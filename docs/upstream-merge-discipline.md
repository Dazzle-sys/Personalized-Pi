# 上游同步纪律（Fork 维护）

> 本 fork 只做两类定制：**i18n 中文化**（`packages/coding-agent/src/**` 改 `t()` 包装 + 独立 zh-CN 词典）和 **B.A.I provider**（`packages/ai` 新增 + `generate-models.ts` 手写模型数组）。
> 文档目的：让「跟上游同步」保持低成本、可回滚。**铁律：永不 rebase 上游，只用 merge。**

## 一、铁律

1. **永不 `git rebase` 上游 / `git rebase -i` 重写历史。** 只 `git merge`。fork 用 rebase 会重写你的自定义提交、让冲突不可恢复，且 `push --force` 会破坏本地唯一的提交历史。
2. **小步、定期同步，别攒版本跳变。** 每次上游 release 同步一次。跨越多版本的冲突是叠加的——版本你跳得越远，冲突面越大。
3. **同步前先 `git fetch` 看差异规模**，选一个干净、无大量无关改动的点做 merge。

## 二、同步流程（每次上游 release）

```bash
# 1. 拉最新上游（当前 origin 即上游仓库）
git fetch origin

# 2. 切到主分支并合并上游 main
git checkout main
git merge origin/main      # 一定用 merge，不用 rebase

# 3. 解决冲突（见第三节），只处理你改过的文件
# 4. 同步生成产物（B.A.I 模型目录是生成物，不入库）
npm run generate:models    # 确保 data/*.json 与 generate-models.ts 一致
# 5. 验证
npm run check
# 6. 提交（只 stage 你这次改的文件）
git add <你改的路径>
git commit -m "chore: sync upstream vX"
```

## 三、冲突处置规则（按类别）

| 冲突来源 | 处置 |
| --- | --- |
| **zh-CN 词典**（`i18n/locales/zh-CN/*`、`tui/i18n/locales/zh-CN.ts`） | 低冲突。上游不碰这些独立文件。若上游改了英文源串 → 在 zh-CN 词典补新映射即可。 |
| **`t()` 包装（`packages/coding-agent/src/**`、`tui/src/**`）** | **高冲突区**。上游频繁改这些源字符串。若只改了字符串内容：保留双方、词典补录；若改了结构/签名：以上游为准重新适配。 |
| **`generate-models.ts` 的 B.A.I 数组** | 上游若也动了 `generate-models.ts`，冲突在此文件。以你的 B.A.I 数组为准，`npm run generate:models` 再核一次。 |
| **`models.generated.ts` / `data/*.json`** | 生成产物，不入库。repo 里以 `npm run generate:models` 重新生成为准，不手动合。 |

## 四、i18n 冲突面管控

i18n 的 `t()` 把 30+ 个源文件改成包装，这些行上游高频触碰 → 冲突不可避免。**降低成本的策略：**

- **词典独立文件**天然低冲突（上游不碰），保持这个边界。
- `t()` 的 key 就是英文源串（缺失回退英文），即使某次 merge 漏了某条词典，**UI 显示英文也不崩**——这是安全兜底。
- **不把 i18n 改动进一步打散**到更多上游文件；新增文案优先追加到已有 zh-CN 词典，而非改英文源文件。

## 五、同步后自检

- [ ] `npm run check` 全绿
- [ ] `npm run generate:models` 无 dirty diff（`data/*.json` 是生成物，不入库）
- [ ] i18n 覆盖审计测试过：`node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run packages/coding-agent/test/i18n-coverage.test.ts`
- [ ] B.A.I 目录 reconcile 不阻塞构建（`BAI_API_KEY` 缺失/401 时回退本地 44 个模型）

## 六、已知环境注意点

- **本机固定出口 IP**（当前 47.128.210.21）下，`BAI_API_KEY` 对 B.A.I 请求返回 **401**（key 绑定其它出口/IP）。因此 B.A.I 的 E2E 测试（`stream.test.ts` 的 `skipIf(!BAI_API_KEY)`）在此机器**必然失败**——这是环境/凭据问题，**不是代码 bug**。凡依赖真实 B.A.I 调用的 E2E，请在**能连通 B.A.I 的环境**运行，或在无 `BAI_API_KEY` 的 CI 里让其 `skip`。
