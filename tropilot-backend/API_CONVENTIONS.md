# Tropilot API and Backend Naming Conventions

## Resource Paths

- Use lowercase plural nouns in kebab-case.
- Prefix protected endpoints with the role that owns the operation:
  - `/api/admin/...`
  - `/api/staff/...`
  - `/api/resident/...`
- Nest data under its owning resource when the ownership is required:
  - `/api/admin/buildings/{buildingId}/invoices`
  - `/api/staff/buildings/{buildingId}/service-fees`
  - `/api/admin/rooms/{roomId}/head-resident`
- Use path variables for resource identity and query parameters for optional filters.
- Do not create a second global endpoint when a building-scoped endpoint is the authoritative workflow.

## HTTP Methods

- `GET` reads resources.
- `POST` creates resources or starts a calculation that produces a new result.
- `PUT` updates an existing resource or performs an idempotent state transition.
- `DELETE` removes or ends a resource relationship when the operation is allowed.

Examples:

- `POST /api/admin/rooms/{roomId}/head-resident`
- `GET /api/admin/rooms/{roomId}/head-resident`
- `DELETE /api/admin/rooms/{roomId}/head-resident`
- `POST /api/admin/buildings/{buildingId}/invoices/preview`
- `POST /api/admin/buildings/{buildingId}/invoices/bulk-generate`

## Controller Names

- Use `{Role}{Resource}Controller` for role-specific resources.
- Include the owning resource when the endpoint is scoped:
  - `AdminBuildingInvoiceController`
  - `StaffBuildingServiceFeeController`
- Use a responsibility name when the controller manages a relationship:
  - `AdminHeadResidentAssignmentController`

## DTO Names

- Use `CreateRequest` when the payload only creates a resource.
- Use `UpdateRequest` when the payload only updates a resource.
- Use `UpsertRequest` when the same payload is intentionally shared by create and update operations.
- Use `Response` for data returned to clients.
- Use domain-specific names instead of generic names such as `Request` or `Data`.

Examples:

- `BuildingUpsertRequest`
- `RoomUpsertRequest`
- `ExpenseCreateRequest`
- `VehicleRegistrationRequest`
- `HeadResidentAssignmentResponse`

## Service Methods

- Start method names with a clear verb: `create`, `get`, `update`, `delete`, `assign`, `remove`, `preview`, or `generate`.
- Include the scope when the method enforces ownership:
  - `getBuildingInvoices`
  - `getBuildingInvoice`
- Avoid overloaded methods whose scope can only be understood from argument order.

## Package Ownership

- `controller`: HTTP transport and role authorization.
- `dto.request`: validated incoming payloads.
- `dto.response`: outgoing API contracts.
- `service`: business interfaces.
- `service.impl`: business implementations only.
- `mapper`: entity-to-DTO mapping.
- `storage`: file validation and storage.
- `validation`: reusable domain guards and reference checks.
- `repository`: persistence queries.

## Compatibility Rule

When an endpoint or DTO is renamed:

1. Update backend controllers, services, and tests.
2. Update every frontend API function and caller in the same change.
3. Search the repository for the old name.
4. Build both applications before reporting completion.
