# DETAILED PROJECT INFORMATION DOSSIER FOR TROPILOT PROPOSAL REPORT

Tài liệu này là hồ sơ thông tin dự án dùng làm đầu vào cho Proposal Report. Đây không phải Proposal Report cuối cùng. Mọi nhận định quan trọng được gắn nhãn:

- [VERIFIED]: Có bằng chứng trực tiếp từ mã nguồn, migration, cấu hình, tài liệu hoặc kết quả chạy lệnh.
- [INFERRED]: Suy luận hợp lý từ dữ liệu hiện có nhưng chưa được xác nhận bằng tài liệu chính thức.
- [MISSING]: Chưa tìm thấy thông tin trong dữ liệu được cung cấp.

Ngày rà soát: 16/07/2026.

## 1. Executive Summary

[VERIFIED] Tên dự án hiện tại là **Tropilot - Modern Rental Property Operation Management System**. Evidence: `README.md`.

[INFERRED] Tên tiếng Việt phù hợp: **TROPILOT - Hệ thống quản lý vận hành bất động sản cho thuê**. Evidence: yêu cầu của sinh viên và chức năng thực tế trong `README.md`, backend controller/service/entity.

[VERIFIED] Loại sản phẩm là web application full-stack gồm frontend React/Vite và backend Spring Boot REST API. Evidence: `tropilot-frontend/package.json`, `tropilot-backend/pom.xml`, `README.md`.

[VERIFIED] Lĩnh vực ứng dụng là quản lý vận hành nhà/phòng/căn hộ cho thuê: tòa nhà, phòng, cư dân, hợp đồng, điện nước, hóa đơn, thanh toán, bảo trì, thiết bị, nhiệm vụ, thông báo, feedback, cash flow. Evidence: `README.md`, các controller như `AdminBuildingController`, `AdminRoomController`, `AdminBuildingInvoiceController`, `ResidentMaintenanceRequestController`, entity package.

[VERIFIED] Nhóm người dùng đăng nhập gồm `ADMIN`, `STAFF`, `RESIDENT_HEAD`. Evidence: `UserRole.java`, `SecurityConfig.java`, `README.md`.

[VERIFIED] Điểm nổi bật kỹ thuật gồm JWT authentication, BCrypt password hashing, method/route authorization, DTO response, Flyway migration, MySQL, file upload validation, SePay QR/webhook, Gemini chatbot, i18n, Playwright smoke tests. Evidence: `pom.xml`, `SecurityConfig.java`, `application.properties`, storage services, `SepayPaymentServiceImpl.java`, `ChatServiceImpl.java`, `i18n.js`, `playwright.config.js`.

[VERIFIED] Trạng thái build/test hiện tại:

| Check | Result | Evidence |
| --- | --- | --- |
| Backend unit/service tests | PASS, 70 tests, 0 failures | Lệnh `mvn test`, 16/07/2026 |
| Frontend production build | PASS, có cảnh báo bundle lớn hơn 500 kB | Lệnh `npm run build`, 16/07/2026 |
| Frontend E2E smoke | FAIL một phần: 8/11 pass, 3 fail | Lệnh `npm run test:e2e`, 16/07/2026 |

[INFERRED] Mức độ hoàn thiện ước tính: 75-85% cho demo học thuật, chưa đủ kết luận production-ready do E2E fail một phần, deployment thật chưa xác nhận, một số bảo mật/file serving còn giới hạn.

Tên đề tài tiếng Anh đề xuất:

| Option | Proposed English Title | Status |
| --- | --- | --- |
| 1 | Tropilot: A Web-Based Rental Property Operation Management System | [INFERRED] |
| 2 | Design and Implementation of a Rental Property Operations Management System | [INFERRED] |
| 3 | A Full-Stack Web Application for Rental Building, Billing, and Maintenance Management | [INFERRED] |
| 4 | Tropilot: Integrated Management of Rental Rooms, Invoices, Payments, and Maintenance | [INFERRED] |
| 5 | Development of a Role-Based Rental Property Management Platform with Payment and AI Assistance | [INFERRED] |

Information Required from the Student:

| Question | Priority |
| --- | --- |
| Xác nhận tên đề tài tiếng Anh cuối cùng. | High |
| Xác nhận phạm vi demo cuối cùng có bao gồm SePay thật và Gemini thật hay chỉ local/mock. | High |

## 2. Administrative Information

| Field | Value | Status |
| --- | --- | --- |
| Student name | [MISSING] | [MISSING] |
| Student ID | [MISSING] | [MISSING] |
| Class | [MISSING] | [MISSING] |
| Major | Công nghệ thông tin | [INFERRED] từ yêu cầu |
| Course/module code | [MISSING] | [MISSING] |
| University | [MISSING] | [MISSING] |
| Instructor | [MISSING] | [MISSING] |
| Project start date | [MISSING] | [MISSING] |
| Proposal submission date | [MISSING] | [MISSING] |
| Final Report submission date | [MISSING] | [MISSING] |
| Defense date | [MISSING] | [MISSING] |
| Individual or group project | [MISSING] | [MISSING] |
| GitHub URL | [MISSING] | [MISSING] |
| Deployment URL | [MISSING] | [MISSING] |

Information Required from the Student: cung cấp đầy đủ thông tin hành chính, link GitHub và link deploy nếu có.

## 3. Project Background

[INFERRED] Đối tượng vận hành nhà/phòng/căn hộ cho thuê thường phải quản lý thông tin tòa nhà, phòng, cư dân, hợp đồng, điện nước, hóa đơn, thanh toán, bảo trì và thiết bị. Tropilot đặt mình vào bối cảnh này bằng các module đã triển khai tương ứng. Evidence: `README.md`, entity/controller/service names.

[INFERRED] Các phương pháp truyền thống có thể gồm Excel/Google Sheets, sổ sách, Zalo, email và chuyển khoản thủ công. Chưa có nguồn thị trường hoặc khảo sát người dùng cụ thể trong repo, vì vậy không được đưa số liệu thị trường vào Proposal nếu chưa nghiên cứu thêm.

[VERIFIED] Tropilot số hóa quy trình bằng workspace theo vai trò, workspace theo tòa nhà, tự động tính hóa đơn, quản lý ảnh minh chứng, xác nhận thanh toán thủ công hoặc SePay, và lưu lịch sử hoạt động. Evidence: `README.md`, `docs/demo-flow.md`, `ActivityLog` entity, invoice/payment/storage services.

Information Required from the Student: nguồn nghiên cứu thị trường Việt Nam, phỏng vấn stakeholder, hoặc khảo sát nghiệp vụ thực tế.

## 4. Problem Statement

| Problem ID | Problem name | Affected stakeholder | Current situation | Root cause | Consequences | Tropilot solution | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PS-01 | Dữ liệu phòng và cư dân phân tán | Admin, Building manager | Thông tin phòng/cư dân dễ nằm ở nhiều file/kênh | Quản lý thủ công, thiếu dữ liệu tập trung | Khó tra cứu, dễ sai trạng thái phòng | Building, Room, RoomAssignment, RoomMember | `Building`, `Room`, `RoomAssignment`, `RoomMember` entities | [VERIFIED]/[INFERRED] |
| PS-02 | Quản lý hợp đồng | Admin, Resident Head | Cần quản lý hợp đồng hiện tại và file hợp đồng | Hợp đồng gắn phòng/cư dân và có vòng đời | Nhầm hợp đồng active/ended | RentalContract, contract file history, resident confirm/report | `RentalContract`, `RentalContractFileHistory`, `RentalContractServiceImpl` | [VERIFIED] |
| PS-03 | Ghi chỉ số điện nước | Admin, Staff | Cần ghi điện/nước theo kỳ và minh chứng | Dữ liệu chỉ số thay đổi hàng tháng | Sai hóa đơn nếu chỉ số sai/trùng | UtilityReading, ảnh minh chứng, ràng buộc room-month | `UtilityReadingServiceImpl`, `V3__add_critical_business_constraints.sql` | [VERIFIED] |
| PS-04 | Tính hóa đơn | Admin, Staff, Resident | Cần tính tiền phòng, cọc, phí, điện nước | Nhiều loại phí và điều kiện kỳ đầu | Sai tổng tiền, trùng hóa đơn | Invoice, InvoiceItem, preview/generate/bulk-generate | `InvoiceServiceImpl`, `AdminBuildingInvoiceController` | [VERIFIED] |
| PS-05 | Đối soát thanh toán | Admin, Staff, Resident, SePay | Có thanh toán thủ công và QR/webhook | Chuyển khoản cần đối chiếu mã/số tiền | Trễ xác nhận hoặc tạo biên lai trùng | Payment proof, staff approval, SePay webhook, receipt | `PaymentServiceImpl`, `SepayPaymentServiceImpl`, `ReceiptCreationServiceImpl` | [VERIFIED] |
| PS-06 | Bảo trì và sửa chữa | Resident, Staff, Admin | Cần nhận yêu cầu, giao việc, hoàn tất | Thiếu luồng trạng thái rõ | Chậm xử lý, khó truy vết | MaintenanceRequest, assignment, start/complete/reject | `MaintenanceRequestServiceImpl` | [VERIFIED] |
| PS-07 | Quản lý thiết bị | Admin, Staff, Resident | Thiết bị có scope tòa nhà/phòng, tình trạng, lịch sử bảo trì | Thiết bị gắn phòng/tòa nhà | Khó biết thiết bị hỏng hoặc đang bảo trì | Equipment, EquipmentMaintenanceHistory | `Equipment`, `EquipmentMaintenanceHistory` | [VERIFIED] |
| PS-08 | Quản lý nhiều tòa nhà | Admin, Staff | Nghiệp vụ cần lọc theo building | Nhiều tòa nhà, nhiều phòng | Nhầm dữ liệu giữa tòa nhà | Building workspace, buildingId endpoints | `AdminBuilding...Controller`, `StaffBuilding...Controller` | [VERIFIED] |
| PS-09 | Phân quyền dữ liệu | Admin, Staff, Resident | Mỗi vai trò có phạm vi khác nhau | Dữ liệu tài chính/cư dân nhạy cảm | Rò rỉ dữ liệu phòng khác | Spring Security, @PreAuthorize, resident room interceptor | `SecurityConfig.java`, `ResidentRoomAccessInterceptor.java` | [VERIFIED] |
| PS-10 | Thông báo/giao tiếp | Admin, Staff, Resident | Cần gửi và đọc thông báo | Nhiều đối tượng nhận | Bỏ sót thông tin | Notification target users/buildings/read | notification entities/controllers | [VERIFIED] |
| PS-11 | Theo dõi doanh thu | Admin, Staff | Cần biết thu, còn lại, chưa thanh toán | Hóa đơn/biên lai tách rời | Khó đánh giá dòng tiền | CashFlowService, receipts | `CashFlowServiceImpl` | [VERIFIED] |
| PS-12 | Tra cứu dữ liệu nghiệp vụ | Admin, Staff, Resident | Người dùng cần hỏi nhanh trạng thái | Dữ liệu nằm nhiều module | Mất thời gian tra cứu | AI assistant read-only theo role context | `ChatServiceImpl`, `ChatContextServiceImpl` | [VERIFIED] |

Information Required from the Student: mức độ thường xuyên/nghiêm trọng từng vấn đề từ thực tế hoặc khảo sát.

## 5. Proposed Solution

[VERIFIED] Tropilot là hệ thống web tập trung hóa vận hành bất động sản cho thuê, kết nối các module identity, property, resident, contract, billing, payment, maintenance, equipment, task, notification, feedback, cash flow và AI assistant. Evidence: `README.md`, backend package structure.

[VERIFIED] Điểm khác biệt so với CRUD phòng trọ đơn giản: có quy trình Head Resident assignment tạo room assignment và rental contract; room member/vehicle approval; utility reading theo kỳ; invoice preview/generate/bulk-generate; SePay QR/webhook; receipt generation; maintenance assignment; building workspace; activity log; AI assistant theo role context. Evidence: services/controllers/tests.

[VERIFIED] SePay có cấu hình bật/tắt, QR base URL, bank code/account, webhook secret và service xử lý webhook. Evidence: `application.properties`, `.env.example`, `SepayPaymentServiceImpl.java`.

[VERIFIED] AI assistant dùng Gemini client, context nghiệp vụ giới hạn theo role, read-only theo tài liệu. Evidence: `ChatServiceImpl.java`, `ChatContextServiceImpl.java`, `docs/chatbot-question-scope.md`.

Information Required from the Student: xác nhận SePay/Gemini đã chạy trên môi trường deploy thật hay mới local/test.

## 6. Stakeholder Analysis

| Stakeholder ID | Stakeholder | Role in business | Problems | Needs | Benefits | System access | Data scope | Influence | Interest | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ST-01 | Admin | Quản trị vận hành | Quản lý toàn bộ dữ liệu | Control users/buildings/finance | Tập trung hóa vận hành | Có | Global admin | High | High | [VERIFIED] |
| ST-02 | Staff | Nhân sự vận hành/kỹ thuật | Nhiệm vụ, bảo trì, chỉ số | Xem việc được giao, thao tác vận hành | Giảm thủ công | Có | Staff operational | Medium | High | [VERIFIED] |
| ST-03 | Resident Head | Đại diện phòng | Hợp đồng, hóa đơn, thành viên, xe, bảo trì | Xem dữ liệu phòng mình | Minh bạch giao dịch | Có | Own active room | Medium | High | [VERIFIED] |
| ST-04 | Room Member | Cư dân trong phòng | Cần được ghi nhận là người ở | Đăng ký/duyệt qua Resident Head/Admin | Hợp thức hóa thông tin | Không thấy login account | Room record | Low | Medium | [VERIFIED] |
| ST-05 | Property owner | Chủ tài sản | Cần theo dõi doanh thu | Báo cáo cash flow | Theo dõi tài sản | [MISSING] | [MISSING] | High | Medium | [INFERRED] |
| ST-06 | Building manager | Quản lý tòa nhà | Điều phối tòa nhà | Workspace theo building | Kiểm soát vận hành | Có thể là Admin/Staff | Building-level | Medium | High | [INFERRED] |
| ST-07 | Accountant | Kế toán | Đối soát thu/chi | Báo cáo tài chính | Theo dõi dòng tiền | Không có role riêng | [MISSING] | Medium | Medium | [INFERRED] |
| ST-08 | Maintenance technician | Kỹ thuật bảo trì | Nhận và hoàn tất yêu cầu | Task/maintenance assigned | Truy vết công việc | Staff | Assigned tasks/requests | Medium | High | [VERIFIED] |
| ST-09 | SePay | Dịch vụ thanh toán | Nhận webhook/QR | Secret, mã thanh toán, amount | Tự động hóa đối soát | External service | Payment payload | Medium | Medium | [VERIFIED] |
| ST-10 | Gemini | AI provider | Sinh phản hồi chatbot | Context đã lọc | Hỗ trợ hỏi đáp | External service | Prompt/context | Medium | Medium | [VERIFIED] |
| ST-11 | Email provider | SMTP | Gửi email reset/task/payment | Cấu hình SMTP | Thông báo ngoài hệ thống | External service | Email message | Low | Medium | [VERIFIED] |
| ST-12 | System administrator | Quản trị hạ tầng | Cấu hình DB/env/deploy | Secrets, CORS, backup | Vận hành hệ thống | Server-level | Full infra | High | Medium | [INFERRED] |

Actor là vai trò tương tác trực tiếp với hệ thống (`ADMIN`, `STAFF`, `RESIDENT_HEAD`). Stakeholder bao gồm cả Actor, bên thứ ba, và người hưởng lợi không nhất thiết có login riêng.

Information Required from the Student: xác nhận có accountant/property owner role trong phạm vi báo cáo hay chỉ là stakeholder ngoài hệ thống.

## 7. User Roles and Permissions

### 7.1 Admin

[VERIFIED] Admin có quyền `/api/admin/**`, quản lý user, building, room, Head Resident assignment, contracts, service fees, invoices, receipts, tasks, notifications, equipment, feedback, activity logs. Evidence: `SecurityConfig.java`, các `Admin...Controller`.

[VERIFIED] Admin có quyền tạo Staff/Resident Head, lock/unlock/reset password, xóa user theo logic service. Evidence: `AdminUserController.java`, `UserServiceImpl.java`.

[VERIFIED] Admin có quyền tài chính rộng hơn Staff: receipt list, cash flow, delete invoices trong điều kiện hợp lệ. Evidence: `AdminReceiptController`, `AdminCashFlowController`, `InvoiceServiceImpl`.

### 7.2 Staff

[VERIFIED] Staff được phép xem building/room/service fee, ghi utility readings, xem/generate invoice trong building workspace, xử lý payment pending, xử lý maintenance/task được giao. Evidence: `Staff...Controller`, `SecurityConfig.java`, `TaskServiceImpl`, `MaintenanceRequestServiceImpl`.

[VERIFIED] Staff không có endpoint `/api/admin/**`; một số endpoint `/api/staff/payments`, `/api/staff/invoices`, `/api/staff/utility-readings` cho phép `STAFF` và `ADMIN`. Evidence: `SecurityConfig.java`.

[MISSING] Chưa thấy cơ chế phân công Staff theo tòa nhà rõ ràng trong entity hoặc service; Staff có thể xem buildings qua `buildingService.getBuildings(null)` trong chat context. Cần xác nhận scope Staff là toàn bộ operational hay theo tòa nhà.

### 7.3 Resident Head

[VERIFIED] Resident Head chỉ được vào `/api/resident/**` khi có role `RESIDENT_HEAD`, và hầu hết resident endpoints yêu cầu active room assignment qua interceptor. Evidence: `SecurityConfig.java`, `WebConfig.java`, `ResidentRoomAccessInterceptor.java`.

[VERIFIED] Resident Head có chức năng xem phòng hiện tại, hợp đồng, hóa đơn, payment upload, room members, vehicles, maintenance, feedback, equipment, notifications, utility readings, AI assistant. Evidence: `Resident...Controller`, `ChatServiceImpl`.

[VERIFIED] Nếu không có active room assignment, resident features bị từ chối ở backend và frontend room-only route redirect. Evidence: `ResidentRoomAccessServiceImpl.java`, `ResidentRoomRoute.jsx`, tests.

Permission Matrix:

| Module | Admin | Staff | Resident Head | Data Scope | Status |
| --- | --- | --- | --- | --- | --- |
| Authentication/profile | Login, profile | Login, profile | Login, profile | Own account | [VERIFIED] |
| User management | CRUD/reset/lock | No | No | Global | [VERIFIED] |
| Building | CRUD | View | View own building identity | Global/operational/own room | [VERIFIED] |
| Room | CRUD | View | View current room | Building/own room | [VERIFIED] |
| Head Resident assignment | Create/remove | No | No | Admin global | [VERIFIED] |
| Room member | Approve/reject/view | No direct admin? | Create/update/leave own | Own room/admin | [VERIFIED] |
| Contract | Upload/mark update/view | [MISSING] | View/confirm/report | Building/own room | [VERIFIED] |
| Utility reading | View/update | Create/update/fetch/view | View own current room | Building/own room | [VERIFIED] |
| Invoice | Preview/generate/delete/view | Preview/generate/view | View/complaint | Building/own room | [VERIFIED] |
| Payment | View/approve/reject via staff endpoints | View/approve/reject | Upload proof | Building/own invoice | [VERIFIED] |
| Receipt | View | [MISSING] | Via invoice/payment? | Building/own room | [VERIFIED]/[MISSING] |
| Maintenance | Assign/view | Start/complete/reject assigned | Create/view own | Building/assigned/own | [VERIFIED] |
| Equipment | CRUD/view | View/request maintenance | View current room/request maintenance | Building/own room | [VERIFIED] |
| Task | CRUD | Start/complete/reject assigned | No | Assigned staff | [VERIFIED] |
| Vehicle | Approve/reject/deactivate | View | Register/cancel own | Building/own room | [VERIFIED] |
| Notification | Create/view sent | View own | View own | Targeted | [VERIFIED] |
| Feedback | View/reply/status | [MISSING] | Create/view | Own room/admin | [VERIFIED] |
| AI assistant | Yes | Yes | Yes with active room | Role-filtered context | [VERIFIED] |

Security layer comparison:

| Layer | Finding | Evidence | Status |
| --- | --- | --- | --- |
| Frontend route protection | `ProtectedRoute`, `RoleBasedRoute`, `ResidentRoomRoute` | frontend route files | [VERIFIED] |
| Backend endpoint authorization | `SecurityConfig` route matchers | `SecurityConfig.java` | [VERIFIED] |
| Method-level authorization | Many controllers use `@PreAuthorize` | controller package | [VERIFIED] |
| Object-level authorization | Resident room checks in services | service `ForbiddenException` checks | [VERIFIED] |
| Building-level data scope | Many services validate selected building | service methods throwing “does not belong” | [VERIFIED] |
| Room-level data scope | ResidentRoomAccessService and per-service room checks | resident services | [VERIFIED] |

Information Required from the Student: xác nhận Staff có bị giới hạn theo danh sách tòa nhà được phân công hay không.

## 8. Project Scope

### 8.1 In-Scope

| Module | Purpose | Actors | Main features | Status | Evidence | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication | Đăng nhập, profile, đổi mật khẩu lần đầu, reset password | All | JWT, BCrypt, reset code email | Implemented | `AuthController`, `AuthServiceImpl` | High |
| User management | Quản lý tài khoản | Admin | create/update/lock/unlock/reset/delete | Implemented | `AdminUserController` | High |
| Building | Quản lý tòa nhà | Admin, Staff | CRUD/view/workspace | Implemented | `Building` | High |
| Room | Quản lý phòng | Admin, Staff, Resident | CRUD/view/status | Implemented | `Room` | High |
| Room assignment | Gán Head Resident | Admin | active assignment/contract creation/removal | Implemented | `HeadResidentAssignmentServiceImpl` | High |
| Room member | Quản lý thành viên phòng | Admin, Resident | pending/approve/reject/leave | Implemented | `RoomMemberServiceImpl` | High |
| Rental contract | Quản lý hợp đồng thuê | Admin, Resident | active contracts, upload, confirm/report | Implemented | contract controllers/services | High |
| Contract file history | Lịch sử file hợp đồng | Admin | upload replacement history | Implemented | `RentalContractFileHistory` | Medium |
| Service fee | Phí dịch vụ | Admin, Staff view | active fee config, electricity/water/other | Implemented | `ServiceFeeServiceImpl` | High |
| Utility reading | Chỉ số điện nước | Admin, Staff, Resident view | create/update/fetch/overview/evidence | Implemented | `UtilityReadingServiceImpl` | High |
| Invoice | Hóa đơn | Admin, Staff, Resident | preview/generate/bulk/delete/complaint | Implemented | `InvoiceServiceImpl` | High |
| Invoice item | Chi tiết hóa đơn | System | rent/deposit/service/utility items | Implemented | `InvoiceItem` | High |
| Payment | Thanh toán thủ công | Resident, Staff/Admin | proof upload, approve/reject | Implemented | `PaymentServiceImpl` | High |
| Receipt | Biên lai | System/Admin | create after valid payment | Implemented | `ReceiptCreationServiceImpl` | High |
| SePay payment | Thanh toán QR/webhook | Resident/System | QR/payment code/webhook/idempotency | Implemented/configurable | `SepayPaymentServiceImpl` | High |
| Maintenance | Bảo trì | Resident/Admin/Staff | request/assign/start/complete/reject | Implemented | `MaintenanceRequestServiceImpl` | High |
| Equipment | Thiết bị | Admin/Staff/Resident | CRUD/view/history/maintenance link | Implemented | `EquipmentServiceImpl` | Medium |
| Task | Nhiệm vụ | Admin/Staff | create/update/start/complete/reject | Implemented | `TaskServiceImpl` | Medium |
| Vehicle | Xe | Resident/Admin/Staff | request/approve/reject/deactivate | Implemented | `VehicleServiceImpl` | Medium |
| Feedback | Phản hồi | Resident/Admin | create/reply/status | Implemented | `FeedbackServiceImpl` | Medium |
| Notification | Thông báo | Admin/System/Users | create/read/target metadata | Implemented | notification entities/services | Medium |
| Contact information | Thông tin liên hệ | Admin/Public | get/update contacts/phones | Implemented | `SystemContact` | Low |
| AI assistant | Hỏi đáp nghiệp vụ | All roles | Gemini read-only context | Implemented/configurable | `ChatServiceImpl` | Medium |
| Internationalization | Đa ngôn ngữ UI | Frontend | vi/en translations | Implemented | `i18n.js`, locale files | Medium |
| Reporting/cash flow | Tổng quan tài chính | Admin/Staff | dashboard/cashflow | Implemented | `CashFlowServiceImpl` | Medium |
| File upload | Minh chứng/file hợp đồng | Several | validation by extension/content type/path | Implemented | storage services | High |
| Excel export | Xuất Excel | Frontend | xlsx utility | Implemented | `excelExport.js`, `xlsx` dependency | Low |

### 8.2 Out-of-Scope

| Function | Reason | Status |
| --- | --- | --- |
| Native mobile application | Không thấy mobile app source | [VERIFIED] |
| IoT electricity/water meters | Chỉ có mock fetch utility readings, không có IoT integration | [VERIFIED] |
| Legally binding digital signatures | Có upload/confirm contract, không thấy e-sign integration | [VERIFIED] |
| Tax accounting/electronic tax invoices | Không thấy tax/e-invoice module | [VERIFIED] |
| Full multi-tenant SaaS isolation | Có building management, chưa thấy tenant isolation model | [INFERRED] |
| International card payment | Chỉ thấy SePay/manual proof | [VERIFIED] |
| Hardware access control | Không thấy module khóa/cửa | [VERIFIED] |
| Advanced predictive analytics | Không thấy analytics/prediction model | [VERIFIED] |
| Automated OCR meter reading | Có ảnh minh chứng/mock fetch, không thấy OCR | [VERIFIED] |

### 8.3 Project Boundaries

[VERIFIED] Hệ thống bắt đầu từ quản lý tài khoản nội bộ do Admin tạo; không có public registration. Evidence: `README.md`, `SecurityConfig.java`.

[VERIFIED] Hệ thống kết thúc trách nhiệm ở việc lưu trạng thái nghiệp vụ, gửi request tới provider, nhận webhook/email; SePay/Gemini/SMTP chịu trách nhiệm dịch vụ bên ngoài. Evidence: `application.properties`, integration/service classes.

[VERIFIED] Một số hoạt động vẫn cần con người xác nhận: manual payment proof approval, room member approval, vehicle approval, maintenance assignment. Evidence: services/controllers.

Information Required from the Student: xác nhận phạm vi “Staff theo tòa nhà”, “receipt resident view”, và yêu cầu deploy cuối cùng.

## 9. Functional Requirements

| Requirement ID | Module | Actor | Requirement | Priority | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| FR-AUTH-01 | Authentication | User | Đăng nhập bằng email/password và nhận JWT | High | Implemented | `AuthController`, `JwtService` |
| FR-AUTH-02 | Authentication | User | Bắt buộc đổi mật khẩu lần đầu nếu `mustChangePassword` | High | Implemented | `ProtectedRoute`, `AuthServiceImpl` |
| FR-AUTH-03 | Authentication | User | Quên/reset mật khẩu bằng code email | Medium | Implemented | `PasswordResetCode`, `AuthServiceImpl` |
| FR-USER-01 | User | Admin | Tạo Staff/Resident Head với temporary password | High | Implemented | `UserServiceImpl` |
| FR-BUILDING-01 | Building | Admin | CRUD building | High | Implemented | `AdminBuildingController` |
| FR-ROOM-01 | Room | Admin | CRUD room theo building | High | Implemented | `AdminRoomController`, `RoomServiceImpl` |
| FR-CONTRACT-01 | Contract | Admin/Resident | Tạo/quản lý hợp đồng active khi gán Head Resident | High | Implemented | `HeadResidentAssignmentServiceImpl` |
| FR-UTILITY-01 | Utility | Admin/Staff | Ghi chỉ số điện/nước cho phòng occupied | High | Implemented | `UtilityReadingServiceImpl` |
| FR-INVOICE-01 | Invoice | Admin/Staff | Preview/generate invoice theo phòng/kỳ | High | Implemented | `InvoiceServiceImpl` |
| FR-INVOICE-02 | Invoice | Admin/Staff | Bulk preview/generate invoice theo building | High | Implemented | `AdminBuildingInvoiceController`, `StaffBuildingInvoiceController` |
| FR-PAYMENT-01 | Payment | Resident | Upload payment proof | High | Implemented | `ResidentPaymentController`, `PaymentServiceImpl` |
| FR-PAYMENT-02 | Payment | Staff/Admin | Approve/reject pending payment | High | Implemented | `StaffPaymentController` |
| FR-SEPAY-01 | Payment | System | Tạo SePay payment code/QR khi cấu hình sẵn sàng | High | Implemented/configurable | `SepayPaymentServiceImpl` |
| FR-SEPAY-02 | Payment | System | Webhook hợp lệ cập nhật invoice/payment và tạo receipt | High | Implemented/tested | `SepayPaymentServiceImplTest` |
| FR-MAINTENANCE-01 | Maintenance | Resident | Tạo maintenance request | High | Implemented | `ResidentMaintenanceRequestController` |
| FR-MAINTENANCE-02 | Maintenance | Admin/Staff | Assign/start/complete/reject request | High | Implemented | `MaintenanceRequestServiceImpl` |
| FR-EQUIPMENT-01 | Equipment | Admin/Staff/Resident | Quản lý/xem thiết bị và lịch sử bảo trì | Medium | Implemented | equipment classes |
| FR-NOTIFICATION-01 | Notification | Admin/System/User | Tạo, target, đọc thông báo | Medium | Implemented | notification classes |
| FR-AI-01 | AI | All roles | Hỏi đáp read-only bằng context theo role | Medium | Implemented/configurable | `ChatServiceImpl`, `GeminiChatClient` |
| FR-EXPORT-01 | Export | Frontend user | Xuất Excel | Low | Implemented in frontend utility | `excelExport.js` |

Core functional detail examples:

| FR | Trigger | Preconditions | Main flow | Error cases | Output | Acceptance criteria | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-INVOICE-01 | Admin/Staff chọn preview/generate | Room occupied, active Head Resident, không trùng invoice month, có config phí hợp lệ | Tính rent/deposit/service/utility, sum item, lưu invoice | Empty room, duplicate invoice, thiếu utility reading, duplicate fee | Invoice + items + optional SePay | Tổng invoice bằng tổng items, không âm, không trùng kỳ | [VERIFIED] |
| FR-SEPAY-02 | SePay gọi webhook | Webhook auth hợp lệ, payment code match, amount đúng | Tìm payment, kiểm tra amount, set PAID, tạo receipt nếu chưa có | Sai auth, thiếu code, sai amount, webhook lặp | Invoice/payment paid, receipt valid | Webhook lặp không tạo receipt trùng | [VERIFIED] |
| FR-MAINTENANCE-02 | Admin assign/Staff start-complete | Request tồn tại, staff active, đúng trạng thái | Assign -> start -> complete, lưu result image/note | Không đúng staff, trạng thái sai | Completed request/history | Staff chỉ xử lý request được giao | [VERIFIED] |

Information Required from the Student: bổ sung Postman/API docs nếu muốn mô tả endpoint chi tiết hơn.

## 10. Core Business Workflows

| # | Workflow | Objective | Actors | Main steps | Final state | Security checks | Evidence | Missing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Admin creates Staff/Resident account | Tạo user nội bộ | Admin | Admin submit user -> service tạo temp password -> must change password | User active | Admin only | `AdminUserController`, `UserServiceImpl` | Email temp password policy |
| 2 | First-login password change | Bảo vệ tài khoản mới | User | Login -> frontend redirect -> change password | `mustChangePassword=false` | Authenticated | `ProtectedRoute`, `AuthServiceImpl` | Password strength policy beyond min 8 |
| 3 | Admin creates building/room | Tạo inventory | Admin | Create building -> create room with building prefix | Room empty | Admin only | building/room services | Không |
| 4 | Resident assigned to room | Bắt đầu cư trú | Admin | Pick room empty + active Resident Head -> create assignment/contract -> room occupied | Assignment ACTIVE | Admin only, service validation | `HeadResidentAssignmentServiceImpl` | Contract template |
| 5 | Rental contract confirmation | Resident xác nhận | Admin/Resident | Admin upload contract -> Resident confirm/report error | Confirmed/reported | Resident own room | contract services/controllers | Chi tiết status final |
| 6 | Room member approval | Quản lý người ở | Resident/Admin | Resident add member -> PENDING -> Admin approve/reject | APPROVED/REJECTED | Own room/admin, max occupants | `RoomMemberServiceImpl` | Không |
| 7 | Vehicle approval | Quản lý xe | Resident/Admin | Resident request -> Admin approve/reject | ACTIVE/REJECTED | Own room/admin | `VehicleServiceImpl` | Fee billing by vehicle details |
| 8 | Utility reading submission | Ghi điện nước | Staff/Admin | Select occupied room -> enter old/new readings/images -> save | Reading recorded | Staff/Admin, occupied+active assignment | `UtilityReadingServiceImpl` | Magic-byte validation |
| 9 | Monthly invoice generation | Tính tiền tháng | Admin/Staff | Preview -> validate -> generate -> optional SePay | Invoice UNPAID | Staff/Admin, room/building validation | `InvoiceServiceImpl` | User acceptance logs |
| 10 | Manual payment confirmation | Đối soát proof | Resident/Staff | Resident upload proof -> Staff/Admin approve/reject | PAID or REJECTED | Own invoice, staff endpoint | `PaymentServiceImpl` | Partial payment policy |
| 11 | SePay webhook payment | Tự động đối soát | SePay/System | Webhook auth -> match code -> amount check -> mark paid -> receipt | PAID + receipt | Webhook secret/amount/idempotency | `SepayPaymentServiceImpl` | Replay timestamp/signature |
| 12 | Receipt generation | Xác nhận thanh toán | System/Admin | Valid payment -> create receipt | VALID receipt | Duplicate receipt check | `ReceiptCreationServiceImpl` | Resident receipt page scope |
| 13 | Maintenance request | Báo sửa chữa | Resident/Admin/Staff | Create request with optional equipment/image | PENDING | Own room/equipment scope | `MaintenanceRequestServiceImpl` | SLA |
| 14 | Admin assigns Staff | Giao xử lý | Admin | Select active staff -> assign | ASSIGNED | Admin only | `MaintenanceRequestServiceImpl` | Staff-building assignment |
| 15 | Staff completes maintenance | Hoàn thành | Staff | Start -> complete with note/image | COMPLETED | Assigned staff only | `MaintenanceRequestServiceImpl` | Không |
| 16 | Notification delivery | Gửi thông báo | Admin/System | Create target -> users read | Sent/read | Target validation | notification services | Push/email notification |
| 17 | AI assistant query | Hỏi đáp nghiệp vụ | All roles | Validate auth/room -> build role context -> Gemini reply | Text answer | Role scope, sensitive key sanitization | `ChatServiceImpl` | External Gemini logs/privacy |
| 18 | Password recovery | Khôi phục mật khẩu | User | Forgot -> code email -> reset | Password changed | Code hash/attempt/expiry | `AuthServiceImpl` | OTP length/expiry docs |
| 19 | Move-out | Kết thúc cư trú | Admin | Remove Head Resident -> end assignment/contract -> members left -> vehicles inactive -> room empty | Room EMPTY | Admin only | tests/service | Final settlement process |

Information Required from the Student: cung cấp sequence/UML nếu đã có; xác nhận trạng thái chi tiết contract/payment.

## 11. Business Rules

| Rule ID | Module | Business Rule | Enforcement Layer | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| BR-RES-01 | Residency | Một phòng chỉ có một active Head Resident | Service + DB generated unique | `HeadResidentAssignmentServiceImpl`, V3 | [VERIFIED] |
| BR-RES-02 | Residency | Một Resident Head chỉ đại diện một active room | Service + DB generated unique | V3, service | [VERIFIED] |
| BR-OCC-01 | Occupancy | Approve member không vượt max occupants | Service + test | `RoomMemberServiceImplTest` | [VERIFIED] |
| BR-ROOM-01 | Room | Chỉ phòng EMPTY được gán Head Resident | Service + test | `assignHeadResidentRejectsNonEmptyRoom` | [VERIFIED] |
| BR-CON-01 | Contract | Assign Head Resident tạo active assignment/contract | Service + test | `HeadResidentAssignmentServiceImplTest` | [VERIFIED] |
| BR-CON-02 | Contract | Contract active list không gồm ended contract | Service + test | `RentalContractServiceImplTest` | [VERIFIED] |
| BR-UTL-01 | Utility | Chỉ occupied rooms có active Head Resident được ghi chỉ số | Service + test | `UtilityReadingServiceImpl` | [VERIFIED] |
| BR-UTL-02 | Utility | Không ghi trùng chỉ số cùng phòng/tháng | Service + DB unique + test | V3, `UtilityReadingServiceImplTest` | [VERIFIED] |
| BR-UTL-03 | Utility | Chỉ số mới >= chỉ số cũ | Service validation | `UtilityReadingServiceImpl` | [VERIFIED] |
| BR-INV-01 | Invoice | Không tạo trùng invoice cùng room/month | Service + DB unique | V3, `InvoiceServiceImpl` | [VERIFIED] |
| BR-INV-02 | Invoice | Invoice total bằng tổng items và không âm | Service + test | `InvoiceServiceImpl` | [VERIFIED] |
| BR-INV-03 | Invoice | Paid invoice không được delete | Service + test | `deleteInvoiceRejectsPaidInvoice` | [VERIFIED] |
| BR-PAY-01 | Payment | Chỉ unpaid/rejected invoice nhận proof | Service | `PaymentServiceImpl` | [VERIFIED] |
| BR-PAY-02 | SePay | Webhook phải đúng authorization và amount | Service + test | `SepayPaymentServiceImplTest` | [VERIFIED] |
| BR-PAY-03 | SePay | Webhook lặp không tạo duplicate receipt | Service + test | `handleWebhookIsIdempotentAfterPaymentWasCompleted` | [VERIFIED] |
| BR-REC-01 | Receipt | Receipt chỉ tạo sau payment hợp lệ | Service | payment/sepay services | [VERIFIED] |
| BR-VEH-01 | Vehicle | Xe pending mới được approve/reject | Service | `VehicleServiceImpl` | [VERIFIED] |
| BR-TASK-01 | Task | Staff chỉ xử lý task được giao | Service | `TaskServiceImpl` | [VERIFIED] |
| BR-SEC-01 | Resident | Resident chỉ xem dữ liệu phòng mình | Interceptor + service | resident access tests | [VERIFIED] |
| BR-NOTI-01 | Notification | Notification target theo user/building | Entity/service | notification classes | [VERIFIED] |

Information Required from the Student: xác nhận luật về hợp đồng không chồng thời gian đã đủ qua active assignment hay cần kiểm tra date overlap độc lập.

## 12. Project Aim and Objectives

### 12.1 General Aim

[INFERRED] Mục tiêu tổng quát: Thiết kế và triển khai một hệ thống web quản lý vận hành bất động sản cho thuê, hỗ trợ quản trị tòa nhà, phòng, cư dân, hợp đồng, điện nước, hóa đơn, thanh toán, bảo trì và giao tiếp theo mô hình phân quyền vai trò.

### 12.2 Specific Objectives

| Objective ID | Description | Related problem | Related feature | Success criterion | Evidence expected | Current status |
| --- | --- | --- | --- | --- | --- | --- |
| OBJ-FUNC-01 | Quản lý tòa nhà/phòng/cư dân tập trung | PS-01 | Building/Room/Assignment | CRUD và assignment hoạt động | Source + demo | [VERIFIED] |
| OBJ-FUNC-02 | Tự động hóa hóa đơn theo phí/chỉ số | PS-03/04 | Utility/Invoice | Không trùng, tính đúng | Tests + demo | [VERIFIED] |
| OBJ-FUNC-03 | Hỗ trợ đối soát thủ công và SePay | PS-05 | Payment/SePay/Receipt | Valid payment tạo receipt | Tests + webhook demo | [VERIFIED] |
| OBJ-SEC-01 | Phân quyền theo role và room scope | PS-09 | Security/interceptor | Resident không xem phòng khác | Tests | [VERIFIED] |
| OBJ-TEST-01 | Có test backend cho nghiệp vụ lõi | Quality | Unit/service tests | `mvn test` pass | Test log | [VERIFIED] |
| OBJ-TEST-02 | Có E2E smoke cho UI chính | Quality | Playwright | 100% smoke pass | Test log | [MISSING/PARTIAL] |
| OBJ-DEP-01 | Deploy demo ổn định | Deployment | Backend/frontend/db/env | URL hoạt động | Deployment logs | [MISSING] |
| OBJ-DOC-01 | Có tài liệu demo và chatbot scope | Documentation | docs | Tài liệu nhất quán code | docs review | [PARTIAL] |

Information Required from the Student: deadline và tiêu chí chấm điểm của trường để ưu tiên objective.

## 13. Success Criteria and Acceptance Criteria

| Criterion ID | Criterion | Measurement Method | Target | Current Evidence |
| --- | --- | --- | --- | --- |
| SC-01 | Ba vai trò truy cập đúng chức năng | Backend/FE auth tests + demo | Pass | Backend tests pass; E2E partial fail |
| SC-02 | Resident không truy cập phòng khác | Service/interceptor tests | Pass | `ResidentRoomAccess...Test` pass |
| SC-03 | Staff không xử lý task/maintenance của người khác | Service tests/manual | Pass | Service checks verified; cần thêm test rộng |
| SC-04 | Invoice tính đúng | Unit tests | Pass | `InvoiceServiceImplTest` pass |
| SC-05 | Không tạo hóa đơn trùng | Unit/DB migration | Pass | V3 unique + service |
| SC-06 | Valid SePay webhook cập nhật invoice | Unit test | Pass | `SepayPaymentServiceImplTest` pass |
| SC-07 | Duplicate webhook idempotent | Unit test | Pass | Test pass |
| SC-08 | Invalid file bị từ chối | Unit/manual test | Pass | Code validation exists; test chưa xác nhận |
| SC-09 | Password không lưu plain text | Code review | BCrypt | `SecurityConfig`, `UserServiceImpl` |
| SC-10 | Migration chạy trên DB trống | Integration/manual | Pass | [MISSING] |
| SC-11 | Core E2E flow hoàn thành | Playwright | 100% pass | 8/11 pass, 3 fail |
| SC-12 | UI responsive | Browser QA | Pass | [MISSING] |
| SC-13 | Lỗi bên thứ ba xử lý hợp lý | Unit tests | Pass | Gemini fallback/email failure tests pass |

Information Required from the Student: test log deploy/demo thật, browser responsive screenshots, migration-on-empty-DB log.

## 14. Existing Solutions and Competitor Analysis Requirements

Research plan:

| Solution | Website | Functions to check | Criteria | Evidence needed | Current status |
| --- | --- | --- | --- | --- | --- |
| Excel/Google Sheets | Official docs | Manual room/billing tracking | Collaboration, errors, automation | screenshots/feature docs | [MISSING] |
| Zalo/email/sổ sách | Official/general sources | Communication/manual records | Searchability/audit | workflow evidence | [MISSING] |
| Vietnamese rental management software | [MISSING] | Room, invoice, payment, tenant | Feature parity | official website | [MISSING] |
| International property management software | [MISSING] | Maintenance, lease, payments | Scope comparison | official website | [MISSING] |
| SePay-like payment reconciliation | SePay official | QR/webhook | Security, idempotency | official docs | [MISSING] |

Competitor matrix template:

| Criteria | Tropilot | Excel/Sheets | Zalo/email/sổ sách | Vietnam PMS | International PMS |
| --- | --- | --- | --- | --- | --- |
| Multi-building management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Room management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Resident management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Contract management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Utility reading | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Meter image evidence | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Automatic invoice generation | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Payment reconciliation | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Maintenance workflow | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Equipment management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Staff task management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Vehicle management | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Notification targeting | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Financial reporting | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| AI assistant | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Vietnamese/English support | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| Role-based access control | [VERIFIED] | [MISSING] | [MISSING] | [MISSING] | [MISSING] |

Information Required from the Student: danh sách đối thủ cụ thể và nguồn chính thức.

## 15. Technology Stack

### 15.1 Frontend

| Item | Value | Evidence | Status |
| --- | --- | --- | --- |
| Framework/library | React 18.2.0 | `package.json` | [VERIFIED] |
| Build tool | Vite 5.2.0 | `package.json` | [VERIFIED] |
| Routing | react-router-dom 6.30.3 | `package.json`, routes | [VERIFIED] |
| API communication | axios 1.16.1 | `axiosClient.js` | [VERIFIED] |
| Styling | CSS files in `src/styles` | file tree | [VERIFIED] |
| i18n | i18next/react-i18next, vi/en locales | `package.json`, locales | [VERIFIED] |
| Excel export | xlsx 0.18.5 | `package.json`, `excelExport.js` | [VERIFIED] |
| Testing | Playwright 1.60.0 | `package.json`, tests | [VERIFIED] |
| Token storage | LocalStorage | `authStorage.js` | [VERIFIED] |
| Folder structure | api, components, pages, routes, features, layouts, styles | file tree | [VERIFIED] |

### 15.2 Backend

| Item | Value | Evidence | Status |
| --- | --- | --- | --- |
| Java | 17 | `pom.xml` | [VERIFIED] |
| Spring Boot | 3.2.4 | `pom.xml` | [VERIFIED] |
| Modules | Web, Data JPA, Security, Mail, Validation | `pom.xml` | [VERIFIED] |
| JWT library | jjwt 0.12.5 | `pom.xml` | [VERIFIED] |
| Validation | spring-boot-starter-validation + annotations | DTO request files | [VERIFIED] |
| Mail | Spring Boot Mail | `pom.xml`, mail services | [VERIFIED] |
| ORM | JPA/Hibernate | `pom.xml`, entities | [VERIFIED] |
| Lombok | Included optional | `pom.xml` | [VERIFIED] |
| Migration | Flyway core/mysql | `pom.xml`, migration folder | [VERIFIED] |
| Gemini client | Custom client | `GeminiChatClient.java` | [VERIFIED] |
| QR generation | SePay QR URL construction, not local QR lib | `SepayPaymentServiceImpl` | [VERIFIED] |
| File handling | Local filesystem storage | storage services | [VERIFIED] |
| Exception handling | GlobalExceptionHandler | exception package | [VERIFIED] |
| Swagger/OpenAPI | Not found | no dependency/source found | [MISSING] |

### 15.3 Database

| Item | Value | Evidence | Status |
| --- | --- | --- | --- |
| Database | MySQL | `application.properties`, mysql connector | [VERIFIED] |
| MySQL version | [MISSING] | no runtime DB version log supplied | [MISSING] |
| Migration count | 9 | migration folder | [VERIFIED] |
| Tables in baseline | 28 | `V1__baseline_schema.sql` | [VERIFIED] |
| Entity Java files | 29, including one `@Embeddable` `ContactPhone` | entity package | [VERIFIED] |
| Extra collection table | `system_contact_phones` | `SystemContact` element collection | [VERIFIED] |
| Constraints | unique room/month invoice, utility, active assignments, active utility fees | V1/V3 migrations | [VERIFIED] |
| Audit fields | Many entities use createdAt/updatedAt | entities | [VERIFIED] |
| Soft delete | User delete appears to archive/inactivate email, not universal soft delete | `UserServiceImplTest` | [INFERRED] |

### 15.4 Third-Party Services

| Service | Why used | Where used | Advantages | Limitations | Alternatives | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| SePay | QR/webhook payment | `SepayPaymentServiceImpl` | Auto reconciliation | Needs secret/account/webhook availability | Manual proof, other payment gateway | [VERIFIED] |
| Gemini | AI assistant | `GeminiChatClient`, `ChatServiceImpl` | Natural-language query | Quota/downtime/hallucination risk | Static FAQ, other LLM | [VERIFIED] |
| Email/SMTP | Reset/task/payment email | mail services | User notifications | SMTP failure possible | In-app only, transactional email provider | [VERIFIED] |
| Local storage | Upload files | storage services | Simple demo setup | Public `/uploads/**`, local disk limits | S3/GCS/MinIO | [VERIFIED] |

Information Required from the Student: MySQL runtime version, deployment provider, Swagger/Postman docs if any.

## 16. Technology Selection Justification

| Choice | Compared with | Advantages | Disadvantages | Suitability for Tropilot | Final justification |
| --- | --- | --- | --- | --- | --- |
| React/Vite | Next.js/Vue | Fast SPA dev, simple build | No SSR, large bundle warning | Good for admin dashboard app | [INFERRED] suitable for demo and role-based SPA |
| Spring Boot | NestJS/Laravel | Strong typed backend, security/JPA/Flyway ecosystem | Verbose, Java setup heavier | Good for layered business rules | [VERIFIED]/[INFERRED] |
| MySQL | PostgreSQL/MongoDB | Relational constraints, common academic setup | Less flexible JSON/advanced analytics than PostgreSQL | Fits invoices/contracts/rooms relations | [INFERRED] |
| REST | GraphQL | Simple, controller-based, easy test | More endpoints, possible overfetch | Fits CRUD/business workflows | [VERIFIED]/[INFERRED] |
| Local file storage | Object storage | Easy local demo | Scalability/security/backups limited | Acceptable for academic local/demo | [VERIFIED]/[INFERRED] |
| JWT LocalStorage | HttpOnly cookie | Simple SPA integration | XSS token exposure risk | Works for demo; future hardening needed | [VERIFIED]/[INFERRED] |
| Playwright | Cypress/Selenium | Cross-browser E2E capability | Current smoke not fully passing | Good for frontend smoke | [VERIFIED] |
| SePay | Manual proof | Faster reconciliation | Webhook dependency | Useful highlight for Vietnam transfer workflow | [VERIFIED]/[INFERRED] |
| Gemini | Static chatbot | Dynamic responses using context | Privacy/hallucination/quota | Good as read-only assistant if scoped | [VERIFIED]/[INFERRED] |

Information Required from the Student: trường có yêu cầu bắt buộc công nghệ nào không.

## 17. System Architecture

[VERIFIED] Kiến trúc thực tế là **decoupled frontend/backend**, **three-tier/layered architecture**, gần với **modular monolith backend**. Evidence: React frontend riêng, Spring Boot backend với controller-service-repository-entity, MySQL database.

[VERIFIED] Không nên gọi là Clean Architecture vì cấu trúc hiện tại chủ yếu là Controller-Service-Repository và entity JPA trong domain persistence. Evidence: package structure.

Architecture components:

| Layer | Components | Evidence |
| --- | --- | --- |
| Presentation | React pages/layouts/routes/components | frontend `src` |
| API layer | Spring controllers returning `ApiResponse<T>` | controller package |
| Application/business layer | Services implementing business rules | service/impl package |
| Data layer | JPA repositories/entities, Flyway migrations | repository/entity/migration |
| Security layer | JWT filter, Spring Security, interceptors | security/config packages |
| External integration layer | Gemini, SePay, SMTP, local file storage | integration/config/storage |

Flows:

| Flow | Summary | Status |
| --- | --- | --- |
| Authentication | Login -> JWT -> LocalStorage -> Axios Bearer -> JWT filter | [VERIFIED] |
| Request | React -> Axios -> controller -> service -> repository -> MySQL | [VERIFIED] |
| File storage | Multipart -> storage service -> local `uploads` path -> `/uploads/**` resource handler | [VERIFIED] |
| Notification | Manual/system notification -> target tables -> user read state | [VERIFIED] |
| Payment | Invoice -> manual proof or SePay QR -> confirmation/webhook -> receipt | [VERIFIED] |
| AI | User message -> role-scoped context -> Gemini client -> text reply | [VERIFIED] |
| Deployment | Local config documented; production/deploy URL missing | [PARTIAL] |

Information Required from the Student: deployment diagram target and production/staging distinction.

## 18. Database Information

Baseline tables:

| Module | Tables | Status |
| --- | --- | --- |
| Identity/Security | `users`, `password_reset_codes`, `activity_logs` | [VERIFIED] |
| Property | `buildings`, `rooms`, `room_assignments` | [VERIFIED] |
| Resident | `room_members`, `vehicles` | [VERIFIED] |
| Contract | `rental_contracts`, `rental_contract_file_histories` | [VERIFIED] |
| Billing | `service_fees`, `utility_readings`, `invoices`, `invoice_items` | [VERIFIED] |
| Payment | `payments`, `sepay_payments`, `receipts` | [VERIFIED] |
| Maintenance/Equipment/Task | `maintenance_requests`, `equipment`, `equipment_maintenance_history`, `tasks` | [VERIFIED] |
| Notification/Communication | `notifications`, `notification_reads`, `notification_target_users`, `notification_target_buildings`, `feedbacks`, `system_contacts`, `system_contact_phones` | [VERIFIED] |
| Security metadata | Notification event/source metadata added in V8/V9 | [VERIFIED] |

Key constraints:

| Constraint | Evidence | Status |
| --- | --- | --- |
| `users.email` unique | V1 | [VERIFIED] |
| `buildings.building_code` unique | V1 | [VERIFIED] |
| `rooms.room_code` unique | V1 | [VERIFIED] |
| `invoices(room_id, invoice_month)` unique | V1/V3 | [VERIFIED] |
| `utility_readings(room_id, reading_month)` unique | V1/V3 | [VERIFIED] |
| Active room assignment uniqueness via generated columns | V3 | [VERIFIED] |
| One active electricity/water fee per building via generated columns | V3 | [VERIFIED] |
| `sepay_payments.payment_code` and `invoice_id` unique | V1 | [VERIFIED] |
| Notification target/read duplicate prevention | V1 unique keys | [VERIFIED] |

Potential database concerns:

| Concern | Impact | Status |
| --- | --- | --- |
| No universal audit log table for before/after values | Harder forensic audit | [INFERRED] |
| Local uploads paths stored as URLs; no object storage metadata | Migration to cloud storage needs care | [INFERRED] |
| Some historical snapshot fields may be insufficient for invoice if room price/service fee changes later | Financial history risk if invoice item detail lacks all snapshots | [INFERRED] |
| Staff-building assignment table not identified | Staff scope ambiguity | [MISSING] |

Information Required from the Student: ERD, full column-level schema export, and confirmation of snapshot/audit expectations.

## 19. Security and Privacy Analysis

### Authentication

| Topic | Finding | Evidence | Status |
| --- | --- | --- | --- |
| Password hashing | BCryptPasswordEncoder | `SecurityConfig.java` | [VERIFIED] |
| JWT | jjwt + JwtAuthenticationFilter | `pom.xml`, security package | [VERIFIED] |
| Access token lifetime | default 1440 minutes | `application.properties` | [VERIFIED] |
| Refresh token | Not found | no source found | [MISSING] |
| Token storage | LocalStorage | `authStorage.js` | [VERIFIED] |
| Logout | Frontend clear storage implied | Auth context/storage | [INFERRED] |
| First-login password | `mustChangePassword` supported | service/frontend | [VERIFIED] |
| Password reset | code entity, email service, attempt count | `AuthServiceImpl` | [VERIFIED] |
| Account locking | Admin lock/unlock endpoints | `AdminUserController` | [VERIFIED] |

### Authorization

[VERIFIED] Route-level authorization exists in `SecurityConfig`. [VERIFIED] Method-level authorization exists with `@PreAuthorize` in controllers. [VERIFIED] Resident object scope is checked by active assignment interceptor and per-service room checks.

[MISSING] Staff building-specific assignment/scope remains unclear.

### File Security

| Control | Finding | Evidence | Status |
| --- | --- | --- | --- |
| Allowed extensions | jpg/jpeg/png/pdf depending service | storage services | [VERIFIED] |
| MIME validation | content type checked | storage services | [VERIFIED] |
| Magic bytes | Some services check type by extension/content type; robust magic-byte validation not confirmed for all | storage services | [PARTIAL] |
| File size | Spring multipart max 10MB | `application.properties` | [VERIFIED] |
| File naming | UUID filenames | storage services | [VERIFIED] |
| Path traversal | normalized destination startsWith directory | storage services | [VERIFIED] |
| Download authorization | `/uploads/**` is permitAll | `SecurityConfig.java` | [VERIFIED] security limitation |

### Payment Security

[VERIFIED] SePay webhook endpoint is public but service validates authorization header using configured secret. Evidence: `SecurityConfig.java`, `SepayPaymentServiceImpl.java`.

[VERIFIED] Amount validation, payment code matching, and idempotency for already paid payment are implemented/tested. Evidence: `SepayPaymentServiceImplTest`.

[MISSING] Timestamp/signature replay protection beyond payment idempotency was not found.

### AI Security

[VERIFIED] AI is read-only by design in docs and code only returns response text. Evidence: `docs/chatbot-question-scope.md`, `ChatServiceImpl.java`.

[VERIFIED] Context excludes sensitive keys by markers and is role scoped. Evidence: `ChatContextServiceImpl.java`.

[MISSING] No evidence of formal prompt injection testing or Gemini data processing policy.

### Privacy

| Data | Who can access | Why collected | Stored where | Third-party sent? | Retention | Missing controls |
| --- | --- | --- | --- | --- | --- | --- |
| Name/email/phone | Admin, relevant role | Identity/contact | `users`, `room_members` | Email provider for messages | [MISSING] | Privacy policy |
| Identity number | [MISSING] | [MISSING] | Not confirmed | [MISSING] | [MISSING] | Confirm if collected |
| Contract files | Admin/Resident | Rental contract | uploads + DB URL | Not confirmed | [MISSING] | Access-protected downloads |
| Vehicle plate | Admin/Staff/Resident own | Vehicle management | `vehicles` | No evidence | [MISSING] | Masking policy |
| Payment proof/info | Admin/Staff/Resident own | Payment confirmation | `payments`, uploads | SePay payload for webhook | [MISSING] | Access-protected uploads |
| Resident history | Admin; limited resident | Audit/history | assignments/contracts/members | No evidence | [MISSING] | Retention policy |
| Uploaded images | Depending module; but URL public if known | Evidence | local uploads | No evidence | [MISSING] | Authorization for file serving |

Information Required from the Student: privacy policy, retention period, whether real personal data is used in demo, and production file access plan.

## 20. Software Development Methodology

[MISSING] Không có bằng chứng đủ để kết luận Scrum. Không thấy sprint records, Trello/Notion, backlog hay burndown trong repo.

[INFERRED] Có thể mô tả là **Hybrid/Kanban-like academic development** nếu sinh viên xác nhận: triển khai theo module, dùng demo checklist và bug log. Evidence hiện có: `docs/demo-flow.md`, `docs/demo-bug-log.md`, git repo.

Information Required from the Student: Git history milestones, task board, sprint plan hoặc mô tả quy trình thực tế.

## 21. Software Engineering Process

| Phase | Activities | Tools | Inputs | Deliverables | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Requirement analysis | Xác định module/role/workflows | docs/README | Business needs | README, demo flow | `README.md`, `docs/demo-flow.md` | [PARTIAL] |
| System design | Layered architecture, DB schema | Spring/JPA/Flyway | Requirements | Entities/migrations | entity/migration packages | [VERIFIED] |
| Development | Frontend/backend modules | React/Spring/MySQL | Design | Source code | repo | [VERIFIED] |
| Integration | SePay, Gemini, email | APIs/SMTP | Config/env | Integration code | config/services | [VERIFIED] |
| Testing | Unit/service/E2E | Maven/Playwright | Source | Test logs | test run results | [PARTIAL] |
| Deployment | Local/demo setup | env, Vite, Spring | Build | Running app | README | [PARTIAL] |
| Maintenance | Bug log and improvements | docs | Demo issues | bug log | `docs/demo-bug-log.md` | [PARTIAL] |
| Documentation | README, chatbot docs | Markdown | Implementation | docs | docs folder | [PARTIAL] |

Information Required from the Student: actual phase dates and responsible person.

## 22. Work Breakdown Structure Information

| WBS ID | Task name | Description | Dependency | Expected output | Responsible | Planned duration | Actual status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.0 | Project initiation | Define topic/scope | None | Approved topic | [MISSING] | [MISSING] | [MISSING] | [MISSING] |
| 2.0 | Requirement analysis | Roles/modules/workflows | 1.0 | Requirement list | [MISSING] | [MISSING] | Partial | README/docs |
| 3.0 | System design | Architecture, DB, API | 2.0 | ERD/UML/API | [MISSING] | [MISSING] | Partial | migrations/entities |
| 4.0 | Backend development | Auth, modules, services | 3.0 | Spring Boot API | [MISSING] | [MISSING] | Implemented | backend source |
| 5.0 | Frontend development | Pages/routes/components | 3.0/4.0 | React SPA | [MISSING] | [MISSING] | Implemented | frontend source |
| 6.0 | Third-party integrations | SePay/Gemini/email | 4.0 | Integration services | [MISSING] | [MISSING] | Configurable | services/config |
| 7.0 | Testing | Unit/E2E/security | 4.0/5.0 | Test logs | [MISSING] | [MISSING] | Partial | 70 backend pass; 8/11 E2E |
| 8.0 | Deployment | Local/demo/prod setup | 4.0/5.0/6.0 | Deployed app | [MISSING] | [MISSING] | Missing production evidence | README |
| 9.0 | Documentation | Proposal/final report/manual | All | Docs | [MISSING] | [MISSING] | Partial | docs |
| 10.0 | Defense preparation | Demo script/slides/video | 8.0/9.0 | Presentation | [MISSING] | [MISSING] | Missing | [MISSING] |

Information Required from the Student: planned/actual durations and owner names.

## 23. Timeline and Gantt Chart Information

| Task ID | Task | Start Date | End Date | Duration | Dependency | Milestone | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | Project initiation | [MISSING] | [MISSING] | [MISSING] | None | Topic selected | [MISSING] |
| T-02 | Requirement analysis | [MISSING] | [MISSING] | [MISSING] | T-01 | Requirements baseline | [PARTIAL] |
| T-03 | Database/backend foundation | [MISSING] | [MISSING] | [MISSING] | T-02 | Auth/schema ready | [VERIFIED code] |
| T-04 | Core business modules | [MISSING] | [MISSING] | [MISSING] | T-03 | Room/invoice/payment ready | [VERIFIED code] |
| T-05 | Frontend UI | [MISSING] | [MISSING] | [MISSING] | T-03 | Role workspaces ready | [VERIFIED code] |
| T-06 | Integrations | [MISSING] | [MISSING] | [MISSING] | T-04 | SePay/Gemini/email | [PARTIAL] |
| T-07 | Testing and bug fixing | [MISSING] | [MISSING] | [MISSING] | T-05/T-06 | Test evidence | [PARTIAL] |
| T-08 | Deployment | [MISSING] | [MISSING] | [MISSING] | T-07 | Demo URL | [MISSING] |
| T-09 | Proposal/final report | [MISSING] | [MISSING] | [MISSING] | T-02 onward | Submission | [MISSING] |
| T-10 | Defense | [MISSING] | [MISSING] | [MISSING] | T-08/T-09 | Defense day | [MISSING] |

Information Required from the Student: project calendar and school deadlines.

## 24. Deliverables

| Deliverable | Status | Location | Evidence | Completion date | Missing work |
| --- | --- | --- | --- | --- | --- |
| Proposal Report | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Write final proposal |
| SRS | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Formalize requirements |
| UML diagrams | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Create/attach |
| ERD | [MISSING] | [MISSING] | migrations/entities | [MISSING] | Render official ERD |
| Database schema | Partial | migrations | V1-V9 | [MISSING] | DB version/export |
| Flyway migrations | Complete current | backend migration folder | 9 files | [MISSING] | Test empty DB |
| Frontend source code | Exists | `tropilot-frontend` | source | [MISSING] | E2E fixes |
| Backend source code | Exists | `tropilot-backend` | source | [MISSING] | Deploy hardening |
| API documentation | Partial/missing | `API_CONVENTIONS.md` | file exists | [MISSING] | Endpoint docs/Postman |
| Postman Collection | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Export collection |
| Test Plan | Partial | tests/docs | tests exist | [MISSING] | Formal plan |
| Test Logs | Partial | terminal output | current run | 16/07/2026 | Save logs |
| Deployed application | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Deploy |
| Installation guide | Partial | README | setup docs | [MISSING] | Production notes |
| User manual | [MISSING] | [MISSING] | demo flow partial | [MISSING] | Write manual |
| Final Report | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Write final report |
| Presentation slides | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Create slides |
| Demo script | Exists | `docs/demo-flow.md` | demo checklist | [MISSING] | Sync after E2E |
| Demo video | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Record |
| AI use declaration | [MISSING] | [MISSING] | [MISSING] | [MISSING] | Prepare if required |

Information Required from the Student: nơi lưu các tài liệu học thuật đã có.

## 25. Testing Strategy

| Test Type | Scope | Tool | Current Status | Planned Evidence |
| --- | --- | --- | --- | --- |
| Unit/service testing | Backend business rules | Maven/JUnit/Mockito | PASS 70 tests | Surefire reports |
| Repository testing | DB queries | [MISSING] | Not clearly separated | Add integration tests |
| Integration testing | SePay/Gemini/email behavior via mocked clients | JUnit | Partial pass | Existing tests |
| API testing | REST endpoints | [MISSING] | No Postman log found | Postman/Newman |
| Authorization testing | Roles/resident room scope | JUnit + E2E | Partial pass | Backend tests + E2E |
| E2E testing | Frontend smoke | Playwright | 8/11 pass, 3 fail | Playwright report |
| Security testing | JWT/file/payment | Code review/tests | Partial | Security test cases |
| File upload testing | Extension/MIME/path | [MISSING] | Code exists, tests missing | Upload test logs |
| Webhook testing | SePay amount/idempotency | JUnit | PASS | `SepayPaymentServiceImplTest` |
| Responsive testing | UI | [MISSING] | Missing | Browser screenshots |
| Performance testing | Load/response | [MISSING] | Missing | Only if required |
| UAT | Demo workflow | Manual | Missing | UAT checklist |

Critical scenarios:

| Scenario | Current evidence | Status |
| --- | --- | --- |
| Resident cannot access another room | Service tests | [VERIFIED] |
| Staff cannot access restricted finance data | Partial route/security review | [PARTIAL] |
| Duplicate monthly invoice is rejected | Service + DB | [VERIFIED] |
| Invalid utility reading is rejected | Service tests | [VERIFIED] |
| Valid SePay webhook updates invoice | Unit test | [VERIFIED] |
| Duplicate SePay webhook is idempotent | Unit test | [VERIFIED] |
| Invalid webhook is rejected | Unit test for wrong amount; auth code exists | [PARTIAL] |
| Invalid file is rejected | Code review only | [PARTIAL] |
| Maintenance workflow follows valid transitions | Service review; tests limited | [PARTIAL] |
| Core E2E workflow completes | 3 failures | [PARTIAL/FAIL] |

Information Required from the Student: lưu lại test reports, fix E2E hoặc cập nhật test theo UI hiện tại.

## 26. Deployment Information

| Topic | Finding | Evidence | Status |
| --- | --- | --- | --- |
| Local frontend | `http://localhost:5173` | README | [VERIFIED] |
| Local backend | `http://localhost:8080` | README/application | [VERIFIED] |
| Local database | MySQL `tropilot` | README/application | [VERIFIED] |
| Staging | [MISSING] | no evidence | [MISSING] |
| Production/demo URL | [MISSING] | no evidence | [MISSING] |
| Frontend hosting | [MISSING] | no evidence | [MISSING] |
| Backend hosting | [MISSING] | no evidence | [MISSING] |
| Database hosting | [MISSING] | no evidence | [MISSING] |
| File storage | Local uploads | application/storage | [VERIFIED] |
| Domain/HTTPS | [MISSING] | no evidence | [MISSING] |
| Environment variables | `.env.example`, `application.properties` | files | [VERIFIED] |
| Secret management | env file documented; default secret exists in properties for demo | README/application | [PARTIAL] |
| CORS | configurable allowed origins | `CorsProperties`, `WebConfig` | [VERIFIED] |
| CI/CD | [MISSING] | `.github` not analyzed as CI evidence | [MISSING] |
| Docker | Not found in provided file list | no Dockerfile observed | [MISSING] |
| Backup/logging/monitoring | [MISSING] | no evidence | [MISSING] |

Information Required from the Student: deployment target, URL, HTTPS, backup, CI/CD, Docker decisions.

## 27. Risk Register

| Risk ID | Risk | Probability | Impact | Priority | Mitigation | Contingency | Current Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Scope quá rộng | High | High | Critical | Prioritize demo-critical flows | Freeze scope | Active |
| R-02 | SePay webhook unavailable during demo | Medium | High | High | Prepare manual proof path/mock webhook | Demo manual payment | Active |
| R-03 | Gemini quota/downtime | Medium | Medium | Medium | Fallback model, explain unavailable | Disable AI demo | Active |
| R-04 | Email sending failure | Medium | Medium | Medium | Graceful failure tests exist | Show in-app result | Mitigated partially |
| R-05 | Data loss/local DB issue | Medium | High | High | Backup demo DB | Restore seed/demo data | Active |
| R-06 | Authorization vulnerability | Medium | High | Critical | Add API/object-level tests | Disable risky endpoints | Active |
| R-07 | Incorrect invoice calculation | Medium | High | Critical | Keep unit tests and demo values | Manual verify invoice | Mitigated partially |
| R-08 | Migration failure | Medium | High | High | Test on empty DB | SQL export fallback | Active |
| R-09 | File storage limitations | Medium | Medium | Medium | Use demo-only clean files | Move to object storage later | Active |
| R-10 | Deployment failure | Medium | High | High | Deploy early | Local demo fallback | Active |
| R-11 | Insufficient testing | High | High | Critical | Fix E2E and save logs | Manual QA checklist | Active |
| R-12 | Documentation delays | Medium | Medium | Medium | Use this dossier as source | Reduce scope of report | Active |
| R-13 | Personal data exposure | Medium | High | Critical | Demo data only, protect uploads | Rotate exposed secrets/data | Active |

Information Required from the Student: actual deployment/demo constraints.

## 28. Limitations

| Limitation | Evidence | Impact | Temporary workaround | Future improvement |
| --- | --- | --- | --- | --- |
| Local file storage | `app.upload.base-path`, storage services | Hard to scale/backup; public URLs | Demo-only files | Object storage + signed URLs |
| JWT in LocalStorage | `authStorage.js` | XSS token theft risk | Avoid XSS, short demo | HttpOnly cookie/refresh token |
| No refresh-token rotation found | no refresh implementation | User sessions less robust | Re-login | Refresh token rotation |
| No mobile app | no mobile source | Mobile experience limited | Responsive web | Native/cross-platform app |
| No IoT meter | no IoT code | Manual readings | Mock fetch/demo | IoT/OCR |
| No legal e-signature | upload/confirm only | Contract not legally signed digitally | Manual signed file | Digital signing integration |
| No tax accounting/e-invoice | no tax module | Cannot handle tax compliance | Out-of-scope | Tax/e-invoice module |
| No advanced audit log | only activity logs | Limited forensic details | Add manual logs | Audit log with before/after |
| No large-scale load testing | no evidence | Unknown performance capacity | Demo scale only | Load testing |
| AI depends on Gemini | Gemini config/client | Quota/downtime | Fallback/disable | Provider abstraction/cache |
| Demo payment limitations | SePay config needed | Demo may fail externally | Manual proof/mock | Sandbox/prod plan |
| No full SaaS tenant isolation | building-level only | Multi-company use risky | Single organization demo | Tenant model |

Information Required from the Student: which limitations should be disclosed in final report.

## 29. Future Improvements

| Term | Improvement | Reason |
| --- | --- | --- |
| Short-term | Fix Playwright smoke failures | Improve demo reliability |
| Short-term | Save backend/frontend test reports | Proposal evidence |
| Short-term | Protect uploaded files by authorization | Reduce privacy risk |
| Short-term | Add file upload tests | Validate security claims |
| Medium-term | HttpOnly cookie + refresh-token rotation | Authentication hardening |
| Medium-term | Object storage | Scalable file handling |
| Medium-term | Audit log with before/after | Traceability |
| Medium-term | Automated backup and monitoring | Deployment reliability |
| Medium-term | Improved AI security tests | Prompt injection/privacy |
| Long-term | Mobile app | Resident convenience |
| Long-term | IoT/OCR meter reading | Reduce manual reading |
| Long-term | Digital contract signing | Legal workflow |
| Long-term | Multi-tenant SaaS | Serve multiple property businesses |
| Long-term | Predictive maintenance/revenue forecasting | Advanced analytics |
| Long-term | Partial payment and reconciliation | More realistic payment operations |

Information Required from the Student: chọn roadmap phù hợp phạm vi đồ án.

## 30. Reference Requirements

Reference groups required for Proposal:

| Group | Preferred source |
| --- | --- |
| Rental property management research | Academic papers, industry reports |
| Vietnam rental market reports | Government/reputable reports |
| Digital transformation in property management | Academic/industry sources |
| Web application security | OWASP official |
| RBAC | Academic/official security references |
| JWT authentication | RFC/official library docs |
| Password hashing | OWASP/password storage docs |
| Payment webhook security | Official payment provider/security docs |
| File upload security | OWASP File Upload Cheat Sheet |
| AI privacy/prompt injection | OWASP LLM Top 10, provider docs |
| React/Vite/Spring Boot/MySQL/Flyway/Playwright | Official documentation |
| SePay/Gemini | Official provider documentation |

Information Required from the Student: citations required by university style.

## 31. Proposal Readiness Assessment

| Area | Readiness Score | Available Information | Missing Information | Priority |
| --- | --- | --- | --- | --- |
| Project background | 55 | Domain inferred from modules | Market/user research | High |
| Problem statement | 75 | Strong module evidence | Frequency/severity data | High |
| Scope | 85 | Clear code modules | Final exclusions confirmation | High |
| Stakeholders | 75 | Roles and services clear | Property owner/accountant details | Medium |
| Functional requirements | 85 | Controllers/services/tests | Formal API docs | High |
| Business rules | 85 | Service/migration/tests | Contract overlap details | Medium |
| Technology information | 90 | Package/config verified | Runtime DB/deploy version | Medium |
| Architecture | 85 | Clear layered structure | Deployment diagram | Medium |
| Methodology | 35 | Demo docs/git repo | Actual process evidence | High |
| Timeline | 20 | File timestamps only | Real schedule/deadlines | Critical |
| Testing plan | 70 | Backend tests pass, E2E exists | E2E failures, API/security tests | Critical |
| Risk management | 75 | Risks identifiable | Owner/probability confirmation | Medium |
| References | 20 | Source categories known | Actual references | High |
| Administrative information | 5 | Major inferred | Student/school/deadlines | Critical |

Information Required from the Student: ưu tiên bổ sung administrative, timeline, references, deployment và E2E results.

## 32. Critical Inconsistencies

| ID | Inconsistency | Documentation says | Code/evidence says | More reliable conclusion | Suggested report correction |
| --- | --- | --- | --- | --- | --- |
| CI-01 | Chatbot architecture mismatch | `docs/chatbot-context-schema.md` nói có `AdminChatContextBuilder`, `StaffChatContextBuilder`, `ResidentChatContextBuilder` | Code hiện tại gom logic trong `ChatContextServiceImpl` | Code đáng tin hơn | Viết: “Current implementation builds role-specific context inside ChatContextServiceImpl; separate builder classes are documented as intended architecture but not present.” |
| CI-02 | Chatbot schema mismatch | Docs nói top-level có `summary`, `buildings`, `roomsNeedingAttention`... | Code tạo top-level `data` chứa summary/buildings/invoices... | Code đáng tin hơn | Cập nhật docs hoặc báo cáo theo code: context top-level gồm `generatedAt`, `user`, `matchedTopics`, `businessRules`, `data`. |
| CI-03 | Frontend E2E readiness | README nói smoke verifies main role routes/critical flows | Current `npm run test:e2e` fail 3/11 | Test log đáng tin hơn | Viết: “Frontend smoke suite exists but currently has 3 failing assertions and must be fixed before final demo.” |
| CI-04 | File upload security claim | README nói file upload validation | Code kiểm extension/MIME/path; `/uploads/**` permitAll | Code đáng tin hơn | Viết: “Upload validation exists, but uploaded files are publicly served by URL in current configuration.” |
| CI-05 | Staff scope | Business wording suggests Staff has operational permissions; some docs imply restricted tasks | Code shows Staff can access several building-wide staff endpoints; task/maintenance completion checks assigned staff | Code partial | Viết rõ Staff scope is operational and partly assignment-based; building assignment constraint not confirmed. |
| CI-06 | Table/entity count | Entity files = 29; baseline tables = 28 | `ContactPhone` is `@Embeddable`, `system_contact_phones` is collection table | Both true | Report should say 28 baseline tables, 29 entity Java files including one embeddable. |

Information Required from the Student: quyết định sửa docs hay sửa implementation để hết mâu thuẫn.

## 33. Missing Information Questionnaire

| Question ID | Category | Question | Why needed | Proposal section affected | Priority | Suggested answer format |
| --- | --- | --- | --- | --- | --- | --- |
| Q-ADM-01 | Administrative | Họ tên, MSSV, lớp, trường, GVHD? | Hoàn thiện thông tin hành chính | 2 | Critical | Text/table |
| Q-ADM-02 | Administrative | Đồ án cá nhân hay nhóm? | Scope/responsibility | 2/22 | Critical | Individual/group + members |
| Q-BG-01 | Background | Có khảo sát/phỏng vấn chủ trọ/quản lý không? | Problem evidence | 3/4 | High | Summary + source |
| Q-SCOPE-01 | Scope | Staff có bị phân công theo tòa nhà cụ thể không? | Permission accuracy | 7 | High | Yes/no + rule |
| Q-SCOPE-02 | Scope | Receipt resident view có trong demo không? | Scope/demo flow | 8/10 | Medium | Yes/no |
| Q-BR-01 | Business rules | Hợp đồng có cần chặn chồng thời gian theo date overlap không? | Contract rules | 11 | Medium | Rule statement |
| Q-TECH-01 | Technology | MySQL version dùng demo là gì? | Stack | 15 | Medium | Version number |
| Q-SEC-01 | Security | Có kế hoạch bảo vệ file upload bằng authorization không? | Security limitations | 19/28 | High | Planned/current |
| Q-PAY-01 | Payment | SePay đã test bằng giao dịch thật hay chỉ unit/mock/local? | Integration status | 15/25/26 | High | Environment + evidence |
| Q-AI-01 | AI | Gemini đã chạy thật trong demo chưa? Có log/test thủ công không? | AI status | 15/19/25 | Medium | Yes/no + evidence |
| Q-TEST-01 | Testing | Có muốn fix E2E hoặc cập nhật test theo UI hiện tại không? | Readiness | 25/31 | Critical | Plan/date |
| Q-TIME-01 | Timeline | Ngày bắt đầu/kết thúc/deadline/defense? | Gantt | 23 | Critical | Dates |
| Q-DEP-01 | Deployment | App deploy ở đâu, URL nào, HTTPS chưa? | Deployment | 26 | Critical | URLs/provider |
| Q-REF-01 | References | Trường yêu cầu style trích dẫn nào? | References | 30 | High | APA/IEEE/etc. |

Information Required from the Student: trả lời theo bảng trên để chuyển hồ sơ này thành Proposal chính xác.

## 34. Final Proposal Input Summary

1. Final project title: [INFERRED] **Tropilot: A Web-Based Rental Property Operation Management System**.
2. Background summary: [INFERRED] Dự án giải quyết nhu cầu số hóa quản lý bất động sản cho thuê, thay thế quy trình rời rạc bằng hệ thống web tập trung.
3. Problem statement summary: [VERIFIED/INFERRED] Các vấn đề chính gồm dữ liệu phân tán, hợp đồng, điện nước, hóa đơn, thanh toán, bảo trì, thiết bị, phân quyền và tra cứu nghiệp vụ.
4. Proposed solution summary: [VERIFIED] Tropilot cung cấp frontend React và backend Spring Boot với module vận hành đầy đủ, phân quyền ba vai trò, payment/receipt, SePay, Gemini, notifications và activity logs.
5. Confirmed stakeholders: [VERIFIED] Admin, Staff, Resident Head, Room Member, SePay, Gemini, Email provider. [INFERRED] Property owner, Building manager, Accountant, System administrator.
6. Confirmed scope: [VERIFIED] Auth, user, building, room, assignment, members, contracts, service fees, readings, invoices, payments, receipts, SePay, maintenance, equipment, task, vehicle, feedback, notification, contact, AI, i18n, file upload, Excel export.
7. Main objectives: [INFERRED] Tập trung hóa vận hành, tự động hóa hóa đơn, đối soát thanh toán, phân quyền dữ liệu, hỗ trợ demo học thuật có kiểm thử.
8. Technology stack: [VERIFIED] React 18.2.0, Vite 5.2.0, Axios, React Router, i18next, xlsx, Playwright, Java 17, Spring Boot 3.2.4, Spring Security/JPA/Mail/Validation, Flyway, MySQL, JJWT, Lombok.
9. Architecture: [VERIFIED] Decoupled frontend/backend, layered three-tier architecture, modular monolith backend.
10. Methodology: [MISSING/PARTIAL] Chưa đủ bằng chứng; có thể mô tả hybrid/Kanban-like nếu sinh viên xác nhận.
11. Implementation phases: [INFERRED] Initiation, requirements, design, backend, frontend, integrations, testing, deployment, documentation, defense preparation.
12. Expected deliverables: [PARTIAL] Source code, migrations, README, demo flow, tests; missing formal Proposal, SRS, ERD/UML, API docs, deployment evidence, final report, slides.
13. Success criteria: [PARTIAL] Backend tests pass; frontend build pass; E2E chưa pass toàn bộ; cần deploy/test evidence.
14. Main risks: [INFERRED] Scope lớn, E2E fail, SePay/Gemini/email dependency, file privacy, deployment, migration, insufficient testing.
15. Limitations: [VERIFIED/INFERRED] Local uploads, JWT LocalStorage, no refresh token, no mobile/IoT/e-sign/tax/e-invoice/load test/full SaaS isolation.
16. Information still missing: administrative data, timeline, deployment URL, research references, Staff data scope, production security decisions, E2E fix evidence.
