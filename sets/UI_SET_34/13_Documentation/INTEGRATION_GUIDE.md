# Boss Encounter Integration

Boss state must be driven by the encounter state machine.
HP thresholds must be data-driven, not hard-coded into UI.
Phase transitions must trigger the correct gameplay and presentation events.
Telegraphs must reflect actual attack timing and target data.
Damage numbers should be event-driven and pooled.
Enrage/stagger states must synchronize with gameplay.
Boss defeat should disable further damage events and transition atomically.
Rewards must be granted once after validated encounter completion.
Victory screen should use the authoritative encounter result.
