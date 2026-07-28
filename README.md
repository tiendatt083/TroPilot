# Tropilot

Hệ thống quản lý vận hành nhà/phòng cho thuê, gồm frontend React/Vite và backend Spring Boot/MySQL.

## Yêu cầu

- Java 17, Maven 3.9+
- Node.js 24+ và npm
- MySQL Server 8.4+ đang chạy trên cổng `3306`
- MySQL Workbench (khuyến nghị)

## Cấu hình lần đầu

1. Tạo database trong MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS tropilot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

2. Tạo `tropilot-backend/.env` từ `.env.example`, sau đó điền thông tin MySQL:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/tropilot?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=YOUR_MYSQL_PASSWORD
```

Không commit file `.env`.

## Chạy local để phát triển

Mở hai terminal:

```powershell
cd tropilot-backend
.\run-local.ps1
```

##developppp
```powershell
cd tropilot-frontend
npm ci
npm run dev
```

##share to domain
```powershell
cd tropilot-frontend
npm run build
npm run preview
```

Mở `http://localhost:5173` và đăng nhập bằng tài khoản admin đã cấu hình trong database local.

## Chạy public qua `tropilot.io.vn`

Chỉ dùng khi MySQL84 đang chạy. Mở ba terminal:

```powershell
cd tropilot-backend
.\run-local.ps1
```


```powershell
& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel run tropilot-local
```

Mở `https://tropilot.io.vn`. Sau mỗi thay đổi frontend, chạy lại `npm run build` rồi khởi động lại preview.

## Kiểm tra nhanh

```powershell
cd tropilot-backend
mvn clean package
```

```powershell
cd tropilot-frontend
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright dùng mock API nên không cần MySQL/backend đang chạy.

## Ghi chú

- Flyway tự tạo/cập nhật schema MySQL khi backend khởi động.
- Email, Gemini và SePay là tích hợp tùy chọn; cần cấu hình giá trị thật trong `tropilot-backend/.env` trước khi sử dụng.
- Public domain hoạt động khi laptop, MySQL, backend, frontend preview và Cloudflare Tunnel đều đang chạy.
