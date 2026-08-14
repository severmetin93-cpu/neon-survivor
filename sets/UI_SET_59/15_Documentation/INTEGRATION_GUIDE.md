# System Status Integration

Network and service state should be derived from authoritative connection/session signals. Retry must be bounded and use backoff. Reconnect should restore session state only after reconciliation. Required updates must block incompatible clients; optional updates may be deferred according to product rules. Download progress should be resumable and storage-validated.
