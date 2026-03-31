# Rental Hub Authentication System

This project is a full-stack rental management system initialized with an authentication flow (Role Selection, Register, and Login) as the foundation. No other features (room management, booking) are implemented at this stage.

## Technologies Used

- **Frontend:** ReactJS (Vite), React Router DOM, Axios, standard CSS
- **Backend:** Spring Boot (Java 17, Maven), Spring Web, Spring Data JPA, Spring Security Crypto (BCrypt)
- **Database:** MySQL

## Project Structure

```
.
├── backend/                  # Java Spring Boot backend
│   ├── pom.xml               # Maven configuration
│   └── src/                  # Application source code
├── frontend/                 # ReactJS frontend
│   ├── package.json          # NPM configuration
│   └── src/                  # Application source code
└── README.md                 # Project documentation
```

## Prerequisites

- Java 17
- Node.js (v18 or newer recommended)
- MySQL Server (running on localhost:3306)
- Maven

## Setup Instructions

### 1. MySQL Setup

1. Open your MySQL client.
2. The Spring Boot application is configured to automatically create the database schema using the `schema.sql` file provided in `backend/src/main/resources/schema.sql`.
3. If you want to create it manually before running the backend, you can execute the contents of that file:
```sql
CREATE DATABASE IF NOT EXISTS rentalhub;
USE rentalhub;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email_or_phone VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
);
```
4. Verify your MySQL credentials in `backend/src/main/resources/application.properties` (default is `root`/`root`).

### 2. Backend Setup

1. Open a terminal and navigate to the `backend` directory.
   ```bash
   cd backend
   ```
2. Build the project using Maven (this will download all dependencies).
   ```bash
   mvn clean install -DskipTests
   ```
3. Run the Spring Boot application.
   ```bash
   mvn spring-boot:run
   ```
   The backend will start running on `http://localhost:8080`.

### 3. Frontend Setup

1. Open an additional terminal and navigate to the `frontend` directory.
   ```bash
   cd frontend
   ```
2. Install the necessary NPM dependencies.
   ```bash
   npm install
   ```
3. Start the Vite development server.
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`.

## Test Flow for Register / Login

1. Open your browser and navigate to `http://localhost:5173`.
2. **Role Selection:** You will see the Role Selection Page. Click on "For Landlord" or "For Tenant". This selected role is saved securely.
3. **Login Page:** You will be redirected to the Login Page, displaying your chosen role. Since you don't have an account yet, click the "Register here" link.
4. **Registration:** You will be taken to the Registration Page for your specific role.
   - Fill in your completely fake credentials.
   - The password MUST be at least 6 characters long and match the confirm password field.
   - Click "Register".
5. **Success:** A success message will let you know your account has been created and you will be pushed back to the Login Page.
6. **Login:** Use the email/phone and password you just registered with to sign in.
7. **Home:** You will be successfully authenticated and navigated to the Home Page, displaying your name and selected role!

Enjoy using Rental Hub!
