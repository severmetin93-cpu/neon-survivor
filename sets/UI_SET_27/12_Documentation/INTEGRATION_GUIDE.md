# Mail Integration

Messages must have stable IDs and server-authoritative timestamps.
Attachments must reference authoritative item/currency/reward IDs.
Claim operations must be idempotent and recoverable after reconnect.
Claim All must only claim currently eligible attachments.
Expired messages must not grant rewards unless the actual product rules explicitly allow recovery.
Unread/read state should persist per account.
Security/system messages should not be deletable if product rules require retention.
