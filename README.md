# Tropilot

Tropilot is a rental property operation management system for administrators, operations staff, and head residents.

This repository contains the Tropilot full-stack application foundation and authentication module:

- `tropilot-backend`: Spring Boot 3.2.4 backend using Java 17 and Maven.
- `tropilot-frontend`: React 18.2.0 frontend using Vite 5.2.0.

## Backend

### Requirements

- Java 17
- Maven
- MySQL Server
- MySQL Workbench or another MySQL client

### Database Setup

Create the application database in MySQL before starting the backend:

```sql
CREATE DATABASE IF NOT EXISTS tropilot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

The backend uses this local database connection by default:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tropilot
spring.datasource.username=root
spring.datasource.password=root
```

If your MySQL username or password is different, update `tropilot-backend/src/main/resources/application.properties` or set these environment variables:

```bash
SPRING_DATASOURCE_USERNAME=your_mysql_username
SPRING_DATASOURCE_PASSWORD=your_mysql_password
```

### Run Backend

```bash
cd tropilot-backend
mvn clean package
mvn spring-boot:run
```

The backend runs on `http://localhost:8080` by default.

When the backend starts and connects to MySQL successfully, the console prints a status block similar to this:

```text
------------------------------------------------------------
Tropilot backend is running
Backend URL: http://localhost:8080
Database connection: successful
Database name: tropilot
Database version: 8.0.x
------------------------------------------------------------
```

If the database credentials are invalid, the backend prints a database connection failure message. A running web server with `Database connection: failed` is not a complete setup. Check that MySQL Server is running and that `spring.datasource.username` and `spring.datasource.password` match the MySQL user credentials.

If port `8080` is already in use, stop the process using that port or run the backend on another port:

```bash
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

## Frontend

### Requirements

- Node.js
- npm

### Run Frontend

```bash
cd tropilot-frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

Open the application in the browser:

```text
http://localhost:5173
```

## Authentication

The backend creates the default administrator account only when no `ADMIN` account exists:

```text
Email: admin@tropilot.com
Password: Admin@123
Role: ADMIN
```

Login flow:

- The login page is available at `http://localhost:5173/login`.
- Users sign in with email and password.
- JWT is stored in browser local storage after successful login.
- Axios attaches `Authorization: Bearer <token>` for protected API calls.
- Users with `mustChangePassword=true` are redirected to `/change-password`.
- Admin users are redirected to `/admin/dashboard`.
- Staff users are redirected to `/staff/dashboard`.
- Head residents are redirected to `/resident/dashboard`.

Admin user management:

- Admin users can open `/admin/users`.
- Admin users can create `STAFF` and `RESIDENT_HEAD` accounts.
- The backend automatically generates a temporary password when an admin creates a user.
- Admin users can see the generated temporary password in the user list while `mustChangePassword=true`.
- Admin users cannot see the real password after the user changes the temporary password.
- The encrypted temporary-password display value is cleared after the user changes password successfully.
- Admin users can lock, unlock, and reset passwords for non-admin accounts.

Building management:

- Admin users can open `/admin/buildings`.
- Admin users can create, view, edit, search, and delete buildings.
- Staff users can open `/staff/buildings` with read-only access.
- Head residents cannot access building management pages.
- A building cannot be deleted when related rooms exist.

Room management:

- Admin users can open `/admin/rooms`.
- Admin users can create, view, edit, filter, search, and delete rooms.
- Staff users can open `/staff/rooms` with read-only access.
- Rooms are connected to buildings.
- Head residents cannot access the all-room list in this phase.
- A room cannot be deleted when related head resident, contract, invoice, utility reading, vehicle, or maintenance data exists.

Head Resident assignment:

- Admin users can assign one active Head Resident account to one room from the room detail page.
- Assigning a Head Resident creates a room assignment and an initial rental contract in one transaction.
- Assigned rooms are moved to `OCCUPIED` status.
- Rooms in `MAINTENANCE` status cannot receive a Head Resident.
- A room can have only one active Head Resident.
- A Head Resident can represent only one active room.
- Head resident users can view their assigned room on the resident dashboard.

Room member management:

- Head resident users can open `/resident/members`.
- Head resident users can add, view, edit, and mark members as left for their own active room.
- Room members do not have login accounts.
- New room members start with `PENDING` status.
- Admin users can open `/admin/members/pending` to approve or reject pending room members.
- Admin users can open `/admin/rooms/{roomId}/members` to view all members in a room.
- Only `APPROVED` members count as active occupants.
- Active occupants are calculated as one active Head Resident plus approved room members.
- Pending, rejected, and left members do not count as active occupants.
- Approval is blocked when the room maximum occupants would be exceeded.

Rental contract upload and confirmation:

- Admin users can open `/admin/contracts`.
- Admin users can view rental contracts and upload signed contract files.
- Contract files are stored in `uploads/contracts`.
- Uploaded contract files are served through `/uploads/contracts/{fileName}`.
- Allowed contract file types are jpg, jpeg, png, and pdf.
- Uploading a new contract file sets contract status to `UPLOADED`.
- Admin users can mark a contract as `NEED_UPDATE`.
- Head resident users can open `/resident/contract`.
- Head resident users can view their current contract, confirm it, or report an issue.
- Confirming requires an uploaded contract file and sets status to `CONFIRMED`.
- Reporting an issue sets status to `NEED_UPDATE`.

Vehicle management:

- Head resident users can open `/resident/vehicles`.
- Head resident users can request vehicle registration for their own active room.
- Vehicles can belong to the Head Resident or an approved room member.
- Room member vehicle owners must match an approved member in the same room.
- New vehicle requests start with `PENDING` status.
- Admin users can open `/admin/vehicles` to review all vehicles.
- Admin users can open `/admin/vehicles/pending` to approve or reject pending vehicles.
- Staff users can open `/staff/vehicles` with read-only access.
- Only `ACTIVE` vehicles are marked as billable for future parking fee calculations.
- `PENDING`, `INACTIVE`, and `REJECTED` vehicles are not billable.
- License plates must be unique among active vehicles.

Service fee management:

- Admin users can open `/admin/service-fees`.
- Admin users can create, edit, activate, deactivate, and delete service fees.
- Staff users can open `/staff/service-fees` with read-only access.
- Head residents cannot access service fee management pages or APIs.
- Service fee codes are unique.
- Unit price must be greater than or equal to zero.
- Parking fees calculated by quantity require a vehicle type.
- Inactive service fees must not be used in future invoice generation.
- Deleting a service fee that is already used by invoice items deactivates it instead of hard deleting it.

Utility reading management:

- Staff users can open `/staff/utility-readings`.
- Staff users can record monthly utility readings at `/staff/utility-readings/create`.
- Admin users can open `/admin/utility-readings` to view, record, and edit readings.
- Head resident users can open `/resident/utility-readings` to view readings for their own active room only.
- Each room can have only one utility reading per month.
- New electricity reading must be greater than or equal to old electricity reading.
- New water reading must be greater than or equal to old water reading.
- All utility reading values must be greater than or equal to zero.
- Electricity and water evidence images are stored in `uploads/utility-readings`.
- Uploaded utility reading images are served through `/uploads/utility-readings/{fileName}`.
- Allowed utility reading image types are jpg, jpeg, and png.
- Admin edits require an edit reason.

Invoice generation:

- Staff users can open `/staff/invoices`.
- Staff users can generate invoices at `/staff/invoices/generate`.
- Admin users can open `/admin/invoices` to view and generate invoices.
- Head resident users can open `/resident/invoices` and `/resident/invoices/{id}`.
- Invoices are generated for one room and one month.
- A room must have an active Head Resident before an invoice can be generated.
- Duplicate invoices for the same room and month are blocked.
- Invoice generation requires a utility reading for the same room and month.
- Electricity and water invoice items use active BY_USAGE service fees.
- Fixed service fees, BY_PERSON fees, and active vehicle parking fees are included.
- BY_PERSON fees count one active Head Resident plus approved room members.
- Parking fees count ACTIVE vehicles only.
- Invoice total amount is the sum of invoice items.
- Head residents can view invoices for their own active room only.

Payment confirmation and receipts:

- Head residents can upload payment proof from their invoice detail page.
- Payment proof files are stored in `uploads/payments`.
- Uploaded payment proof files are served through `/uploads/payments/{fileName}`.
- Allowed payment proof image types are jpg, jpeg, and png.
- Uploading payment proof changes the invoice status to `PENDING_CONFIRMATION`.
- Staff and Admin users can review pending payments at `/staff/payments/pending`.
- Approving payment changes the invoice status to `PAID`.
- Approving payment creates a valid receipt automatically.
- Rejecting payment changes the invoice status to `REJECTED`.
- Admin users can view receipts at `/admin/receipts`.
- One invoice can have only one valid receipt.

Expenses and cash flow:

- Staff users can create expenses at `/staff/expenses/create`.
- Staff users can view expenses and basic cash flow at `/staff/expenses`.
- Admin users can view expenses at `/admin/expenses`.
- Admin users can view full cash flow at `/admin/cashflow`.
- Expense proof images are stored in `uploads/expenses`.
- Uploaded expense proof images are served through `/uploads/expenses/{fileName}`.
- Expense proof image upload is optional.
- Allowed expense proof image types are jpg, jpeg, and png.
- Cancelled expenses do not count toward total expense.
- Cancelled receipts do not count toward total income.
- Remaining cash equals total income minus total expense.
- Unpaid amount is calculated from unpaid invoices for the selected month.

Protected backend APIs:

```text
POST /api/auth/login
GET /api/auth/me
POST /api/auth/change-password-first-time
POST /api/admin/users
GET /api/admin/users
GET /api/admin/users/{id}
PUT /api/admin/users/{id}
PUT /api/admin/users/{id}/lock
PUT /api/admin/users/{id}/unlock
PUT /api/admin/users/{id}/reset-password
POST /api/admin/buildings
GET /api/admin/buildings
GET /api/admin/buildings/{id}
PUT /api/admin/buildings/{id}
DELETE /api/admin/buildings/{id}
GET /api/staff/buildings
GET /api/staff/buildings/{id}
POST /api/admin/rooms
GET /api/admin/rooms
GET /api/admin/rooms/{id}
PUT /api/admin/rooms/{id}
DELETE /api/admin/rooms/{id}
GET /api/staff/rooms
GET /api/staff/rooms/{id}
POST /api/admin/rooms/{roomId}/assign-head
GET /api/admin/rooms/{roomId}/head
PUT /api/admin/rooms/{roomId}/remove-head
GET /api/resident/room
POST /api/resident/members
GET /api/resident/members
PUT /api/resident/members/{id}
PUT /api/resident/members/{id}/leave
GET /api/admin/members/pending
GET /api/admin/rooms/{roomId}/members
PUT /api/admin/members/{id}/approve
PUT /api/admin/members/{id}/reject
GET /api/admin/contracts
GET /api/admin/contracts/{id}
POST /api/admin/contracts/{id}/upload
PUT /api/admin/contracts/{id}/mark-need-update
GET /api/resident/contracts/current
PUT /api/resident/contracts/{id}/confirm
POST /api/resident/contracts/{id}/report-error
POST /api/resident/vehicles/request
GET /api/resident/vehicles
PUT /api/resident/vehicles/{id}/request-cancel
GET /api/admin/vehicles
GET /api/admin/vehicles/pending
PUT /api/admin/vehicles/{id}/approve
PUT /api/admin/vehicles/{id}/reject
PUT /api/admin/vehicles/{id}/deactivate
GET /api/staff/vehicles
POST /api/admin/service-fees
GET /api/admin/service-fees
GET /api/admin/service-fees/{id}
PUT /api/admin/service-fees/{id}
DELETE /api/admin/service-fees/{id}
PUT /api/admin/service-fees/{id}/toggle
GET /api/staff/service-fees
POST /api/staff/utility-readings
GET /api/staff/utility-readings
GET /api/staff/utility-readings/{id}
GET /api/admin/utility-readings
PUT /api/admin/utility-readings/{id}
GET /api/resident/utility-readings/current-room
POST /api/staff/invoices/generate
GET /api/staff/invoices
GET /api/staff/invoices/{id}
GET /api/admin/invoices
GET /api/admin/invoices/{id}
GET /api/resident/invoices
GET /api/resident/invoices/{id}
POST /api/resident/payments/upload
GET /api/resident/payments
GET /api/staff/payments/pending
PUT /api/staff/payments/{id}/approve
PUT /api/staff/payments/{id}/reject
GET /api/admin/receipts
GET /api/admin/receipts/{id}
POST /api/staff/expenses
GET /api/staff/expenses
GET /api/staff/cashflow
GET /api/admin/expenses
GET /api/admin/cashflow
PUT /api/admin/expenses/{id}/cancel
```

## Environment

Backend configuration supports environment variable overrides for database, mail, CORS, and upload settings. The default database URL points to a local MySQL database named `tropilot`.
