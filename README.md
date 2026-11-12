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
│   │   ├── AvailabilityExplorer.tsx      # Bộ lọc ngày thuê, kiểm tra thiết bị khả dụng & nút Tra cứu đơn
│   │   ├── BookingModal.tsx              # Đặt thuê nhanh 3 bước (hỗ trợ Thành viên & Vãng lai) + live availability
│   │   ├── CalendarModal.tsx             # Bộ chọn ngày thuê động
│   │   ├── CartModal.tsx                 # Giỏ hàng 3 bước, snapshot đơn & thanh toán cọc
│   │   ├── PaymentModal.tsx              # Cổng thanh toán VietQR / VNPAY / Tại quầy & nút tự hủy giữ chỗ
│   │   ├── ReservationFloatingWidget.tsx # Widget đếm ngược 15 phút "Đơn chờ thanh toán"
│   │   ├── booking/                      # Thành phần đặt lịch nhanh Khách vãng lai 3 bước
│   │   │   ├── GuestCustomerStep.tsx     # Bước 2: Nhập thông tin liên hệ (không OTP) hoặc Đăng nhập nhận ưu đãi
│   │   │   └── GuestOrderLookupPanel.tsx # Tra cứu đơn vãng lai (Mã đơn + SĐT), thanh toán tiếp & tự hủy
│   │   ├── Hero.tsx
│   │   └── LiquidNavbar.tsx              # Thanh điều hướng + nút "Tra cứu đơn" cho Khách vãng lai
│   ├── context/AuthContext.tsx           # Quản lý phiên đăng nhập, pending intent & toast
│   ├── hooks/useCart.ts                  # Quản lý giỏ hàng bền vững cho Guest, tự xóa khi Member logout
│   ├── schemas/
│   │   ├── auth.schema.ts                # Schema Zod kiểm tra form Auth
│   │   └── guest.schema.ts               # Schema Zod v4 kiểm tra thông tin Khách vãng lai & Tra cứu đơn
│   ├── services/
│   │   ├── api.ts                        # Gọi /api/models?start_date=&end_date= & /:id/availability
│   │   └── authApi.ts                    # Gọi /api/auth/*, /api/orders/*, guest-lookup, guest-cancel & localStorage vãng lai
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── fujifilm-catalog.json             # Dữ liệu gốc 139 mẫu thiết bị & serial (được watch tự động)
│   └── assets/                           # Logo, favicon, ảnh thiết bị Fujifilm
├── docs/                                 # Đặc tả hệ thống SRS v1.0, v1.1 (đã cập nhật luồng Khách vãng lai) & mockups Figma
├── Bao_Cao_Tien_Do_ReFuji.docx           # Báo cáo tiến trình & lộ trình phát triển dự án
├── package.json                          # Script `npm run dev` (API+WEB) & `npm run dev:all` (API+WEB+POS)
├── vite.config.ts                        # Vite Port 5173 + Proxy `/api` sang `:4000` (bắt lỗi 503)
├── README.md
│
└── refuji-system/                        # Monorepo Backend API & Cổng Quản trị POS / Web
    ├── apps/
    │   ├── api/                          # [PORT 4000] Express REST API + SQLite
    │   │   ├── data/refuji.sqlite        # Database SQLite tự tạo khi khởi chạy (migration user_id NULL cho Guest)
    │   │   ├── prisma/                   # Prisma schema MySQL & script seed
    │   │   └── src/
    │   │       ├── modules/
    │   │       │   ├── auth/auth.routes.ts     # /api/auth/* (Rate Limit login/register), /api/users, /api/users/me
    │   │       │   ├── catalog/catalog.routes.ts # /api/models?start_date=&end_date= & /:id/availability
    │   │       │   └── orders/
    │   │       │       ├── availability.helper.ts # Thuật toán Date-Range Overlap, giải phóng hold 15p & tính giá server
    │   │       │       └── orders.routes.ts       # Dual Member/Guest, guest-lookup, guest-cancel & /api/admin/orders POS
    │   │       ├── db.ts                 # Khởi tạo SQLite, migration Guest & fs.watch đồng bộ fujifilm-catalog.json
    │   │       └── index.ts              # Khởi động Express Server tại cổng 4000 (+ mount /api/admin/orders)
    │   └── web/                          # [PORT 5174] Cổng Quản trị POS Nhân viên & App Đa trang
    │       ├── src/
    │       │   ├── layouts/              # ClientLayout (Dark) & StaffPosLayout
    │       │   ├── pages/admin-staff/    # Dashboard, Kho Serial, Duyệt đơn (OrderApprovalPage POS), Check-out (KYC Alert)...
    │       │   ├── pages/auth/           # LoginPage, RegisterPage, ForgotPasswordPage
    │       │   ├── pages/client/         # Catalog, Checkout, Orders, Profile KYC, Membership...
    │       │   └── routes/AppRoutes.tsx  # Điều phối route `/` và `/staff/*`
    │       └── vite.config.ts            # Vite Port 5174 + Proxy `/api` sang `:4000`
    └── packages/shared/                  # Types, Enums (`GUEST_INQUIRY`), Validators dùng chung
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
*(Nếu chạy riêng trong từng app con và thiếu gói cục bộ, có thể chạy thêm `npm install` trong `refuji-system/apps/api` và `refuji-system/apps/web`.)*

---

### 4.2. Cách 1 — Khởi chạy nhanh Website Khách hàng + Backend API + Admin POS
Tại thư mục gốc `refuji/`, chạy **1 lệnh duy nhất**:
```bash
npm run dev:all              # Bật đồng thời cả 3 dịch vụ: API (:4000) + Web Client (:5173) + Admin POS (:5174)
# hoặc nếu chỉ chạy Website Khách hàng + Backend API:
npm run dev
```
Lệnh sử dụng `concurrently` để bật song song:
- **Backend API Server**: `http://localhost:4000` (`npm run server`)
- **Website Khách hàng**: `http://localhost:5173` (`vite`)
- **Cổng Quản trị POS Nhân viên** *(khi dùng `dev:all`)*: `http://localhost:5174` (`cd refuji-system && npm run dev`)

---

### 4.3. Cách 2 — Chạy riêng từng Server (3 Terminal độc lập)

#### Terminal 1: Chạy riêng Backend API Server (Port 4000)
Từ thư mục gốc:
```bash
npm run server
```
Hoặc chạy trực tiếp trong thư mục `refuji-system/apps/api`:
```bash
cd refuji-system/apps/api
npm run dev                  # Chế độ watch tự reload khi sửa code (tsx watch src/index.ts)
# hoặc:
npx tsx src/index.ts         # Chạy một lần không watch
```

#### Terminal 2: Chạy riêng Website Khách hàng chính (Port 5173)
Từ thư mục gốc:
```bash
npm run dev:frontend
```

#### Terminal 3: Chạy Cổng Quản trị POS Nhân viên & App Đa trang (Port 5174)
Từ thư mục `refuji-system/`:
```bash
cd refuji-system
npm run dev                  # Chạy workspace @refuji/web (Port 5174)
```
Hoặc chạy trực tiếp trong `refuji-system/apps/web`:
```bash
cd refuji-system/apps/web
npm run dev                  # hoặc: npx vite
```

---

### 4.4. Build & Preview bản Production
- **Website Khách hàng chính (thư mục gốc):**
  ```bash
  npm run build              # Kiểm tra TypeScript (tsc) & build Vite ra dist/
  npm run preview            # Xem thử bản build production
  ```
- **Monorepo Backend & POS Web (`refuji-system/`):**
  ```bash
  cd refuji-system
  npm run build              # Build toàn bộ workspaces (shared, api, web)

  # Hoặc build từng phần:
  cd refuji-system/apps/api && npm run build
  cd refuji-system/apps/web && npm run build && npm run preview
  ```

---

### 4.5. Chạy kèm Docker (MySQL 8.4 + Mailpit) & Prisma *(Tùy chọn)*
Mặc định hệ thống dùng **SQLite** nên không cần Docker. Khi cần chạy với **MySQL 8.4** và **Mailpit** (test email):
```bash
cd refuji-system
docker compose up -d         # Bật MySQL (:3306) và Mailpit (:8025 Web UI / :1025 SMTP)
```
Khởi tạo schema & dữ liệu mẫu với Prisma (trong `refuji-system/apps/api`):
```bash
cd refuji-system/apps/api
npm run prisma:generate      # Sinh Prisma Client
npm run prisma:migrate       # Chạy migration tạo bảng trên MySQL
npm run prisma:seed          # Nạp dữ liệu mẫu ban đầu
```
Dựng toàn bộ stack production bằng Docker:
```bash
cd refuji-system
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 5. THÔNG TIN CÁC CỔNG LOCALHOST, ROUTES & TÀI KHOẢN TRUY CẬP

### 5.1. Tổng quan các cổng Localhost

| Dịch vụ | Địa chỉ URL | Chức năng chính |
|---|---|---|
| **Website Khách hàng chính** | `http://localhost:5173/` | Giao diện Light mode *Liquid Glass*: duyệt thiết bị, lọc tồn kho theo khoảng ngày, giỏ hàng bền vững, **đặt thuê nhanh Khách vãng lai 3 bước (không cần OTP)**, thanh toán VietQR / VNPAY / Yêu cầu tại quầy, tra cứu đơn & tự hủy. |
| **Cổng Quản trị POS & Web đa trang** | `http://localhost:5174/` | Giao diện Dark mode (`refuji-system/apps/web`): gồm các trang khách hàng đa route (`/catalog`, `/checkout`, `/orders`, `/profile`, `/login`, `/register`) và **phân hệ POS Nhân viên (`/staff/*`)**. |
| **Backend REST API** | `http://localhost:4000/api` | API Express + SQLite (hỗ trợ cả `/api/*` và `/api/v1/*`). |
| **API Health Check** | `http://localhost:4000/api/health` | Kiểm tra trạng thái Backend API. |
| **API Danh mục thiết bị** | `http://localhost:4000/api/models` | Trả về danh sách thiết bị kèm trạng thái từng cá thể Serial theo thời gian thực. |
| **Mailpit (khi bật Docker)** | `http://localhost:8025/` | Giao diện xem email test cục bộ (SMTP chạy tại cổng `1025`). |

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

1. **Đặt thuê nhanh Khách vãng lai 3 bước (không cần OTP SMS/Gmail)**:
   - Khách vãng lai có thể duyệt thiết bị, lưu giỏ hàng qua reload (F5) và điền thông tin ở **Bước 2** (`GuestCustomerStep`: Họ tên, SĐT 10 số, Email, Ghi chú, Privacy Consent 2025) mà **không cần tạo tài khoản hay xác minh OTP** — hoặc bấm **"Đăng nhập thành viên"** để hưởng giảm cọc 5–15%.
   - **2 chế độ xử lý rõ ràng:**
     - **Thanh toán Online (VietQR / VNPAY):** Khóa Serial 15 phút (`PENDING_PAYMENT`), chống spam tối đa 2 giữ chỗ mỗi SĐT/IP, thanh toán xong tự động `CONFIRMED` (đóng đủ 100% cọc chuẩn, giảm `0%`, không tích lũy hạng).
     - **Yêu cầu giữ tại quầy (`GUEST_INQUIRY`):** Không khóa Serial kho để tránh đầu cơ giữ chỗ ảo; chờ Admin/Staff duyệt trên POS (`CONFIRMED` mới gán Serial) hoặc khách tự chuyển sang trả Online nếu máy còn trống.
   - *(Ghi chú mở rộng: Schema CSDL đã lưu sẵn `guest_phone` và `guest_email` để cắm thêm module gửi thông báo SMS/Email/OTP trong các giai đoạn phát triển tiếp theo).*
2. **Kiểm tra khả dụng theo giao thoa khoảng ngày (`Date-Range Overlap`) & Gán Serial thực tế (`POST /api/orders`)**:
   - Lọc tồn kho chính xác theo `[start_date, end_date]` qua `GET /api/models?start_date=&end_date=` và `GET /api/models/:id/availability`: cho phép đặt khác tuần trên cùng 1 máy nhưng chặn ngay `409 Conflict` nếu trùng lịch.
   - Tự động loại bỏ `GUEST_INQUIRY` khỏi tập khóa kho và hủy các đơn `PENDING_PAYMENT` quá hạn 15 phút.
3. **Tra cứu đơn công khai, Tự hủy giữ chỗ & Admin POS thực tế**:
   - Nút **"Tra cứu đơn"** trên Navbar & AvailabilityExplorer mở `GuestOrderLookupModal`: yêu cầu khớp đồng thời **Mã đơn + SĐT** (`GET /api/orders/guest-lookup`), cho phép thanh toán tiếp đơn chờ 15p hoặc tự hủy (`POST /api/orders/:orderCode/guest-cancel`) để giải phóng Serial ngay.
   - Cổng Admin POS (`:5174`) tại `/staff/approval` và `/staff/checkout-wizard` kết nối trực tiếp API thật `/api/admin/orders` *(đăng nhập bằng `fuji@refuji.vn`)*, hiển thị badge phân biệt Thành viên vs **Khách vãng lai** và **Banner cảnh báo kiểm tra KYC gắt hơn** khi bàn giao tại quầy.
4. **Ràng buộc tồn kho ở Frontend & Tự động đồng bộ Catalog JSON ↔ SQLite**:
   - Khi thiết bị hết máy khả dụng trong khoảng ngày đã chọn, giao diện tự chuyển trạng thái *"Đã có khách giữ chỗ"*, khóa nút đặt và chặn tăng số lượng giỏ hàng vượt tồn kho.
   - Backend chạy `fs.watch` theo dõi `public/fujifilm-catalog.json` để đồng bộ trực tiếp vào SQLite.
5. **Tài khoản, Định danh & Hạng thành viên**:
   - Chiết khấu tiền cọc theo hạng: **Đồng** (`0%`), **Bạc** (`5%`), **Vàng** (`10%`), **Bạch Kim** (`15%`) — chỉ áp dụng cho Thành viên đăng nhập.
   - Bảo mật endpoint `/api/orders/my-orders` (`401` nếu chưa xác thực) và tự động xóa giỏ hàng khi thành viên đăng xuất.

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
