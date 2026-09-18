# TW2-3689 分布式构建落地 TODO

Linear issue: `TW2-3689`
Suggested branch: `tj/tw2-3689-开发者分布式构建`
Parent issue: `TW2-3590`

目标架构：GitHub App 负责身份、仓库授权、Webhook 和 workflow dispatch；creator 仓库中的 GitHub Action 负责在用户 runner 上构建和上传；Worker 负责鉴权、编排、状态和发布；R2 保存不可变制品；D1 保存部署事实；Play Worker/Cloudflare Edge 负责访问和路由。

## 9 个主 TODO

按依赖关系分步执行；每个主 TODO 完成后再进入下一项。

1. [ ] **P0 Creator Action 一键导入到 Game Publish 页面**：GitHub App 创建安装分支、写入 workflow 并创建 PR；无写权限时提供复制/下载兜底。
2. [ ] **P0 GitHub App 连接与 workflow readiness**：installation、repository、default branch、branch 和 workflow 检查。
3. [ ] **P0 Webhook 幂等与严格 deployment 状态机**：delivery 抢占、run/attempt 绑定、迟到事件保护。
4. [ ] **P0 OIDC 与一次性上传会话**：绑定 repository、installation、workflow、run、commit、deployment 和 tenant。
5. [ ] **P0 Manifest、R2 制品和静态安全校验**：路径、大小、SHA-256、静态文件和安全规则。
6. [ ] **P0 原子发布、Preview、Private Link 与 rollback**：不可变制品、D1 CAS pointer、审核门禁和回滚。
7. [ ] **P0 Deployment API、日志和 Publish 状态控制台**：detail/events/logs、轮询、断线恢复和错误展示。
8. [ ] **P0 多租户、并发、重放和安全验收**：跨租户、重复 webhook、并发上传和旧构建覆盖测试。
9. [ ] **P1 运维与增强能力**：超时恢复、孤儿清理、审计、限流、workflow 自动创建、分支刷新和 SSE。

## 1. Creator GitHub Action 与接入流程

- [ ] **P0 提供 creator 可一键导入或复制的 `randseed-deploy.yml` 模板**
  - 模板放在仓库内可版本化的位置，例如 `docs/templates/randseed-deploy.yml`，并由 Dashboard 提供复制/下载入口。
  - 推荐 GitHub App 创建安装分支、提交 workflow 并创建 Pull Request；不直接写入默认分支，不自动合并。
  - 一键 PR 需要 installation token 具备 `Contents: write` 和 `Pull requests: write`；现有只读安装需要用户重新授权升级权限。
  - App token 只在 Worker 服务端使用，前端不得获得 installation token。
  - 只使用 `workflow_dispatch`，由 Worker 传入 `deployment_id`、完整 40 位 `commit_sha`、`game_id`。
  - 使用 `actions/checkout` 检出精确 SHA，不使用浮动分支 HEAD。
  - job 权限最小化：`contents: read`、`id-token: write`；不得要求 Cloudflare token、GitHub App 私钥、平台长期部署 token 或数据库凭据。
  - 执行 creator 自己的安装、构建和静态输出目录检查。
  - 生成绑定 `deployment_id`、`commit_sha`、`root`、文件列表、文件数量、总字节数和每个文件 SHA-256 的 manifest。
  - 使用 GitHub OIDC 请求 `/api/deployments/:id/upload-session`，使用返回的短期 upload token 逐文件上传，再调用 `/api/deployments/:id/upload-complete`。
  - 所有 token 写入环境变量前必须 mask；失败时不得输出 Authorization、OIDC、upload token、私有仓库 URL 或环境变量内容。
  - 模板 README 要说明需要的仓库 workflow 权限、build directory、Worker API URL 和安装方式。
- [ ] **P0 将 Dashboard 的复制文本改为模板单一来源**
  - 删除 `GitHubSyncCard.tsx` 内维护的长字符串副本，避免模板和服务端契约漂移。
  - 复制前按实际 repository、branch、build directory、API environment 和 workflow 名称渲染必要参数。
- [ ] **P1 检查仓库 workflow 是否存在并提供指导**
  - 缺少模板时显示复制/创建提示。
  - 只有 GitHub App 明确拥有 `Contents: Write` 和 `Pull requests: Write` 时，才允许通过 PR 创建 workflow；默认不自动合并。
- [ ] **P1 支持仓库默认分支和分支列表**
  - 安装授权后读取 default branch。
  - 绑定页面可以刷新并选择 App 可访问的 branch。

## 2. 分布式构建、Webhook 与状态机

- [ ] **P0 固化 push 到部署的幂等流程**
  - `push` webhook 必须验证 HMAC 和 GitHub installation。
  - 按 `delivery_id` 原子抢占事件，重复或并发投递只能产生一个 deployment 和一次 workflow dispatch。
  - deployment 保存 tenant、game、repository、installation、branch、完整 SHA 和 commit message。
  - 同一 repository/branch 的多游戏绑定策略必须明确：Phase 1 默认禁止重复绑定，或显式为每个 binding 创建部署。
- [ ] **P0 实现严格状态机**
  - `pending -> queued -> building -> uploading -> verifying -> ready -> publishing -> published`。
  - 失败状态：`failed`、`cancelled`、`superseded`。
  - 每次状态变更都带允许的前置状态；迟到、重复、伪造回调不能回退状态或覆盖终态。
  - GitHub `workflow_run`/`workflow_job` 必须验证 installation、repository、workflow、commit、branch，并记录 `github_run_id` 和 `workflow_run_attempt`。
- [ ] **P0 绑定 OIDC 与具体 GitHub Run**
  - upload-session 和 upload-complete 除 repository、commit、branch、workflow 外，还要校验 OIDC `run_id` 与 deployment 的 `github_run_id` 一致。
  - 手动触发但没有合法 deployment/run 绑定时必须拒绝。
- [ ] **P0 处理连续 push、重试和旧构建晚完成**
  - 每个 commit 有独立事实记录。
  - 同 SHA retry 记录新的 run/attempt，但不能重复发布同一 deployment。
  - 旧 commit 或旧 run 晚完成时不能覆盖最新 sandbox、preview 或 active pointer。
- [ ] **P1 增加超时和恢复处理**
  - 长时间停留在 queued/building/uploading/verifying 的 deployment 显示明确原因。
  - 支持安全重试；不复用已过期或已消费的 upload session。

## 3. OIDC、短期上传授权与制品校验

- [ ] **P0 将 upload session 约束为 deployment 专属**
  - 保存 `upload_session_id`、deployment、tenant、object prefix、manifest、过期时间和使用时间。
  - upload-session、文件 PUT、upload-complete 都校验 deployment、session、OIDC、对象路径和状态。
  - 同一文件只允许首次成功上传；重复/并发 PUT 和重复 complete 必须返回冲突。
- [ ] **P0 完善 manifest 校验**
  - 校验完整 commit SHA、deployment ID、build root、文件路径、文件数量、单文件大小、总大小、SHA-256 和 manifest checksum。
  - 禁止路径穿越、空路径、反斜杠、异常超长路径和不允许的文件类型。
  - 上传完成后重新读取 R2 对象，校验实际大小和 SHA-256，不能只信任客户端声明或 ETag。
- [ ] **P0 限制为静态制品**
  - 拒绝服务端代码、Worker 配置、危险执行文件和任意 Cloudflare 配置。
  - 对 HTML/JS 执行 CSP、外链、顶层逃逸和静态安全规则检查。
  - 校验失败不得切换任何 sandbox、preview 或 active pointer。
- [ ] **P1 清理过期 session 和孤儿对象**
  - session 到期后拒绝继续上传。
  - 定时清理未完成 session 对应的 R2 对象、D1 文件记录和孤儿 deployment 数据。

## 4. 发布、指针、Preview 与回滚

- [ ] **P0 使用不可变 deployment 路径**
  - 采用 `tenants/{tenant}/games/{game}/deployments/{deployment_id}/...` 或等价路径。
  - 禁止覆盖历史 deployment 的对象。
- [ ] **P0 以 D1 为事实源并原子发布**
  - 校验通过后按 `uploading -> verifying -> ready -> publishing` 更新。
  - 使用 D1 transaction/CAS 同时保护 deployment 状态和 active pointer。
  - 发布失败时保留旧 active pointer，不能暴露 publishing 或半成品 deployment。
- [ ] **P0 增加历史版本回滚 API**
  - 只能回滚到已验证且存在的 `ready`/`published` deployment。
  - 回滚只切换 pointer，不重新触发构建。
  - 并发发布/回滚只能有一个请求成功完成 pointer 切换。
- [ ] **P0 校验 Preview 和 Private Link**
  - 按 tenant/game/deployment 授权。
  - Private Link 支持有效期、撤销和安全 token 校验。
  - 处理缓存导致的撤销延迟，避免撤销后继续长时间可访问。
- [ ] **P1 增加 Sandbox、Preview、Public 指针分离**
  - 明确 `active_deployment_id`、`preview_deployment_id` 和 sandbox 指针的生命周期。
  - 支持发布前预览、审核后公开发布和快速回滚。

## 5. CI/CD 记录与 Creator 控制台

- [ ] **P0 补齐 deployment detail/events API**
  - 支持列表、详情、事件和受控日志读取：
    - `GET /api/games/:gameId/deployments`
    - `GET /api/games/:gameId/deployments/:deploymentId`
    - `GET /api/games/:gameId/deployments/:deploymentId/events`
    - `GET /api/games/:gameId/deployments/:deploymentId/logs`
  - 所有查询按 `caller / tenant / resource / action` 授权。
- [ ] **P0 记录完整部署事实**
  - 保存 deployment ID、tenant/game、repository、installation、branch、完整 SHA、delivery ID、run ID/attempt、status、artifact hash/size、preview/live URL、error code/message 和各阶段时间。
  - 不向浏览器返回 installation token、OIDC token、upload token 或 GitHub 私钥。
- [ ] **P0 控制台状态必须来自 D1**
  - Phase 1 使用 2 到 5 秒轮询 deployment detail。
  - 断线重连后重新从 Worker 获取事实状态。
  - 显示 GitHub 最新 commit 与已部署 commit 的差异，不把 API/network 失败显示为同步成功。
- [ ] **P0 记录和脱敏构建日志**
  - 日志只能由 Worker 代理给已授权成员。
  - 脱敏 token、Authorization、Cookie、签名 URL、私有仓库 URL 和环境变量。
- [ ] **P1 增加审计和可观测性**
  - 记录触发者、发布者、回滚者、状态变更来源和时间。
  - 对 GitHub API 限流、R2 不可用、对象缺失和长时间无进展提供明确错误码。

## 6. 多租户安全与验收

- [ ] **P0 完成租户隔离检查**
  - 租户 A 不能读取、上传、发布或创建租户 B 的 deployment。
  - 服务端生成并校验 tenant/game/object prefix，不能信任客户端路径。
  - repository、installation、game、deployment 和 private release 的归属关系必须一致。
- [ ] **P0 完成并发与重放测试**
  - 重复 webhook、并发 upload、重复 complete、旧 commit 晚完成、并发发布、并发 rollback 均有拒绝或幂等结果。
- [ ] **P0 建立功能测试矩阵**
  - 覆盖首次构建、精确 SHA、构建失败、OIDC 越权、跨租户上传、checksum/manifest 失败、静态制品违规、旧版本保护、Private Link 和 rollback。
- [ ] **P1 建立清理和恢复演练**
  - 验证 D1 事实恢复、R2 孤儿对象清理、GitHub API 故障重试和 deployment 超时恢复。

## 推荐执行顺序

1. **P0：Creator Action 模板和接入契约**
2. **P0：Webhook 幂等、Run/OIDC 绑定和严格状态机**
3. **P0：upload session 一次性语义、manifest 和静态制品校验**
4. **P0：D1 原子发布、旧版本保护和 rollback API**
5. **P0：deployment detail/events/logs 和控制台轮询**
6. **P0：多租户、并发、重放和安全测试**
7. **P1：workflow 自动创建、分支刷新、SSE、清理、审计和可观测性**

## Definition of Done

- [ ] Creator 安装 GitHub App 后可以复制并运行官方 `randseed-deploy.yml`。
- [ ] Action 只使用 GitHub OIDC 和本次 deployment 的短期授权，不保存平台长期密钥。
- [ ] Worker 可以证明 repository、installation、run、branch、commit、deployment 和制品之间的一致性。
- [ ] 重复、乱序、跨租户和伪造回调不能改变错误 deployment 或 active pointer。
- [ ] 失败发布不会影响当前线上版本，已验证历史版本可以直接回滚。
- [ ] D1、R2、GitHub webhook 和 Action 日志的 P0 测试全部通过。
- [ ] Pull Request 描述中附加 Linear issue `TW2-3689`，并链接对应实现和测试证据。
