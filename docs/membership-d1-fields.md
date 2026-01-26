# D1 字段说明（会员订阅系统）

本文件解释 `docs/membership-d1.sql` 里的表结构与字段含义，所有时间均为 UTC ISO 字符串。

## memberships（会员数据表）

用于记录已支付或已撤销的会员记录，是订阅有效期判断的主要来源。

- id：自增主键
- email：用户邮箱（不验证，仅用于查询与跨设备）
- feature_key：功能标识，如 `seed`
- plan：套餐类型，格式为 `功能-周期`，如 `seed-monthly` / `seed-yearly` / `seed-lifetime`
- amount：金额（USD），整数（5 / 39 / 100）
- currency：币种，固定 `USD`
- provider：支付渠道，`paypal` / `usdt`
- txn_id：交易号（PayPal 订单/捕获 ID 或 USDT 凭证号）
- status：状态，`paid` / `refunded` / `revoked` 等
- created_at：创建时间（UTC ISO）
- expires_at：到期时间（UTC ISO），终身可为空

## orders（一次性订单）

用于 PayPal 终身付费的订单跟踪（order -> capture）。

- id：自增主键
- email：用户邮箱
- feature_key：功能标识，如 `seed`
- order_id：PayPal order id
- plan：套餐类型，如 `seed-lifetime`
- status：订单状态（如 `CREATED` / `COMPLETED`）
- created_at：创建时间（UTC ISO）

## subscriptions（自动续费订阅）

用于月/年自动续费的订阅关系追踪。

- id：自增主键
- email：用户邮箱
- feature_key：功能标识，如 `seed`
- plan：套餐类型，如 `seed-monthly` / `seed-yearly`
- provider：支付渠道，固定 `paypal`
- subscription_id：PayPal subscription id
- status：订阅状态（如 `ACTIVE` / `CANCELLED`）
- created_at：创建时间（UTC ISO）
- updated_at：更新时间（UTC ISO）
- last_payment_at：最近一次成功扣款时间（UTC ISO）
- next_billing_at：下一次续费时间（UTC ISO）
