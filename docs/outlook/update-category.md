---
type: OKF Endpoint
title: Rename Outlook Category
method: PUT
path: /outlook/periods/:id/categories/:category_id
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Rename Outlook Category

Body `{ name }` (same cleaning/limits as [create-category](./create-category.md)). Only the name changes. Returns `200 { data: { state }, message: "Kategori diubah" }`. Errors: `404` period/category; `422 { errors: { name } }`; locked period ([lock](./index.md#closing-period-lock)).
