# 会员收费需求与方案

## 范围
- 仅限制 `balatro-seed-analyzer.html` 的 Analyze Seed 功能。
- 后续新增付费功能沿用同一套 featureKey 和计划命名规则。

## 计费与限制
- 免费：每设备每天 3 次，UTC 00:00 重置。
- 订阅：月付 USD 5、年付 USD 39、终身 USD 100。
- 订阅仅覆盖购买的功能，不覆盖其他功能。
- 月/年为自动续费订阅（周期 30/365 天）。

## 套餐命名
- 规则：`feature-period`
- 示例：`seed-monthly` / `seed-yearly` / `seed-lifetime`
- 未来可扩展：`vip-monthly` 等。

## 展示文案
- 今日剩余：`X/3`
- 重置规则：`每日 00:00 UTC 重置`
- 付费提示：`订阅后该功能无限使用`

## FeatureKey 模型
- 示例 featureKey：`seed`
- 免费额度与付费控制均以 featureKey 为维度。

## 前端限制（可被绕过）
- 本地存储键：
  - `bc_device_id`
  - `bc_usage_daily`
  - `bc_paid_email`
  - `bc_paid_features`
- `bc_usage_daily` 结构：
  - `{ [featureKey]: { date: "YYYY-MM-DD", used: number } }`
- `bc_paid_features` 结构：
  - `{ [featureKey]: { plan: "seed-monthly", expiresAt: "ISO" } }`
- Analyze 点击流程：
  1) 当前设备已付费 → 允许。
  2) 否则检查今日剩余次数 → 未超限则扣 1 次并允许。
  3) 超限 → 弹出付费弹窗。

## 订阅查询（邮箱不验证）
- 用户输入邮箱。
- 前端请求：`GET /api/subscription?email=...&feature=...`。
- 若有效，将对应 feature 的 plan 和 expiresAt 写入本地缓存。

## Cloudflare 后端
- D1 表：
  - `memberships`：会员主表（按功能维度）
  - `orders`：终身一次性订单
  - `subscriptions`：自动续费订阅
- Worker API：
  - `POST /api/paypal/create-order`（终身）
  - `POST /api/paypal/capture`（终身）
  - `POST /api/paypal/create-subscription`（月/年）
  - `POST /api/paypal/subscription-activate`（回跳确认）
  - `POST /api/paypal/webhook`（回调）
  - `GET /api/subscription?email=...&feature=...`
  - 环境变量命名：`PAYPAL_PLAN_<FEATURE>_<PERIOD>`（如 `PAYPAL_PLAN_SEED_MONTHLY`）
- 管理员接口（Basic Auth）：
  - `GET /admin`
  - `POST /api/admin/payment`（手动 USDT）
  - `GET /api/admin/search?email=...`
  - `POST /api/admin/revoke`

## PayPal 流程
- 终身：订单 -> capture。
- 月/年：Subscriptions API（自动续费）。
- Webhook 校验签名后更新订单/订阅状态。
- `expires_at`：
  - monthly：now + 30 days
  - yearly：now + 365 days
  - lifetime：null
  - 自动续费：每次扣费成功后更新 `expires_at`

## 管理员流程
- Basic Auth 账户密码通过环境变量配置。
- 手动 USDT：录入 email、plan、amount、txn_id。

## 运维与风控
- 订阅查询和 PayPal 接口加限流。
- 记录 webhook 校验失败日志。
- D1 定期备份（导出或快照）。
- Basic Auth 密码定期轮换。

## 可扩展性
- 新功能只需新增 `featureKey` 与对应 plan。
- 无需改变已存在的订阅逻辑。

## 落地步骤
1) 前端加配额提示与本地次数限制。
2) 建 D1 表与 Functions API。
3) 接入 PayPal 订阅与回调。
4) 增加管理员页面（手动 USDT/查询/撤销）。
5) 前端接入订阅查询。

## 备注
- D1 建表 SQL：`docs/membership-d1.sql`
- D1 字段说明：`docs/membership-d1-fields.md`
