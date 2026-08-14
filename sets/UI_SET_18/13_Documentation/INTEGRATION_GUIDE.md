# Shop / Economy Integration

Prices and balances must come from the authoritative economy configuration.
Purchase validation must happen server-side where applicable.
Client UI must never grant currency or items by itself.
Purchase results must be idempotent and recoverable.
Loot box outcomes must use authoritative drop tables and reveal state.
Limited offers must respect their actual start/end times and eligibility rules.
Owned/insufficient/limit states must reflect current account state.
