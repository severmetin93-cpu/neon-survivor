# Social Integration

Friend relationships must be server-authoritative.
Party membership and leader permissions must be validated server-side.
Clan roles and membership require authoritative permission checks.
Chat channels need message routing, mute/block permissions and moderation hooks.
Invites must expire according to authoritative timestamps and cannot be accepted twice.
Presence is ephemeral session state and should degrade gracefully when disconnected.
The UI must not assume a successful social action until the authoritative response arrives.
