# Inventory Integration

Inventory items must use stable item IDs and authoritative ownership.
Equipment changes must validate slot compatibility.
Loadout presets must save atomically.
Item stats must come from the authoritative item definition.
Upgrade costs and resulting stats must be validated before commit.
Salvage must be irreversible only after explicit confirmation and successful grant.
Protected/favorite items must be excluded from bulk salvage according to actual rules.
UI comparison values are informational and must never become game state.
