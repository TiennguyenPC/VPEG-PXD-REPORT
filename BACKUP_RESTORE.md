# Khôi phục bản trước khi sửa (29/05/2026)

Trước khi sửa lint/bug, dự án được đánh dấu bằng **git tag**:

- **Tag:** `backup/before-fixes-2026-05-29`
- **Commit gốc:** `33eff1d` (Remove Google Drive helper note from task attachments tab.)

## Cách quay lại toàn bộ mã nguồn

```bash
cd "c:\Users\ThinkPad P15\.gemini\antigravity\scratch - Copy\epc-solar-dashboard"
git checkout backup/before-fixes-2026-05-29
```

Sau đó nếu muốn làm nhánh làm việc từ bản cũ:

```bash
git checkout -b restore-from-backup
```

## Cách xem tag đã tạo

```bash
git tag -l "backup/*"
git show backup/before-fixes-2026-05-29 --stat
```

## Lưu ý

- Tag chỉ lưu **code đã commit** tại thời điểm backup (working tree lúc đó sạch).
- File `.env` không nằm trong git — tự giữ bản `.env` riêng nếu có.
- Thư mục `node_modules`, `dist`, `android/app/build` không bị tag ảnh hưởng; có thể xóa và `npm install` / `npm run build` lại sau khi checkout.
