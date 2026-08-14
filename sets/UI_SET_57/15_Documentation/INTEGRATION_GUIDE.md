# Multiplayer Integration

Queue state, lobby membership, ready state, team assignment and match acceptance must be server-authoritative. Match found acceptance must be idempotent. Lobby leader permissions must be validated. Reconnect should reconcile queue/lobby/match state before presenting actions to the player.
