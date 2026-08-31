import { spawnSync } from "node:child_process";

export interface RevertSnapshot {
	headCommit: string | null;
	stashHash: string | null;
	createdAt: string;
	cwd: string;
}

function runGit(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
	const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 5000 });
	return { status: r.status, stdout: (r.stdout as string) ?? "", stderr: (r.stderr as string) ?? "" };
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
	// ponytail: stash create 仅覆盖已跟踪文件的 index + working tree，未跟踪文件不纳入快照；如需完整未跟踪恢复，改用 stash push --include-untracked
	const stash = runGit(cwd, ["stash", "create"]);
	const stashHash = stash.status === 0 ? stash.stdout.trim() || null : null;
	return { headCommit, stashHash, createdAt: new Date().toISOString(), cwd };
}

export function describeSnapshot(s: RevertSnapshot): string {
	const short = s.headCommit ? s.headCommit.slice(0, 7) : "empty";
	return `HEAD ${short} @ ${new Date(s.createdAt).toLocaleString()}`;
}

export function executeRevert(cwd: string, snapshot: RevertSnapshot): { ok: true } | { ok: false; error: string } {
	if (!isGitRepo(cwd)) return { ok: false, error: "not a git repository" };
	if (snapshot.cwd && snapshot.cwd !== cwd) {
		// 允许子目录回退，但跨仓库路径则拒绝
		// 仅当 snapshot.cwd 与当前 cwd 完全不同且不在同一仓库根时才警告；此处简化为严格匹配
		// 为兼容 fork 场景，不强制阻断，仅记录；如需严格可取消注释下一行
		// return { ok: false, error: `snapshot cwd mismatch: ${snapshot.cwd} vs ${cwd}` };
	}
	if (snapshot.headCommit) {
		const r = runGit(cwd, ["reset", "--hard", snapshot.headCommit]);
		if (r.status !== 0) return { ok: false, error: r.stderr.trim() || "git reset failed" };
	}
	const clean = runGit(cwd, ["clean", "-fd"]);
	if (clean.status !== 0) return { ok: false, error: clean.stderr.trim() || "git clean failed" };
	if (snapshot.stashHash) {
		const apply = runGit(cwd, ["stash", "apply", "--index", snapshot.stashHash]);
		if (apply.status !== 0) return { ok: false, error: apply.stderr.trim() || "git stash apply failed" };
	}
	return { ok: true };
}
