# End Match Integration

Results must be generated from the validated match result.
Score, XP, rank and rewards must not be trusted from client-submitted values.
Reward grants must be idempotent.
XP level transitions must be atomic with progression updates.
Scoreboard values should be finalized before rendering the result screen.
Personal-best detection should compare against authoritative historical data.
Claimable rewards must have a unique grant/claim identity.
Disconnect results should follow the game's explicit match-abandonment policy.
