# REFUJI — HƯỚNG DẪN CÀI ĐẶT, KHỞI CHẠY & SỬ DỤNG HỆ THỐNG

> **Dự án:** Hệ thống Quản lý & Cho thuê Máy ảnh, Ống kính Fujifilm chuyên nghiệp  
> **Tác giả:** Nguyễn Thành Duy + Nguyễn Ngọc Minh Châu — Khoa Công nghệ Thông tin, Đại học Công nghệ Sài Gòn (STU)  
> **Cập nhật:** Tháng 11/2026

---

## MỤC LỤC
1. [Ngôn ngữ lập trình & Công nghệ (Tech Stack)](#1-ngôn-ngữ-lập-trình--công-nghệ-tech-stack)
2. [Cấu trúc thư mục dự án](#2-cấu-trúc-thư-mục-dự-án)
3. [Yêu cầu môi trường (Prerequisites)](#3-yêu-cầu-môi-trường-prerequisites)
4. [Hướng dẫn cài đặt & Khởi chạy toàn bộ hệ thống](#4-hướng-dẫn-cài-đặt--khởi-chạy-toàn-bộ-hệ-thống)
5. [Thông tin cổng dịch vụ & Tài khoản truy cập](#5-thông-tin-cổng-dịch-vụ--tài-khoản-truy-cập)
6. [Hướng dẫn sử dụng các phân hệ chức năng](#6-hướng-dẫn-sử-dụng-các-phân-hệ-chức-năng)
7. [Xử lý sự cố thường gặp (Troubleshooting)](#7-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. NGÔN NGỮ LẬP TRÌNH & CÔNG NGHỆ (TECH STACK)

### 1.1. Ngôn ngữ chính
- **TypeScript 5.6+**: Ngôn ngữ lập trình chủ đạo xuyên suốt từ Frontend tới Backend, đảm bảo kiểu dữ liệu tĩnh nghiêm ngặt (`strict: true`), chống lỗi runtime.
- **SQL (MySQL Dialect)**: Thiết kế chuẩn hóa 13 bảng 3NF.

### 1.2. Frontend (Khách hàng & Landing Page)
- **Framework:** React 18.3 (Hooks, Functional Components, Context API).
- **Build Tool:** Vite 5.4 (HMR cực nhanh, ESBuild).
- **Styling:** Tailwind CSS 3.4, PostCSS, Autoprefixer, phong cách thiết kế tối giản *Đen than Magie Fujifilm* kết hợp hiệu ứng *Liquid Glass*.
- **Motion & Hiệu ứng:** Framer Motion 14 (Spring Physics chuẩn Apple iOS/macOS, chuyển cảnh mượt mà).
- **Icons:** Lucide React.
- **Validation & Form:** Zod 4, TypeScript Types.

### 1.3. Backend & Cơ sở dữ liệu (API System)
- **Runtime:** Node.js (v20+ LTS).
- **Web Framework:** Express 4.21.
- **ORM:** Prisma ORM 6.0 (Quản lý schema, migrations, type-safe queries).
- **Database:** MySQL 8.4 LTS (chạy trên port `3306`, hỗ trợ utf8mb4_unicode_ci).
- **Bảo mật:**
  - JWT (JSON Web Token) phân tách Access Token (15 phút) & Refresh Token (7 ngày).
  - Mã hóa AES-256-GCM bảo vệ Căn cước công dân (CCCD) theo Luật Bảo vệ Dữ liệu Cá nhân 2025.
  - Băm HMAC-SHA256 chống trùng lặp dữ liệu định danh KYC.
- **Tích hợp thanh toán:** VNPAY Sandbox (Tách riêng Return URL & IPN Webhook).

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (ĐÃ TÁCH MODULE CHUẨN HOÁ)

```text
refuji/
├── src/                                  # [CHÍNH] Source code Frontend Website khách hàng
│   ├── components/                       # Các UI Components giao diện
│   │   ├── account/                      # [ĐÃ TÁCH] Phân hệ Tài khoản & Hội viên
│   │   │   ├── types.ts                  # Interface, Types và Variants chuyển cảnh
│   │   │   ├── MembershipTiersTab.tsx    # Tab hạng thành viên & mã ưu đãi cọc
│   │   │   ├── RentalOrdersTab.tsx       # Tab lịch sử đơn thuê & tiến độ
│   │   │   ├── UserProfileTab.tsx        # Tab hồ sơ cá nhân & định danh
│   │   │   ├── ChangePasswordForm.tsx    # Form đổi mật khẩu bảo mật
│   │   │   └── ChangeCccdForm.tsx        # Form cập nhật CCCD chuẩn 2025
│   │   ├── AccountModal.tsx              # Component điều phối modal tài khoản gọn gàng
│   │   ├── AvailabilityExplorer.tsx      # Bộ lọc & ma trận lịch 7 ngày
│   │   ├── BookingModal.tsx              # Modal chi tiết thuê máy & combo gợi ý
│   │   ├── CartModal.tsx                 # Giỏ hàng thuê thiết bị Liquid Glass
│   │   ├── Hero.tsx                      # Màn hình mở đầu 100vh tối giản
│   │   └── LiquidNavbar.tsx              # Thanh điều hướng nổi đa trạng thái
│   ├── hooks/                            # [ĐÃ TÁCH] Custom Hooks tái sử dụng logic
│   │   └── useCart.ts                    # Hook quản lý giỏ hàng & lưu trữ localStorage
│   ├── services/api.ts                   # Tầng kết nối gọi Backend API (/api/models)
│   ├── types.ts                          # Định nghĩa TypeScript domain interface
│   ├── App.tsx                           # Component gốc điều phối toàn bộ trang
│   ├── index.css                         # CSS toàn cục & hiệu ứng Liquid Glass
│   └── main.tsx                          # Điểm khởi chạy React
├── public/                               # Static assets (ảnh Fujifilm, catalog, logo)
├── docs/                                 # Tài liệu đặc tả hệ thống SRS và CSDL
├── README.md                             # Hướng dẫn kiến trúc, cài đặt & sử dụng
├── package.json                          # Cấu hình dependencies Frontend
├── vite.config.ts                        # Cấu hình Vite & Proxy tự động sang Backend (:4000)
│
└── refuji-system/                        # [HỆ THỐNG BACKEND & ADMIN MONOREPO]
    ├── apps/
    │   ├── api/                          # Express REST API Server (3-Tier Layered)
    │   │   ├── prisma/                   # Schema database MySQL & file seed 139 thiết bị
    │   │   ├── data/                     # Thư mục lưu trữ SQLite tự động (refuji.sqlite)
    │   │   └── src/
    │   │       ├── modules/              # [ĐÃ TÁCH] Các Router phân hệ nghiệp vụ
    │   │       │   ├── auth/             # Xác thực JWT, User Profile, KYC CCCD
    │   │       │   ├── catalog/          # Danh mục 139 dòng máy Fujifilm & Serial
    │   │       │   └── orders/           # Tạo đơn giữ chỗ 15 phút & quản lý đơn
    │   │       ├── db.ts                 # Khởi tạo SQLite engine tự động & Seed
    │   │       └── index.ts              # Server bootstrap sạch gọn
    │   └── web/                          # Giao diện POS / Quản trị nội bộ dành cho nhân viên (Port 5174)
    ├── packages/
    │   └── shared/                       # Thư viện dùng chung (Types, Zod Schemas, Enums)
    └── .env                              # File cấu hình biến môi trường toàn hệ thống
```

---

## 3. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Trước khi chạy, máy tính cần cài đặt:
1. **Node.js**: Phiên bản 20 LTS trở lên (`node -v`).
2. **NPM**: Phiên bản 10 trở lên (`npm -v`).
3. **Cơ sở dữ liệu**:
   - Hệ thống đã tích hợp sẵn **SQLite tự động** (`better-sqlite3`), có thể khởi chạy ngay mà không cần cài đặt thêm phần mềm cơ sở dữ liệu bên ngoài.
   - *(Tùy chọn nâng cao)*: Hỗ trợ kết nối MySQL 8.0+ / XAMPP qua Prisma ORM khi cấu hình file `.env`.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY TOÀN BỘ HỆ THỐNG

Quy trình khởi chạy đồng thời cả 3 dịch vụ trên Localhost:

### Bước 1: Khởi động Backend API Server (Port 4000)
Mở Terminal thứ nhất:
```bash
cd refuji-system/apps/api
npm install
npx tsx watch src/index.ts
```
> Khi màn hình hiện `🚀 REFUJI API Server running at http://localhost:4000` là thành công. Hệ thống tự động seed 139 dòng máy và 140 serial vật lý vào database.

### Bước 2: Khởi động Website Khách hàng (Port 5173)
Mở Terminal thứ hai tại thư mục gốc của dự án:
```bash
cd /Users/tx/Documents/refuji
npm install
npm run dev
```
> Website sẵn sàng tại: **`http://localhost:5173`** (Vite tự động proxy request `/api/*` về cổng `4000`).

### Bước 3: Khởi động Cổng Quản trị POS Nhân viên (Port 5174)
Mở Terminal thứ ba:
```bash
cd refuji-system/apps/web
npm install
npx vite
```
> Cổng POS nội bộ sẵn sàng tại: **`http://localhost:5174`**.

---

## 5. THÔNG TIN CỔNG DỊCH VỤ & TÀI KHOẢN TRUY CẬP

| Dịch vụ | Địa chỉ URL | Chức năng | Trạng thái |
|---|---|---|:---:|
| **Website Khách hàng** | `http://localhost:5173/` | Trang chủ, tra cứu lịch khả dụng, giỏ hàng, đặt giữ chỗ 15 phút | 🟢 Hoạt động |
| **Cổng Quản trị & POS** | `http://localhost:5174/` | Bàn giao thiết bị, kiểm định ngoại hình, duyệt đơn, xuất kho | 🟢 Hoạt động |
| **Backend REST API** | `http://localhost:4000/api` | REST API (Auth, Models, Orders, Users, Health) | 🟢 Hoạt động |
| **API Health Check** | `http://localhost:4000/api/health` | Kiểm tra trạng thái máy chủ Backend | 🟢 Hoạt động |
| **API Danh mục** | `http://localhost:4000/api/models` | Trả về 139 dòng máy kèm danh sách cá thể serial | 🟢 Hoạt động |

### Tài khoản mẫu thử nghiệm hệ thống:
- **Tài khoản Khách hàng / Quản trị viên:**
  - **Email:** `fuji@refuji.vn`
  - **Mật khẩu:** `test@123`
  - **Tên hiển thị:** `Admin Fuji`

---

## 6. HƯỚNG DẪN SỬ DỤNG CÁC PHÂN HỆ CHỨC NĂNG

### 6.1. Dành cho Khách hàng thuê (Client Portal)
1. **Trang chủ Hero 100vh**:
   - Giao diện mở đầu phong cách tối giản hoàn toàn không có thanh navbar chắn tầm nhìn.
   - Bấm **"Cuộn xuống để khám phá"** hoặc cuộn chuột xuống để thanh điều hướng xuất hiện.
2. **Tra cứu lịch khả dụng thời gian thực (Availability Explorer)**:
   - Chọn bộ lọc: Hệ ngàm (`X-Mount` hoặc `G-Mount Medium Format`), dòng máy (`X100`, `X-T`, `X-H`, `GFX`).
   - Bấm vào khung ngày để chọn ngày nhận máy và ngày trả máy. Ma trận lịch 7 ngày sẽ tự tính số lượng máy còn trống trong tủ kho.
3. **Xem chi tiết & Bộ sưu tập ảnh sắc nét**:
   - Bấm vào bất kỳ máy ảnh nào để mở modal thông số kỹ thuật, giá thuê/ngày, mức cọc chuẩn.
   - Bấm vào ảnh máy để bật chế độ xem ảnh toàn màn hình với các góc chụp thực tế.
4. **Giỏ hàng thuê thiết bị & Đặt giữ chỗ**:
   - Bấm **"Thêm vào giỏ hàng"** để tích lũy thiết bị cho chuyến đi.
   - Mở biểu tượng **Giỏ hàng** góc trên bên phải để xem tổng tiền thuê, tiền cọc và bấm đặt chỗ. Hệ thống tự động giữ chỗ 15 phút.
5. **Hạng thành viên & Chiết khấu cọc**:
   - Bấm nút **"Tài khoản"** góc trên bên phải để chuyển đổi thử nghiệm các hạng thành viên:
     - **Hạng Đồng (Đồng)**: Cọc 100% chuẩn.
     - **Hạng Bạc (Silver)**: Giảm 5% tiền cọc.
     - **Hạng Vàng (Gold)**: Giảm 10% tiền cọc.
     - **Hạng Bạch Kim (Platinum)**: Giảm 15% tiền cọc.

---

## 7. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

1. **Website báo lỗi kết nối API khi tải danh mục máy:**
   - **Nguyên nhân:** Backend API port 4000 chưa được bật hoặc MySQL chưa mở.
   - **Cách sửa:** Khởi động lại `mysqld` và chạy lệnh `cd refuji-system/apps/api && npx tsx src/index.ts`.
2. **Port 5173 hoặc 4000 bị báo `EADDRINUSE` (trùng cổng):**
   - **Cách sửa:** Chạy lệnh giải phóng cổng:
     ```bash
     lsof -ti :5173 | xargs kill -9
     lsof -ti :4000 | xargs kill -9
     ```
3. **Lỗi `Access denied for user 'refuji_user'@'localhost'`:**
   - **Cách sửa:** Kiểm tra file `.env` và xác thực mật khẩu MySQL đã khớp với thông tin tài khoản được cấp quyền trong database.
