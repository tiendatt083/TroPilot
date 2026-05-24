# Tropilot - Modern Rental Property Operation Management System

Tropilot is a full-stack rental property operation management system for property administrators, operations staff, and Head Residents. It centralizes daily rental operations including buildings, rooms, resident accounts, room members, contracts, utility readings, invoices, payments, vehicles, maintenance requests, staff tasks, receipts, expenses, cash flow, notifications, feedback, dashboards, and activity logs.

The system is designed for an academic demonstration while still following production-oriented practices such as JWT authentication, role-based authorization, DTO-based API responses, password hashing, file upload validation, and clear service-layer business logic.

## Technology Stack

### Frontend

- ReactJS 18.2.0 
edddd
- Vite 5.2.0
- JavaScript
- React Router DOM
- Axios
- CSS

### Backend

- Java 17
- Spring Boot 3.2.4
- Spring Web
- Spring Data JPA
- Spring Security
- Spring Boot Mail
- Maven
- Lombok

### Database

- MySQL

## User Roles

- `ADMIN`: Property Administrator with full system control.
- `STAFF`: Operations or technical staff with operational permissions.
- `RESIDENT_HEAD`: Head Resident who represents one active room.

## Main Features

- User management
- Building management
- Room management
- Head Resident assignment
- Room member management
- Rental contract management
- Vehicle management
- Service fee management
- Utility reading with evidence images
- Invoice generation
- Payment confirmation
- Receipt management
- Expense management
- Cash flow management
- Staff task assignment
- Maintenance request management
- Notification management
- Feedback management
- Role-based dashboards
- Activity logs

## Project Structure

```text
tropilot-backend/
  src/main/java/com/tropilot/
    config/
    controller/
    dto/
    entity/
    enums/
    exception/
    repository/
    security/
    service/
    util/

tropilot-frontend/
  src/
    api/
    assets/
    components/
    contexts/
    layouts/
    pages/
    routes/
    styles/
    utils/
```

## Backend Setup

### Requirements

- Java 17
- Maven
- MySQL Server
- MySQL Workbench or another MySQL client

### MySQL Setup

Create the Tropilot database before starting the backend:

```sql
CREATE DATABASE IF NOT EXISTS tropilot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### Backend Configuration

The backend configuration is stored in:

```text
tropilot-backend/src/main/resources/application.properties
```

For a local demo, configure the database connection using environment variables or your local `application.properties` values:

```bash
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/tropilot?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=your_mysql_username
SPRING_DATASOURCE_PASSWORD=your_mysql_password
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
APP_UPLOAD_BASE_PATH=uploads
APP_JWT_SECRET=change_this_demo_secret
APP_TEMPORARY_PASSWORD_ENCRYPTION_SECRET=change_this_demo_encryption_secret
```

Do not commit real production credentials or private secrets.

### Build Backend

```bash
cd tropilot-backend
mvn clean package
```

### Run Backend

```bash
cd tropilot-backend
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

When the backend starts successfully and connects to MySQL, the console prints a status block similar to:

```text
------------------------------------------------------------
Tropilot backend is running
Backend URL: http://localhost:8080
Database connection: successful
Database name: tropilot
Database version: 8.0.x
------------------------------------------------------------
```

If port `8080` is already in use, stop the process using that port or run the backend on another port:

```bash
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

## Frontend Setup

### Requirements

- Node.js
- npm

### Install Dependencies

```bash
cd tropilot-frontend
npm install
```

### Run Frontend

```bash
cd tropilot-frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

### Build Frontend

```bash
cd tropilot-frontend
npm run build
```

## Default Admin Account

The backend creates this account only if no `ADMIN` account exists:

```text
Email: admin@tropilot.com
Password: Admin@123
Role: ADMIN
Status: ACTIVE
Must change password: false
```

Use this account for the first demo login.

## Authentication and Routing

- Login page: `http://localhost:5173/login`
- Admin dashboard: `/admin/dashboard`
- Staff dashboard: `/staff/dashboard`
- Head Resident dashboard: `/resident/dashboard`
- First-time password change page: `/change-password`

After successful login, the frontend stores the JWT in browser local storage and Axios attaches:

```text
Authorization: Bearer <token>
```

Protected frontend routes and backend role permissions are both enforced.

## Demo Flow

Use clean demo data only. Do not use real personal information in names, phone numbers, identity numbers, contract files, proof images, or notes.

1. Log in as Admin using the default Admin account.
2. Create a Staff account.
3. Create a Head Resident account.
4. Log in with each temporary account and complete the first-login password change.
5. Create a building.
6. Create a room under that building.
7. Assign the Head Resident to the room.
8. Add room members from the Head Resident account.
9. Approve room members from the Admin account.
10. Upload the signed rental contract from the Admin account.
11. Confirm or report the contract from the Head Resident account.
12. Request a vehicle registration from the Head Resident account.
13. Approve the vehicle from the Admin account.
14. Configure service fees for electricity, water, cleaning, parking, and other charges.
15. Record monthly utility readings with evidence images from the Staff or Admin account.
16. Generate an invoice for the room and month.
17. View the invoice from the Head Resident account.
18. Upload payment proof from the Head Resident account.
19. Confirm the payment from the Staff or Admin account.
20. Verify that a receipt is generated automatically.
21. Create a maintenance request from the Head Resident account.
22. Assign the maintenance request to Staff from the Admin account.
23. Start and complete the maintenance request from the Staff account.
24. Create an expense, optionally linked to the maintenance request.
25. View cash flow from the Admin account.
26. View role-based dashboards for Admin, Staff, and Head Resident.
27. Review activity logs from the Admin account.

## Security Notes

- Public registration is not allowed.
- Only Admin can create Staff and Head Resident accounts.
- Admin-created accounts receive temporary passwords.
- Users must change temporary passwords on first login.
- Passwords are hashed with BCrypt.
- JWT authentication protects backend APIs.
- Backend role-based access control is enforced with Spring Security.
- Frontend routes are protected by authentication and role checks.
- JPA entities are not exposed directly to the frontend.
- API responses use the standard `ApiResponse<T>` format.
- Sensitive data such as passwords and raw JWT tokens must not be logged.
- Demo secrets must be replaced before any real deployment.

## File Uploads

Uploaded files are stored under the configured upload base path and served by the backend.

Default upload folders:

```text
uploads/contracts
uploads/utility-readings
uploads/payments
uploads/maintenance
uploads/expenses
uploads/tasks
```

Supported upload examples:

- Rental contract files: jpg, jpeg, png, pdf
- Utility evidence images: jpg, jpeg, png
- Payment proof images: jpg, jpeg, png
- Maintenance images: jpg, jpeg, png
- Expense proof images: jpg, jpeg, png
- Task result images: jpg, jpeg, png

## Standard API Response Format

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Clear English error message",
  "errors": []
}
```

## Final Build Check

Run these commands before demonstration:

```bash
cd tropilot-backend
mvn clean package
```

```bash
cd tropilot-frontend
npm run build
```

Both commands must finish successfully before the final demo.

## Demo Preparation Checklist

- MySQL Server is running.
- The `tropilot` database exists.
- Backend configuration uses the correct local MySQL username and password.
- Backend starts on `http://localhost:8080`.
- Frontend starts on `http://localhost:5173`.
- Default Admin login works.
- Demo Staff and Head Resident accounts are created through Admin.
- Temporary passwords are changed on first login.
- Upload folders exist or can be created by the backend.
- Demo files contain no private or real personal information.
- Browser local storage is cleared if switching between demo users on the same browser.
- Backend and frontend builds pass.

## Notes for Academic Demonstration

Tropilot is prepared as an academic full-stack project. The default Admin seed account exists for demonstration startup only. Before any production use, replace all demo secrets, configure production-grade database credentials, review mail settings, harden deployment configuration, and use secure infrastructure for file storage and backups.
