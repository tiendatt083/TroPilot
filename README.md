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
```

## Environment

Backend configuration supports environment variable overrides for database, mail, CORS, and upload settings. The default database URL points to a local MySQL database named `tropilot`.
