# Slide Training — VPEG-PXD Dashboard

## File trong thư mục này

| File | Mô tả | Cách dùng |
|------|-------|-----------|
| **TRAINING_VPEG_PXD.html** | Slide trình chiếu đầy đủ (33 slide) | Mở Chrome/Edge — trình chiếu hoặc **In → PDF** |
| **TRAINING_VPEG_PXD.md** | Nguồn Marp (~25 slide) | Xuất PDF/PPTX qua Marp |

---

## 1. Xuất PDF — nhanh nhất (không cần AI, không cần cài thêm)

1. Mở `TRAINING_VPEG_PXD.html` bằng **Chrome** hoặc **Edge**.
2. Nhấn **🖨 In / PDF** hoặc **Ctrl + P**.
3. **Destination:** Save as PDF.
4. **Layout:** Ngang (Landscape).
5. **More settings:**
   - **Margins:** Default hoặc Minimum
   - **Background graphics:** Bật (tùy chọn — giúp header bảng/card có màu nhẹ; **PDF vẫn đọc được nếu tắt** nhờ theme in sáng)
   - **Headers and footers:** **Tắt** (bỏ ngày giờ / URL ở mép trang cho gọn)
6. **Save** → 33 trang PDF nền trắng, chữ đen, in training được.

> **Lỗi cũ (đã sửa):** Chữ trắng trên nền trắng, tiêu đề gradient biến mất — do theme tối màn hình không hợp in PDF.

---

## 2. Xuất PowerPoint (.pptx)

### Cách A — Marp (miễn phí, khuyến nghị)

1. Cài extension **Marp for VS Code** trong Cursor.
2. Mở `TRAINING_VPEG_PXD.md`.
3. Marp icon → **Export Slide Deck** → **PPTX** hoặc **PDF**.

Hoặc terminal (lần đầu tải Chromium ~ vài phút):

```powershell
cd "c:\Users\ThinkPad P15\.gemini\antigravity\scratch - Copy\epc-solar-dashboard"
npx @marp-team/marp-cli training-slides/TRAINING_VPEG_PXD.md --pptx -o training-slides/TRAINING_VPEG_PXD.pptx
npx @marp-team/marp-cli training-slides/TRAINING_VPEG_PXD.md --pdf -o training-slides/TRAINING_VPEG_PXD.pdf
```

### Cách B — PDF → PowerPoint

1. Xuất PDF theo mục 1.
2. Mở PowerPoint → **Insert → Slides from PDF** (Office 365) hoặc kéo PDF vào Canva → Export PPTX.

### Cách C — Google Slides

1. Upload file PDF lên Google Drive.
2. Mở bằng Google Slides (tự tách slide) → chỉnh logo Vu Phong → **File → Download → PPTX**.

---

## 3. Trình chiếu HTML

1. Double-click `TRAINING_VPEG_PXD.html` → Chrome/Edge.
2. Phím: **→ ← Space** · **F** toàn màn hình · **Home/End**.
3. Không cần internet.

---

## 4. Có cần AI free tạo 33 slide không?

**Không cần** — slide đã có sẵn (HTML 33 trang + Marp ~25 trang).

AI free **có thể** giúp nếu bạn muốn **làm lại cho đẹp hơn** (template corporate), không phải viết lại nội dung:

| Công cụ | Free? | Ghi chú |
|---------|-------|---------|
| **In HTML → PDF** | ✅ 100% free | Nhanh nhất, đủ 33 slide |
| **Marp** | ✅ free | PDF/PPTX từ `.md` |
| **Gamma.app** | ~400 credit free | Paste outline → slide đẹp; 33 slide có thể hết credit |
| **Canva** | Free tier | Doc to Deck, chỉnh template |
| **ChatGPT / Gemini** | Free giới hạn | Tốt tạo **outline**; paste 33 slide một lần hay bị cắt — chia 8 phần A→H |
| **Google Slides + Gemini** | Free | Outline → copy vào Slides thủ công |

**Thực tế:** Với training nội bộ, **HTML trình chiếu + PDF in** là đủ. Chỉ dùng Gamma/Canva nếu cần file `.pptx` bóng bẩy gửi BOD/HR.

---

## Tài liệu đi kèm

- Chi tiết A–Z: [`../HUONG_DAN_SU_DUNG.md`](../HUONG_DAN_SU_DUNG.md)
