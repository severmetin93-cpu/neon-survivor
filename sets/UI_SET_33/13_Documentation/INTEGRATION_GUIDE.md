# In-Game HUD Integration

HUD is presentation-only and must read live gameplay state.
Health/energy/shield values must never be authoritative UI data.
Ability cooldowns and readiness must use the same timers as gameplay.
Minimap markers should reference actual world/objective/entity IDs.
Combat feedback should be event-driven and pooled to avoid allocation spikes.
Pause behavior must follow the active game mode's pause rules.
Dead/revive states must be synchronized with the player state machine.
Safe-area and touch targets must be validated on mobile aspect ratios.
