---
type: API Endpoint
title: <Human name, e.g. List Akun>
description: <one line>
method: <GET | POST | PUT | PATCH | DELETE>
path: /<resource>
status: mock
tags: [<module>, <read|write>]
resource: /frontend/src/mocks/modules/<module>.ts
timestamp: <ISO 8601>
---

# <Title>

<What this endpoint is for. Which frontend view/action calls it.>

## Request

### Path params
| Name | Type | Notes |
|---|---|---|
| `id` | string | — |

### Query
| Name | Type | Required | Notes |
|---|---|---|---|
| … | … | … | … |

Inherits pagination params from [conventions](../conventions.md) for list endpoints.

### Body
```json
{ }
```

## Response

`200` (or `201` for create):

```json
{ "data": { } }
```

Field notes:

| Field | Type | Notes |
|---|---|---|

## Errors

| Status | When | Body |
|---|---|---|
| `404` | not found | `{ "message": "..." }` |
| `422` | validation | `{ "message": "...", "errors": { "<field>": ["..."] } }` |

## Notes

- <business rules, edge cases, links to related endpoints e.g. [create-akun](./create-akun.md)>
