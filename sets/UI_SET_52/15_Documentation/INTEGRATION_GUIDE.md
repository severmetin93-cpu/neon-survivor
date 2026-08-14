# Crafting Integration

All item mutations must be authoritative and atomic. Costs and materials are checked at mutation time. Success chances must be determined by the authoritative system. Results must be idempotent and recoverable after reconnect. Protected/quest items cannot be destroyed without explicit, validated rules. Client UI must never grant outputs directly.
