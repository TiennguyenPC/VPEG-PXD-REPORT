---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    background: #0a0f1a;
    color: #e2e8f0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 40px 50px;
  }
  h1, h2 { color: #fff; }
  h2 {
    border-left: 4px solid #5252ff;
    padding-left: 12px;
    font-size: 1.4em;
  }
  strong { color: #fff; }
  a { color: #7373ff; }
  table { font-size: 0.75em; }
  th { background: rgba(82,82,255,0.15); color: #7373ff; }
  td, th { border: 1px solid #263554; padding: 6px 10px; }
  section.title { text-align: center; }
  section.title h1 {
    background: linear-gradient(135deg, #fff, #7373ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  section.section { text-align: center; }
  section.section h2 { border: none; color: #7373ff; font-size: 2em; }
  .badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid rgba(82,82,255,0.4);
    background: rgba(82,82,255,0.12);
    color: #7373ff;
    font-size: 0.8em;
  }
---

<!-- _class: title -->

# Dashboard VPEG-PXD
## Training nhân viên mới

<div class="badge">Vu Phong Energy Group · v1.0 · 2026</div>

---

## Nội dung buổi training

| Phần | Nội dung |
|------|----------|
| **A** | Giới thiệu & đăng nhập |
| **B** | Giao diện & phân quyền |
| **C** | Tổng quan & Danh sách dự án |
| **D** | Chi tiết dự án (KPI → Module) |
| **E** | Công việc (Task) |
| **F** | Tài khoản & Admin |
| **G** | Chia sẻ · AI · Thông báo |
| **H** | Thực hành & Q&A |

*Tài liệu chi tiết: `HUONG_DAN_SU_DUNG.md`*

---

<!-- _class: section -->

## PHẦN A
### Giới thiệu hệ thống

---

## Dashboard VPEG-PXD là g?

**Nền tảng quản lý dự án điện mặt trời EPC** — Vu Phong Energy Group

- 📊 Portfolio: kWp, tiến độ, COD, risk, vướng mắc
- 🏗️ Nhật ký hiện trường (ngày/tuần/tháng) + ảnh site
- 📋 Task theo dự án & văn phòng
- 📈 S-Curve, milestone, KPI tuần
- 🔗 Link read-only cho khách hàng
- 🔐 Quản trị tài khoản & audit log

---

## Kiến trúc & truy cập

1. **Trình duyệt** — React UI, cache local
2. **Google Apps Script** — API backend
3. **Google Sheets / Drive** — Kho dữ liệu

**URL:** https://vpeg-pxd-dashboard.vercel.app

⚠️ Lưu mới cần internet · Xem cache được khi mạng yếu

---

## Đăng nhập lần đầu

1. Chrome / Edge → URL production
2. Nhập username + password (Admin cấp)
3. **Đổi mật khẩu ngay** (mặc định thường `123123`)

| Lỗi | Xử lý |
|-----|-------|
| Sai pass | Liên hệ Admin reset |
| Bị khóa | Admin → Mở khóa |
| Trang trắng | Ctrl + F5 |

---

<!-- _class: section -->

## PHẦN B
### Giao diện & Phân quyền

---

## Sidebar — 5 menu chính

| Menu | Mô tả |
|------|-------|
| **TỔNG QUAN** | KPI, risk, task — check-in buổi sáng |
| **CÔNG VIỆC** | Task toàn công ty |
| **DỰ ÁN** | Bảng portfolio, lọc, Excel |
| **TÀI KHOẢN** | Đổi mật khẩu, xem dự án gán |
| **CÀI ĐẶT** | Chỉ Admin |

Cuối sidebar: 🔔 Thông báo · 🌙 Theme · 🚪 Đăng xuất

---

## Ma trận phân quyền

| Hành động | Admin | PM/SM (gán DA) | NV khác |
|-----------|-------|----------------|---------|
| Sửa dự án | ✅ | ✅ | ❌ xem |
| Thêm/xóa DA | ✅ | ❌ | ❌ |
| Tạo task | ✅ | ✅ | ❌ |
| Sửa task | ✅ | Chỉ task mình | Chỉ task mình |
| Quản lý user | ✅ | ❌ | ❌ |

**Quy tắc:** Phải được **gán dự án** mới sửa được dữ liệu dự án

---

<!-- _class: section -->

## PHẦN C
### Tổng quan & Danh sách dự án

---

## Trang Tổng quan

**4 thẻ KPI:** Tổng kWp · Đang thi công · Risk · Task quan trọng

**Bên dưới:**
- Tiến độ top 5 dự án
- Bảng Risk — click vào dự án
- Kanban task: Quá hạn | Hôm nay | Sắp tới | Hoàn thành

💡 PM: mở mỗi sáng trước họp 15 phút

---

## Danh sách dự án — Đọc bảng

| Cột | Ý nghĩa |
|-----|---------|
| % Thực tế | Tiến độ hiện tại |
| **Δ Kế hoạch** | +x% xanh = OK · **-x% đỏ = chậm** |
| COD còn lại | Đếm ngược ngày đóng điện |
| Risk | LOW / MEDIUM / HIGH |
| Vướng mắc | Double-click sửa (có quyền) |

**Thao tác:** Tìm kiếm · Bộ lọc · Sort · Phân trang · **Xuất Excel**

---

<!-- _class: section -->

## PHẦN D
### Chi tiết dự án

---

## 5 khu vực chi tiết dự án

| Tab | Nội dung |
|-----|----------|
| **KPI** | KH vs TT · Delay · COD |
| **Milestone** | Timeline mốc EPC |
| **Nhật ký** | Ngày · Tuần · Tháng |
| **S-Curve** | Biểu đồ tiến độ |
| **Hạng mục** | 6 module EPC |

SM/GS dùng nhiều: **Nhật ký** + **Thi công**

---

## Nhật ký hiện trường

**Nhật ký NGÀY** (cập nhật hàng ngày):
- Nhân lực · Thời tiết · Công việc · Sự cố · Ghi chú
- **Tối đa 4 ảnh/ngày**

**Quy trình:** Chọn ngày → Bút chì → Sửa → Tự lưu

Trạng thái: `Đang lưu...` → `Đã lưu` / `Lỗi kết nối`

---

## 6 Module EPC

1. **Risk** — Rủi ro mở, PIC, hạn xử lý
2. **Giấy phép** — Hồ sơ, GP
3. **Thiết kế** — Bản vẽ, BOQ
4. **Mua sắm** — Pin, inverter
5. **Thi công** — % hạng mục
6. **Bàn giao** — Nghiệm thu, COD

Click accordion → sửa → tiến độ cập nhật KPI tổng

---

<!-- _class: section -->

## PHẦN E
### Quản lý Công việc

---

## Trang Công việc

**4 chế độ:** Lưới · Board (Kanban) · Lịch · Biểu đồ

**Tạo task** (PM/SM/Admin):
- Loại: Dự án hoặc Văn phòng
- Tác vụ · Nhân sự · Ưu tiên · Deadline

Chỉ **NHÂN_SỰ được giao** mới sửa/xóa task

---

<!-- _class: section -->

## PHẦN F
### Tài khoản & Admin

---

## Admin — Tạo user (3 bước)

1. Chọn nhân viên từ sheet Employee
2. Username + password + Role
3. **Gán dự án** được phép sửa

**Audit Log:** Theo dõi login, sửa dự án, task, user, site log

---

<!-- _class: section -->

## PHẦN G
### Chia sẻ · AI · Thông báo

---

## Chia sẻ khách · AI PXD · Thông báo

**Link khách:** Admin bật → Copy link → Read-only · VI/EN

**AI PXD:** Nút bot góc phải — hỏi hướng dẫn, đọc số liệu, tư vấn EPC

**Thông báo:** Task giao · Deadline · Gán dự án · Risk quá hạn

---

<!-- _class: section -->

## PHẦN H
### Thực hành

---

## Quy trình hàng ngày

**SM/GS:** Sáng check task → Cập nhật nhật ký + ảnh (trước 17h) → Cuối tuần nhật ký tuần

**PM:** Sort Δ âm (đỏ) · Xuất Excel trước họp BOD · Giao task rõ deadline

**Sự cố:** F5 · Kiểm tra dự án gán · Ctrl+Shift+R nếu trang trắng

---

## Kịch bản thực hành 4 buổi

| Buổi | Nội dung | Thời gian |
|------|----------|-----------|
| 1 | Login, sidebar, Tổng quan, Dự án | 45' |
| 2 | Chi tiết DA, nhật ký, module, risk | 60' |
| 3 | Task 4 chế độ, tạo & hoàn thành | 45' |
| 4 | Admin: user, audit, link khách | 30' |

---

<!-- _class: title -->

# Cảm ơn!
## Q & A

<div class="badge">Vu Phong Energy Group · VPEG-PXD</div>

*Tài liệu: HUONG_DAN_SU_DUNG.md*
