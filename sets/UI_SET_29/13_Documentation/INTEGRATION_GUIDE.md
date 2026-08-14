# Inventory Integration

Item IDs, quantities and ownership must come from authoritative inventory state.
Equipment slots must validate item compatibility before equipping.
Loadout save/equip/delete operations must persist atomically.
Sorting/filtering is presentation state and must not alter inventory ownership.
Favorite/selected/new states should persist only where the product requires it.
Inventory capacity must be validated before grants.
Consumable use and item grants must be idempotent.
