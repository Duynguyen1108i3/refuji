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

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
refuji/
├── src/                          # [CHÍNH] Source code Frontend Website khách hàng
│   ├── components/               # Các UI Components (Hero, LiquidNavbar, AvailabilityExplorer,...)
│   ├── services/api.ts           # Tầng kết nối gọi Backend API (/api/models)
│   ├── types.ts                  # Định nghĩa TypeScript interface
│   ├── App.tsx                   # Component gốc điều phối toàn bộ luồng trang
│   ├── index.css                 # CSS toàn cục & hiệu ứng Liquid Glass
│   └── main.tsx                  # Điểm khởi chạy React
├── public/                       # Static assets (ảnh Fujifilm, catalog, logo)
├── docs/                         # Tài liệu đặc tả hệ thống SRS v1.0 & v1.1
├── README.md                     # Bản đặc tả kỹ thuật & nghiệp vụ SRS 13 bảng
├── package.json                  # Cấu hình dependencies Frontend
├── vite.config.ts                # Cấu hình Vite & Proxy tự động sang Backend (:4000)
│
└── refuji-system/                # [HỆ THỐNG BACKEND & ADMIN MONOREPO]
    ├── apps/
    │   ├── api/                  # Express REST API Server
    │   │   ├── prisma/           # Schema database & file seed 139 thiết bị thực tế
    │   │   └── src/index.ts      # Khởi chạy API server port 4000
    │   └── web/                  # Giao diện POS / Quản trị nội bộ dành cho nhân viên cửa hàng
    ├── packages/
    │   └── shared/               # Thư viện dùng chung (Types, Zod Schemas, Enums)
    └── .env                      # File cấu hình biến môi trường toàn hệ thống
```

---

## 3. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Trước khi chạy, máy tính cần cài đặt:
1. **Node.js**: Phiên bản 20 LTS trở lên (`node -v`).
2. **NPM**: Phiên bản 10 trở lên (`npm -v`).
3. **MySQL**: MySQL 8.0+ hoặc XAMPP MySQL đang chạy tại cổng `3306`.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY TOÀN BỘ HỆ THỐNG

Quy trình khởi chạy hệ thống gồm 3 bước tuần tự:

### Bước 1: Khởi động Cơ sở dữ liệu MySQL
- Khởi động MySQL server trên cổng `3306`.
- Đảm bảo database `refuji_db` đã được tạo và cấp quyền:
  - **User:** `refuji_user`
  - **Password:** `RefujiPass@2026`
  - **Database:** `refuji_db`
- *(Nếu chưa nạp dữ liệu)*: Chạy lệnh seed trong thư mục `refuji-system/apps/api`:
  ```bash
  cd refuji-system/apps/api
  npx prisma db push
  npm run prisma:seed
  ```

### Bước 2: Khởi động Backend API Server (Port 4000)
Mở Terminal thứ nhất:
```bash
cd refuji-system/apps/api
npm install
npx tsx src/index.ts
```
> Khi màn hình hiện `🚀 REFUJI API Server running at http://localhost:4000` là thành công.

### Bước 3: Khởi động Website Frontend Khách hàng (Port 5173)
Mở Terminal thứ hai tại thư mục gốc của dự án:
```bash
cd /Users/tx/Documents/refuji
npm install
npm run dev
```
> Website sẵn sàng tại: **`http://localhost:5173`** (Vite tự động chuyển tiếp request `/api/*` về cổng `4000`).

---

## 5. THÔNG TIN CỔNG DỊCH VỤ & TÀI KHOẢN TRUY CẬP

| Dịch vụ | Địa chỉ URL | Chức năng |
|---|---|---|
| **Website Khách hàng** | `http://localhost:5173/` | Trang chủ, tra cứu lịch khả dụng, chọn máy, giỏ hàng thuê |
| **Backend REST API** | `http://localhost:4000/api` | Cung cấp dữ liệu 139 sản phẩm, kiểm tra sức khỏe hệ thống |
| **API Health Check** | `http://localhost:4000/api/health` | Kiểm tra kết nối Backend & MySQL |
| **API Danh mục** | `http://localhost:4000/api/models` | Lấy danh sách 139 dòng máy kèm serial kho vật lý |
| **MySQL Server** | `localhost:3306` | Lưu trữ 13 bảng CSDL chuẩn 3NF |

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
