import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import { createRevertSnapshot, describeSnapshot, executeRevert, isGitRepo } from "../src/core/session-revert.ts";

// 检查 git 是否可用
function hasGit(): boolean {
	try {
		execSync("git --version", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

describe("session-revert", () => {
	it("非 git 目录 isGitRepo 返回 false，createRevertSnapshot 返回 null", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-not-repo-"));
		assert.equal(isGitRepo(dir), false);
		assert.equal(createRevertSnapshot(dir), null);
		rmSync(dir, { recursive: true, force: true });
	});

	it.skipIf(!hasGit())("端到端：创建快照后修改文件，回退可还原", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-e2e-"));
		try {
			execSync("git init", { cwd: dir, stdio: "ignore" });
			execSync("git config user.email 'test@test.com'", { cwd: dir });
			execSync("git config user.name 'test'", { cwd: dir });
			writeFileSync(join(dir, "a.txt"), "v1");
			execSync("git add . && git commit -m init", { cwd: dir, stdio: "ignore" });

			const snap = createRevertSnapshot(dir);
			assert.ok(snap, "快照不应为 null");
			assert.ok(snap!.headCommit, "headCommit 不应为空");
			// 干净仓库 stashHash 应为 null
			assert.equal(snap!.stashHash, null);

			// 修改已跟踪文件 + 新增未跟踪文件
			writeFileSync(join(dir, "a.txt"), "v2");
			writeFileSync(join(dir, "untracked.txt"), "tmp");

			const r = executeRevert(dir, snap!);
			assert.equal(r.ok, true);
			assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "v1");
			assert.equal(existsSync(join(dir, "untracked.txt")), false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it.skipIf(!hasGit())("脏工作区快照可还原已暂存/未暂存改动", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-e2e-dirty-"));
		try {
			execSync("git init", { cwd: dir, stdio: "ignore" });
			execSync("git config user.email 'test@test.com'", { cwd: dir });
			execSync("git config user.name 'test'", { cwd: dir });
			writeFileSync(join(dir, "a.txt"), "base");
			execSync("git add . && git commit -m init", { cwd: dir, stdio: "ignore" });

			// 制造脏改动：已跟踪文件修改
			writeFileSync(join(dir, "a.txt"), "dirty");

			const snap = createRevertSnapshot(dir);
			assert.ok(snap?.stashHash, "脏工作区应产生 stashHash");

			// 会话期间进一步修改
			writeFileSync(join(dir, "a.txt"), "session-change");
			writeFileSync(join(dir, "b.txt"), "new-file");

			const r = executeRevert(dir, snap!);
			assert.equal(r.ok, true);
			assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "dirty");
			// clean 会删掉 session 期间新增的未跟踪文件
			assert.equal(existsSync(join(dir, "b.txt")), false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it.skipIf(!hasGit())("空 headCommit 仅执行 clean，不执行 reset", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-empty-"));
		try {
			execSync("git init", { cwd: dir, stdio: "ignore" });
			execSync("git config user.email 'test@test.com'", { cwd: dir });
			execSync("git config user.name 'test'", { cwd: dir });
			// 无 commit 的空仓库
			writeFileSync(join(dir, "untracked.txt"), "hello");
			const snap = {
				headCommit: null,
				stashHash: null,
				createdAt: new Date().toISOString(),
				cwd: dir,
				untrackedFiles: [],
			};
			const r = executeRevert(dir, snap);
			assert.equal(r.ok, true);
			assert.equal(existsSync(join(dir, "untracked.txt")), false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it.skipIf(!hasGit())("回退后保留既有未跟踪文件，仅删除会话期间新增", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-e2e-preuntracked-"));
		try {
			execSync("git init", { cwd: dir, stdio: "ignore" });
			execSync("git config user.email 'test@test.com'", { cwd: dir });
			execSync("git config user.name 'test'", { cwd: dir });
			writeFileSync(join(dir, "a.txt"), "v1");
			execSync("git add . && git commit -m init", { cwd: dir, stdio: "ignore" });

			// 会话开始时已存在两个未跟踪文件
			writeFileSync(join(dir, "pre-existing.txt"), "keep me");
			mkdirSync(join(dir, "sub"));
			writeFileSync(join(dir, "sub", "nested.txt"), "keep too");

			const snap = createRevertSnapshot(dir);
			assert.ok(snap, "快照不应为 null");
			assert.deepEqual(snap!.untrackedFiles.sort(), ["pre-existing.txt", "sub/nested.txt"]);

			// 会话期间：改动已跟踪文件 + 新增未跟踪文件
			writeFileSync(join(dir, "a.txt"), "v2");
			writeFileSync(join(dir, "session-new.txt"), "nuke me");

			const r = executeRevert(dir, snap!);
			assert.equal(r.ok, true);
			// 已跟踪文件还原
			assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "v1");
			// 既有未跟踪文件被保留
			assert.equal(readFileSync(join(dir, "pre-existing.txt"), "utf8"), "keep me");
			assert.equal(readFileSync(join(dir, "sub", "nested.txt"), "utf8"), "keep too");
			// 会话期间新增的未跟踪文件被删除
			assert.equal(existsSync(join(dir, "session-new.txt")), false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("describeSnapshot 格式化正确", () => {
		const snap = {
			headCommit: "abc1234567890",
			stashHash: null,
			createdAt: new Date().toISOString(),
			cwd: "/tmp",
			untrackedFiles: [],
		};
		const desc = describeSnapshot(snap);
		assert.match(desc, /HEAD abc1234/);
		const empty = {
			headCommit: null,
			stashHash: null,
			createdAt: new Date().toISOString(),
			cwd: "/tmp",
			untrackedFiles: [],
		};
		assert.match(describeSnapshot(empty), /empty/);
	});

	it("非 git 仓库 executeRevert 返回失败", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-not-repo2-"));
		const snap = {
			headCommit: "abc",
			stashHash: null,
			createdAt: new Date().toISOString(),
			cwd: dir,
			untrackedFiles: [],
		};
		const r = executeRevert(dir, snap);
		assert.equal(r.ok, false);
		rmSync(dir, { recursive: true, force: true });
	});

	it("SessionManager 创建会话时写入 revertSnapshot", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-sm-"));
		// 在 /tmp 临时目录创建会话（非 git），snapshot 应为 null 但字段存在
		const sm = SessionManager.inMemory(dir);
		const header: any = sm.getHeader();
		assert.ok("revertSnapshot" in header, "header 应包含 revertSnapshot 字段");
		assert.equal(sm.getRevertSnapshot(), header.revertSnapshot);
		rmSync(dir, { recursive: true, force: true });
	});

	it("BUILTIN_SLASH_COMMANDS 包含 revert", async () => {
		const { BUILTIN_SLASH_COMMANDS } = await import("../src/core/slash-commands.ts");
		const names = BUILTIN_SLASH_COMMANDS.map((c) => c.name);
		assert.ok(names.includes("revert"), `missing revert, got ${names.join(",")}`);
	});
});
