# Matchmaking Integration

Matchmaking status must reflect the authoritative service state.
Queue cancel must be idempotent.
Lobby membership and host permissions must be validated server-side.
Ready state must be authoritative and reset when the session changes.
Team formation must be authoritative and should not allow client-side team spoofing.
Loading completion must be based on actual asset/session readiness.
Reconnect flows must restore the correct session without creating duplicate queue requests.
Match start should occur only after all required readiness conditions are satisfied.
