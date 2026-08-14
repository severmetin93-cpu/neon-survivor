# Combat HUD Integration

All gameplay values must come from authoritative combat state. HUD elements are read-only presentation. Ability, ammo, health, shield, cooldown and target values must never be granted or modified by UI code. Combat feedback should be event-driven and rate-limited.
