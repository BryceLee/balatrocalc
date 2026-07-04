CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_id_unique
  ON orders (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_unique
  ON subscriptions (provider, subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_provider_txn_unique
  ON memberships (provider, txn_id)
  WHERE txn_id IS NOT NULL;
