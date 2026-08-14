# Inventory Integration

Inventory contents must come from authoritative player ownership data.
Item definitions and stats must come from the game catalog/data tables.
Equip requests must validate ownership and slot compatibility.
Equipped loadout should persist atomically.
Locked items must expose their actual unlock condition where available.
Upgrade eligibility must be validated server-side or by the authoritative progression system.
Duplicate/overflow handling must follow the inventory rules.
Cosmetic previews must never grant ownership.
