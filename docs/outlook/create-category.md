---
type: OKF Endpoint
title: Create Outlook Category
method: POST
path: /outlook/periods/:id/categories
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Create Outlook Category

Body `{ name, parent_id?, flow_type? }`. Without `parent_id` it adds a **root** category and `flow_type` (`CASH_IN`/`CASH_OUT`) is required; with `parent_id` the child inherits the parent's flow and `flow_type` is ignored. `name` is trimmed, whitespace collapsed, 1–150 chars. Appended after its siblings.

Maximum depth is 3 (a child of a depth-3 category is refused). When the parent was a leaf that already held OL/actual, those rows are deleted in the same write — the system does not move them to the child (decision OD-01).

Returns `201 { data: { state, result: { category_id, reset: { ol, actual } } }, message: "Kategori ditambahkan" }`. The UI warns when `reset` is non-zero.

Errors: `404` period/parent; `422 { errors: { name } }`, `422 { errors: { flow_type } }`, `422 { errors: { parent_id: ["Level 4 tidak diperbolehkan"] } }`, locked period ([lock](./index.md#closing-period-lock)).
