# PayPal 接入需求说明（可复用）

本文件是**需求层面的提示词/清单**，用于复用到其它项目，不包含实现细节或技术步骤。

---

## 1) 目标

- 提供 PayPal 支付，支持订阅与一次性终身购买。
- 订阅成功后自动解锁功能，并清晰展示会员状态与到期时间。
- 出现支付问题时，用户能快速找到官方支持邮箱。

---

## 2) 业务范围

**支付类型**
- 月订阅（自动续费）
- 年订阅（自动续费）
- 终身（一次性支付）

**账户识别**
- 以用户输入的邮箱作为订阅查询与会员识别。
- 支持“退出账号/切换账号”。

**权限规则**
- 免费用户：每天 100 次额度（示例），到点重置。
- 订阅用户：Unlimited，无次数限制。

**续费叠加**
- 若用户已有未到期订阅，再购买时**从当前到期日累加**，不能直接覆盖成“从今天起算”。
- Lifetime 不显示到期时间。

---

## 3) 用户体验（UI / 文案）

**Paywall 弹窗**
- 标题：Unlimited Seed Analysis
- 文案：Subscribe for unlimited access to Seed Analyzer.
- 说明：Monthly and yearly plans auto-renew. Cancel anytime.
- 支付异常提示：  
  `If you cannot pay or encounter issues, contact support@balatrocalc.com.`  
  邮箱可点击复制。

**订阅成功后**
- 弹窗自动关闭（2–3 秒内）
- Toast 居中提示：  
  `Subscription confirmed. Access unlocked.`

**订阅状态展示**
- 显示：Seed Pro + 当前方案（Monthly / Yearly / Lifetime）
- 显示到期日期（UTC）
- 显示用户邮箱
- 支持“Log out”
- 提供“Upgrade Pro”按钮

**订阅管理**
- 提供“Manage in PayPal”按钮  
  用于用户在 PayPal 中取消自动续费（站内不做直接取消）。

---

## 4) 环境要求（非技术流程）

**Sandbox / Live 分离**
- Preview / 测试环境必须使用 Sandbox
- Production 必须使用 Live
- Webhook 也必须分开配置

**Webhook 必须生效**
- Webhook 能收到订阅创建/激活/支付完成事件
- Webhook 失败时要有错误提示/日志

---

## 5) 数据记录要求（抽象需求）

系统需要持久记录以下信息：
- 用户邮箱
- 订阅类型（月/年/终身）
- 支付状态（ACTIVE / CANCELLED / …）
- 到期时间
- 支付流水或订阅 ID

