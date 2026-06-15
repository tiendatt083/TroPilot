# Tropilot Chatbot Question Scope

## Purpose

This document defines the official question scope for the Tropilot chatbot.
It is the acceptance checklist for future chatbot context, prompt, permission,
and response-quality work.

The chatbot is currently read-only. It may explain authorized data and
recommend actions, but it must never claim that it created, updated, deleted,
approved, rejected, or paid a record.

## Global Acceptance Rules

Every chatbot answer must:

- Use only current data supplied by the authorized Tropilot context.
- Answer the requested value directly when the context contains it.
- State clearly when the context does not contain enough information.
- Never invent counts, names, statuses, dates, amounts, or recommendations
  that depend on unavailable data.
- Use the language of the user's latest message.
- Explain important findings and recommend a practical next action when useful.
- Respect role permissions and the active-room restriction for Head Residents.
- Never expose passwords, temporary passwords, tokens, secrets, bank
  credentials, encrypted values, or unnecessary personal information.

## Admin Question Checklist

### CHAT-ADMIN-001: Portfolio Counts

- **Canonical question:** How many buildings, rooms, and residents are currently managed?
- **Required answer data:** Total buildings, total rooms, total Head Residents,
  total approved room members, and total occupants.
- **Expected behavior:** Present exact counts and distinguish Head Residents,
  approved members, and total occupants.
- **Must not:** Estimate values or count pending/left members as active occupants.

### CHAT-ADMIN-002: Buildings With Empty Rooms

- **Canonical question:** Which buildings currently have empty rooms?
- **Required answer data:** Building code, building name, empty-room count, and
  room codes when available.
- **Expected behavior:** List only buildings with at least one empty room and
  include a total.
- **Must not:** Treat maintenance rooms as empty rooms.

### CHAT-ADMIN-003: Missing Utility Readings

- **Canonical question:** Which occupied rooms have not recorded utility readings this month?
- **Required answer data:** Context month, building code, room code, and missing
  reading status.
- **Expected behavior:** List only occupied rooms that require a reading for the
  context month.
- **Must not:** Include empty rooms or rooms that already have a reading for the
  context month.

### CHAT-ADMIN-004: Rooms Missing Invoices

- **Canonical question:** Which occupied rooms have not received an invoice this month?
- **Required answer data:** Invoice month, building code, room code, Head
  Resident, and invoice eligibility status.
- **Expected behavior:** List eligible occupied rooms without an invoice for the
  requested month.
- **Must not:** Include empty rooms or rooms that already have an invoice for
  that month.

### CHAT-ADMIN-005: Unpaid And Overdue Invoices

- **Canonical question:** Which invoices are unpaid or overdue?
- **Required answer data:** Invoice ID, building code, room code, Head Resident,
  invoice month, due date, total amount, and status.
- **Expected behavior:** Separate unpaid invoices from overdue invoices and
  summarize their counts and amounts.
- **Must not:** Include paid invoices.

### CHAT-ADMIN-006: Expiring Contracts

- **Canonical question:** Which active rental contracts will expire soon?
- **Required answer data:** Building code, room code, Head Resident, contract end
  date, and remaining days.
- **Expected behavior:** List only active rental contracts within the configured
  expiry window.
- **Must not:** Include ended contracts as current rentals.

### CHAT-ADMIN-007: Pending Maintenance

- **Canonical question:** Which maintenance requests still require processing?
- **Required answer data:** Request ID, building code, room code, title, status,
  assigned Staff member, and created date.
- **Expected behavior:** Group or order requests by operational urgency and
  identify unassigned requests.
- **Must not:** Include completed or rejected requests as pending work.

### CHAT-ADMIN-008: Financial Summary

- **Canonical question:** What are the current total income, total expense, remaining cash, and unpaid amount?
- **Required answer data:** Total income, total expense, remaining cash, unpaid
  invoice amount, and reporting period.
- **Expected behavior:** Explain that remaining cash equals valid income minus
  valid expenses and identify material unpaid amounts.
- **Must not:** Count cancelled receipts or cancelled expenses.

## Staff Question Checklist

### CHAT-STAFF-001: Assigned Tasks

- **Canonical question:** Which tasks are currently assigned to me?
- **Required answer data:** Task ID, title, related building or room, deadline,
  priority, and status.
- **Expected behavior:** List only tasks assigned to the authenticated Staff
  member and highlight overdue or urgent tasks.
- **Must not:** Reveal tasks assigned to another Staff member.

### CHAT-STAFF-002: Rooms Requiring Utility Readings

- **Canonical question:** Which rooms still need utility readings this month?
- **Required answer data:** Context month, building code, room code, and reading
  status.
- **Expected behavior:** List only occupied rooms eligible for Staff operations
  that have no reading for the context month.
- **Must not:** Include empty rooms or completed readings.

### CHAT-STAFF-003: Pending Payment Confirmations

- **Canonical question:** Which payments are waiting for confirmation?
- **Required answer data:** Payment ID, invoice ID, building code, room code,
  amount, upload time, and status.
- **Expected behavior:** List only pending confirmations Staff is authorized to
  process.
- **Must not:** Reveal bank credentials or unrelated payment data.

### CHAT-STAFF-004: Active Maintenance Work

- **Canonical question:** Which maintenance requests do I need to process?
- **Required answer data:** Request ID, building code, room code, title, status,
  and assignment information.
- **Expected behavior:** List only requests assigned to the authenticated Staff
  member and distinguish assigned from in-progress work.
- **Must not:** Reveal requests assigned to another Staff member unless existing
  Staff permissions explicitly allow it.

## Head Resident Question Checklist

### CHAT-RESIDENT-001: Current Room

- **Canonical question:** What is my current room information?
- **Required answer data:** Building code, building name, room code, room name,
  room status, and active occupancy summary.
- **Expected behavior:** Answer only from the authenticated Head Resident's
  active room assignment.
- **Must not:** Reveal another room's information.

### CHAT-RESIDENT-002: Active Members And Vehicles

- **Canonical question:** Which room members and vehicles are currently active in my room?
- **Required answer data:** Approved active member names and active vehicle
  summaries belonging to the current room.
- **Expected behavior:** Distinguish the Head Resident from approved room members
  and list only active vehicles.
- **Must not:** Include pending or left members, inactive vehicles, or another
  room's data.

### CHAT-RESIDENT-003: Current Contract

- **Canonical question:** What is the status of my current rental contract?
- **Required answer data:** Contract status, rental status, start date, end date,
  and remaining days when applicable.
- **Expected behavior:** Return only the current active rental contract.
- **Must not:** Present an ended contract as the current contract.

### CHAT-RESIDENT-004: Latest Invoice And Payment Status

- **Canonical question:** What is my latest invoice and payment status?
- **Required answer data:** Invoice month, utility-reading month, issue date, due
  date, total amount, invoice status, and payment status.
- **Expected behavior:** Explain the current payment state and due date clearly.
- **Must not:** Reveal another room's invoice or payment.

### CHAT-RESIDENT-005: Related Maintenance And Notifications

- **Canonical question:** What recent maintenance requests and notifications relate to my room?
- **Required answer data:** Recent room maintenance requests and authorized
  notifications relevant to the authenticated Head Resident.
- **Expected behavior:** Summarize unresolved maintenance first and distinguish
  unread notifications.
- **Must not:** Reveal unrelated room notifications or requests.

## Permission And Failure Checklist

### CHAT-PERM-001: Resident Without Active Room

- **Scenario:** A Head Resident without an active room assignment sends a chat
  request.
- **Expected result:** Access is denied with a clear message. No residential
  context is generated or sent to Gemini.

### CHAT-PERM-002: Cross-Room Resident Question

- **Scenario:** A Head Resident asks for another room's invoice, contract,
  members, vehicles, maintenance, or notifications.
- **Expected result:** The chatbot refuses because the requested data is outside
  the authorized context.

### CHAT-PERM-003: Cross-Staff Assignment Question

- **Scenario:** A Staff member asks for another Staff member's restricted tasks
  or maintenance assignments.
- **Expected result:** The chatbot only answers with data permitted by existing
  Staff permissions.

### CHAT-PERM-004: Sensitive Data Question

- **Scenario:** Any user asks for passwords, temporary passwords, tokens,
  secrets, encrypted values, or bank credentials.
- **Expected result:** The chatbot refuses and no sensitive value is included in
  the generated context.

### CHAT-FAIL-001: Missing Context Data

- **Scenario:** The user asks an in-scope question, but the required value is not
  present in the generated context.
- **Expected result:** The chatbot states that the current context is
  insufficient and does not invent an answer.

### CHAT-FAIL-002: Out-Of-Scope Question

- **Scenario:** The user asks a question unrelated to Tropilot or rental
  property operations.
- **Expected result:** The chatbot states that it can only assist with Tropilot
  and its supported operational domains.

## Completion Criteria

Phase 1 is complete when:

- Every supported role has an explicit question checklist.
- Every question defines the required context data and expected answer behavior.
- Permission and failure scenarios are documented.
- Future context builders and chatbot tests reference the stable checklist IDs
  in this document.
