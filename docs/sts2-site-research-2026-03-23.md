# Slay the Spire 2 工具站调研

更新时间：2026-03-23

## TL;DR

- 值得做，但不建议把 `StS2` 当成 `Balatro` 那样的“精确算分器”问题来做。
- 对 `StS2` 更合适的切口是：`seed / 路线 / run 日志解析 / patch 版本差异 / 社区统计`。
- 如果你现在就开做，我最推荐的路线是：
  1. `Patch-aware 数据库`
  2. `本地 run/metrics 导入分析`
  3. `受版本约束的 Seed Lab`
- 如果只能做一个 MVP，我会做：`本地解析 + 可分享 run 页面 + 前几层 seed 路线预测`。

## 1. 先确认：杀戮尖塔 2 现在是什么状态

截至 2026-03-23，`Slay the Spire 2` 已经在 `2026-03-05` 进入 Steam Early Access。

公开且比较重要的事实：

- Steam 商店页显示，游戏于 `2026-03-05` 发售 EA，当前支持 `14` 种语言，包含简体中文，并带有 `Online Co-op`、`Stats`、`Steam Leaderboards`。  
  来源：[Steam 商店页](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/)
- 官方 FAQ 明确写了：
  - EA 预计大约还会持续 `1-2 年`
  - 引擎是 `Godot`
  - 有 `Steam Workshop`
  - `StS1` 的 mod 不能轻松平移，但 `StS2` 会更易于做 mod
  - 新系统包括 `enchantments`、`afflictions`、`Ancients`、`alternate acts`
  - 有 `Steam friends only` 的在线合作  
  来源：[Mega Crit FAQ](https://www.megacrit.com/faq/)
- 官方 2026 年 3 月的 Neowsletter 写到：EA 上线一周后，`3,000,000` 份销量、`25,000,000+` 次 run。  
  来源：[Steam 社区新闻](https://steamcommunity.com/app/2868840/allnews/)
- Steam 商店页当前显示 `32,177` 条评价，`95%` 好评。  
  来源：[Steam 商店页](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/)

这几个点很关键，因为它们决定了产品窗口：

- 玩家量足够大
- 游戏仍在高速变化
- 官方明确会继续加内容、做平衡、上 Workshop
- 简中是首发语言之一，中文工具站是成立的

## 2. 为什么 Balatro 式“计算器”不能直接照搬到 StS2

### 2.1 Balatro 更像“有限状态、确定性较强的组合优化”

`Balatro` 的高价值工具，通常围绕：

- 单回合/单手牌最高分
- Joker 顺序与牌型组合
- seed 队列重放

你的仓库里现在的方向也很符合这个模型：

- 当前 [README](/Users/lizhongxin/SoloProduct/balatrocalc/README.md) 里描述的就是“输入手牌与 Joker 场景，求最高得分打法”
- [blueprint/README.md](/Users/lizhongxin/SoloProduct/balatrocalc/blueprint/README.md) 也已经在往 `Balatro Seed Tools` 走

这类问题可以做成浏览器内穷举、搜索、剪枝，体验也直观。

### 2.2 StS2 更像“长程、路径依赖、隐藏状态很多的决策搜索”

`StS2` 的核心不是“一手牌多少分”，而是：

- 当前战斗状态如何演化
- 抽牌顺序、洗牌、怪物 intent、随机掉落如何联动
- 路线、HP、金钱、事件选择，如何影响后续很多层
- 现在还是 EA，版本更新会直接改变数据和行为

这意味着你如果做“最佳出牌计算器”，难度会显著高于 Balatro。

几个很有说服力的证据：

- 旧作 `Slay-I` 不是做“精确求解器”，而是训练了一个基于 `325,000` 场战斗数据的模型，去预测一场战斗大概会掉多少血，并辅助评估加牌/升级/删牌。  
  来源：[SlayTheSpireFightPredictor](https://github.com/alexdriedger/SlayTheSpireFightPredictor)
- 旧作的 `SeedSearch` 模组明确写了：做 seed 搜索时必须对玩家选择和状态作很多假设，所以真正自己跑 seed 时，后面楼层会出现 `diverging behavior`。  
  来源：[SeedSearch](https://github.com/ForgottenArbiter/SeedSearch)
- `StS2` 官方 3 月补丁里甚至直接有多条 `Fixed state divergence...` 的修复，说明连官方自己都在持续处理状态分歧问题。  
  来源：[Patch Notes - v0.99.1](https://steamcommunity.com/app/2868840/allnews/)

我的判断：

- `Balatro` 的主入口可以是“算”
- `StS2` 的主入口更应该是“看 / 复盘 / 预测 / 筛 seed / 规划路线”

## 3. 现在已经有哪些站在做这件事

这里最重要的不是“有没有竞品”，而是“别人已经验证了哪些需求是真的有需求”。

### 3.1 Spire Codex

站点 / 开源项目：

- [Spire Codex](https://spire-codex.com/)
- [GitHub 仓库](https://github.com/ptrlrd/spire-codex)

它做了什么：

- 直接从 `StS2` 游戏文件逆向出数据库和 API
- 支持官方 `14` 种语言
- 有 cards / relics / monsters / events / encounters / acts / changelog
- 有自己的更新流水线：提取 `pck`、反编译 `sts2.dll`、解析成结构化 JSON、生成版本差异

这个项目最值得你学的不是 UI，而是数据基础设施：

- 它证明了 `StS2` 的游戏数据可以被系统性抽取
- 它证明了“按游戏版本管理数据”是必须的
- 它证明了多语言数据站是可行的

### 3.2 STS.gg v2

站点：

- [STS.gg v2](https://sts.gg/v2)

它现在公开展示的方向：

- 卡牌 / relic / monster 数据库
- synergy 页面
- `.run` 文件上传 leaderboard
- 搜索结果摘要里已经提到 `Seed prediction coming soon`
- 搜索结果摘要里还提到 `Run Simulator`，目标是从 seed 生成地图、卡奖、relic 掉落、遭遇等  
  来源：[STS.gg 搜索摘要](https://sts.gg/v2)

这说明两件事：

- 市场已经默认接受“StS2 工具站 = 数据库 + 工具”的组合
- seed predictor / simulator 是强需求，但现在还没有特别稳的统一答案

### 3.3 STS2Stats

站点：

- [STS2Stats](https://sts2stats.com/)

它做了什么：

- 社区 run 统计
- 卡牌 pick / win rate
- relic win rate
- 通过 `STS2 mod` 上传 run 数据
- 页面上直接提供 `API Key` 注册和 `POST /api/runs` 的用法  
  来源：[STS2Stats 首页](https://sts2stats.com/)、[API Key 页面](https://sts2stats.com/register)

这说明：

- “社区上传 run -> 做统计”已经被证明是有意义的
- 你不一定要先做全自动 seed 引擎，也可以先做“日志/上传/分析”

### 3.4 STS Log Viewer

站点：

- [STS Log Viewer](https://stslogviewer.com/)

它做了什么：

- 解析 `metrics` 和 `.run` 文件
- 完全本地浏览器处理，不上传用户文件
- 提供 `Progress Viewer` 和 `Run Viewer`  
  来源：[STS Log Viewer 首页](https://stslogviewer.com/)

这是非常重要的产品信号：

- 本地隐私优先的模式很适合这类工具
- 你可以先做“读取玩家本地数据 -> 可视化 -> 分享摘要”，不用一开始就搞云端同步

### 3.5 slaythespire2.space

站点：

- [slaythespire2.space](https://slaythespire2.space/)

它做了什么：

- SEO 型数据库与攻略内容
- Co-op Synergy Builder
- Deck Builder
- 种子页 / God-Seed Leaderboard  
  来源：[首页](https://slaythespire2.space/)、[种子页](https://slaythespire2.space/seeds/)

这类站点的价值在于：

- 证明 `StS2` 相关流量已经开始被“内容站 + 工具页”吃掉
- 但它们大多偏内容聚合，不一定有很强的产品深度

## 4. 反过来看，真正还值得做的空位是什么

我把机会按“难度 / 差异化 / 用户价值”综合排了一下。

### A. 最值得做：Seed Lab / 路线实验室

这不是“给一个 seed 直接告诉你必赢路线”，而是：

- 输入 seed、角色、难度、版本
- 展示前几层地图和关键分支
- 预测早期 card reward / relic pool / elite / event 候选
- 允许用户标记自己的选择，向后推演
- 对每一步明确标注“确定 / 依赖假设 / 可能分歧”

为什么它最值得做：

- 比纯数据库更有工具价值
- 比全局 seed solver 更现实
- 比战斗求解器更容易先做出产品

### B. 很值得做：Run Import / Replay / Share

具体形式：

- 用户拖进 `.run` 或 `metrics`
- 生成 floor-by-floor 的可视化 run 页面
- 自动提取关键节点：掉血最多的战斗、最赚的 relic、关键转折事件
- 自动打标签：高风险路线、低血贪 elite、商店决策、事件收益
- 可生成可分享链接

为什么这个方向好：

- 真实可做
- 不依赖完全逆向全套 seed 逻辑
- 社区传播性很强
- 能自然接上统计和排行榜

### C. 很值得做：Patch-aware Database / Diff

具体形式：

- 每个版本一套数据快照
- 卡牌 / relic / encounter / event 差异页
- “这个版本 Silent 被改了什么”
- “这张卡历史改动”

为什么值：

- EA 期更新快，版本差异常常比“静态百科”更值钱
- 也非常适合 SEO
- 还能给 seed / run 分析提供版本基础

### D. 中高价值：Community Stats

形态可以是：

- 卡牌 pick rate / win rate
- relic 胜率
- 不同 ascension、不同角色、不同多人队伍配置的数据切片
- “高分 / 速通 / 连胜 / 高 ascension” 维度排行榜

但这个方向的门槛是：

- 需要上传入口
- 需要足够多 run
- 需要防脏数据

所以我不会建议它做第一个 MVP。

### E. 中价值：Co-op Planner

因为 `StS2` 最大新特性之一是最多 4 人 co-op，这一块有明显新需求：

- 角色搭配建议
- 团队卡组职责分工
- 团队资源分配
- 协同遗物 / 协同卡牌

它的优势是差异化明显，但短板是：

- 容易做成内容页而不是强工具
- 没有 seed / run 这种天然可验证的数据闭环

## 5. 我不建议你一开始做什么

### 5.1 不建议先做“最佳战斗出牌计算器”

原因不是“做不出来”，而是“第一阶段性价比太差”：

- 状态空间巨大
- 多角色、多怪、多意图、多洗牌、多随机
- 多人模式让状态复杂度再翻一层
- EA 每次平衡补丁都可能把推演逻辑打坏

如果以后真要做，这更像：

- 限定 boss / elite 的局部战斗分析器
- 或者 ML/启发式“风险估计器”

而不是 Balatro 那种“一眼能看懂的精确求最优”。

### 5.2 不建议先做纯内容站

单做“卡牌百科 + relic 列表 + 攻略文章”，你会直接掉进红海：

- 已经有人在做
- SEO 竞争会越来越重
- 护城河低

更好的方式是：

- 用内容做流量入口
- 用工具页做真正留存

## 6. 我会怎么排你的 MVP

### P0：版本化数据底座

先把这些打牢：

- 游戏版本号 / build id
- cards / relics / monsters / events / encounters / keywords
- 中英双语
- patch diff 机制

这里可以直接借鉴 `Spire Codex` 的思路：

- `提取 -> 解析 -> 标准化 JSON -> 前端消费`

### P1：本地 run / metrics 解析

这一版就能上线：

- 上传 `.run`
- 上传 `metrics`
- 本地解析
- 生成 run 可视化页面
- 给出几个自动洞察

这一版的优势是：

- 用户价值很清晰
- 隐私友好
- 不必先解决 seed 全链路推演

### P2：Seed Lab（先做前几层）

不要一上来就做全 run predictor。

先做：

- Act 1 前 8-12 层
- 地图分支
- elite / shop / rest 路线评分
- 前几次 card reward / relic / event 的预测
- 显示假设条件

这会比“全局精确预测器”稳得多。

### P3：分享与社区层

- seed 页面
- run 页面
- 收藏与评论
- God seed 榜单
- 玩家提交“这条线为什么强”

### P4：上传统计

- 可选 mod 上传
- 角色/难度/多人组合切片
- pick rate / win rate / badge / leaderboard

## 7. 技术路线建议

### 数据源

我建议分 3 层：

1. 游戏静态数据  
   来源：本地游戏文件解析  
   目标：cards / relics / enemies / events / localized strings / patch diffs

2. 用户本地日志  
   来源：`metrics` + `.run`  
   目标：run viewer / progress viewer / share link

3. 社区上传数据  
   来源：前端导出摘要 JSON，或者 mod 上报  
   目标：社区统计、排行榜、热门 seed

### 架构

如果你要沿着现在仓库的气质去做，我会偏向：

- 前端：`Vite + React` 或 `Next.js`
- 数据层：静态 JSON + 少量 API
- 重运算：`Web Worker` / `WASM`
- 版本：按 `game_version + build_id` 存目录
- 分享页：把 run 摘要 JSON 压缩后存对象存储或数据库

### 一个现实的折中

不要让站点一开始就“必须连云端才能用”。

更好的产品体验是：

- 默认本地解析
- 用户愿意时再生成分享链接
- 云端只存摘要，不存原始文件

这点 `STS Log Viewer` 的产品思路是对的。

## 8. 风险与坑

### 8.1 EA 版本变化过快

这是最大的坑。

你必须：

- 所有页面都显示版本
- seed / run 分析都绑定版本
- 旧链接能回到旧版本数据

不然用户会很快遇到“昨天对，今天错”。

### 8.2 seed 预测必然存在分歧

这不是 bug，而是产品事实。

你应该在 UI 上明确区分：

- 完全确定
- 依赖假设
- 高概率分歧

而不是假装自己是绝对正确的 oracle。

### 8.3 资产与商业化边界

Mega Crit 的内容政策明确允许视频内容变现、允许 mod、允许基于原创美术卖周边，但不允许直接拿游戏/营销素材做商品。  
  来源：[Mega Crit Content Policy](https://megacrit.com/content-policy/)

我对站点的推断是：

- 做 fan database / tool 大概率没问题
- 但如果你要强商业化，最好减少“直接搬运原图当核心资产”的依赖
- 最稳的方案仍然是：数据与功能是核心，图片只是辅助

这里是推断，不是官方对 fan site 的明确授权条款。

## 9. 中文市场有没有机会

我做了中文侧快速检索，能看到：

- Bilibili 上已经有不少 `StS2` 中文内容
- 但没看到一个明显成型、强产品化的中文种子/分析工具站

这不能证明“没有”，但至少说明：

- 中文市场的主流供给目前仍偏视频/攻略内容
- 中文工具体验仍有窗口

如果你做中文优先，我会建议：

- 首发就做中英双语
- 首页不要先做百科，先做 `Run 导入分析`
- 再用 seed / patch / build 页面吃搜索

## 10. 最终建议

如果你的目标是做一个“像 balatro calculator 一样有明确用户价值的工具站”，那我会这样定方向：

- 不做：`StS2 最佳出牌计算器` 作为第一产品
- 要做：`StS2 Seed + Run Analysis Lab`

一句话版本：

> 把 `Balatro` 的“精确算分”思路，改写成 `StS2` 的“版本化数据 + 本地日志解析 + 可控 seed 推演 + 分享/社区层”。

如果只做一个 4-6 周 MVP，我建议是：

1. 版本化 cards / relics / monsters / events 数据底座
2. `.run` / `metrics` 本地导入与可视化
3. Seed Lab v1，只做 Act 1 的前几层路线与候选奖励推演

这条线最务实，也最有机会做出区别于现有站点的产品。

## 参考来源

- [Steam: Slay the Spire 2 商店页](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/)
- [Mega Crit FAQ](https://www.megacrit.com/faq/)
- [Steam 社区新闻 / 补丁 / Neowsletter](https://steamcommunity.com/app/2868840/allnews/)
- [Mega Crit Content Policy](https://megacrit.com/content-policy/)
- [Spire Codex](https://spire-codex.com/)
- [Spire Codex GitHub](https://github.com/ptrlrd/spire-codex)
- [STS.gg v2](https://sts.gg/v2)
- [STS2Stats](https://sts2stats.com/)
- [STS2Stats API Key 页面](https://sts2stats.com/register)
- [STS Log Viewer](https://stslogviewer.com/)
- [slaythespire2.space](https://slaythespire2.space/)
- [slaythespire2.space / seeds](https://slaythespire2.space/seeds/)
- [SlayTheSpireFightPredictor](https://github.com/alexdriedger/SlayTheSpireFightPredictor)
- [SeedSearch](https://github.com/ForgottenArbiter/SeedSearch)
- [The Soul - Balatro seed analyzer](https://github.com/SpectralPack/TheSoul)
