---
type: API Endpoint
title: Delete Cash Advance
description: Delete a submitted operational cash advance.
method: DELETE
path: /cash-advance/:id
status: mock
tags: [cash-advance, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Delete Cash Advance

Only advances with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Uang muka operasional dihapus" }`

`422`: `{ "message": "Hanya uang muka submitted yang dapat dihapus" }` for approved
or rejected advances.
