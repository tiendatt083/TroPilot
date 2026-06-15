# Tropilot Chatbot Context Schema

## Purpose

This document defines the stable JSON contract supplied to the Tropilot
chatbot. Every role receives the same top-level structure. Role-specific
builders may populate only the fields authorized for the authenticated user.

The context is created from response DTOs and deliberately selected scalar
values. JPA entities must never be serialized directly into this document.

## Common Structure

```json
{
  "generatedAt": "15/06/2026 10:30",
  "user": {
    "role": "ADMIN",
    "dataScope": "GLOBAL_ADMIN"
  },
  "businessRules": {},
  "summary": {},
  "buildings": [],
  "roomsNeedingAttention": [],
  "invoicesNeedingAttention": [],
  "expiringContracts": [],
  "maintenanceRequests": [],
  "tasks": []
}
```

All top-level fields are always present, even when their value is an empty
object or array. This gives Gemini a predictable structure and allows later
phases to add data without changing the contract.

## Field Definitions

| Field | Type | Purpose |
| --- | --- | --- |
| `generatedAt` | String | Time the live context was generated, formatted as `dd/MM/yyyy HH:mm`. |
| `user.role` | String | Authenticated Tropilot role: `ADMIN`, `STAFF`, or `RESIDENT_HEAD`. |
| `user.dataScope` | String | Maximum authorized scope of the generated context. |
| `businessRules` | Object | Stable Tropilot rules loaded from `chat/tropilot-business-rules.json` and used to explain business behavior. |
| `summary` | Object | Role-specific summary values and current-room summary for a Head Resident. |
| `buildings` | Array | Authorized building summaries. Admin receives per-building operational and cash-flow statistics, Staff receives operational statistics, and a Head Resident receives only their assigned building and room identity. |
| `roomsNeedingAttention` | Array | Authorized rooms requiring operational attention. |
| `invoicesNeedingAttention` | Array | Authorized unpaid, overdue, disputed, or otherwise actionable invoices. |
| `expiringContracts` | Array | Authorized active contracts approaching their end date. |
| `maintenanceRequests` | Array | Authorized unresolved or recent maintenance requests. |
| `tasks` | Array | Authorized active tasks. |

## Data Scopes

| Role | `dataScope` | Meaning |
| --- | --- | --- |
| `ADMIN` | `GLOBAL_ADMIN` | May receive authorized global system summaries and building-level operational data. |
| `STAFF` | `STAFF_OPERATIONAL` | May receive operational data permitted for Staff. Restricted Admin-only data must be excluded. |
| `RESIDENT_HEAD` | `RESIDENT_OWN_ROOM_ONLY` | May receive only data belonging to the authenticated Head Resident's active room. |

## Role Builder Architecture

`ChatContextServiceImpl` owns only the stable schema, timestamp, role scope,
business-rule context, and builder selection. Detailed live data is populated
by one builder per role:

- `AdminChatContextBuilder`
- `StaffChatContextBuilder`
- `ResidentChatContextBuilder`

`BusinessRuleContextProvider` loads the fixed business-rule context separately.
This separation prevents one role builder from accidentally inheriting another
role's data queries.

## Current Context Population

### Admin

`summary` contains global dashboard metrics, including building, room,
occupant, vehicle, contract, invoice, cash-flow, maintenance, task, and
feedback counts or totals.

`buildings` contains per-building room status, missing-reading, contract,
invoice, maintenance, task, and current-month cash-flow summaries.

The attention arrays contain bounded, explicitly mapped records for rooms
missing readings or invoices, unpaid, overdue, disputed, or recent invoices,
active contracts expiring soon, unfinished or recent maintenance requests, and
unfinished tasks.

### Staff

`summary` contains Staff operational dashboard metrics. `buildings` contains
only operational counts needed by Staff. Detailed arrays contain only rooms
missing readings, pending payment confirmations, maintenance assigned to the
authenticated Staff member, and tasks assigned to that Staff member.

Admin-only contract and cash-flow detail is excluded. Assigned maintenance may
include unfinished requests plus recently completed or rejected requests when
they are still operationally useful to explain recent work.

### Head Resident

`summary.currentRoom` contains a deliberately selected subset of the active
room assignment DTO plus approved members, active vehicles, recent authorized
notifications, the current contract, and the latest invoice:

```json
{
  "assigned": true,
  "roomCode": "BD01-P101",
  "roomName": "Room 101",
  "roomStatus": "OCCUPIED",
  "buildingCode": "BD01",
  "buildingName": "Building 01",
  "approvedMemberCount": 2,
  "activeVehicleCount": 1,
  "unreadNotificationCount": 3,
  "recentMaintenanceRequestCount": 1,
  "activeMembers": [],
  "activeVehicles": [],
  "recentNotifications": [],
  "currentContract": {},
  "latestInvoice": {}
}
```

The Head Resident receives only their own assigned building identity, own-room
unpaid, disputed, or recent invoices, their own contract approaching expiry,
and their own unfinished or recent maintenance requests.

## Data Limits

The chatbot context is not a database export. Builders must keep detailed
records small and operational:

- Each detailed array is limited to approximately 50 records for Admin and
  Staff.
- Head Resident recent lists are limited to approximately 10 records.
- Contracts are limited to active contracts that are approaching expiry.
- Invoices are limited to unpaid, overdue, disputed, or recent invoices.
- Maintenance requests are limited to unfinished or recent requests.
- Tasks are limited to unfinished tasks.
- Building data is aggregated into statistics. Child room, invoice,
  maintenance, task, or resident histories must not be nested under each
  building.

## Data Safety Rules

The generated context must never contain:

- Passwords or temporary passwords.
- Password hashes or encrypted password values.
- JWT tokens, API keys, webhook secrets, or encryption secrets.
- Bank credentials.
- Bank account numbers generated for payment QR codes.
- Gemini keys, SePay secrets, webhook API keys, or encrypted configuration
  values.
- Internal numeric identifiers unless they are strictly needed for a supported
  chatbot answer.
- Full JPA entities or uncontrolled entity relationships.
- Data outside the authenticated role's authorized scope.
- Personal information that is unnecessary for answering supported questions.

## Fixed Business Knowledge

`businessRules` is loaded from
`tropilot-backend/src/main/resources/chat/tropilot-business-rules.json`.
The resource contains concise, English-only rules for residency, occupancy,
contracts, utility readings, invoices, service fees, SePay payments, and role
permissions.

The resource is read once when the backend starts. Each chatbot context receives
an independent JSON copy so a request cannot mutate the shared rule set.

## Evolution Rules

- Do not rename or remove top-level fields without a versioned migration.
- Add detailed values only through selected DTO fields or explicit maps.
- Keep every list bounded when detailed records are added.
- Keep `summary` concise; detailed records belong in the relevant arrays.
- Tests must verify the common top-level schema for all three roles.
