# End Run Integration

Show the result screen only after the run state is finalized.
Populate score and statistics from the actual run result.
Reward cards must use the real reward payload.
Claiming rewards must be idempotent and must not duplicate grants.
Replay should create a fresh run state.
Continue should route to the intended progression destination.
Share should use the platform share flow only when implemented.
Defeat/timeout/retry must preserve any rewards the game rules actually grant.
