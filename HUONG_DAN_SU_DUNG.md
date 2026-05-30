# Hướng dẫn sử dụng Dashboard VPEG-PXD

> **Phiên bản tài liệu:** 1.3  
> **Đối tượng:** PM, SM, GS, SA, TK, P.SC — vận hành hàng ngày  
> **Mục đích:** Training từ A–Z — đọc xong có thể tự thao tác trên hệ thống  
> **Đọc trên web:** https://vpeg-pxd-dashboard.vercel.app/huong-dan

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
10. [Chia sẻ tiến độ cho khách hàng](#10-chia-sẻ-tiến-độ-cho-khách-hàng)
11. [Trợ lý AI (AI PXD)](#11-trợ-lý-ai-ai-pxd)
12. [Thông báo](#12-thông-báo)
13. [Mẹo vận hành & xử lý sự cố](#13-mẹo-vận-hành--xử-lý-sự-cố)
14. [Kịch bản training đề xuất](#14-kịch-bản-training-đề-xuất)

---

## 1. Giới thiệu

### 1.1. Phần mềm là gì?

**Dashboard VPEG-PXD** là nền tảng quản lý dự án điện mặt trời EPC của **Vũ Phong Energy Group**. Phần mềm giúp:

- Theo dõi **toàn bộ danh mục dự án** (công suất, tiến độ, COD, rủi ro, vướng mắc).
- Quản lý **công việc (task)** theo dự án hoặc văn phòng.
- Ghi **nhật ký hiện trường** (ngày / tuần / tháng), ảnh site, nhân lực, sự cố.
- Theo dõi **6 hạng mục EPC**: Risk, Giấy phép, Thiết kế, Mua sắm, Thi công, Bàn giao.
- Xem **S-Curve**, milestone, KPI tuần.
- **Chia sẻ read-only** cho khách hàng qua link công khai.

### 1.2. Dữ liệu lưu ở đâu?

Dữ liệu được đồng bộ qua **Google Apps Script (GAS)** — backend kết nối Google Sheets / Drive. Trình duyệt có **cache cục bộ** để tải nhanh; khi mất mạng tạm thời vẫn xem được dữ liệu đã cache, nhưng **lưu mới cần có kết nối**.

### 1.3. Địa chỉ truy cập

| Môi trường | URL |
|------------|-----|
| Production | `https://vpeg-pxd-dashboard.vercel.app` |
| Hướng dẫn sử dụng | `https://vpeg-pxd-dashboard.vercel.app/huong-dan` |

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
| **CÀI ĐẶT** | `/settings/users` | Quản trị hệ thống — Admin nội bộ (không cần thao tác vận hành) |

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

**Nguyên tắc vàng:** PM/SM **toàn quyền** trên dự án được Admin **gán** cho mình. Dự án **không** thuộc phạm vi quản lý → **chỉ xem**, không sửa module / nhật ký / vướng mắc.

| Hành động | Admin | PM/SM — dự án được gán | PM/SM — dự án khác | Nhân viên khác |
|-----------|-------|------------------------|--------------------|----------------|
| Xem danh sách & chi tiết dự án | ✅ | ✅ | ✅ **chỉ xem** | ✅ **chỉ xem** |
| Sửa module, nhật ký, risk, ảnh site | ✅ | ✅ **toàn quyền** | ❌ chỉ xem | ❌ chỉ xem |
| Sửa **Vướng mắc** trên bảng dự án | ✅ | ✅ | ❌ | ❌ |
| **Theo dõi HĐ SM+** (milestone hợp đồng) | ✅ | ✅ xem & sửa | ❌ | ❌ |
| Thêm dự án mới | ✅ | ✅ | ✅ | ✅ |
| Xóa dự án | ✅ | ✅ *(dự án mình tạo)* | ❌ | ❌ *(chỉ dự án mình tạo)* |
| Tạo task mới | ✅ | ✅ | ✅ *(task văn phòng / dự án được gán)* | ❌ |
| Sửa / xóa task | ✅ | ✅ **toàn quyền** task thuộc dự án được gán | Chỉ task mình được giao (`NHÂN_SỰ`) | Chỉ task mình được giao |
| Quản lý tài khoản hệ thống | ✅ | ❌ | ❌ | ❌ |
| Bật link chia sẻ khách | ✅ | ✅ *(dự án được gán)* | ❌ | ❌ |

> **Quy tắc quan trọng:** Muốn **sửa** dữ liệu dự án, tài khoản phải được **gán dự án** đó. PM/SM được gán dự án A → toàn quyền dự án A; mở dự án B (không gán) → chỉ đọc, không có nút Sửa nhật ký / không lưu module.

#### 4.2.1. PM/SM toàn quyền — cụ thể được làm gì?

Trên **dự án được gán**, PM/SM có thể:

- Cập nhật **6 module EPC** (Risk, Giấy phép, Thiết kế, Mua sắm, Thi công, Bàn giao).
- Ghi **Nhật ký & Vận hành** (ngày/tuần), upload **ảnh hiện trường**.
- Sửa **Vướng mắc** trực tiếp trên bảng danh sách dự án (double-click).
- Nhập / xem **Theo dõi HĐ SM+** trên timeline milestone.
- **Tạo, sửa, xóa task** thuộc dự án đó (không bị giới hạn như nhân viên thường).
- **Bật / copy / tắt link chia sẻ khách** cho dự án được gán.

#### 4.2.2. Dự án không quản lý — chỉ view

- Xem KPI, Milestone, S-Curve, module, nhật ký — **read-only**.
- Không thấy **Sửa nhật ký**, không lưu được module.
- Vẫn có thể **xem task**; chỉ sửa task nếu mình là `NHÂN_SỰ` được giao.

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
- **Copy link / Bật link** — Admin hoặc **PM/SM được gán dự án** (xem [mục 10](#10-chia-sẻ-tiến-độ-cho-khách-hàng)).

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

### 7.4. Trục Milestone kiểm soát tiến độ

**Vị trí:** Tab **Milestone** — khối **TRỤC MILESTONE KIỂM SOÁT TIẾN ĐỘ**.

Đây là “đồng hồ chiến lược” của dự án: nhìn một lần biết đang ở giai đoạn nào, mốc nào trễ, COD còn bao xa.

#### 7.4.1. Bảy mốc trên timeline

| # | Mốc | Nguồn ngày hiển thị | % dưới mốc |
|---|-----|---------------------|------------|
| 1 | **KICKOFF** | Ngày kickoff dự án / hợp đồng | 100% khi đã qua ngày kickoff |
| 2 | **PHÁP LÝ** (Giấy phép) | Ngày **kết thúc** lịch module Giấy phép | Tiến độ module Giấy phép |
| 3 | **THIẾT KẾ** | Ngày kết thúc lịch module Thiết kế | Tiến độ module Thiết kế |
| 4 | **VẬT TƯ** (Mua sắm) | Ngày kết thúc lịch module Mua sắm | Tiến độ module Mua sắm |
| 5 | **THI CÔNG** | Ngày kết thúc lịch module Thi công | Tiến độ module Thi công |
| 6 | **COD** | Ngày COD dự kiến của dự án | 100% khi dự án hoàn thành / bàn giao xong |
| 7 | **BÀN GIAO HỒ SƠ** | Ngày kết thúc lịch module Bàn giao | Tiến độ module Bàn giao |

> **Quan trọng:** Ngày trên mỗi mốc là **ngày kế hoạch kết thúc** giai đoạn đó (trừ KICKOFF là mốc mở đầu). % là **tiến độ thực tế** lấy từ bảng hạng mục bên dưới trang — cập nhật module thì milestone tự đổi theo.

#### 7.4.2. Bốn trạng thái màu (chú thích góc phải)

| Màu | Trạng thái | Ý nghĩa vận hành |
|-----|------------|------------------|
| 🟢 **Xanh lá** | HOÀN THÀNH | Mốc đã xong (100%) **và** đã qua ngày kết thúc kế hoạch |
| 🔵 **Xanh dương** | ĐANG THỰC HIỆN | Đang trong khung thời gian của mốc — kể cả khi % đã 100% nhưng **chưa tới ngày kết thúc** |
| ⚪ **Xám** | CHƯA BẮT ĐẦU | Chưa tới ngày bắt đầu hoặc chưa có tiến độ |
| 🔴 **Đỏ** | DELAY | **Đã qua ngày kết thúc** mà % vẫn &lt; 100% — badge hiện số ngày trễ |

**Ví dụ thường gặp:** Giấy phép hiện **100%** nhưng vẫn **xanh dương (Đang thực hiện)** — vì hôm nay chưa qua ngày kết thúc lịch Giấy phép (vd. 26/07). Hệ thống coi giai đoạn vẫn “đang chạy” cho đến hết ngày KH.

#### 7.4.3. Vạch HÔM NAY và thanh tiến thời gian

- **Vạch đứt nét xanh “HÔM NAY”** — vị trí ngày hiện tại trên trục thời gian (từ Kickoff → COD).
- **Thanh gradient xanh** bên trái vạch — phần timeline đã “trôi qua”.
- Kéo ngang timeline trên mobile nếu không thấy hết 7 mốc.

#### 7.4.4. Ô Dự kiến COD

Góc phải header milestone: **DỰ KIẾN COD** + ngày tím — lấy từ ngày COD của dự án / hợp đồng. Dùng đối chiếu nhanh với các mốc Thi công, Bàn giao.

#### 7.4.5. Theo dõi HĐ (SM+)

Ngay **phía trên** timeline, có dòng **“Theo dõi HĐ · SM+”** (mũi tên mở rộng):

- **Mục đích:** Theo dõi **mốc hợp đồng nội bộ** (SM/PM) — song song với milestone kỹ thuật.
- **Chấm xanh nhỏ** bên cạnh = đã có ít nhất một ngày hợp đồng được nhập.
- Mở ra xem **sơ đồ luồng hợp đồng** (flow) với các deadline tính tự động từ ngày đã nhập + lịch module.
- **Không hiện** trên link chia sẻ khách — chỉ nội bộ Vũ Phong Energy Group.
- PM/SM được gán dự án có thể cập nhật ngày (biểu tượng bút chì → chế độ nhập).

> **Cách đọc kết hợp:** Milestone = tiến độ **kỹ thuật EPC**; Theo dõi HĐ = mốc **cam kết hợp đồng**. Họp nội bộ nên đối chiếu cả hai.

#### 7.4.6. Milestone lấy dữ liệu từ đâu?

```
Bảng hạng mục (Giấy phép, Thiết kế, …)
    ↓ cập nhật % hoàn thành + ngày BĐ/KT module
Trục Milestone (tự tính trạng thái + %)
    ↓
KPI tổng dự án + S-Curve
```

**Việc cần làm:** Giữ **ngày Bắt đầu / Số ngày** trên header mỗi module chính xác; cập nhật **Kết quả cuối** từng dòng trong bảng → % module đổi → milestone đổi theo.

---

### 7.5. Nhật ký & Vận hành (Site Log)

**Vị trí:** Tab **Nhật ký** — khối **NHẬT KÝ & VẬN HÀNH**.

Công cụ chính của **SM/GS hàng ngày**: ghi nhận hiện trường, tiến độ thi công trong ngày, và kế hoạch ngày mai.

#### 7.5.1. Ba chế độ xem

| Chế độ | Dùng khi |
|--------|----------|
| **Ngày** | Ghi / xem nhật ký từng ngày (mặc định) |
| **Tuần** | Tổng hợp 7 ngày — nhân lực, thời tiết, sự cố |
| **Tháng** | Báo cáo tháng |

Chọn ngày bằng **mũi tên trái/phải** hoặc **bấm vào ngày** để mở lịch.

#### 7.5.2. Bốn thẻ KPI (hàng trên)

| Thẻ | Ý nghĩa | Nguồn dữ liệu |
|-----|---------|---------------|
| **Nhân lực Site** | Số công nhân + Kỹ sư/GS | Nhập khi **Sửa nhật ký** |
| **Thời tiết** | Điều kiện + nhiệt độ | Nhập thủ công hoặc **Tự động** (API thời tiết) |
| **Công việc chính** | Số hạng mục thi công ghi tiến độ trong ngày | Từ phần **Tiến độ thi công** khi sửa nhật ký |
| **Sự cố** | Số vụ sự cố + badge trạng thái ngày | Nhập khi sửa; badge **Bình thường** khi = 0 |

Thẻ **Công việc chính** hiện “Không ghi nhận” nếu chưa ai ghi tiến độ thi công ngày đó.

#### 7.5.3. Ghi chú hiện trường

Vùng text tự do — mỗi dòng một ghi chú (mưa gián đoạn, chờ vật tư, an toàn…).  
Chỉnh bằng **Sửa nhật ký** → ô “Ghi chú hiện trường”.

#### 7.5.4. Tóm tắt ngày (góc trái dưới)

| Chỉ số | Giải thích |
|--------|------------|
| **Tiến độ thực tế** | % dự án ghi nhận **trong ngày** từ tiến độ thi công (delta % từng việc × trọng số hạng mục) |
| **Chênh lệch** | Thực tế − Kế hoạch ngày |
| **Trạng thái ngày** | Bình thường / Có vấn đề — theo sự cố và mức chênh lệch |
| **Kế hoạch** (dòng nhỏ) | % dự án **lẽ ra** phải đạt trong ngày theo lịch module + thi công |
| **Chênh lệch tác động** | Gợi ý ngắn (vd. số việc KH trong ngày) |

**Logic kế hoạch ngày:** Hệ thống chia đều tiến độ kế hoạch theo **ngày bắt đầu – kết thúc** từng việc trong bảng Thi công / Mua sắm / Giấy phép…  
**Logic thực tế ngày:** Chỉ tính từ **Tiến độ thi công** bạn nhập khi sửa nhật ký (vd. `[TC01] Lắp khung +3%`).

> **Tip PM:** Cuối ngày nếu **Thực tế &lt; Kế hoạch** → ghi rõ lý do ở Ghi chú hiện trường hoặc thêm Risk.

#### 7.5.5. Công việc ngày mai (góc phải dưới)

Badge **Ưu tiên cao** — danh sách việc cần chú ý ngày hôm sau.

**Ba nguồn tự động:**

1. **Lịch hạng mục ngày D+1** — module đang trong khung KH (Giấy phép, Thiết kế, Vật tư…).
2. **Việc thi công cụ thể** — tên việc + mã `[TCxx]` nếu có lịch thi công ngày mai.
3. **Carry-over** — việc ghi ở “ngày mai” hôm qua mà hôm nay **chưa** ghi tiến độ thi công.

**Nút “Xem bảng ↓”** (bên cạnh Giấy phép, Thiết kế…):

- Bấm → trang **cuộn xuống** đúng bảng hạng mục (Giấy phép / Thiết kế / …).
- Module **tự mở** accordion + viền tím nhấn 2 giây.
- Dùng khi cần xem **checklist chi tiết** thay vì chỉ tên module trên nhật ký.

**Khi sửa nhật ký:**

- Danh sách gợi ý có nút **X** để bỏ nhắc việc không còn relevant.
- Ô **“Thêm công việc khác”** — mỗi dòng một việc bổ sung thủ công.

#### 7.5.6. Quy trình sửa nhật ký ngày (SM/GS)

1. Chọn đúng **ngày** trên thanh lịch.
2. Nhấn **Sửa nhật ký** (góc phải header).
3. Form chỉnh sửa mở ra — các nhóm chính:
   - **Nhân lực / Thời tiết / Sự cố**
   - **Tiến độ thi công** — chọn việc, nhập % tăng trong ngày (delta)
   - **Ghi chú hiện trường**
   - **Công việc ngày mai** — xem gợi ý, bỏ nhắc (X), thêm việc khác
   - **Vấn đề / Rủi ro**
4. Nhấn **Lưu ngay** (desktop: góc form; mobile: thanh cuối màn hình).
5. Theo dõi badge trạng thái: *Đang lưu…* → *Đã lưu*.

**Ảnh hiện trường:** Tối đa **4 ảnh/ngày** — panel riêng **Ảnh hiện trường** ngay dưới Nhật ký (không bắt buộc điền nhân lực).

#### 7.5.7. Nhật ký tuần

- Bảng lịch 7 cột: nhân lực, kỹ sư, thời tiết, sự cố, ghi chú chính từng ngày.
- Biểu đồ cột **nhân lực theo ngày** trong tuần.
- Dùng họp tuần SM → PM.

> **Quyền:** Chỉ user **được gán dự án** mới sửa. Người khác xem read-only. Không có quyền → liên hệ Admin gán dự án (Admin tự setup, không cần thao tác trên dashboard).

---

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

### 8.2. Thẻ thống kê (Stat cards) & Lọc nhanh

5 thẻ thống kê trên cùng hiển thị số lượng công việc theo trạng thái:
- **Tổng công việc**
- **Đang diễn ra**
- **Trễ hạn**
- **Hoàn thành**
- **Ưu tiên cao**

> **Mẹo Lọc Nhanh:** Bạn có thể **bấm trực tiếp** vào các thẻ thống kê này để ngay lập tức lọc danh sách công việc bên dưới theo trạng thái tương ứng.

### 8.3. Tìm kiếm & lọc nâng cao

- Ô **Tìm kiếm:** Gõ từ khóa để tìm theo tên tác vụ, mô tả hoặc tên dự án.
- Nút **Lọc:** Nằm cạnh ô tìm kiếm, cho phép chọn menu trạng thái (Tất cả, Đang diễn ra, Trễ hạn, Hoàn thành, Ưu tiên cao) — tác dụng tương tự như bấm vào thẻ thống kê.
- Lọc theo **Nhân sự**: Trong các menu chọn nhân sự (khi thêm/sửa tác vụ), nay đã có ô tìm kiếm giúp gõ tên để tìm nhanh người cần giao.
- Có thể vào từ Tổng quan kèm tham số `?q=...` hoặc `?project=...` để lọc sẵn.

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

## 10. Chia sẻ tiến độ cho khách hàng

### 10.1. Ai được bật link?

| Vai trò | Quyền chia sẻ khách |
|---------|---------------------|
| **Admin** | Mọi dự án |
| **PM / SM** | Dự án được Admin **gán** cho mình |
| Khác | Không có nút chia sẻ trên header chi tiết dự án |

Nút **Bật link / Copy link / Tắt link** nằm trên header **Chi tiết dự án** (góc phải).

### 10.2. Cách bật link

1. Vào **Chi tiết dự án**.
2. Nhấn **Bật link** → hệ thống tạo token.
3. Nhấn **Copy link** — URL dạng:  
   `https://vpeg-pxd-dashboard.vercel.app/share/{token}`

### 10.3. Khách hàng thấy gì?

Trang **read-only** (chỉ xem):

- KPI, Milestone, S-Curve.
- Nhật ký site (không sửa được).
- Các module (Permit, Design, Procurement, Construction, Handover).
- **Không** thấy: Risk nội bộ, task, dữ liệu nhạy cảm khác.

Hỗ trợ **Tiếng Việt / English**.

### 10.4. Tắt link

Nhấn **Tắt link chia sẻ** — link cũ hết hiệu lực ngay.

---

## 11. Trợ lý AI (AI PXD)

### 11.1. Vị trí & cách mở

- Nút **bot** góc dưới phải (mọi trang sau đăng nhập).
- Kéo thả nút bot để đổi vị trí — hệ thống nhớ vị trí lần sau.
- Trên mobile: bot nằm phía trên thanh điều hướng dưới.

### 11.2. AI biết gì? (cập nhật 2026)

AI PXD được huấn luyện trên **toàn bộ dashboard** + **dữ liệu thực** trên trang bạn đang mở:

| Nhóm | AI trả lời được |
|------|-----------------|
| **Hướng dẫn app** | Từng màn hình: Tổng quan, Dự án, Task, Nhật ký, Module, S-Curve, Milestone… |
| **Nhật ký site** | Cách sửa nhật ký, tiến độ thi công, **Công việc ngày mai**, nút **Xem bảng ↓**, Tóm tắt ngày KH vs TT |
| **Milestone** | 7 mốc, trạng thái màu, vì sao 100% vẫn “Đang thực hiện”, **Theo dõi HĐ SM+** |
| **Module EPC** | Giấy phép, Thiết kế, Mua sắm, Thi công, Bàn giao — cách cập nhật, % ảnh hưởng tiến độ |
| **Số liệu thực** | Tiến độ %, vật tư X/Y, milestone trễ, risk mở, nhân lực site, Δ kế hoạch |
| **Phân tích** | “Vì sao dự án trễ?”, đề xuất recovery, ưu tiên việc tuần này |
| **Solar EPC** | PR, commissioning, zero-export, thi công mái, checklist nghiệm thu |
| **Phân quyền** | PM/SM toàn quyền dự án được gán; dự án khác chỉ xem; PM/SM được gán có thể share link khách |
| **Hướng dẫn web** | Link tài liệu: `/huong-dan` |

> **Mẹo:** Mở **chi tiết dự án** trước khi hỏi — AI đọc đúng dữ liệu dự án đó (local cache + ngữ cảnh trang).

### 11.3. Gợi ý câu hỏi (bấm nhanh trong chat)

- *"Hướng dẫn trang tôi đang xem"*
- *"Vật tư dự án này về mấy %?"*
- *"Dự án trễ — phân tích và đề xuất"*
- *"Làm sao ghi nhật ký site?"*
- *"Công việc ngày mai và Xem bảng là gì?"*
- *"Giải thích milestone — vì sao Giấy phép 100% mà vẫn xanh dương?"*
- *"Giải thích S-Curve và Tóm tắt ngày KH vs TT"*
- *"PM/SM được quyền gì trên dự án được gán?"*
- *"Làm sao share link tiến độ cho khách?"*
- *"Commissioning checklist"*

### 11.4. Cách hỏi hiệu quả

1. **Đứng đúng trang** — ví dụ vào Nhật ký rồi hỏi “hướng dẫn trang này”.
2. **Hỏi cụ thể** — “Nhật ký ngày 26/05 tiến độ thực tế bao nhiêu?” thay vì “tiến độ sao?”.
3. **Một câu một việc** — dễ nhận câu trả lời từng bước.
4. **Kết hợp hướng dẫn web** — doc đầy đủ tại https://vpeg-pxd-dashboard.vercel.app/huong-dan ; AI giải thích thêm theo ngữ cảnh.

### 11.5. Giới hạn

- AI đọc data từ **cache trình duyệt** — nếu chưa mở dự án / chưa sync, số liệu có thể chưa mới nhất.
- Câu trả lời mang tính **hỗ trợ** — quyết định chính thức theo dashboard và quy trình công ty.
- Không thay thế Admin (tạo tài khoản, gán dự án) — liên hệ Admin nếu thiếu quyền.

---

## 12. Thông báo

### 12.1. Chuông thông báo

Biểu tượng **chuông** ở sidebar — hiện số badge khi có thông báo chưa đọc.

### 12.2. Loại thông báo

| Loại | Khi nào |
|------|---------|
| Task được giao | Admin/PM giao task cho bạn |
| Task sắp đến hạn | Nhắc trước deadline |
| Task quá hạn | Quá ngày kết thúc |
| Dự án được gán / bỏ gán | Admin đổi phân quyền dự án |
| Dự án hoàn thành | COD / bàn giao xong |
| Risk quá hạn | Risk chưa xử lý quá hạn |

### 12.3. Thao tác

- Nhấn thông báo → chuyển đến trang liên quan (task / dự án).
- **Đánh dấu đã đọc** từng mục hoặc **Đọc tất cả**.

---

## 13. Mẹo vận hành & xử lý sự cố

### 13.1. Mẹo hàng ngày cho SM/GS

1. **Sáng:** Mở **Tổng quan** → xem task hôm nay / quá hạn.
2. **Trong ngày:** Cập nhật **Nhật ký site** + **4 ảnh** trước 17h.
3. **Cuối tuần:** Kiểm tra **Nhật ký tuần**, tổng hợp sự cố.
4. **Khi có vấn đề:** Thêm **Risk** + cập nhật **Vướng mắc** trên bảng dự án.

### 13.2. Mẹo cho PM

1. Rà **Δ Kế hoạch** âm (đỏ) mỗi sáng trên **Danh sách dự án**.
2. Sort theo **Risk HIGH** trước khi họp tuần.
3. Giao task rõ **NHÂN_SỰ + deadline** trên trang Công việc.
4. **Xuất Excel** trước họp BOD.

### 13.3. Xử lý sự cố kỹ thuật

| Vấn đề | Cách xử lý |
|--------|------------|
| "Đang lưu..." mãi | Kiểm tra mạng; F5; thử lại |
| "Lỗi kết nối" khi lưu nhật ký | Không tắt tab; đợi mạng ổn; sửa lại 1 trường để trigger save |
| Ảnh không upload | Giảm kích thước ảnh; tối đa 4 ảnh/ngày; xác thực Google Drive |
| Không sửa được dự án | Kiểm tra **Tài khoản → Dự án được gán**; liên hệ Admin gán quyền |
| Trang trắng sau update | `Ctrl + Shift + R` (hard refresh) |
| Dữ liệu cũ | Hệ thống tự refresh nền; chuyển tab rồi quay lại |

### 13.4. Định dạng ngày

Toàn hệ thống dùng **dd/mm/yyyy** (ví dụ: `25/05/2026`).

---

## 14. Kịch bản training đề xuất

Dùng checklist này cho buổi training nhân viên mới (~2–3 giờ):

### Buổi 1 — Làm quen (45 phút)

- [ ] Đăng nhập, đổi mật khẩu.
- [ ] Khám phá sidebar, theme sáng/tối, chuông thông báo.
- [ ] Xem **Tổng quan**: giải thích 4 thẻ KPI.
- [ ] Mở **Danh sách dự án**: tìm kiếm, lọc, sort, phân trang.
- [ ] Hỏi thử **AI PXD**: "Trang này dùng để làm gì?"

### Buổi 2 — Vận hành dự án (60 phút)

- [ ] Vào **Chi tiết dự án** được gán.
- [ ] Đọc **KPI** + giải thích chênh lệch kế hoạch.
- [ ] **Milestone:** đọc 7 mốc, giải thích vì sao 100% vẫn “Đang thực hiện”, mở **Theo dõi HĐ SM+**.
- [ ] **Nhật ký ngày:** cập nhật nhân lực + tiến độ thi công 1 việc.
- [ ] Xem **Tóm tắt ngày** (Kế hoạch vs Thực tế) và **Công việc ngày mai** — thử **Xem bảng ↓**.
- [ ] Upload **1 ảnh** hiện trường.
- [ ] Mở **Module Giấy phép** — cập nhật 1 trường; quay lại Milestone xem % đổi.

### Buổi 3 — Task & quy trình (45 phút)

- [ ] Xem **Công việc** — 4 chế độ xem.
- [ ] PM demo: tạo task, giao cho trainee.
- [ ] Trainee: đổi trạng thái task → Hoàn thành.
- [ ] Xem task trên **Kanban Tổng quan**.

> **Ghi chú Admin:** Tạo tài khoản, gán dự án, audit log — Admin tự vận hành qua menu Cài đặt, không nằm trong training vận hành.

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

*Tài liệu thuộc **Vũ Phong Energy Group** — VPEG-PXD Dashboard. Cập nhật khi phát hành phiên bản mới.*
