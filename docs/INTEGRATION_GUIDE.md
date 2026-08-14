# NORYVX UI System Integration Guide

1. Keep each UI set independently addressable under `sets/`.
2. Reuse the shared components and state conventions from UI Set 60 where applicable.
3. Preserve the manifests and QA documentation included inside each set.
4. Treat gameplay, progression, account, multiplayer, and other state mutations as authoritative outside the presentation layer.
5. Validate mobile safe areas, touch targets, localization expansion, accessibility, and performance during implementation.
