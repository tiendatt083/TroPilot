# Tropilot Official Demo Flow

This document defines the fixed academic demonstration flow for Tropilot. Use this checklist to keep the demo predictable and to avoid changing screens or data randomly during presentation.

## Demo Rules

- Use only clean demo data.
- Do not use real personal information, private contract files, or private payment screenshots.
- Do not commit temporary passwords, bank data, webhook secrets, or API keys.
- Use one demo building as the main walkthrough target.
- Use the building workspace for detailed building-level operations such as rooms, service fees, utility readings, invoices, vehicles, payments, receipts, and maintenance.
- Record any issue found during the live walkthrough in `docs/demo-bug-log.md`.

## Required Local Services

Before starting the demo, verify:

- MySQL Server is running.
- The `tropilot` database exists.
- Backend runs on `http://localhost:8080`.
- Frontend runs on `http://localhost:5173`.
- Browser local storage is cleared before switching between demo users.
- Upload folders are writable.
- Backend tests or backend build pass.
- Frontend build passes.

## Clean Demo Data Set

Use these values as the main clean demo data. Replace temporary passwords only during the live demo and never commit them.

### Accounts

| Purpose | Name | Email | Role |
| --- | --- | --- | --- |
| Default administrator | Admin | admin@tropilot.com | ADMIN |
| Demo staff | Demo Staff | staff.demo@tropilot.test | STAFF |
| Demo head resident | Demo Resident | resident.demo@tropilot.test | RESIDENT_HEAD |

### Building And Room

| Field | Demo value |
| --- | --- |
| Building code | DEMO01 |
| Building name | Demo Tower 01 |
| Address | Demo Street 01 |
| Room code input | P101 |
| Expected full room code | DEMO01-P101 |
| Floor | 1 |
| Max occupants | 4 |
| Room price | 5000000 |

For a real low-value SePay transfer test, create a separate low-value room or temporarily use a low room price in a local-only demo database. Do not use low-value financial data in screenshots meant to represent a production scenario.

### Room Member

| Field | Demo value |
| --- | --- |
| Full name | Demo Member One |
| Phone | 0900000001 |
| Email | member.one@tropilot.test |
| Relationship | Roommate |
| Move-in date | Current demo date |

### Service Fee Configuration

| Fee | Calculation method | Demo value |
| --- | --- | --- |
| Electricity | By usage | 3500 |
| Water | By usage | 12000 |
| Internet | By room | 100000 |
| Cleaning | By person | 30000 |
| Parking | By room or by registered vehicle, depending on the current implemented workflow | 100000 |

Each building must have only one active electricity configuration and one active water configuration.

### Utility Reading

| Field | Demo value |
| --- | --- |
| Room | DEMO01-P101 |
| Reading date | Current demo date |
| Electricity old reading | 100 |
| Electricity new reading | 120 |
| Water old reading | 10 |
| Water new reading | 15 |
| Evidence files | Clean demo jpg or png files |

Only occupied rooms should appear in the utility reading room selector.

### Invoice

| Field | Demo value |
| --- | --- |
| Invoice date | Current demo date |
| Due date | Day 05 of the invoice month |
| Invoice room | DEMO01-P101 |
| Invoice month | Current demo month |

The invoice should include room rent, configured recurring service fees, and utility usage from the correct utility reading period.

## Official Demo Checklist

Use the checklist below from top to bottom.

| Step | Actor | Action | Expected result |
| --- | --- | --- | --- |
| 1 | Admin | Log in with the default Admin account | Admin dashboard is visible |
| 2 | Admin | Create a Staff account | Staff account is created with a temporary password |
| 3 | Admin | Create a Head Resident account | Head Resident account is created with a temporary password |
| 4 | Staff | Log in and change the temporary password | Staff reaches the Staff workspace |
| 5 | Head Resident | Log in and change the temporary password | Head Resident reaches the allowed resident workspace |
| 6 | Admin | Create `DEMO01 - Demo Tower 01` | Building appears in the building list |
| 7 | Admin | Create room `P101` under `DEMO01` | Room appears as `DEMO01-P101` |
| 8 | Admin | Open the `DEMO01` building workspace | Building workspace opens |
| 9 | Admin | Assign the Head Resident to `DEMO01-P101` | Room becomes occupied and assignment is active |
| 10 | Head Resident | Add `Demo Member One` | Member is pending approval |
| 11 | Admin | Approve the pending room member | Approved member counts as an active occupant |
| 12 | Admin | Upload a clean demo contract file | Contract is uploaded and visible |
| 13 | Head Resident | Confirm the contract | Contract confirmation status is updated |
| 14 | Head Resident | Request vehicle registration | Vehicle request is submitted |
| 15 | Admin | Approve the vehicle request | Vehicle becomes active |
| 16 | Admin or Staff | Configure service fees for the building | Electricity, water, and other services are active |
| 17 | Admin or Staff | Record utility readings with evidence | Reading is created and evidence is visible |
| 18 | Admin or Staff | Generate invoice for the room or building | Invoice is created once for the selected month |
| 19 | Head Resident | Open invoice detail | Invoice items and payment information are visible |
| 20 | Head Resident | Pay through SePay QR or submit manual proof | Invoice moves toward paid or pending confirmation |
| 21 | System | Receive successful SePay webhook or approved payment | Invoice becomes paid and receipt is created |
| 22 | Admin | Verify receipt | Valid receipt is visible |
| 23 | Head Resident | Create maintenance request | Request starts as pending |
| 24 | Admin | Assign maintenance request to Staff | Request becomes assigned |
| 25 | Staff | Start and complete maintenance request | Request becomes completed |
| 26 | Admin | Review building cash flow | Income and remaining cash are updated |
| 27 | Admin | Remove the Head Resident from the room | Assignment and contract end, room members leave, vehicles become inactive, room becomes empty |
| 28 | Admin | Check room members, vehicles, and contracts | No old active residence data remains for the empty room |
| 29 | Admin | Review activity logs | Important actions are logged without sensitive data |

## Fixed Verification Points

After the walkthrough, verify:

- The ended contract does not appear as an active rental.
- The empty room does not allow new utility readings or invoices.
- The old room member is marked as left.
- The old vehicle is inactive.
- A resident without an active room cannot access room-based features through direct URL entry.
- A paid invoice cannot be deleted.
- An unpaid or pending-confirmation invoice can be deleted only when no valid receipt exists.
- Admin sees payment status, not resident payment QR behavior.
- Head Resident sees QR only while the invoice still needs payment.

## Demo Bug Recording

If any issue appears during the walkthrough:

1. Do not fix it immediately during the live demo unless it blocks the demo.
2. Record it in `docs/demo-bug-log.md`.
3. Include the role, page URL, action, expected result, actual result, and severity.
4. Reproduce the issue once after the demo before changing code.
