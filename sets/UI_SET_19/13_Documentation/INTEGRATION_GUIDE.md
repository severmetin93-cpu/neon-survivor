# Quest Integration

Daily and weekly reset windows must use authoritative server time.
Progress must be updated from validated gameplay events.
Completion must be idempotent.
Rewards must be granted only after valid completion.
Claimable state must not imply reward ownership until the grant succeeds.
Expired quests must stop progress according to actual rules.
Quest IDs and objective IDs should remain stable across UI versions.
