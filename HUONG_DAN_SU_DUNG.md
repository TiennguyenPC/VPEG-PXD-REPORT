# Hướng dẫn sử dụng Dashboard VPEG-PXD

> **Phiên bản tài liệu:** 1.0  
> **Đối tượng:** Nhân viên mới, PM, SM, GS, SA, TK, P.SC và Admin  
> **Mục đích:** Training từ A–Z — đọc xong có thể tự thao tác trên hệ thống

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Truy cập & đăng nhập](#2-truy-cập--đăng-nhập)
3. [Giao diện chung](#3-giao-diện-chung)
4. [Phân quyền theo vai trò](#4-phân-quyền-theo-vai-trò)
5. [Trang Tổng quan](#5-trang-tổng-quan)
6. [Danh sách dự án](#6-danh-sách-dự-án)
7. [Chi tiết dự án](#7-chi-tiết-dự-án)
8. [Quản lý công việc (Task)](#8-quản-lý-công-việc-task)
9. [Tài khoản cá nhân](#9-tài-khoản-cá-nhân)
10. [Cài đặt hệ thống (Admin)](#10-cài-đặt-hệ-thống-admin)
11. [Chia sẻ tiến độ cho khách hàng](#11-chia-sẻ-tiến-độ-cho-khách-hàng)
12. [Trợ lý AI (AI PXD)](#12-trợ-lý-ai-ai-pxd)
13. [Thông báo](#13-thông-báo)
14. [Mẹo vận hành & xử lý sự cố](#14-mẹo-vận-hành--xử-lý-sự-cố)
15. [Kịch bản training đề xuất](#15-kịch-bản-training-đề-xuất)

---

## 1. Giới thiệu

### 1.1. Phần mềm là gì?

**Dashboard VPEG-PXD** là nền tảng quản lý dự án điện mặt trời EPC của **Vu Phong Energy Group**. Phần mềm giúp:

- Theo dõi **toàn bộ danh mục dự án** (công suất, tiến độ, COD, rủi ro, vướng mắc).
- Quản lý **công việc (task)** theo dự án hoặc văn phòng.
- Ghi **nhật ký hiện trường** (ngày / tuần / tháng), ảnh site, nhân lực, sự cố.
- Theo dõi **6 hạng mục EPC**: Risk, Giấy phép, Thiết kế, Mua sắm, Thi công, Bàn giao.
- Xem **S-Curve**, milestone, KPI tuần.
- **Chia sẻ read-only** cho khách hàng qua link công khai.
- Quản trị **tài khoản, phân quyền, nhật ký hoạt động** (Admin).

### 1.2. Dữ liệu lưu ở đâu?

Dữ liệu được đồng bộ qua **Google Apps Script (GAS)** — backend kết nối Google Sheets / Drive. Trình duyệt có **cache cục bộ** để tải nhanh; khi mất mạng tạm thời vẫn xem được dữ liệu đã cache, nhưng **lưu mới cần có kết nối**.

### 1.3. Địa chỉ truy cập

| Môi trường | URL |
|------------|-----|
| Production | `https://vpeg-pxd-dashboard.vercel.app` |
| Local (dev) | `http://localhost:5173` (khi chạy `npm run dev`) |

---

## 2. Truy cập & đăng nhập

### 2.1. Đăng nhập lần đầu

1. Mở trình duyệt **Chrome** hoặc **Edge** (khuyến nghị).
2. Truy cập URL production ở trên.
3. Nhập **Tên đăng nhập** và **Mật khẩu** do Admin cấp.
4. Nhấn **Đăng nhập**.

> **Lưu ý:** Mật khẩu mặc định khi Admin tạo tài khoản mới thường là `123123`. **Bắt buộc đổi mật khẩu** ngay sau lần đăng nhập đầu (xem [mục 9](#9-tài-khoản-cá-nhân)).

### 2.2. Lỗi đăng nhập thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| "Đăng nhập thất bại" | Sai user/pass | Kiểm tra lại; liên hệ Admin reset |
| Không vào được | Tài khoản bị khóa | Admin vào **Cài đặt → Tài khoản → Mở khóa** |
| Trang trắng / lỗi tải | Cache cũ | `Ctrl + F5` hoặc xóa cache trình duyệt |

### 2.3. Đăng xuất

Ở **thanh sidebar dưới cùng**, nhấn biểu tượng **Đăng xuất** (mũi tên ra). Luôn đăng xuất khi dùng máy chung.

---

## 3. Giao diện chung

### 3.1. Thanh điều hướng bên trái (Sidebar)

| Menu | Đường dẫn | Mô tả |
|------|-----------|-------|
| **TỔNG QUAN** | `/` | Dashboard tổng hợp KPI, risk, task |
| **CÔNG VIỆC** | `/tasks` | Quản lý task toàn công ty |
| **DỰ ÁN** | `/projects` | Bảng danh sách dự án |
| **TÀI KHOẢN** | `/account` | Thông tin cá nhân, đổi mật khẩu |
| **CÀI ĐẶT** | `/settings/users` | Chỉ **Admin** thấy menu này |

**Thu gọn sidebar:** Nút **Thu gọn** / biểu tượng mũi tên ở cuối sidebar — tiết kiệm không gian màn hình.

**Logo VUPHONG:** Nhấn để quay về **Tổng quan**.

### 3.2. Chế độ giao diện (Sáng / Tối / Hệ thống)

Ở cuối sidebar, biểu tượng **Mặt trời / Mặt trăng / Màn hình**:

- **Sáng** — nền sáng, dễ đọc ban ngày.
- **Tối** — nền tối, mặc định dashboard.
- **Hệ thống** — theo cài đặt Windows/macOS.

### 3.3. Ngôn ngữ (trang chia sẻ khách)

Trang nội bộ chủ yếu dùng **Tiếng Việt**. Trang **link chia sẻ khách** (`/share/...`) hỗ trợ chuyển **VI / EN** qua nút ngôn ngữ góc trên.

### 3.4. Trạng thái tải dữ liệu

Khi mở trang lần đầu hoặc đồng bộ, có thể thấy:

- *"Đang đồng bộ dữ liệu..."* — danh sách dự án.
- *"Đang tải giao diện..."* — chuyển trang.
- *"Đang tải chi tiết dự án..."* — trang chi tiết.

Đợi vài giây; nếu quá 30 giây, thử **F5** hoặc kiểm tra mạng.

---

## 4. Phân quyền theo vai trò

### 4.1. Các vai trò (Role)

| Role | Tên hiển thị | Mô tả ngắn |
|------|--------------|------------|
| `admin` | Admin | Toàn quyền hệ thống |
| `pm` | PM | Project Manager — quản lý dự án được gán |
| `sm` | SM | Site Manager — quản lý hiện trường |
| `gs` | GS | Giám sát |
| `sa` | SA | — |
| `tk` | TK | — |
| `psc` | P.SC | Phòng SC |
| `employee` | Nhân viên | Xem & cập nhật task được giao |

### 4.2. Ma trận quyền chính

| Hành động | Admin | PM/SM (dự án được gán) | Nhân viên khác |
|-----------|-------|------------------------|----------------|
| Xem tất cả dự án | ✅ | ✅ (xem) | ✅ (xem) |
| Sửa dữ liệu dự án (module, nhật ký…) | ✅ | ✅ | ❌ (chỉ xem) |
| Thêm / xóa dự án | ✅ | ❌ | ❌ |
| Sửa "Vướng mắc" trên bảng dự án | ✅ | ✅ (dự án được gán) | ❌ |
| Tạo task mới | ✅ | ✅ | ❌ |
| Sửa / xóa task | ✅ | Chỉ task mình được giao (`NHÂN_SỰ`) | Chỉ task mình được giao |
| Quản lý tài khoản | ✅ | ❌ | ❌ |
| Bật link chia sẻ khách | Chỉ admin chủ định | ❌ | ❌ |

> **Quy tắc quan trọng:** Muốn sửa dữ liệu dự án, tài khoản phải được **gán dự án** đó (trong Cài đặt → Tài khoản). PM/SM thường được gán dự án mình phụ trách.

---

## 5. Trang Tổng quan

**Đường dẫn:** `/` — menu **TỔNG QUAN**

### 5.1. Mục đích

Trang "điểm danh" buổi sáng: xem nhanh toàn công ty đang thế nào — không cần mở từng dự án.

### 5.2. Thẻ KPI trên cùng

| Thẻ | Ý nghĩa |
|-----|---------|
| **Tổng công suất Site** | Tổng kWp các dự án đang active |
| **Dự án đang thi công** | Số dự án chưa hoàn thành |
| **Risk cần xử lý** | Rủi ro mở — nhấn để cuộn xuống bảng Risk |
| **Task quan trọng** | Task ưu tiên cao — nhấn để cuộn xuống bảng Task |

### 5.3. Các khối nội dung

- **Tiến độ dự án** — top 5 dự án active theo công suất; thanh % thực tế vs kế hoạch.
- **Risk cần xử lý** — rủi ro HIGH/MEDIUM chưa đóng; nhấn dòng để vào chi tiết dự án.
- **Task quan trọng** — task ưu tiên Khẩn cấp / Quan trọng / Bình thường (không gồm Thấp).
- **Kanban task** — 4 cột: **Quá hạn | Hôm nay | Sắp tới | Hoàn thành**; nhấn thẻ để sang trang Công việc.

### 5.4. Thao tác nhanh

- Nhấn tên dự án → vào **Chi tiết dự án**.
- Nhấn task → chuyển sang **Công việc** (có thể kèm bộ lọc tìm kiếm).

---

## 6. Danh sách dự án

**Đường dẫn:** `/projects` — menu **DỰ ÁN**

### 6.1. Bảng dự án — các cột

| Cột | Giải thích |
|-----|------------|
| **Dự án** | Tên dự án — nhấn để vào chi tiết |
| **Khách hàng** | Chủ đầu tư |
| **PM** | Project Manager phụ trách |
| **Công suất (kWp)** | Quy mô công trình |
| **% Thực tế** | Tiến độ thi công thực tế |
| **Δ Kế hoạch** | Chênh lệch so kế hoạch: **+x%** (xanh = đúng/vượt), **-x%** (đỏ = chậm) |
| **COD còn lại** | Số ngày đến ngày Commercial Operation Date |
| **Risk** | LOW / MEDIUM / HIGH |
| **Vướng mắc** | Vấn đề chính đang gặp |
| **Action** | Nút xem chi tiết |

### 6.2. Tìm kiếm & lọc

- **Ô tìm kiếm:** Gõ tên dự án, khách hàng, PM, SM.
- **Bộ lọc nâng cao:** Lọc theo PM, SM, Khu vực, Khách hàng, Trạng thái, Risk.
  - Chọn tab bên trái → tick checkbox bên phải.
  - **Áp dụng** để lọc; **Xóa bộ lọc** để reset.

### 6.3. Sắp xếp

Nhấn **tiêu đề cột** để sắp xếp tăng/giảm. Mũi tên ↑↓ hiện ở cột đang sort.

### 6.4. Phân trang

Chọn số dòng: **4 / 8 / 12 / 20** dự án mỗi trang. Dùng nút số trang hoặc mũi tên `< >`.

### 6.5. Xuất Excel

Nút **Xuất Excel** (góc phải header) — tải file CSV danh sách dự án **theo bộ lọc hiện tại**.

### 6.6. Thêm dự án mới *(Admin)*

1. Nhấn **Thêm dự án** (góc phải).
2. Điền form bên phải:
   - **Tên dự án EPC** * (bắt buộc) — tự chuyển IN HOA.
   - **Khách hàng / Chủ đầu tư** * (bắt buộc).
   - **PM**, **Công suất (kWp)**.
   - **Ngày Kickoff**, **Ngày COD** (định dạng dd/mm/yyyy).
3. Nhấn **Lưu dự án**.

Hệ thống tự sinh **Mã dự án** dạng `2026-01`, `2026-02`… theo năm hiện tại.

### 6.7. Sửa vướng mắc nhanh trên bảng

Người có quyền sửa dự án: **double-click** ô **Vướng mắc** → gõ nội dung → **Enter** hoặc click ra ngoài để lưu.

---

## 7. Chi tiết dự án

**Cách vào:** Nhấn tên dự án từ Tổng quan / Danh sách dự án / Task.

**Đường dẫn:** `/projects/{tên-hoặc-mã-dự-án}`

### 7.1. Header dự án

- **Quay lại** — về Tổng quan.
- Thông tin: tên, khách hàng, công suất, tiến độ, COD.
- **Copy link / Bật link** — chỉ admin được phép chia sẻ khách (xem [mục 11](#11-chia-sẻ-tiến-độ-cho-khách-hàng)).

### 7.2. Thanh điều hướng nội bộ (sticky)

Cuộn trang sẽ tự highlight mục đang xem:

| Tab | Nội dung |
|-----|----------|
| **KPI** | Chỉ số tổng hợp dự án |
| **Milestone** | Timeline các mốc quan trọng |
| **Nhật ký** | Site log ngày/tuần/tháng |
| **S-Curve** | Biểu đồ tiến độ kế hoạch vs thực tế |
| **Hạng mục** | 6 module EPC |

### 7.3. KPI Overview

Hiển thị:

- Tiến độ **kế hoạch** vs **thực tế**.
- **Chênh lệch / Delay** (%).
- **Thời gian còn lại** đến COD.

### 7.4. Milestone Timeline

Timeline các mốc: Kickoff, Giấy phép, Thiết kế, Mua sắm, Thi công, COD, Bàn giao…  
Màu sắc thể hiện trạng thái: hoàn thành / đang làm / chưa tới / trễ.

### 7.5. Nhật ký & Vận hành (Site Log)

**Ba chế độ xem:** **Ngày | Tuần | Tháng**

#### Nhật ký theo ngày

| Trường | Mô tả |
|--------|-------|
| Nhân lực Site | Số công nhân hiện trường |
| Kỹ sư / GS | Số kỹ sư giám sát |
| Thời tiết | Nắng / Mưa / Nhiều mây… |
| Công việc chính | Checklist công việc trong ngày |
| Sự cố | Số sự cố, mức độ |
| Ghi chú hiện trường | Mô tả tự do |
| Ảnh hiện trường | Tối đa **4 ảnh/ngày** |

**Cách cập nhật nhật ký ngày:**

1. Chọn ngày trên lịch (hoặc mũi tên trái/phải).
2. Nhấn biểu tượng **bút chì** ở các mục cần sửa.
3. Nhập / tick / upload ảnh.
4. Hệ thống **tự lưu** — xem trạng thái góc panel:
   - *Đang lưu...* → *Đã lưu* (thành công) hoặc *Lỗi kết nối* (thử lại).

**Upload ảnh:**

- Chọn file từ máy; ảnh tự nén trước khi gửi.
- Cần quyền Google Drive nếu lần đầu upload (hệ thống có thể yêu cầu xác thực).

#### Nhật ký tuần / tháng

- **Tuần:** Tổng hợp nhân lực, thời tiết, sự cố; biểu đồ nhân lực theo ngày.
- **Tháng:** Báo cáo tổng hợp tháng.

> **Quyền:** Chỉ người được **gán dự án** mới sửa được. Người khác thấy chế độ **Chỉ xem**.

### 7.6. S-Curve

Biểu đồ đường cong tiến độ:

- **Kế hoạch (Plan)** — đường mục tiêu theo thời gian.
- **Thực tế (Actual)** — tiến độ ghi nhận từ site log / module.

Dùng để báo cáo BOD: dự án đi **trên** hay **dưới** đường kế hoạch.

### 7.7. Sáu hạng mục EPC (Modules)

Mỗi module là một **accordion** (mở/đóng). Click tiêu đề để mở rộng.

| # | Module | Nội dung chính |
|---|--------|----------------|
| 1 | **Risk** | Danh sách rủi ro: mô tả, mức độ, người phụ trách, hạn xử lý, trạng thái |
| 2 | **Giấy phép (Permit)** | Tiến độ hồ sơ, giấy phép xây dựng / điện lực… |
| 3 | **Thiết kế (Design)** | Bản vẽ, BOQ, phê duyệt thiết kế |
| 4 | **Mua sắm (Procurement)** | Đặt hàng tấm pin, inverter, vật tư… |
| 5 | **Thi công (Construction)** | Hạng mục thi công, % hoàn thành từng hạng mục |
| 6 | **Bàn giao (Handover)** | Nghiệm thu, đóng điện, bàn giao O&M |

**Cách cập nhật module:**

1. Mở accordion module cần sửa.
2. Chỉnh các trường (ngày, %, trạng thái, ghi chú…).
3. Nhấn **Lưu** (nếu có) hoặc chờ autosave.
4. Tiến độ module **ảnh hưởng tiến độ tổng** dự án và milestone.

**Risk module — lưu ý:**

- Risk **HIGH** hiển thị trên Tổng quan.
- Đóng risk khi đã xử lý xong (cập nhật trạng thái).

---

## 8. Quản lý công việc (Task)

**Đường dẫn:** `/tasks` — menu **CÔNG VIỆC**

### 8.1. Bốn chế độ xem

| Chế độ | Icon | Mô tả |
|--------|------|-------|
| **Lưới (Grid)** | Bảng | Bảng task đầy đủ cột — mặc định |
| **Board** | Kanban | Cột theo trạng thái |
| **Calendar** | Lịch | Task theo ngày bắt đầu / kết thúc |
| **Chart** | Biểu đồ | Thống kê theo trạng thái, ưu tiên, thành viên |

Chuyển chế độ bằng các nút ở thanh công cụ phía trên.

### 8.2. Thống kê nhanh (5 ô trên cùng)

- **Tổng task**
- **Chưa bắt đầu**
- **Đang diễn ra**
- **Trễ hạn**
- **Hoàn thành**

### 8.3. Tìm kiếm & lọc

- Ô **Tìm kiếm:** theo tên task, mô tả, tên dự án.
- Có thể vào từ Tổng quan kèm tham số `?q=...` hoặc `?project=...`.

### 8.4. Thêm công việc mới *(PM/SM/Admin)*

1. Nhấn nút **+ Thêm công việc** (hoặc tương đương).
2. Chọn loại:
   - **Công việc Dự án** — gắn với một dự án cụ thể.
   - **Công việc Văn phòng / Nội bộ** — không gắn dự án.
3. Điền:
   - **Tác vụ** (tiêu đề) *
   - **Mô tả**
   - **Dự án** (nếu loại Dự án)
   - **Nhân sự** — người được giao
   - **Ưu tiên:** Khẩn cấp / Quan trọng / Bình thường / Thấp
   - **Ngày bắt đầu**, **Ngày kết thúc** (dd/mm/yyyy)
4. Nhấn **Lưu**.

### 8.5. Cập nhật / hoàn thành task

- Người được giao (`NHÂN_SỰ` khớp tên đăng nhập) hoặc Admin mới sửa được.
- Đổi **trạng thái** trực tiếp trên bảng hoặc trong form chi tiết.
- **Ghim (Pin)** task quan trọng lên đầu danh sách.

### 8.6. Xuất dữ liệu

Nút **Xuất** — tải CSV danh sách task đang hiển thị.

---

## 9. Tài khoản cá nhân

**Đường dẫn:** `/account` — menu **TÀI KHOẢN** hoặc click avatar sidebar.

### 9.1. Thông tin hiển thị

- Họ tên, Email, Vai trò (PM, SM…).
- **Dự án được gán** — số lượng dự án bạn có quyền sửa.

### 9.2. Đổi mật khẩu

1. Nhập **Mật khẩu hiện tại**.
2. Nhập **Mật khẩu mới** (tối thiểu 6 ký tự).
3. Nhập lại **Xác nhận mật khẩu**.
4. Nhấn **Đổi mật khẩu**.

Biểu tượng **mắt** để hiện/ẩn mật khẩu khi gõ.

---

## 10. Cài đặt hệ thống (Admin)

**Chỉ role Admin** truy cập được.

### 10.1. Quản lý tài khoản

**Đường dẫn:** `/settings/users`

#### Danh sách user

- Tìm theo tên, username, email, role.
- Cột: Họ tên, Username, Email, Role, Dự án gán, Trạng thái.

#### Tạo tài khoản mới (3 bước)

**Bước 1 — Chọn nhân viên**

- Chọn từ danh sách **Employee** (đồng bộ từ sheet nhân sự).
- Hệ thống tự điền họ tên, email `@vuphong.com`, role theo chức vụ.

**Bước 2 — Tài khoản đăng nhập**

- **Username** — không trùng.
- **Mật khẩu** — mặc định `123123`; có thể đổi khi tạo.
- **Role** — PM, SM, GS, SA, TK, P.SC, Nhân viên.

**Bước 3 — Gán dự án**

- Tick các dự án user được phép **sửa**.
- PM/SM thường gán đúng dự án phụ trách.

#### Thao tác trên user

| Nút | Tác dụng |
|-----|----------|
| **Sửa** | Đổi role, gán dự án, reset mật khẩu |
| **Khóa** | User không đăng nhập được |
| **Mở khóa** | Khôi phục đăng nhập |
| **Vô hiệu hóa** | Tắt tài khoản (không xóa dữ liệu) |
| **Kích hoạt lại** | Bật lại tài khoản đã vô hiệu |

> Không sửa/xóa tài khoản **Admin** qua UI.

### 10.2. Nhật ký hoạt động (Audit Log)

**Đường dẫn:** `/settings/audit`

Ghi lại mọi hành động quan trọng:

| Loại | Ví dụ |
|------|-------|
| Đăng nhập / Đăng xuất | User A login lúc 8:00 |
| Dự án | Tạo, sửa, xóa dự án |
| Task | Tạo, sửa, xóa task |
| Tài khoản | Tạo user, khóa, đổi role |
| Site log / ảnh | Upload ảnh, sửa nhật ký |

**Lọc:** Theo loại hành động, tìm theo tên user / nội dung.  
**Chi tiết:** Nhấn "Chi tiết" để xem JSON thay đổi.

**Cấu hình email thông báo:** Admin có thể bật/tắt gửi email và cấu hình URL app.

---

## 11. Chia sẻ tiến độ cho khách hàng

### 11.1. Ai được bật link?

Chỉ **Admin chủ** (username `tien.nguyen`) thấy nút chia sẻ trên header chi tiết dự án.

### 11.2. Cách bật link

1. Vào **Chi tiết dự án**.
2. Nhấn **Bật link** → hệ thống tạo token.
3. Nhấn **Copy link** — URL dạng:  
   `https://vpeg-pxd-dashboard.vercel.app/share/{token}`

### 11.3. Khách hàng thấy gì?

Trang **read-only** (chỉ xem):

- KPI, Milestone, S-Curve.
- Nhật ký site (không sửa được).
- Các module (Permit, Design, Procurement, Construction, Handover).
- **Không** thấy: Risk nội bộ, task, dữ liệu nhạy cảm khác.

Hỗ trợ **Tiếng Việt / English**.

### 11.4. Tắt link

Nhấn **Tắt link chia sẻ** — link cũ hết hiệu lực ngay.

---

## 12. Trợ lý AI (AI PXD)

### 12.1. Vị trí

Nút **bot** góc dưới phải màn hình (mọi trang sau đăng nhập).

### 12.2. AI có thể giúp gì?

- Hướng dẫn thao tác từng màn hình.
- Đọc số liệu dự án / task bạn đang xem.
- Tư vấn kỹ thuật điện mặt trời EPC.

### 12.3. Gợi ý câu hỏi nhanh

- *"Hướng dẫn trang tôi đang xem"*
- *"Làm sao thêm dự án?"*
- *"Làm sao thêm công việc?"*
- *"Giải thích S-Curve và milestone"*

### 12.4. Lưu ý

- AI đọc dữ liệu từ cache trình duyệt + ngữ cảnh trang hiện tại.
- Câu trả lời mang tính **hỗ trợ** — quyết định chính thức vẫn theo dữ liệu trên dashboard và quy trình công ty.

---

## 13. Thông báo

### 13.1. Chuông thông báo

Biểu tượng **chuông** ở sidebar — hiện số badge khi có thông báo chưa đọc.

### 13.2. Loại thông báo

| Loại | Khi nào |
|------|---------|
| Task được giao | Admin/PM giao task cho bạn |
| Task sắp đến hạn | Nhắc trước deadline |
| Task quá hạn | Quá ngày kết thúc |
| Dự án được gán / bỏ gán | Admin đổi phân quyền dự án |
| Dự án hoàn thành | COD / bàn giao xong |
| Risk quá hạn | Risk chưa xử lý quá hạn |

### 13.3. Thao tác

- Nhấn thông báo → chuyển đến trang liên quan (task / dự án).
- **Đánh dấu đã đọc** từng mục hoặc **Đọc tất cả**.

---

## 14. Mẹo vận hành & xử lý sự cố

### 14.1. Mẹo hàng ngày cho SM/GS

1. **Sáng:** Mở **Tổng quan** → xem task hôm nay / quá hạn.
2. **Trong ngày:** Cập nhật **Nhật ký site** + **4 ảnh** trước 17h.
3. **Cuối tuần:** Kiểm tra **Nhật ký tuần**, tổng hợp sự cố.
4. **Khi có vấn đề:** Thêm **Risk** + cập nhật **Vướng mắc** trên bảng dự án.

### 14.2. Mẹo cho PM

1. Rà **Δ Kế hoạch** âm (đỏ) mỗi sáng trên **Danh sách dự án**.
2. Sort theo **Risk HIGH** trước khi họp tuần.
3. Giao task rõ **NHÂN_SỰ + deadline** trên trang Công việc.
4. **Xuất Excel** trước họp BOD.

### 14.3. Xử lý sự cố kỹ thuật

| Vấn đề | Cách xử lý |
|--------|------------|
| "Đang lưu..." mãi | Kiểm tra mạng; F5; thử lại |
| "Lỗi kết nối" khi lưu nhật ký | Không tắt tab; đợi mạng ổn; sửa lại 1 trường để trigger save |
| Ảnh không upload | Giảm kích thước ảnh; tối đa 4 ảnh/ngày; xác thực Google Drive |
| Không sửa được dự án | Kiểm tra **Tài khoản → Dự án được gán**; liên hệ Admin |
| Trang trắng sau update | `Ctrl + Shift + R` (hard refresh) |
| Dữ liệu cũ | Hệ thống tự refresh nền; chuyển tab rồi quay lại |

### 14.4. Định dạng ngày

Toàn hệ thống dùng **dd/mm/yyyy** (ví dụ: `25/05/2026`).

---

## 15. Kịch bản training đề xuất

Dùng checklist này cho buổi training nhân viên mới (~2–3 giờ):

### Buổi 1 — Làm quen (45 phút)

- [ ] Đăng nhập, đổi mật khẩu.
- [ ] Khám phá sidebar, theme sáng/tối, chuông thông báo.
- [ ] Xem **Tổng quan**: giải thích 4 thẻ KPI.
- [ ] Mở **Danh sách dự án**: tìm kiếm, lọc, sort, phân trang.
- [ ] Hỏi thử **AI PXD**: "Trang này dùng để làm gì?"

### Buổi 2 — Vận hành dự án (60 phút)

- [ ] Vào **Chi tiết dự án** được gán.
- [ ] Đọc KPI, Milestone, S-Curve.
- [ ] **Thực hành:** Cập nhật nhật ký ngày + upload 1 ảnh.
- [ ] Mở từng **Module** — cập nhật 1 trường trong Construction hoặc Permit.
- [ ] Thêm 1 **Risk** mẫu và đóng lại.

### Buổi 3 — Task & quy trình (45 phút)

- [ ] Xem **Công việc** — 4 chế độ xem.
- [ ] PM demo: tạo task, giao cho trainee.
- [ ] Trainee: đổi trạng thái task → Hoàn thành.
- [ ] Xem task trên **Kanban Tổng quan**.

### Buổi 4 — Admin (chỉ Admin/HR) (30 phút)

- [ ] Tạo tài khoản mẫu (3 bước).
- [ ] Gán / bỏ gán dự án.
- [ ] Khóa / mở khóa tài khoản.
- [ ] Xem **Audit Log**.
- [ ] Demo **link chia sẻ khách** (nếu có quyền).

---

## Phụ lục A — Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|------------|
| **EPC** | Engineering, Procurement, Construction — trọn gói thi công |
| **COD** | Commercial Operation Date — ngày vận hành thương mại / đóng điện |
| **kWp** | Kilowatt-peak — công suất lắp đặt |
| **S-Curve** | Đường cong tiến độ lũy kế theo thời gian |
| **PM** | Project Manager |
| **SM** | Site Manager |
| **GS** | Giám sát thi công |
| **Δ Kế hoạch** | Chênh lệch % thực tế so với kế hoạch |
| **Milestone** | Mốc tiến độ quan trọng trong vòng đời dự án |

## Phụ lục B — Liên hệ hỗ trợ

| Vấn đề | Liên hệ |
|--------|---------|
| Quên mật khẩu / bị khóa tài khoản | Admin hệ thống |
| Không được gán dự án | PM hoặc Admin |
| Lỗi kỹ thuật / mất dữ liệu | IT / Admin (kèm screenshot + thời gian) |
| Yêu cầu tính năng mới | PMO / Ban quản lý dự án |

---

*Tài liệu thuộc Vu Phong Energy Group — VPEG-PXD Dashboard. Cập nhật khi phát hành phiên bản mới của phần mềm.*
