# Balatro Calculator — Cards Logic and Architecture

本分析文档梳理本项目中与“扑克牌/卡牌（含 Joker）”相关的核心逻辑与实现思路，涵盖数据模型、UI 渲染、状态打包、评分模拟、并行优化与常见交互路径。

> 主要参考文件：
> - 主 UI 与状态管理：`main.js`（各语言版本如 `cn/main.js` 同构）
> - 模拟与规则引擎：`balatro-sim.js`
> - 并行调度与优化：`manageWorkers.js`、`worker.js`
> - Joker 文案与元数据：`cards.js`
> - 卡片悬浮交互：`hoverCard.js`

---

## 1. 总体目标与数据流

- 目标：在网页端构建一套可交互的 Balatro 手牌/Joker 组合试算工具。
  - 用户在 UI 中选择要加入的扑克牌与 Joker、配置增强/版本、设置牌型等级与回合状态。
  - 引擎对“出哪几张牌”“以什么顺序出”“Joker 的结算顺序”进行搜索和评分，输出 Chips × Mult 的上下界与 EV，同时提供最佳出牌/Joker 顺序和可视化拆解。

- 数据流大致分层：
  1) UI 构建/交互（`main.js`）→ 2) 状态打包（`manageWorkers.js`）→ 3) Worker 执行优化 + 调用模拟器（`worker.js` + `balatro-sim.js`）→ 4) 结果回传 + UI 展示（`manageWorkers.js`/`main.js`）

---

## 2. 数据模型（Worker/模拟侧的紧致结构）

为性能考虑，Worker 内部使用“紧致数组”表示卡与 Joker：

- 扑克牌（cards）：
  - 结构：`[RANK, SUIT, EDITION, ENHANCEMENT, SEAL, EXTRA_CHIPS, CARD_DISABLED, INDEX, EXTRA_EXTRA_CHIPS]`
  - 常量定义于 `balatro-sim.js`（如 `RANK=0`、`SUIT=1` 等）。
  - Rank：`_2..ACE`，其中 `JACK=9`、`QUEEN=10`、`KING=11`、`ACE=12`。
  - Suit：`HEARTS=0`、`CLUBS=1`、`DIAMONDS=2`、`SPADES=3`。
  - Editions：`FOIL=1`、`HOLOGRAPHIC=2`、`POLYCHROME=3`、`NEGATIVE=4`（NEGATIVE 在 UI 中不直接使用）。
  - Enhancements：`BONUS=1`、`MULT=2`、`WILD=3`、`GLASS=4`、`STEEL=5`、`STONE=6`、`GOLD=7`、`LUCKY=8`。

- Joker：
  - 结构：`[JOKER_ID, VALUE, EDITION, JOKER_DISABLED, SELL_VALUE]`
  - `JOKER_ID` 由 UI 侧的 (i,j) 精灵坐标映射（`i*10 + j`）。

- 手牌类型基础分（handChips）：
  - `[[chips, mult, chips_per_level, mult_per_level], ...]`，顺序覆盖 Flush Five → High Card。

- Mult 表示：使用自定义“大数浮点”结构 `[mantissa, exponent]`，配套 `bigAdd`、`bigTimes`、`bigBigAdd` 等运算，保证极大数乘加时的精度与性能。

---

## 3. UI 渲染与交互（main.js / cn/main.js）

- 卡面渲染：
  - 普通牌：`redrawCards()` 基于 `assets/8BitDeck.png` 或高对比度版本 `_opt2` 拼接背景层（底图 + Editions + Enhancers），`cardString()` 负责生成 CSS 多背景层样式。
  - Joker：`jredrawCards()` 使用 `assets/Jokers.png` 精灵图与 `Editions.png` 叠加，`jokerString()` 生成样式；`cards.js` 提供 Joker 文案（tooltip）。

- 增强/版本切换：
  - UI 中的切换按钮更新 `modifiers`（普通牌）与 `jmodifiers`（Joker），再重绘卡面。

- 选牌/移除：
  - `addCard(i, j)` 将选中的牌（含增强/版本/禁用标记）加入 `playfieldCards`；`removeCard(id)` 移除。
  - Joker 类似：`addJoker(i, j)`、`removeJoker(id)`，并可进入“修改面板”调整 Joker `value` 与 `sell`。

- 高对比度/排序/限制：
  - 高对比度切换 `toggleContrast()` 影响底图选择与已选牌渲染。
  - Joker 与出牌的顺序支持 UI 手动微调，亦可开启“优化 Joker/卡牌”自动排列。

---

## 4. 状态打包与线程管理（manageWorkers.js）

- 将 UI 层状态转换为 Worker 使用的紧致数组：
  - 牌：基于 `playfieldCards` 生成 `[rank, suit, edition, enhancement, red_seal?, extra_chips, disabled, index]`。
  - Joker：`[i*10+j, value, edition, disabled, sell, index]`。
  - 手牌等级/行星/出牌次数：从 `hands` 读取；全局效果（TheFlint/TheEye/PlasmaDeck/Observatory）也一起打包。

- 线程管理：
  - 启动 `THREADS = navigator.hardwareConcurrency` 个 Worker。
  - 任务拆分：当开启优化 Joker 顺序时，会对 Joker 的全排列按线程切片分发。
  - 收集结果：比较分数（最大/最小模式）、同分下 tie-break，更新最佳 Joker 顺序与出牌顺序，并更新 UI。

---

## 5. 优化与 Worker 工作流（worker.js）

- 组合搜索：
  - Joker 顺序：若优化开启，对 Joker 全排列遍历（阶乘级）。
  - 出牌集合：若优化卡牌开启，对“从手牌选 1~5 张”的所有组合搜索，并对每个组合的出牌顺序做全排列。

- 评分比较策略：
  - maximize（默认）：以“最差手”（保底）为比较标准，必要时用“最佳手”作 tie-break；minimize 反之。

- 统计输出：
  - 计算 `simulateBestHand()` 与 `simulateWorstHand()` 作为上下界；若两者不同，采样若干次 `simulateRandomHand()` 得到 Mean/Median。
  - 返回：最佳 Joker 顺序、最佳出牌集合/顺序、上下界、EV/Median、编译中间值等。

---

## 6. 模拟引擎（balatro-sim.js / Hand 类）

引擎分“编译阶段”和“模拟阶段”，以减少重复计算、提速遍历。

- 编译阶段：
  1) `compileJokers()`：处理与 Joker 全局效果相关的标志（FourFingers、Shortcut、Pareidolia、SmearedJoker、Splash、Vampire、MidasMask 等）。
  2) `compileJokerOrder()`：处理与 Joker 顺序相关的能力（Blueprint/Brainstorm 复制、Swashbuckler 卖价聚合等），生成 `compiledValues`、`jokerRarities`、`cardCast`。
  3) `compileCards()`：
     - 处理 `WILD` 花色、判定手牌类型 `getTypeOfHand()`，并计算牌型基础 chips/mult（含 TheFlint 对半效果）。
     - 处理依赖“手型/出牌集合”的 Joker（如 Stone/Steel/Runner/Obelisk/Vampire/Spare Trousers 等），把增益记入 `compiledChips/compiledMult/compiledValues`。

- 模拟阶段：`simulate()`
  - 触发出牌：对涉及的牌（或 Stone）逐张触发 `triggerCard()`，其中处理 Editions、Enhancement、面牌判定（Pareidolia/禁用/花色影响），以及逐牌触发的 Joker（如 Greedy/Lusty/Wrathful/Gluttonous、Scary Face、Even/Odd、Fibonacci、Scholar、Bloodstone/Seltzer 等）。
  - 触发“手牌中”效果：`triggerCardInHand()` 处理 Red Seal/双触发、Raised Fist/Shoot the Moon/Baron 等。
  - 触发 Joker：`triggerJoker()` 处理按 Joker 逐个结算的增益（Joker/Popcorn/Ramen/Campfire/Flash Card/Lucky Cat/Bull 等）。
  - 处理全局牌组效果：Observatory（按行星加乘）、Plasma（把 Chips 合成 Mult 再平方）等。
  - 返回 `[score_mantissa, score_exponent, chips, mult_big]`（或 Plasma 模式对应变形）。

- 判型：`getTypeOfHand()`
  - 计算 Straight/Flush/Four of a Kind/Full House/Two Pair/Three of a Kind/Flush House/Flush Five 等。
  - 支持 FourFingers（4 张成型）、Shortcut（可跳级）、WILD（任意花色）、Smeared（红黑花色融合）等规则。

---

## 7. Joker 文案与元数据（cards.js）

- 提供 Joker 的名称、价钱矩阵、稀有度矩阵、tooltip 模板（含高亮颜色、符号、花色名等）。
- `main.js` 在渲染时通过 `eval('`...`')` 代入动态变量（如 `jokerValue`、`hands[...]` 等）生成最终 tooltip 文案。

---

## 8. 交互要点与实现细节

- ID 编码与稳定性：
  - UI 层为每张卡构造唯一 ID，编码包含点数、花色、增强/版本布尔位等，确保排序与去重稳定。

- 高对比度与多背景层：
  - 卡面通过 CSS 多背景层完成底图+增强+版本的拼接；高对比度切换切换底图资源。

- 性能与可用性：
  - 当 Joker 数量或手牌数较大时，组合空间爆炸。UI 提供“优化 Joker/卡牌”的开关，避免在两个维度同时全搜索导致卡顿。

- 随机与确定：
  - 对 Lucky 等概率性效果，使用三种模式（Best/Worst/Random）来分别估计上界、下界与期望。

---

## 9. 扩展与维护建议

- 新增 Joker：
  - 在 `cards.js` 增加文案；在 `balatro-sim.js` 的 `compileCards`/`triggerCard`/`triggerCardInHand`/`triggerJoker`/`compileJokerOrder` 对应 `case` 实现规则；在 UI 的贴图坐标（`jokerString`）中补充覆盖（如有遮罩差异）。

- 新增增强或版本：
  - 增强需在 UI 的 `setModifierString()` 与模拟器增强常量中添加，并在 `triggerCard`/判型/编译相关处实现其效果。

- 测试与验证：
  - 以已有 Joker 的实现为模板，先在 `simulateBestHand/ WorstHand` 下复核上下界，再通过 `simulateRandomHand` 采样对齐期望值。

---

## 10. 快速索引（常看位置）

- UI 渲染：
  - 普通牌样式拼接：`main.js` → `cardString()` / `redrawCards()`
  - Joker 样式拼接：`main.js` → `jokerString()` / `jredrawCards()`
  - 选牌/移除：`main.js` → `addCard()` / `removeCard()`

- 优化与并行：
  - 入口：`manageWorkers.js` → `calculator()` / `terminateThreads()`
  - Worker 流程：`worker.js` → `initialize()` / `run()`

- 模拟引擎：
  - 编译阶段：`balatro-sim.js` → `compileJokers()` / `compileJokerOrder()` / `compileCards()`
  - 判型：`balatro-sim.js` → `getTypeOfHand()`
  - 结算：`balatro-sim.js` → `triggerCard()` / `triggerCardInHand()` / `triggerJoker()` / `simulate()`

---

如需对任意具体 Joker 或牌型判定流程做逐行解释，或需要一份数据流/时序图，我可以在该文档基础上继续细化补充。

