import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

export interface RevertSnapshot {
	headCommit: string | null;
	stashHash: string | null;
	createdAt: string;
	cwd: string;
	/** Untracked file paths (repo-relative) present at snapshot time; preserved on revert. */
	untrackedFiles: string[];
}

function runGit(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
	const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 5000 });
	return { status: r.status, stdout: (r.stdout as string) ?? "", stderr: (r.stderr as string) ?? "" };
}

/** Untracked, non-ignored file paths (repo-relative), expanded to files, NUL-safe for spaces. */
function listUntrackedFiles(cwd: string): string[] {
	const r = runGit(cwd, ["ls-files", "--others", "--exclude-standard", "-z"]);
	if (r.status !== 0) return [];
	return r.stdout.split("\0").filter((p) => p.length > 0);
}

export function isGitRepo(cwd: string): boolean {
	const r = runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
	return r.status === 0 && r.stdout.trim() === "true";
}

export function getHeadCommit(cwd: string): string | null {
	const r = runGit(cwd, ["rev-parse", "HEAD"]);
	if (r.status !== 0) return null;
	const out = r.stdout.trim();
	return out || null;
}

export function createRevertSnapshot(cwd: string): RevertSnapshot | null {
	if (!isGitRepo(cwd)) return null;
	const headCommit = getHeadCommit(cwd);
	// ponytail: stash create 仅覆盖已跟踪文件的 index + working tree，未跟踪文件不纳入；
	// 我们额外记录未跟踪文件集，在 revert 时按集精准删除会话期间新增文件，保留既有未跟踪文件。
	const stash = runGit(cwd, ["stash", "create"]);
	const stashHash = stash.status === 0 ? stash.stdout.trim() || null : null;
	return { headCommit, stashHash, createdAt: new Date().toISOString(), cwd, untrackedFiles: listUntrackedFiles(cwd) };
}

export function describeSnapshot(s: RevertSnapshot): string {
	const short = s.headCommit ? s.headCommit.slice(0, 7) : "empty";
	return `HEAD ${short} @ ${new Date(s.createdAt).toLocaleString()}`;
}

export function executeRevert(cwd: string, snapshot: RevertSnapshot): { ok: true } | { ok: false; error: string } {
	if (!isGitRepo(cwd)) return { ok: false, error: "not a git repository" };
	if (snapshot.headCommit) {
		const r = runGit(cwd, ["reset", "--hard", snapshot.headCommit]);
		if (r.status !== 0) return { ok: false, error: r.stderr.trim() || "git reset failed" };
	}
	// Precisely remove only untracked files created during the session (not present at
	// snapshot time), preserving any untracked file that existed when the session started.
	// This avoids the previous `git clean -fd`, which deleted pre-existing untracked files
	// that stash create never captured, making them unrecoverable.
	const kept = new Set(snapshot.untrackedFiles ?? []);
	const toRemove = listUntrackedFiles(cwd).filter((p) => !kept.has(p));
	for (const path of toRemove) {
		try {
			rmSync(resolve(cwd, path), { recursive: true, force: true });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return { ok: false, error: `failed to remove ${path}: ${message}` };
		}
	}
	if (snapshot.stashHash) {
		// Restore the dirty tracked-file state captured at snapshot time.
		// Patching-in is idempotent for our use: we already reset --hard to headCommit,
		// so this re-applies just the index+working-tree changes that were stashed.
		// Note: `stash apply` does NOT drop the stash, so repeated /revert calls for the
		// same snapshot accumulate `git stash list` entries. Harmless: the same
		// stashHash is re-applied idempotently, and keeping it lets a later re-revert
		// still restore the snapshot state.
		const apply = runGit(cwd, ["stash", "apply", "--index", snapshot.stashHash]);
		if (apply.status !== 0) return { ok: false, error: apply.stderr.trim() || "git stash apply failed" };
	}
	return { ok: true };
}
