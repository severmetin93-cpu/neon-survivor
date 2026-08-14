# Quest Integration

Quest IDs must be stable.
Availability and progression must come from authoritative quest state.
Tracked quest selection should persist as player preference.
Daily and weekly reset timestamps must use authoritative time.
Objective progress must be updated from validated gameplay events.
Completion rewards must be granted idempotently.
Expired or failed quests must follow their configured recovery/retry rules.
Map markers should reference the same quest/objective IDs.
