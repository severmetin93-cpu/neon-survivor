# Store Integration

Catalog and prices must come from authoritative store configuration.
Currency balances must never be trusted from client UI.
Purchases must be validated server-side.
Platform purchases must validate receipts through the appropriate platform flow.
Purchase grants must be idempotent.
Owned items cannot be purchased again unless the catalog explicitly supports duplicates.
Offer timers should use authoritative server time.
Daily deals must rotate from authoritative configuration.
Premium entitlements must be checked from the account entitlement state.
No client-side price calculation should determine the granted value.
