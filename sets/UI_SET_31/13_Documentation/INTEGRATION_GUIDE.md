# Game Mode Integration

Mode availability must come from authoritative configuration/service state.
Party requirements must be validated before queue/start.
Ranked eligibility must be validated server-side.
Matchmaking/searching states must reflect actual queue state.
Maintenance and cooldown timers should use authoritative time.
Mode start requests must be idempotent and recover safely from reconnects.
Rewards and score results must be awarded only from validated match completion.
