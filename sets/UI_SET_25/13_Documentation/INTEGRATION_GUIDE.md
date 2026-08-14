# Store Integration

Prices and offers must come from authoritative commerce configuration.
Purchase flow must verify entitlement/payment result before granting items.
Grants must be idempotent and recoverable after interrupted transactions.
Owned items must never be granted twice unless the actual product rules allow it.
Limited-offer timers must use authoritative server time.
Sold-out, locked and available states must reflect actual inventory/catalog state.
Client UI must not be trusted to determine purchase success or ownership.
