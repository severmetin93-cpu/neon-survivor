# Notification / Inbox / Daily Login Integration

Notifications must be generated from real game/account events.
Unread/read state must persist.
Mail should have stable IDs and expiration rules when applicable.
Rewards must be granted idempotently and marked claimed only after successful grant.
Daily login resets must use the authoritative daily boundary.
Streaks must preserve continuity according to the game's actual rules.
Never grant rewards merely because a claim button was rendered.
