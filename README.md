# REFUJI — HƯỚNG DẪN CÀI ĐẶT, KHỞI CHẠY & SỬ DỤNG HỆ THỐNG

> **Dự án:** Hệ thống Quản lý & Cho thuê Máy ảnh, Ống kính Fujifilm chuyên nghiệp  
> **Tác giả:** Nguyễn Thành Duy + Nguyễn Ngọc Minh Châu — Khoa Công nghệ Thông tin, Đại học Công nghệ Sài Gòn (STU)  
> **Cập nhật:** Tháng 11/2026

---

## MỤC LỤC
1. [Ngôn ngữ lập trình & Công nghệ (Tech Stack)](#1-ngôn-ngữ-lập-trình--công-nghệ-tech-stack)
2. [Cấu trúc thư mục dự án](#2-cấu-trúc-thư-mục-dự-án)
3. [Yêu cầu môi trường (Prerequisites)](#3-yêu-cầu-môi-trường-prerequisites)
4. [Hướng dẫn cài đặt & Khởi chạy hệ thống](#4-hướng-dẫn-cài-đặt--khởi-chạy-hệ-thống)
5. [Thông tin các cổng Localhost, Routes & Tài khoản truy cập](#5-thông-tin-các-cổng-localhost-routes--tài-khoản-truy-cập)
6. [Các phân hệ & Tính năng chính](#6-các-phân-hệ--tính-năng-chính)
7. [Xử lý sự cố thường gặp (Troubleshooting)](#7-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. NGÔN NGỮ LẬP TRÌNH & CÔNG NGHỆ (TECH STACK)

### 1.1. Ngôn ngữ & Kiểm kiểu
- **TypeScript 5.6+**: Ngôn ngữ chủ đạo xuyên suốt từ Frontend đến Backend và gói `@refuji/shared`.
- **SQL**: Thiết kế chuẩn hóa 13 bảng 3NF (chạy mặc định trên SQLite và có schema MySQL/Prisma).

### 1.2. Frontend
- **Website Khách hàng chính (`localhost:5173`)**:
  - **Framework:** React 18.3 (Hooks, Context API), Vite 5.4.
  - **Styling & Motion:** Tailwind CSS 3.4, Framer Motion 14, Lucide React, giao diện Light mode tối giản kết hợp hiệu ứng *Liquid Glass*.
  - **Validation:** Zod 4 + TypeScript Types.
- **Cổng Quản trị POS & App Đa trang (`localhost:5174` — `refuji-system/apps/web`)**:
  - React 18.3, Vite 5.4, Tailwind CSS 3.4, Framer Motion 11, giao diện Dark mode cho nhân viên showroom/admin và các trang client mở rộng.

### 1.3. Backend & Cơ sở dữ liệu (`localhost:4000`)
- **Runtime & Framework:** Node.js (v20+ LTS), Express 4.21, `tsx` watch mode.
- **Database mặc định:** **SQLite (`better-sqlite3`)** tự khởi tạo & seed dữ liệu tại `refuji-system/apps/api/data/refuji.sqlite` (không cần cài DB ngoài để chạy thử).
- **ORM / DB mở rộng:** Prisma ORM 6.0 + MySQL 8.4 LTS (`refuji-system/apps/api/prisma/schema.prisma`, Docker Compose).
- **Bảo mật & Xác thực:**
  - `bcrypt` (salt rounds 12) + JWT (Access Token & HttpOnly Refresh Token cookie).
  - Bảo vệ định danh CCCD theo chuẩn Luật Bảo vệ Dữ liệu Cá nhân 2025.
- **Thanh toán tích hợp:** VietQR (tự tạo QR Napas 247), VNPAY Sandbox, Thanh toán tại quầy.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
refuji/
├── src/                                  # [PORT 5173] Website Khách hàng chính (Light mode)
│   ├── components/
│   │   ├── account/                      # Phân hệ Tài khoản, Hạng hội viên & Đơn thuê
│   │   │   ├── types.ts
│   │   │   ├── MembershipTiersTab.tsx
│   │   │   ├── RentalOrdersTab.tsx       # Danh sách đơn, Serial khóa kho & nút Thanh toán ngay
│   │   │   ├── UserProfileTab.tsx        # Hồ sơ cá nhân, CCCD & nút Đăng xuất
│   │   │   ├── ChangePasswordForm.tsx
│   │   │   └── ChangeCccdForm.tsx
│   │   ├── auth/                         # Modal & Form Đăng nhập, Đăng ký, Quên mật khẩu
│   │   │   ├── AuthModal.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── PasswordStrengthMeter.tsx
│   │   │   └── UserNavButton.tsx         # Nút tài khoản + thông báo đơn chờ thanh toán
│   │   ├── AccountModal.tsx
│   │   ├── AllEquipmentModal.tsx         # Toàn bộ thiết bị & trạng thái tồn kho thực tế
│   │   ├── AvailabilityExplorer.tsx      # Bộ lọc & kiểm tra thiết bị khả dụng
│   │   ├── BookingModal.tsx              # Đặt thuê, chọn ngày nhận/trả & thanh toán giữ chỗ
│   │   ├── CalendarModal.tsx             # Bộ chọn ngày thuê động
│   │   ├── CartModal.tsx                 # Giỏ hàng thuê nhiều món & thanh toán cọc
│   │   ├── PaymentModal.tsx              # Cổng thanh toán VietQR / VNPAY / Tại quầy
│   │   ├── ReservationFloatingWidget.tsx # Widget đếm ngược 15 phút "Đơn chờ thanh toán"
│   │   ├── Hero.tsx
│   │   └── LiquidNavbar.tsx
│   ├── context/AuthContext.tsx           # Quản lý phiên đăng nhập, pending intent & toast
│   ├── hooks/useCart.ts                  # Quản lý giỏ hàng có ràng buộc tồn kho & auto-clear khi logout
│   ├── schemas/auth.schema.ts            # Schema Zod kiểm tra form Auth
│   ├── services/
│   │   ├── api.ts                        # Gọi /api/models & tính trạng thái AVAILABLE/LOW_STOCK/BOOKED
│   │   └── authApi.ts                    # Gọi /api/auth/*, /api/orders & /api/orders/:orderCode/pay
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── fujifilm-catalog.json             # Dữ liệu gốc 139 mẫu thiết bị & serial (được watch tự động)
│   └── assets/                           # Logo, favicon, ảnh thiết bị Fujifilm
├── docs/                                 # Đặc tả hệ thống SRS v1.0, v1.1 & mockups Figma
├── Bao_Cao_Tien_Do_ReFuji.docx           # Báo cáo tiến trình & lộ trình phát triển dự án
├── package.json                          # Script `npm run dev` chạy song song API (:4000) + WEB (:5173)
├── vite.config.ts                        # Vite Port 5173 + Proxy `/api` sang `:4000` (bắt lỗi 503)
├── README.md
│
└── refuji-system/                        # Monorepo Backend API & Cổng Quản trị POS / Web
    ├── apps/
    │   ├── api/                          # [PORT 4000] Express REST API + SQLite
    │   │   ├── data/refuji.sqlite        # Database SQLite tự tạo khi khởi chạy
    │   │   ├── prisma/                   # Prisma schema MySQL & script seed
    │   │   └── src/
    │   │       ├── modules/
    │   │       │   ├── auth/auth.routes.ts     # /api/auth/*, /api/users, /api/users/me
    │   │       │   ├── catalog/catalog.routes.ts # /api/models (lọc & khóa serial đang giữ chỗ)
    │   │       │   └── orders/orders.routes.ts   # /api/orders (tạo đơn, gán serial, giữ chỗ 15p, pay)
    │   │       ├── db.ts                 # Khởi tạo SQLite, seed & fs.watch đồng bộ fujifilm-catalog.json
    │   │       └── index.ts              # Khởi động Express Server tại cổng 4000
    │   └── web/                          # [PORT 5174] Cổng Quản trị POS Nhân viên & App Đa trang
    │       ├── src/
    │       │   ├── layouts/              # ClientLayout (Dark) & StaffPosLayout
    │       │   ├── pages/admin-staff/    # Dashboard, Kho Serial, Duyệt đơn, Check-out/in, Khách hàng...
    │       │   ├── pages/auth/           # LoginPage, RegisterPage, ForgotPasswordPage
    │       │   ├── pages/client/         # Catalog, Checkout, Orders, Profile KYC, Membership...
    │       │   └── routes/AppRoutes.tsx  # Điều phối route `/` và `/staff/*`
    │       └── vite.config.ts            # Vite Port 5174 + Proxy `/api` sang `:4000`
    └── packages/shared/                  # Types, Enums, Validators dùng chung
```

---

## 3. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

1. **Node.js**: Phiên bản 20 LTS trở lên (`node -v`).
2. **NPM**: Phiên bản 10 trở lên (`npm -v`).
3. **Cơ sở dữ liệu**:
   - Mặc định chạy bằng **SQLite tích hợp sẵn (`better-sqlite3`)**, không cần cài đặt MySQL hay Docker để chạy thử.
   - *(Tùy chọn)* Có sẵn `refuji-system/docker-compose.yml` và Prisma schema nếu muốn chạy với MySQL 8.4.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### 4.1. Cài đặt dependencies (chỉ cần chạy lần đầu)
Tại thư mục gốc dự án (`refuji/`):
```bash
npm install
cd refuji-system && npm install
```

### 4.2. Khởi chạy Website Khách hàng + Backend API (Khuyên dùng)
Tại thư mục gốc `refuji/`, chạy **1 lệnh duy nhất**:
```bash
npm run dev
```
Lệnh này sử dụng `concurrently` để bật song song:
- **API Server**: `http://localhost:4000` (`npm run server`)
- **Website Khách hàng**: `http://localhost:5173` (`vite`)

*(Nếu muốn chạy riêng từng phần: `npm run server` cho Backend API hoặc `npm run dev:frontend` cho Frontend `:5173`.)*

### 4.3. Khởi chạy Cổng Quản trị POS Nhân viên (Port 5174) *(Tùy chọn)*
Mở thêm một Terminal mới khi cần dùng giao diện POS / Admin hoặc các trang đa route:
```bash
cd refuji-system/apps/web
npx vite
```
> Hoặc chạy từ thư mục `refuji-system/`: `npm run dev`. Cổng POS sẵn sàng tại **`http://localhost:5174`**.

---

## 5. THÔNG TIN CÁC CỔNG LOCALHOST, ROUTES & TÀI KHOẢN TRUY CẬP

### 5.1. Tổng quan các cổng Localhost

| Dịch vụ | Địa chỉ URL | Chức năng chính |
|---|---|---|
| **Website Khách hàng chính** | `http://localhost:5173/` | Giao diện Light mode *Liquid Glass*: duyệt 139 thiết bị, kiểm tra tồn kho, giỏ hàng, đặt giữ chỗ 15 phút (khóa Serial thật), thanh toán VietQR / VNPAY / tại quầy, widget đếm ngược đơn chờ thanh toán. |
| **Cổng Quản trị POS & Web đa trang** | `http://localhost:5174/` | Giao diện Dark mode (`refuji-system/apps/web`): gồm các trang khách hàng đa route (`/catalog`, `/checkout`, `/orders`, `/profile`, `/login`, `/register`) và **phân hệ POS Nhân viên (`/staff/*`)**. |
| **Backend REST API** | `http://localhost:4000/api` | API Express + SQLite (hỗ trợ cả `/api/*` và `/api/v1/*`). |
| **API Health Check** | `http://localhost:4000/api/health` | Kiểm tra trạng thái Backend API. |
| **API Danh mục thiết bị** | `http://localhost:4000/api/models` | Trả về danh sách thiết bị kèm trạng thái từng cá thể Serial theo thời gian thực. |

### 5.2. Các route chính trên Cổng `http://localhost:5174`
- **Phân hệ Nhân viên / Quản trị POS (`/staff/*`)**:
  - `/staff/dashboard` — Tổng quan Dashboard
  - `/staff/catalog` — Quản lý Mẫu máy
  - `/staff/inventory` — Kho cá thể Serial
  - `/staff/approval` — Duyệt đơn thuê
  - `/staff/checkout-wizard` — Bàn giao máy (Check-out)
  - `/staff/checkin-settlement` — Thu hồi & Hoàn cọc (Check-in)
  - `/staff/maintenance` — Phiếu bảo dưỡng & Shutter
  - `/staff/customers` — Quản lý Khách hàng *(tải dữ liệu thật từ `GET /api/users`)*
  - `/staff/reconcile` — Đối soát VNPAY / Thu tiền
  - `/staff/audit-logs` — Nhật ký Audit Logs
- **Đăng nhập phân quyền trên `5174`**:
  - Truy cập `http://localhost:5174/login` và đăng nhập tài khoản có quyền `ADMIN` hoặc `STAFF` sẽ tự động chuyển hướng vào `/staff/dashboard`.

### 5.3. Tài khoản Quản trị mặc định
- **Email:** `fuji@refuji.vn`
- **Mật khẩu:** `Test@1188` *(vẫn hỗ trợ đăng nhập bằng `test@123`)*
- **Tên hiển thị:** `Admin Fuji` — **Vai trò:** `ADMIN`

*(Bạn cũng có thể tạo tài khoản khách hàng mới ngay tại modal Đăng ký trên `:5173` hoặc trang `/register` trên `:5174`.)*

---

## 6. CÁC PHÂN HỆ & TÍNH NĂNG CHÍNH

1. **Giữ chỗ 15 phút & Gán Serial kho thực tế (`POST /api/orders`)**:
   - Kiểm tra ngày thuê hợp lệ (không chọn ngày quá khứ, tối thiểu 1 ngày, tối đa 30 ngày).
   - Tự động hủy các đơn `PENDING_PAYMENT` đã quá hạn 15 phút để trả máy về kho.
   - Kiểm tra số lượng khả dụng thực tế và gán mã `assigned_serials` độc quyền cho từng đơn (cả đặt lẻ và đặt cả giỏ hàng), tránh đặt trùng lịch.
2. **Thanh toán cọc & Theo dõi đơn chờ (`POST /api/orders/:orderCode/pay`)**:
   - Hỗ trợ 3 hình thức trong `PaymentModal` / `BookingModal` / `CartModal`: **Chuyển khoản VietQR** (tạo QR kèm số tiền và nội dung `REFUJI <MÃ ĐƠN>`), **Cổng VNPAY Sandbox**, và **Thanh toán tại quầy**.
   - Nếu đóng modal để thanh toán sau, widget nổi **`ReservationFloatingWidget`** ở góc dưới bên phải sẽ đếm ngược thời gian giữ chỗ 15 phút để mở lại thanh toán bất cứ lúc nào (hoặc mở lại từ tab *Đơn thuê* trong Hồ sơ tài khoản).
3. **Ràng buộc tồn kho ở Frontend & Tự động đồng bộ Catalog JSON ↔ SQLite**:
   - Khi thiết bị hết máy khả dụng, giao diện tự chuyển trạng thái *"Đã có khách giữ chỗ"*, ẩn/khóa nút đặt chỗ và chặn tăng số lượng giỏ hàng vượt quá số lượng kho.
   - Backend chạy `fs.watch` theo dõi `public/fujifilm-catalog.json`: mọi chỉnh sửa về máy hoặc số lượng serial trong file JSON sẽ tự động cập nhật vào SQLite ngay lập tức.
4. **Tài khoản, Định danh & Hạng thành viên**:
   - Chiết khấu tiền cọc theo hạng: **Đồng** (`0%`), **Bạc** (`5%`), **Vàng** (`10%`), **Bạch Kim** (`15%`).
   - Tự động xóa giỏ hàng khi đăng xuất, và ngăn modal đăng nhập bật lại khi reload nếu đã có phiên đăng nhập.

---

## 7. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

1. **Báo lỗi HTTP `503` — *"Máy chủ Backend (Port 4000) không phản hồi hoặc đang tắt"*:**
   - **Nguyên nhân:** Bạn chạy Frontend riêng (`vite` / `npm run dev:frontend`) mà chưa bật Backend API.
   - **Cách sửa:** Chạy `npm run dev` tại thư mục gốc để bật cả API và Web, hoặc chạy `npm run server` ở một terminal khác.
2. **Port `4000`, `5173` hoặc `5174` bị lỗi `EADDRINUSE` (đang có tiến trình chiếm cổng):**
   - **Cách sửa:** Giải phóng cổng đang kẹt:
     ```bash
     lsof -ti :4000 | xargs kill -9
     lsof -ti :5173 | xargs kill -9
     lsof -ti :5174 | xargs kill -9
     ```
3. **Muốn reset toàn bộ dữ liệu đơn hàng / tài khoản về trạng thái seed ban đầu:**
   - **Cách sửa:** Tắt server, xóa file `refuji-system/apps/api/data/refuji.sqlite` (và các file `.sqlite-wal`, `.sqlite-shm` nếu có), sau đó chạy lại `npm run dev` để hệ thống tự khởi tạo và seed lại từ đầu.
