---
type: API Endpoint
title: List Product Variant Option
description: Attribute names and values already used by the active company's products — suggestions for the product form's variant editor.
method: GET
path: /product-variant-option
status: mock
tags: [product, read]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-11-15T12:00:00Z
---

# List Product Variant Option

Backs the suggestions of "Nama Atribut" and "Nilai" in the product form (`views/product/components/ProductVariants.vue`), so
staff reuse "S" instead of typing "Small" next to it. Not a master: values are collected from live products, and free text is
still accepted.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

No query params; the list is small and returned in one page.

## Response

`200`:

```json
{ "data": [{ "name": "Ukuran", "values": ["S", "M", "L"] }], "meta": { "page": 1, "per_page": 1, "total": 1, "last_page": 1 } }
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | attribute name, first spelling seen; names match case-insensitively |
| `values` | string[] | distinct values (case-insensitive) of non-deleted variants |

## Notes

- Without a resolvable `X-Company-Id` the list is empty ([conventions](../conventions.md#company-scoping)).
