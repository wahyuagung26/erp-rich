---
type: OKF Endpoint
title: Delete Outlook Category
method: DELETE
path: /outlook/periods/:id/categories/:category_id
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Delete Outlook Category

Deletes the category at any level together with all its sub-categories and their OL/actual. The UI confirms first and says whether sub-categories / values go too. Returns `200 { data: { state }, message: "Kategori dihapus" }`. Errors: `404`; locked period ([lock](./index.md#closing-period-lock)).
