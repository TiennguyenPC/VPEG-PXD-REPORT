/** Cơ sở tri thức cố định — AI PXD ưu tiên khi hướng dẫn sử dụng app */
import { SOLAR_EPC_KNOWLEDGE, getSolarFaqAnswer } from './solarKnowledge';
export const APP_USAGE_GUIDE = `
# VPEG-PXD Solar EPC Dashboard — Hướng dẫn sử dụng

## Tổng quan
Ứng dụng web quản lý dự án điện mặt trời EPC của Phòng Xây Dựng (PXD). Dữ liệu đồng bộ Google Sheets qua Google Apps Script.

## Điều hướng
### Máy tính (sidebar trái — logo VPEG-PXD)
- **TỔNG QUAN** (\`/\`): KPI tổng thể, top dự án, rủi ro, công việc quan trọng.
- **CÔNG VIỆC** (\`/tasks\`): Quản lý tác vụ đa chế độ xem.
- **DỰ ÁN** (\`/projects\`): Bảng danh sách dự án, lọc, xuất Excel, thêm/sửa dự án.
- **TÀI KHOẢN** (\`/account\`): Thông tin cá nhân, đổi mật khẩu, giao diện Sáng/Tối, đăng xuất.
- **HƯỚNG DẪN VẬN HÀNH** (\`/huong-dan\`): Tài liệu training A–Z cho toàn bộ nhân sự (sidebar, ngay dưới Tài khoản).
- **CÀI ĐẶT** (\`/settings/users\`): Chỉ Admin — quản lý user, audit log.
- **Chi tiết dự án** (\`/projects/:id\`): Click dòng dự án ở Tổng quan hoặc Danh sách dự án.
- Cuối sidebar: thông báo, chế độ sáng/tối, đăng xuất, thu gọn menu.

### Điện thoại (thanh dưới + góc phải trên)
- Thanh dưới: Tổng quan | Công việc | Dự án | Tài khoản | Cài đặt (admin).
- Góc phải trên: chuông thông báo + icon mặt trời/trăng (Sáng / Tối / Hệ thống).
- **Tài khoản** → cuộn xuống **Giao diện & phiên đăng nhập** → Đăng xuất.
- Cài app: APK nội bộ hoặc PWA "Thêm vào màn hình chính" (tự cập nhật từ web Vercel).

## Trợ lý AI (góc phải dưới — nút tím lấp lánh)
- Bấm icon để mở chat; kéo header để di chuyển cửa sổ.
- Hỏi: cách dùng app, số liệu dự án/công việc đang xem, kỹ thuật Solar EPC.

---

## 1. Trang TỔNG QUAN (\`/\`)
- **KPI**: Tổng công suất (kWp), số dự án đang thi công, rủi ro cần xử lý, task quan trọng. Trên mobile: lưới 2×2 full width.
- Click thẻ **Risk** hoặc **Task** → cuộn tới khối tương ứng.
- **Tiến độ dự án**: Mobile = thẻ từng dự án (Kế hoạch / Thực tế / Chậm-Đạt); Desktop = bảng.
- **Vấn đề / Rủi ro**: Mobile = thẻ; "Xem tất cả" → Danh sách dự án.
- **Công việc quan trọng**: Kanban 4 cột — mobile vuốt ngang từng cột.

---

## 2. Trang DANH SÁCH DỰ ÁN (\`/projects\`)
- **Mobile**: Danh sách thẻ (PM, kWp, % thực tế, Δ kế hoạch, vướng mắc); Desktop: bảng đầy đủ cột.

### Thao tác chính
- **Tìm kiếm**: Ô "Tìm kiếm dự án, khách hàng..." phía trên bảng.
- **Lọc**: Nút "Lọc" — lọc theo trạng thái, PM, risk, v.v. (panel nhiều tab).
- **Sắp xếp**: Click tiêu đề cột (Dự án, Khách hàng, % Thực tế, COD còn lại...).
- **Thêm dự án**: Nút tím **"+ Thêm dự án"** góc phải header → drawer nhập thông tin.
- **Xuất Excel**: Nút "Xuất Excel" — tải CSV danh sách đang lọc.
- **Giao diện sáng/tối**: Icon mặt trời/trăng cạnh Xuất Excel.
- **Vào chi tiết**: Click một dòng trong bảng.
- **Sửa nhanh vướng mắc**: Click ô "Vướng mắc" trên dòng (nếu có).
- **Xóa dự án**: Trong drawer chi tiết / form sửa (nếu có nút xóa).

### Cột quan trọng
- **% Thực tế / Δ Kế hoạch**: Tiến độ và chênh lệch (âm = chậm so kế hoạch).
- **COD còn lại**: Số ngày đến ngày COD kế hoạch.
- **Risk**: Mức rủi ro (Cao / Trung bình / Thấp).

---

## 3. Trang CHI TIẾT DỰ ÁN (\`/projects/:id\`)
### Header
- **Quay lại tổng quan**: Link phía trên tiêu đề.
- **Chia sẻ**: Copy URL dự án.
- **Export**: In / PDF trang (Ctrl+P).
- **Tiến độ thực tế tổng thể**: % tổng hợp từ các module.

### Các khối nội dung (từ trên xuống)
1. **KPI Overview**: COD, kickoff, delay, trạng thái.
2. **Milestone Timeline** (tab Milestone — TRỤC MILESTONE KIỂM SOÁT TIẾN ĐỘ):
   - **7 mốc:** KICKOFF → PHÁP LÝ (Giấy phép) → THIẾT KẾ → VẬT TƯ → THI CÔNG → COD → BÀN GIAO HỒ SƠ.
   - Ngày trên mốc = **ngày kết thúc kế hoạch** giai đoạn (trừ KICKOFF). % = tiến độ thực tế từ module tương ứng.
   - **4 trạng thái màu:** 🟢 Hoàn thành (100% + qua ngày KT) | 🔵 Đang thực hiện (trong khung thời gian, kể cả 100% chưa tới ngày KT) | ⚪ Chưa bắt đầu | 🔴 Delay (qua ngày KT mà % < 100%).
   - **Ví dụ:** Giấy phép 100% vẫn xanh dương vì chưa qua ngày kết thúc lịch Giấy phép — không phải lỗi.
   - Vạch **HÔM NAY** (đứt nét xanh) trên trục thời gian Kickoff → COD.
   - **Theo dõi HĐ · SM+** (phía trên timeline): mốc hợp đồng nội bộ, chỉ nội bộ vũ phong (by Tien Nguyen), không hiện link khách. PM/SM được gán dự án có thể sửa ngày (icon bút chì).
   - Số ngày **âm** trên milestone cũ = **trễ**, không phải lỗi nhập.
3. **S-Curve**: Biểu đồ tiến độ kế hoạch vs thực tế theo thời gian.
4. **Nhật ký & Vận hành (Site Log)** — tab Nhật ký:
   - Chế độ **Ngày / Tuần / Tháng**; chọn ngày bằng mũi tên hoặc lịch.
   - **Xem:** 4 thẻ KPI (Nhân lực, Thời tiết, Công việc chính, Sự cố), Ghi chú hiện trường, **Tóm tắt ngày** (Tiến độ thực tế, Chênh lệch KH vs TT, Trạng thái ngày), **Công việc ngày mai** (góc phải dưới).
   - **Sửa nhật ký:** Nút **Sửa nhật ký** → form (Nhân lực/Thời tiết/Sự cố, Tiến độ thi công delta %, Ghi chú, Công việc ngày mai, Risk) → **Lưu ngay** (desktop: trong form; mobile: thanh cuối). **Hủy** để thoát không lưu.
   - **Công việc ngày mai:** Tự gợi ý từ lịch D+1, thi công ngày mai, carry-over hôm qua. Nút **Xem bảng ↓** bên Giấy phép/Thiết kế… → cuộn xuống + mở accordion module (viền tím 2 giây).
   - **Ảnh hiện trường:** Tối đa 4 ảnh/ngày — panel riêng dưới Nhật ký.
   - Chỉ user **được gán dự án** mới sửa; dự án khác chỉ xem.
5. **Module accordion** (mở từng mục):
   - **Risk** — rủi ro dự án
   - **Permit** — giấy phép (10% trọng số tiến độ)
   - **Design** — thiết kế (15%)
   - **Procurement** — mua sắm (25%)
   - **Construction** — thi công (40%)
   - **Handover** — bàn giao (10%)
   - Tick hoàn thành từng hạng mục → cập nhật % module và % tổng dự án.

---

## 4. Trang CÔNG VIỆC (\`/tasks\`)
- **Mobile**: Tab Lưới/Bảng/Lịch/Biểu đồ + tìm kiếm + nút + thêm tác vụ; thẻ thống kê 2×2.

### Chế độ xem (tab trên cùng)
- **Lưới**: Bảng danh sách (Tên tác vụ, **Mô tả**, Dự án…), sort cột, phân trang. Mô tả lưu cột GHI_CHÚ trên Sheet.
- **Bảng (Kanban)**: Cột theo **Bộ chứa** (VĂN PHÒNG, DỰ ÁN, ...).
- **Lịch**: Lịch tháng theo ngày bắt đầu/hạn.
- **Biểu đồ**: Trạng thái, ưu tiên, bộ chứa, thành viên.

### Thao tác
- **Thêm tác vụ**: Nút tím **"+ Thêm tác vụ"** góc phải → modal nhập (gán dự án, người, hạn, ưu tiên...).
- **Tìm kiếm**: "Tìm kiếm tác vụ..."
- **Xem/sửa**: Click dòng (Lưới) hoặc thẻ (Kanban) → panel chi tiết bên phải / modal.
- **Thẻ thống kê**: Tổng, Đang làm, Trễ, Hoàn thành, Ưu tiên cao.

### Trạng thái tự tính
- Quá hạn mà chưa hoàn thành → **Trễ**.
- Có ngày bắt đầu trong tương lai → **Chưa bắt đầu**.

---

## 5. Quy ước dữ liệu (bắt buộc khi giải thích)
- Milestone / công việc hiển thị **số ngày âm** (vd: -1, -4) = **TRỄ TIẾN ĐỘ** tương ứng, không phải hoàn thành sớm hay lỗi nhập.
- **Δ Kế hoạch** âm trên bảng dự án = chậm hơn kế hoạch.
- Dữ liệu có thể trễ vài giây khi đồng bộ Sheets; refresh trang nếu vừa sửa trên sheet khác.

---

## 6. Trang TÀI KHOẢN (\`/account\`)
- Xem email, vai trò, số dự án được gán.
- **Đổi mật khẩu**: Mật khẩu hiện tại + mới + xác nhận → Cập nhật.
- **Giao diện**: Sáng / Tối / Hệ thống (mobile cũng có icon góc phải trên).
- **Đăng xuất**: Nút đỏ cuối trang Tài khoản (hoặc sidebar desktop).

## 6b. Phân quyền PM/SM (quan trọng)
- PM/SM **toàn quyền** trên dự án được Admin **gán**: sửa module, nhật ký, vướng mắc, Theo dõi HĐ SM+, tạo/sửa/xóa task dự án đó.
- Dự án **không được gán** → **chỉ xem** (read-only), không nút Sửa nhật ký, không lưu module.
- Thêm dự án: mọi user đăng nhập. Xóa dự án: Admin hoặc người tạo dự án.
- Quản lý tài khoản / link chia sẻ khách: chỉ Admin chủ định.

## 6c. Hướng dẫn đầy đủ trên web
- Tài liệu training A–Z: https://vpeg-pxd-dashboard.vercel.app/huong-dan (mục lục 16 phần, milestone, site log chi tiết).

## 7. PXD — quy ước nội bộ VPEG (vũ phong by Tien Nguyen)
- Dự án rooftop C&I: OSAKA, VAL, v.v. — công suất kWp trên KPI tổng.
- Module tiến độ: Permit 10%, Design 15%, Procurement 25%, Construction 40%, Handover 10%.
- 15 hạng mục mua sắm chuẩn (xem Procurement).
- PM/SM ghi nhật ký site hàng ngày; delay âm = trễ.

## 8. Câu hỏi mẫu người dùng hay hỏi
- "Làm sao thêm dự án?" → /projects → **+ Thêm dự án**.
- "Làm sao thêm việc?" → /tasks → **+ Thêm tác vụ**.
- "Xem tiến độ một dự án?" → Click dự án → S-Curve + Milestone + module.
- "Ghi nhật ký site?" → Chi tiết dự án → tab Nhật ký → **Sửa nhật ký** → nhập → **Lưu ngay**.
- "Công việc ngày mai / Xem bảng?" → Góc phải dưới nhật ký ngày; bấm **Xem bảng ↓** để cuộn tới module Giấy phép/Thiết kế…
- "Milestone 100% mà vẫn xanh dương?" → Đang trong khung thời gian, chưa qua ngày kết thúc kế hoạch module.
- "PM/SM quyền gì?" → Toàn quyền dự án được gán; dự án khác chỉ xem.
- "Hướng dẫn đầy đủ?" → https://vpeg-pxd-dashboard.vercel.app/huong-dan
- "Xuất báo cáo?" → Chi tiết dự án → Export (in PDF) hoặc Danh sách dự án → Xuất Excel.
- "Đăng xuất?" → Tài khoản → Đăng xuất (mobile) hoặc sidebar desktop.
- "Đổi giao diện sáng tối?" → Icon mặt trời/trăng góc phải trên (mobile) hoặc sidebar.
- "Vật tư dự án X về mấy %?" → Hỏi khi đang mở chi tiết dự án X hoặc gọi tên dự án.
- "Dự án trễ vì sao?" → AI đọc milestone, procurement, site log, risk → đề xuất recovery.
`;

// Danh sách 15 hạng mục mua sắm chuẩn (đồng bộ với ProcurementModule)
const DEFAULT_PROCUREMENTS = [
  'An toàn tạm',
  'Dây cáp (AC/DC/Cứu sinh/dây mạng/dây tín hiệu,...)',
  'Lan can cứng',
  'Walkway',
  'Hệ thống khung đỡ (Rail, xà gồ, kẹp biên, kẹp giữa, kẹp seamlock, Pad L,..)',
  'Tấm pin PV ( Kẹp tiếp địa, kẹp thoát nước,...)',
  'Máng cáp (Máng DC, AC, nắp đậy máng, thanh V làm support,..)',
  'Nhà biến tần (khung lưới, mái tôn, chân trụ, bản mã, xà gồ, khung treo biến tần,...)',
  'Biến tần (Inverter, phụ kiện bấm MC4,...)',
  'Tủ điện (Isolator, ACDB)',
  'Hệ thống tiếp địa (dây PE, kẹp tiếp địa, hộp test box, dây đồng trần,...)',
  'Hệ PCCC (Quả cầu PCCC, tiêu lệnh, bình xịt PCCC,...)',
  'Hệ thống giám sát (Tủ Mornitoring, Bluelog, Data logger, UPS, nguồn điện,...)',
  'Hệ thống tủ thông tin/không phát ngược lưới (Tủ zero export, Multi Meter, CT,...)',
  'Hệ thống vệ sinh pin (Bơm, phụ kiện bơm, bồn nước, CB bơm, ống nước, khơi thủy)',
];

function normalizeFieldKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getAnyField(row, aliases) {
  if (!row) return '';
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const wanted = normalizeFieldKey(alias);
    const match = keys.find((key) => normalizeFieldKey(key) === wanted);
    if (match && row[match] !== undefined && row[match] !== null) {
      return row[match];
    }
  }
  return '';
}

function mergeProcurementsForAI(rawData) {
  const norm = normalizeFieldKey;
  return DEFAULT_PROCUREMENTS.map((name) => {
    const row = Array.isArray(rawData)
      ? rawData.find((r) => {
          const hm = getAnyField(r, [
            'HẠNG_MỤC_MUA_HÀNG',
            'HẠNG_MỤC',
            'HANG_MUC',
            'hangmuc',
            'hang_muc',
            'hang_muc_mua_hang',
          ]);
          return norm(hm) === norm(name);
        })
      : null;
    return {
      hang_muc: name,
      tinh_trang: getAnyField(row, [
        'TÌNH_TRẠNG_VẬT_TƯ',
        'tinhtrangvattu',
        'tinh_trang_vat_tu',
        'trang_thai_vat_tu',
      ]),
      ngay_du_kien: getAnyField(row, [
        'NGÀY_VỀ_DỰ_KIẾN',
        'ngayvedukien',
        'ngay_ve_du_kien',
        'ngay ve du kien',
        'expectedDate',
      ]),
      ngay_thuc_te: getAnyField(row, [
        'NGÀY_VỀ_THỰC_TẾ',
        'ngayvethucte',
        'ngay_ve_thuc_te',
        'ngay ve thuc te',
        'actualDate',
      ]),
      danh_gia: getAnyField(row, [
        'ĐÁNH_GIÁ_TIẾN_ĐỘ',
        'danhgiatiendo',
        'danh_gia_tien_do',
        'evaluation',
      ]),
      ghi_chu: getAnyField(row, [
        'GHI_CHÚ',
        'ghichu',
        'ghi_chu',
        'note',
      ]),
    };
  });
}

function findProcurementSubject(message, messages, procurements) {
  const recentText = [
    message,
    ...(Array.isArray(messages) ? messages.slice(-6).map((m) => m.content || '') : []),
  ].join(' ');
  const normalizedRecent = normalizeFieldKey(recentText);

  return procurements.find((item) => {
    const fullName = normalizeFieldKey(item.hang_muc);
    const shortName = normalizeFieldKey(String(item.hang_muc || '').split('(')[0]);
    return (shortName && normalizedRecent.includes(shortName)) ||
      (fullName && normalizedRecent.includes(fullName));
  });
}

function formatProcurementPercent(arrivedCount, totalCount) {
  if (!totalCount) return '0%';
  return `${Math.round((arrivedCount / totalCount) * 100)}%`;
}

function formatProcurementSummary(projectName, arrivedCount, totalCount, { allArrived = false } = {}) {
  const pct = formatProcurementPercent(arrivedCount, totalCount);
  const ratio = `${arrivedCount}/${totalCount} hạng mục (${pct})`;
  if (allArrived) {
    return `${projectName}: vật tư đã về đủ — ${ratio}.`;
  }
  return `${projectName}: vật tư đã về ${ratio}.`;
}

function formatProcurementLine(item) {
  const arrivalDate = item.ngay_thuc_te || item.ngay_du_kien || 'chưa có';
  const evaluation = item.danh_gia ? `, đánh giá: ${item.danh_gia}` : '';
  const note = item.ghi_chu ? `, ghi chú: ${item.ghi_chu}` : '';
  return `- ${item.hang_muc}: về ngày ${arrivalDate}${evaluation}${note}`;
}

function compactValue(value) {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (!text || text === '-' || text.toLowerCase() === 'null') return '';
  return text.length > 500 ? `${text.slice(0, 500)}...` : value;
}

function compactRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const cleaned = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      if (key === '_rowIndex') return;
      const compacted = compactValue(value);
      if (compacted !== '') cleaned[key] = compacted;
    });
    return cleaned;
  });
}

function buildTableSnapshot(tables) {
  if (!tables || typeof tables !== 'object') return null;
  const snapshot = {};
  Object.entries(tables).forEach(([tableName, rows]) => {
    if (!Array.isArray(rows)) return;
    snapshot[tableName] = {
      so_dong: rows.length,
      du_lieu: compactRows(rows),
    };
  });
  return snapshot;
}

function formatCurrentDateAnswer(now = new Date()) {
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const weekday = weekdays[now.getDay()];
  const date = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Hôm nay là ${weekday}, ngày ${date}. Giờ hiện tại khoảng ${time}.`;
}

function getTableRows(context, tableName, fallback = []) {
  const rows = context?.tables?.[tableName];
  return Array.isArray(rows) ? rows : fallback;
}

function getProjectIdentity(project) {
  if (!project) return [];
  return [
    project.id,
    project.PROJECT_ID,
    project.name,
    project.TÊN_DỰ_ÁN,
    project.PROJECT_NAME,
  ].filter(Boolean).map((value) => normalizeFieldKey(value));
}

function rowBelongsToProject(row, project) {
  if (!project) return true;
  const identities = getProjectIdentity(project);
  if (identities.length === 0) return true;
  const rowValues = [
    row.PROJECT_ID,
    row.projectId,
    row.TÊN_DỰ_ÁN,
    row.PROJECT_NAME,
    row.name,
  ].filter(Boolean).map((value) => normalizeFieldKey(value));
  return rowValues.some((value) => identities.includes(value));
}

function findProjectById(projectId, candidates) {
  if (!projectId) return null;
  const wanted = normalizeFieldKey(projectId);
  return candidates.find((project) =>
    getProjectIdentity(project).some((identity) => identity === wanted)
  ) || null;
}

function isOnProjectDetailPath(context) {
  return /^\/projects\/[^/]+/.test(context.currentPath || '');
}

function refersToCurrentProject(q) {
  return /duannay|projectnay|dangxem|trangnay|hientai|dangmo|nay/.test(q);
}

function findMentionedProject(context, userMessage) {
  const q = normalizeFieldKey(userMessage);
  const candidates = [
    ...(Array.isArray(context.projects) ? context.projects : []),
    ...getTableRows(context, 'PROJECT_MASTER'),
  ];

  const named = candidates.find((project) => {
    const identities = getProjectIdentity(project);
    return identities.some((identity) => identity && q.includes(identity));
  });
  if (named) return named;

  if (refersToCurrentProject(q) || isOnProjectDetailPath(context)) {
    if (context.currentProject) return context.currentProject;
    const fromId = findProjectById(context.projectId, candidates);
    if (fromId) return fromId;
  }

  return context.currentProject || findProjectById(context.projectId, candidates) || null;
}

function takeRows(rows, limit = 8) {
  return rows.slice(0, limit);
}

function formatProject(project) {
  const name = project.name || project.TÊN_DỰ_ÁN || project.PROJECT_NAME || project.PROJECT_ID || 'Dự án';
  const plan = project.planProgress ?? project.TIẾN_ĐỘ_KẾ_HOẠCH ?? project.PLAN_PROGRESS ?? '';
  const actual = project.actualProgress ?? project.TIẾN_ĐỘ_THỰC_TẾ ?? project.ACTUAL_PROGRESS ?? '';
  const delay = project.delay ?? project.DELAY ?? '';
  const status = project.status || project.TRẠNG_THÁI || project.STATUS || '';
  const risk = project.risk || project.RISK_LEVEL || '';
  const cod = project.cod || project.KẾ_HOẠCH_COD || project.COD_PLAN || '';
  return `- ${name}: kế hoạch ${plan || '-'}%, thực tế ${actual || '-'}%, delay ${delay || '-'}, trạng thái ${status || '-'}, risk ${risk || '-'}, COD ${cod || '-'}`;
}

function formatTask(task) {
  const title = task.TÁC_VỤ || task.TÊN_CÔNG_VIỆC || task.title || 'Task';
  const project = task.TÊN_DỰ_ÁN || task.PROJECT_ID || '';
  const status = task.TRẠNG_THÁI || task.computedStatus || task.status || '';
  const priority = task.ƯU_TIÊN || task.priority || '';
  const assignee = task.NHÂN_SỰ || task.assignee || task.ĐÃ_CHỈ_ĐỊNH_CHO || '';
  const due = task.NGÀY_KẾT_THÚC || task.ĐẾN_HẠN || task.due || '';
  return `- ${title}${project ? ` (${project})` : ''}: ${status || 'chưa rõ'}${priority ? `, ưu tiên ${priority}` : ''}${assignee ? `, phụ trách ${assignee}` : ''}${due ? `, hạn ${due}` : ''}`;
}

function formatRisk(risk) {
  const text = risk.MÔ_TẢ || risk.RISK || risk.description || risk.VƯỚNG_MẮC || 'Rủi ro';
  const level = risk.MỨC_ĐỘ || risk.LEVEL || risk.level || risk.RISK_LEVEL || '';
  const status = risk.TRẠNG_THÁI || risk.STATUS || '';
  const action = risk.BIỆN_PHÁP || risk.ACTION || risk.GIẢI_PHÁP || '';
  return `- ${text}${level ? ` — mức ${level}` : ''}${status ? `, trạng thái ${status}` : ''}${action ? `, xử lý: ${action}` : ''}`;
}

function formatMilestone(row) {
  const name = row.MILESTONE || row.HẠNG_MỤC || row.TÊN_MỐC || row.name || 'Milestone';
  const plan = row.NGÀY_KẾ_HOẠCH || row.PLAN_DATE || row.KẾ_HOẠCH || '';
  const actual = row.NGÀY_THỰC_TẾ || row.ACTUAL_DATE || row.THỰC_TẾ || '';
  const delay = row.DELAY || row.delay || '';
  const status = row.TRẠNG_THÁI || row.STATUS || '';
  return `- ${name}: kế hoạch ${plan || '-'}, thực tế ${actual || '-'}${delay !== '' ? `, delay ${delay}` : ''}${status ? `, ${status}` : ''}`;
}

function formatConstruction(row) {
  const item = row.HẠNG_MỤC_CÔNG_VIỆC || row.HẠNG_MỤC || row.MÃ_CV || 'Hạng mục thi công';
  const group = row.NHÓM_THI_CÔNG || row.NHÓM || '';
  const progress = row.TIẾN_ĐỘ_THỰC_TẾ ?? row.ACTUAL_PROGRESS ?? row.progress ?? '';
  const start = row.NGÀY_BẮT_ĐẦU || '';
  const end = row.NGÀY_KẾT_THÚC || row.NGÀY_HT_THỰC_TẾ || '';
  return `- ${item}${group ? ` (${group})` : ''}: tiến độ ${progress || '-'}${start ? `, bắt đầu ${start}` : ''}${end ? `, kết thúc ${end}` : ''}`;
}

function formatSiteLog(row) {
  const date = row.LOG_DATE || row.NGÀY || 'Ngày chưa rõ';
  const manpower = row.MANPOWER ?? row.NHÂN_LỰC_SITE ?? '';
  const engineers = row.ENGINEERS ?? row.KỸ_SƯ_GS ?? '';
  const weather = row.WEATHER || row.THỜI_TIẾT || '';
  const note = row.DAILY_NOTE || row.GHI_CHÚ_HIỆN_TRƯỜNG || '';
  return `- ${date}: nhân lực ${manpower || 0}, kỹ sư ${engineers || 0}${weather ? `, thời tiết ${weather}` : ''}${note ? ` — ${note}` : ''}`;
}

function formatWebMapAnswer() {
  return [
    'Web có các phần chính:',
    '- Tổng quan: KPI, tiến độ dự án, rủi ro, task quan trọng.',
    '- Dự án: danh sách dự án, lọc, xuất Excel, thêm/sửa dự án.',
    '- Chi tiết dự án: tiến độ, milestone, S-Curve, site log, risk, permit, design, procurement, construction, handover.',
    '- Công việc: task, trạng thái, ưu tiên, người phụ trách, hạn.',
    '- AI PXD: hỏi dữ liệu web, cách dùng app, phân tích Solar EPC.',
  ].join('\n');
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function getProjectProgress(project) {
  const plan = toNumber(project?.planProgress ?? project?.TIẾN_ĐỘ_KẾ_HOẠCH ?? project?.PLAN_PROGRESS);
  const actual = toNumber(project?.actualProgress ?? project?.TIẾN_ĐỘ_THỰC_TẾ ?? project?.ACTUAL_PROGRESS);
  const rawDelay = toNumber(project?.delay ?? project?.DELAY);
  const gap = rawDelay ?? (actual !== null && plan !== null ? actual - plan : null);
  return { plan, actual, gap };
}

function isDelayedValue(value) {
  const num = toNumber(value);
  if (num !== null) return num < 0;
  return /trễ|tre|delay|chậm|cham/i.test(String(value || ''));
}

function getLatestSiteLog(siteLogs) {
  return Array.isArray(siteLogs) && siteLogs.length > 0 ? siteLogs[siteLogs.length - 1] : null;
}

function getRowNote(row) {
  return getAnyField(row, [
    'GHI_CHÚ',
    'GHI_CHÚ_HIỆN_TRƯỜNG',
    'DAILY_NOTE',
    'WEEKLY_ASSESSMENT',
    'MONTHLY_REPORT',
    'MÔ_TẢ',
    'BIỆN_PHÁP',
    'ACTION',
    'GIẢI_PHÁP',
    'VƯỚNG_MẮC',
    'THỜI_TIẾT',
    'WEATHER',
    'NOTE',
  ]);
}

function collectNotes(label, rows, formatter = getRowNote) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const note = formatter(row);
      return note ? { label, note: String(note), row } : null;
    })
    .filter(Boolean);
}

function hasRaw(text, pattern) {
  return pattern.test(String(text || '').toLowerCase());
}

function hasNorm(text, pattern) {
  return pattern.test(normalizeFieldKey(text));
}

function classifyEPCNotes(notes) {
  const buckets = {
    weather: [],
    procurement: [],
    manpower: [],
    designPermit: [],
    construction: [],
    risk: [],
  };

  notes.forEach((item) => {
    const text = item.note;
    if (hasRaw(text, /mưa|giông|bão|gió lớn|thời tiết|ẩm ướt/) || hasNorm(text, /rain|storm|weather|wind/)) {
      buckets.weather.push(item);
    }
    if (hasRaw(text, /vật tư|nhà cung cấp|ncc|giao hàng|chậm giao|eta|lead time|thiếu hàng/) || hasNorm(text, /supplier|delivery|material|procurement|leadtime|eta/)) {
      buckets.procurement.push(item);
    }
    if (hasRaw(text, /nhân lực|nhân sự|thiếu người|đội thi công|kỹ sư|giám sát/) || hasNorm(text, /manpower|engineer|worker|crew/)) {
      buckets.manpower.push(item);
    }
    if (hasRaw(text, /thiết kế|bản vẽ|permit|giấy phép|phê duyệt|đấu nối|pccc/) || hasNorm(text, /design|drawing|permit|approval/)) {
      buckets.designPermit.push(item);
    }
    if (hasRaw(text, /thi công|lắp đặt|mái|kéo cáp|inverter|module|tủ điện|khung/) || hasNorm(text, /construction|install|roof|cable|inverter|module/)) {
      buckets.construction.push(item);
    }
    if (hasRaw(text, /rủi ro|vướng mắc|sự cố|issue|risk|blocker|chờ/) || hasNorm(text, /risk|issue|blocker|incident/)) {
      buckets.risk.push(item);
    }
  });

  return buckets;
}

function formatNoteExamples(items, limit = 2) {
  return items.slice(0, limit).map((item) => `"${item.note}"`).join('; ');
}

function buildEPCRecommendations(causes) {
  const actions = [];
  if (causes.weather.length) {
    actions.push('Mưa/thời tiết: chuyển việc ngoài trời sang việc trong nhà/xưởng (lắp tủ, pre-assembly, kiểm vật tư), che chắn khu vực làm được, cập nhật look-ahead 3 ngày và bù tiến độ bằng tăng ca khi khô ráo');
  }
  if (causes.procurement.length) {
    actions.push('Vật tư/NCC: xác nhận ETA từng hạng mục blocking, tách giao hàng từng phần, ưu tiên vật tư đường găng, có phương án NCC thay thế hoặc mượn tạm vật tư tương đương đã duyệt');
  }
  if (causes.manpower.length) {
    actions.push('Nhân sự: bổ sung đội thi công/kỹ sư GS cho khu vực chậm, chia ca, giao sản lượng/ngày và kiểm soát output cuối ngày');
  }
  if (causes.designPermit.length) {
    actions.push('Thiết kế/giấy phép: mở danh sách pending approval, gán owner/deadline, ưu tiên bản vẽ/permit đang chặn thi công và họp daily 15 phút để gỡ');
  }
  if (causes.construction.length) {
    actions.push('Thi công: xác định hạng mục đường găng, tăng nguồn lực cho roof/DC cable/inverter nếu đang chậm, nghiệm thu cuốn chiếu để không dồn cuối dự án');
  }
  if (causes.risk.length) {
    actions.push('Risk/issue: lập action log gồm nguyên nhân, owner, deadline, trạng thái, escalation nếu quá hạn 24-48h');
  }
  return actions;
}

function analyzeProjectRecovery({ project, projectName, procurements, milestones, constructions, risks, siteLogs }) {
  const { plan, actual, gap } = getProjectProgress(project);
  const delayedMilestones = milestones.filter((row) =>
    isDelayedValue(row.DELAY ?? row.delay ?? row.TRẠNG_THÁI ?? row.STATUS)
  );
  const delayedConstructions = constructions.filter((row) =>
    isDelayedValue(row.ĐÁNH_GIÁ_TIẾN_ĐỘ ?? row.TRẠNG_THÁI ?? row.STATUS) ||
    (toNumber(row.TIẾN_ĐỘ_THỰC_TẾ ?? row.ACTUAL_PROGRESS) !== null &&
      toNumber(row.TIẾN_ĐỘ_THỰC_TẾ ?? row.ACTUAL_PROGRESS) < 100)
  );
  const activeRisks = risks.filter((row) =>
    !/đóng|dong|done|closed|hoàn thành|hoan thanh/i.test(String(row.TRẠNG_THÁI || row.STATUS || ''))
  );
  const notArrivedProcurements = procurements.filter((item) =>
    !normalizeFieldKey(item.tinh_trang).includes('datoisite')
  );
  const latestLog = getLatestSiteLog(siteLogs);
  const manpower = latestLog ? toNumber(latestLog.MANPOWER ?? latestLog.NHÂN_LỰC_SITE) : null;
  const engineers = latestLog ? toNumber(latestLog.ENGINEERS ?? latestLog.KỸ_SƯ_GS) : null;
  const notes = [
    ...collectNotes('risk', risks),
    ...collectNotes('construction', constructions),
    ...collectNotes('site log', siteLogs),
    ...collectNotes('procurement', procurements, (item) => item.ghi_chu || item.danh_gia || item.tinh_trang),
  ];
  const causes = classifyEPCNotes(notes);
  const epcActions = buildEPCRecommendations(causes);

  const status =
    gap === null
      ? 'chưa đủ dữ liệu để kết luận trễ hay không'
      : gap < 0
        ? `đang trễ ${Math.abs(gap)}% so với kế hoạch`
        : `đang đạt/vượt ${gap}% so với kế hoạch`;

  const blockers = [];
  if (delayedMilestones.length) blockers.push(`${delayedMilestones.length} milestone có dấu hiệu trễ`);
  if (delayedConstructions.length) blockers.push(`${delayedConstructions.length} hạng mục thi công chưa xong/chậm`);
  if (notArrivedProcurements.length) blockers.push(`${notArrivedProcurements.length} hạng mục vật tư chưa tới site/chưa có trạng thái`);
  if (activeRisks.length) blockers.push(`${activeRisks.length} rủi ro/vướng mắc đang mở`);
  if (manpower !== null && manpower < 5) blockers.push(`nhân lực site thấp (${manpower} người)`);
  if (causes.weather.length) blockers.push(`thời tiết/mưa ảnh hưởng (${formatNoteExamples(causes.weather)})`);
  if (causes.procurement.length) blockers.push(`ghi chú vật tư/NCC (${formatNoteExamples(causes.procurement)})`);
  if (causes.designPermit.length) blockers.push(`thiết kế/giấy phép/phê duyệt đang ảnh hưởng (${formatNoteExamples(causes.designPermit)})`);

  const actions = [];
  if (gap !== null && gap < 0) actions.push('chốt recovery plan theo ngày: tăng ca/ca cuối tuần cho các hạng mục đường găng');
  if (notArrivedProcurements.length) actions.push('đẩy procurement: xác nhận ETA, ưu tiên vật tư blocking, tách giao hàng từng phần');
  if (delayedConstructions.length) actions.push('bổ sung đội thi công cho nhóm chậm nhất, giao sản lượng/ngày rõ ràng');
  if (manpower !== null && manpower < 5) actions.push('bổ sung nhân sự site hoặc điều đội hỗ trợ trong 3-5 ngày cao điểm');
  if (engineers !== null && engineers < 1) actions.push('bố trí kỹ sư GS bám site để gỡ vướng nhanh');
  if (activeRisks.length) actions.push('mở action log cho rủi ro/vướng mắc: owner, deadline, trạng thái mỗi ngày');
  actions.push(...epcActions);
  if (!actions.length) actions.push('duy trì nhịp hiện tại, tiếp tục theo dõi milestone và S-Curve hằng ngày');

  return [
    `${projectName} ${status}.`,
    plan !== null || actual !== null ? `Kế hoạch: ${plan ?? '-'}%, thực tế: ${actual ?? '-'}%.` : '',
    blockers.length ? `Điểm nghẽn: ${blockers.join('; ')}.` : 'Điểm nghẽn: chưa thấy blocker rõ trong dữ liệu.',
    `Cách kéo lại: ${actions.join('; ')}.`,
  ].filter(Boolean).join('\n\n');
}

function isCountQuestion(q) {
  return /tong|baonhieu|may|soluong|dem|count/.test(q);
}

export function getLocalDataAnswer(userMessage, context = {}, messages = []) {
  const q = normalizeFieldKey(userMessage);
  const isCurrentDateQuestion =
    /homnay|hnay|ngayhomnay|thu may|thumay|baygio|giohientai|maygio|ngayhientai|today|date|time/.test(q);

  if (isCurrentDateQuestion) {
    return formatCurrentDateAnswer();
  }

  if (/webcogi|appcogi|namdau|odau|module|chucnang|menugom|dulieunamdau|bangnao/.test(q)) {
    return formatWebMapAnswer();
  }

  const usageHint = getOfflineAppHint(userMessage);
  if (usageHint) return usageHint;

  const selectedProject = findMentionedProject(context, userMessage);
  const projectName = selectedProject?.name || selectedProject?.TÊN_DỰ_ÁN || selectedProject?.PROJECT_NAME || 'dự án đang xem';

  const masterProjects = getTableRows(context, 'PROJECT_MASTER', context.projects || []);
  const allTasks = getTableRows(context, 'PROJECT_TASKS', context.tasks || []);
  const projectTasks = allTasks.filter((row) => rowBelongsToProject(row, selectedProject));
  const risks = getTableRows(context, 'PROJECT_RISK', context.risks || []).filter((row) => rowBelongsToProject(row, selectedProject));
  const milestones = getTableRows(context, 'PROJECT_MILESTONE', context.milestones || []).filter((row) => rowBelongsToProject(row, selectedProject));
  const constructions = getTableRows(context, 'PROJECT_CONSTRUCTION', context.constructions || []).filter((row) => rowBelongsToProject(row, selectedProject));
  const siteLogs = getTableRows(context, 'DAILY_SITE_LOG', context.siteLogs || []).filter((row) => rowBelongsToProject(row, selectedProject));
  const procurementRows = getTableRows(context, 'PROJECT_PROCUREMENT', context.procurements || [])
    .filter((row) => rowBelongsToProject(row, selectedProject));
  const mergedProcurements = selectedProject ? mergeProcurementsForAI(procurementRows) : [];
  const wantsCount = isCountQuestion(q);
  const wantsAnalysis = /phantich|danhgia|tre|cham|delay|laylaitiendo|kehoachkeolai|recover|catchup|nguyennhan|diemnghen|nhansu|bosung|yeu|thieu|tien do|tiendo/.test(q);

  if (wantsAnalysis && selectedProject) {
    return analyzeProjectRecovery({
      project: selectedProject,
      projectName,
      procurements: mergedProcurements,
      milestones,
      constructions,
      risks,
      siteLogs,
    });
  }

  if (wantsAnalysis && !selectedProject && masterProjects.length) {
    const delayedProjects = masterProjects.filter((project) => {
      const { gap } = getProjectProgress(project);
      return gap !== null && gap < 0;
    });
    if (delayedProjects.length) {
      return `Có ${delayedProjects.length}/${masterProjects.length} dự án đang trễ tiến độ:\n\n${takeRows(delayedProjects, 5).map(formatProject).join('\n')}`;
    }
    return `Chưa thấy dự án nào trễ theo chênh lệch tiến độ hiện có.`;
  }

  const isProcurementQuestion =
    /vattu|muasam|hangmuc|toisite|datoi|dave|vengaynao|ngayvedukien|ngayvethucte|ngaynao|vechua|vedu|duchua|daydu|thieugi|mayphantram|baonhieu%|chiebbaonhieu%/.test(q);

  if (isProcurementQuestion && selectedProject) {
    const procurements = mergedProcurements;
    const arrived = procurements.filter((item) =>
      normalizeFieldKey(item.tinh_trang).includes('datoisite')
    );
    const subject = findProcurementSubject(userMessage, messages, procurements);
    const asksComplete = /duchua|daydu|vechua|vedu|thieugi|duchua/.test(q);

    if (asksComplete) {
      const allArrived = procurements.length > 0 && arrived.length === procurements.length;
      const summary = allArrived
        ? formatProcurementSummary(projectName, arrived.length, procurements.length, { allArrived: true })
        : `${formatProcurementSummary(projectName, arrived.length, procurements.length)} Vật tư chưa về đủ.`;
      const arrivedLines = arrived.length > 0
        ? `\n\nĐã tới site:\n${arrived.map(formatProcurementLine).join('\n')}`
        : '\n\nChưa có hạng mục nào đã tới site.';
      return `${summary}${arrivedLines}`;
    }

    if (wantsCount) {
      const pct = formatProcurementPercent(arrived.length, procurements.length);
      return `${projectName} có ${arrived.length}/${procurements.length} hạng mục vật tư đã tới site (${pct}).`;
    }

    if (subject && /ngaynao|ngayve|vedukien|vethucte/.test(q)) {
      return `${projectName} — ${subject.hang_muc}\n\n${formatProcurementLine(subject)}`;
    }

    if (/ngaynao|ngayve|vedukien|vethucte/.test(q)) {
      const lines = arrived.length > 0
        ? arrived.map(formatProcurementLine).join('\n')
        : 'Chưa có hạng mục nào có trạng thái Đã tới site.';
      return `${projectName} — Ngày về vật tư đã tới site\n\n${lines}`;
    }

    const summary = formatProcurementSummary(projectName, arrived.length, procurements.length);
    const arrivedLines = arrived.length > 0
      ? `\n\nĐã tới site:\n${arrived.map(formatProcurementLine).join('\n')}`
      : '\n\nChưa có hạng mục nào đã tới site.';
    return `${summary}${arrivedLines}`;
  }

  if (/task|congviec|tacvu|viec/.test(q)) {
    const rows = selectedProject ? projectTasks : allTasks;
    if (!rows.length) return `Không thấy task phù hợp trong dữ liệu hiện có.`;
    if (wantsCount) return `${selectedProject ? projectName : 'Hiện tại'} có ${rows.length} task.`;
    return `Task${selectedProject ? ` của ${projectName}` : ''} — ${rows.length} dòng\n\n${takeRows(rows).map(formatTask).join('\n')}`;
  }

  if (/ruiro|risk|vuongmac|vande/.test(q)) {
    if (!risks.length) return `Không thấy rủi ro/vướng mắc phù hợp trong dữ liệu hiện có.`;
    if (wantsCount) return `${selectedProject ? projectName : 'Hiện tại'} có ${risks.length} rủi ro/vướng mắc.`;
    return `Rủi ro/Vướng mắc${selectedProject ? ` của ${projectName}` : ''} — ${risks.length} dòng\n\n${takeRows(risks).map(formatRisk).join('\n')}`;
  }

  if (/milestone|moc|timeline|cod|kickoff/.test(q)) {
    if (!milestones.length) return `Không thấy milestone phù hợp trong dữ liệu hiện có.`;
    if (wantsCount) return `${selectedProject ? projectName : 'Hiện tại'} có ${milestones.length} milestone.`;
    return `Milestone${selectedProject ? ` của ${projectName}` : ''} — ${milestones.length} dòng\n\n${takeRows(milestones).map(formatMilestone).join('\n')}`;
  }

  if (/thicong|construction|lapdat|maicong|tien do thi cong|tiendothicong/.test(q)) {
    if (!constructions.length) return `Không thấy dữ liệu thi công phù hợp trong bảng hiện có.`;
    if (wantsCount) return `${selectedProject ? projectName : 'Hiện tại'} có ${constructions.length} hạng mục thi công.`;
    return `Thi công${selectedProject ? ` của ${projectName}` : ''} — ${constructions.length} dòng\n\n${takeRows(constructions).map(formatConstruction).join('\n')}`;
  }

  if (/nhatky|sitelog|hientruong|site/.test(q)) {
    if (!siteLogs.length) return `Không thấy nhật ký site phù hợp trong dữ liệu hiện có.`;
    if (wantsCount) return `${selectedProject ? projectName : 'Hiện tại'} có ${siteLogs.length} dòng nhật ký site.`;
    return `Nhật ký site${selectedProject ? ` của ${projectName}` : ''} — ${siteLogs.length} dòng gần nhất\n\n${takeRows([...siteLogs].reverse()).map(formatSiteLog).join('\n')}`;
  }

  if (/duan|project|tiendo|rasao|tongquan|status|trangthai|delay/.test(q)) {
    const rows = selectedProject ? [selectedProject] : masterProjects;
    if (!rows.length) return `Không thấy dự án phù hợp trong dữ liệu hiện có.`;
    if (wantsCount && !selectedProject) return `Hiện tại có ${rows.length} dự án.`;
    if (!selectedProject && isOnProjectDetailPath(context)) {
      return `Mở đúng chi tiết dự án rồi hỏi lại, hoặc gọi tên dự án cụ thể (ví dụ OSAKA, VAL).`;
    }
    if (wantsCount) return `Hiện tại có ${rows.length} dự án.`;
    return `Dữ liệu dự án${selectedProject ? ` — ${projectName}` : ''}\n\n${takeRows(rows).map(formatProject).join('\n')}`;
  }

  if (/huongdantrang|trangnay|trangdangxem|trangnaylamgi|dungde/.test(q)) {
    const pageHint = getCurrentPageHint(context);
    if (pageHint) return pageHint;
  }

  if (/dangxuat|logout|thoat/.test(q)) {
    return 'Đăng xuất: Tài khoản (mobile) hoặc icon thoát sidebar (desktop).';
  }
  if (/sang|toi|giaodien|theme|chedo/.test(q)) {
    return 'Giao diện: icon mặt trời/trăng góc phải trên (Sáng/Tối/Hệ thống) hoặc trang Tài khoản.';
  }

  const solarFaq = getSolarFaqAnswer(userMessage);
  if (solarFaq) return solarFaq;

  return null;
}

const PAGE_HINTS = {
  'Tổng quan': 'KPI 2×2 (mobile), thẻ tiến độ/rủi ro, kanban công việc. Góc phải trên: thông báo + giao diện.',
  'Danh sách dự án': 'Mobile: thẻ dự án. Desktop: bảng + lọc + Thêm dự án + Xuất Excel.',
  'Chi tiết dự án': 'Tab KPI/Milestone/Nhật ký/S-Curve/Hạng mục. Site Log tự lưu. Module accordion tick %.',
  'Danh sách công việc': 'Lưới/Kanban/Lịch/Biểu đồ. + Thêm tác vụ. Thẻ thống kê tổng/trễ/hoàn thành.',
  'Tài khoản': 'Đổi mật khẩu, chọn Sáng/Tối/Hệ thống, nút Đăng xuất.',
  'Cài đặt': 'Admin: quản lý user, nhật ký hệ thống.',
};

function getCurrentPageHint(context) {
  const page = context?.currentPage || '';
  const hint = PAGE_HINTS[page];
  if (!hint) return null;
  return `Bạn đang ở ${page}.\n\n${hint}\n\nHỏi cụ thể hơn (vd: "vật tư về mấy %", "milestone trễ không", "thêm task thế nào").`;
}

export function buildSystemInstruction(context = {}) {
  const {
    currentPage,
    currentPath,
    currentDateTime,
    projects,
    tasks,
    currentProject,
    projectId,
    // chi tiết dự án (khi đang ở trang /projects/:id)
    milestones,
    risks,
    procurements,
    constructions,
    siteLogs,
    permits,
    designs,
    tables,
  } = context;

  // Gửi dự án đang xem nếu có; không trộn toàn bộ danh sách khi đang ở chi tiết dự án
  const projectSource = Array.isArray(projects) ? projects : [];
  const scopedProjects = currentProject
    ? projectSource.filter((p) => rowBelongsToProject(p, currentProject))
    : projectSource;
  const projectsForPrompt = (currentProject && scopedProjects.length === 0)
    ? [currentProject]
    : (currentProject ? scopedProjects : projectSource);

  const allProjects = projectsForPrompt.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    pm: p.pm,
    capacity: p.capacity,
    status: p.status,
    planProgress: p.planProgress,
    actualProgress: p.actualProgress,
    delay: p.delay,
    risk: p.risk,
    issue: p.issue,
    cod: p.cod,
  }));

  const taskSource = Array.isArray(tasks) ? tasks : [];
  const scopedTasks = currentProject
    ? taskSource.filter((t) => rowBelongsToProject(t, currentProject))
    : taskSource;

  const allTasks = scopedTasks.map((t) => ({
    title: t.TÁC_VỤ || t.title,
    description: t.GHI_CHÚ || t.MÔ_TẢ || '',
    project: t.TÊN_DỰ_ÁN || t.PROJECT_ID,
    status: t.TRẠNG_THÁI,
    priority: t.ƯU_TIÊN,
    assignee: t.NHÂN_SỰ || t.assignee,
    start: t.NGÀY_BẮT_ĐẦU,
    due: t.NGÀY_KẾT_THÚC,
  }));

  // Merge procurement với danh sách chuẩn 15 mục — đếm đúng theo TÌNH_TRẠNG_VẬT_TƯ
  let procurementSummary = null;
  if (currentProject) {
    const merged = mergeProcurementsForAI(procurements);
    const arrived = merged.filter((p) =>
      (p.tinh_trang || '').toLowerCase().includes('đã tới') ||
      (p.tinh_trang || '').toLowerCase().includes('da toi')
    );
    const late = merged.filter((p) =>
      (p.danh_gia || '').toLowerCase().includes('trễ')
    );
    const noInfo = merged.filter((p) => !(p.tinh_trang || '').trim());
    procurementSummary = {
      tong_hang_muc: merged.length,
      da_toi_site: arrived.length,
      chua_co_thong_tin: noInfo.length,
      tre_tien_do: late.length,
      chi_tiet: merged,
    };
  }

  // Tóm tắt risks
  let riskSummary = null;
  if (Array.isArray(risks) && risks.length > 0) {
    riskSummary = risks.map((r) => ({
      mo_ta: r.MÔ_TẢ || r.RISK || r.description || '',
      muc_do: r.MỨC_ĐỘ || r.LEVEL || r.level || '',
      bien_phap: r.BIỆN_PHÁP || r.ACTION || '',
      trang_thai: r.TRẠNG_THÁI || r.STATUS || '',
    }));
  }

  const dataSnapshot = {
    trang_hien_tai: currentPage || '',
    duong_dan: currentPath || '',
    thoi_gian_hien_tai: currentDateTime || new Date().toLocaleString('vi-VN'),
    tong_du_an: allProjects.length,
    tong_cong_viec: allTasks.length,
    du_an: allProjects,
    cong_viec: allTasks,
  };

  const tableSnapshot = buildTableSnapshot(tables);
  if (tableSnapshot && currentProject) {
    ['PROJECT_MASTER', 'PROJECT_TASKS', 'PROJECT_RISK', 'PROJECT_MILESTONE', 'PROJECT_PROCUREMENT', 'PROJECT_CONSTRUCTION', 'DAILY_SITE_LOG', 'PROJECT_PERMIT', 'PROJECT_DESIGN'].forEach((tableName) => {
      if (!Array.isArray(tableSnapshot[tableName]?.du_lieu)) return;
      tableSnapshot[tableName].du_lieu = tableSnapshot[tableName].du_lieu.filter((row) => rowBelongsToProject(row, currentProject));
      tableSnapshot[tableName].so_dong = tableSnapshot[tableName].du_lieu.length;
    });
  }
  if (tableSnapshot) {
    dataSnapshot.bang_du_lieu = tableSnapshot;
  }

  // Nếu đang xem chi tiết dự án — thêm đầy đủ data
  if (currentProject) {
    dataSnapshot.du_an_dang_xem = {
      thong_tin: {
        id: currentProject.id,
        ten: currentProject.name,
        khach_hang: currentProject.client,
        cong_suat_kwp: currentProject.capacity,
        pm: currentProject.pm,
        sm: currentProject.sm,
        trang_thai: currentProject.status,
        tien_do_ke_hoach: currentProject.planProgress,
        tien_do_thuc_te: currentProject.actualProgress,
        delay_ngay: currentProject.delay,
        muc_rui_ro: currentProject.risk,
        vuong_mac: currentProject.issue,
        cod_ke_hoach: currentProject.cod,
      },
      milestone: milestones || [],
      rui_ro: riskSummary || [],
      vat_tu_mua_sam: procurementSummary || null,
      thi_cong: constructions || [],
      nhat_ky_site: siteLogs ? siteLogs.slice(0, 10) : [],
      giay_phep: permits || [],
      thiet_ke: designs || [],
    };
  }

  const dataJson = JSON.stringify(dataSnapshot, null, 0);

  return `Bạn là **AI PXD** — trợ lý thông minh của Phòng Xây Dựng VPEG-PXD, tích hợp trong Dashboard Solar EPC.

## Vai trò
1. **Ưu tiên nội dung web**: dữ liệu dự án, task, risk, milestone, vật tư, thi công, nhật ký site, S-Curve.
2. **Hướng dẫn app**: Giải thích từng bước thao tác, đúng tên nút/menu tiếng Việt.
3. **Chuyên gia Solar EPC**: Tư vấn kỹ thuật khi câu hỏi không phải dữ liệu/cách dùng web.

## Phong cách trả lời (BẮT BUỘC)
- **Một câu hỏi → một mục đích**: trả đúng thứ người dùng hỏi, không lan sang module khác.
- **Mặc định ngắn**: 2–6 dòng hoặc bullet gọn. Không mở bài "Dựa trên dữ liệu..." / không kết bài "Nếu cần thêm...".
- **Chỉ dài** khi user hỏi rõ: "phân tích", "vì sao", "đề xuất", "cách xử lý", "lấy lại tiến độ".
- **Số liệu**: trả con số trước, giải thích sau (vd: **6/15 (40%)** rồi mới liệt kê).
- **Danh sách**: tối đa 8 dòng trừ khi user yêu cầu "tất cả" / "chi tiết".
- **Không lặp** câu hỏi, không nhắc lại quy tắc hệ thống cho user.

## Quy tắc dữ liệu
- Luôn trả lời tiếng Việt, thân thiện, chuyên nghiệp.
- Số âm ở delay/COD = TRỄ. Không bịa số liệu.
- Không dùng ** hay markdown in đậm. Chỉ plain text và bullet "-" khi cần.
- Thứ tự ưu tiên: **(1) dữ liệu bảng/web**, **(2) cách dùng web**, **(3) kiến thức Solar EPC**, **(4) kiến thức chung**.
- Nếu câu hỏi có thể trả lời từ dữ liệu bảng thì phải trả lời bằng số liệu/tên dòng cụ thể, không nói chung chung.
- Nếu người dùng hỏi dạng **tổng / bao nhiêu / mấy / số lượng** thì chỉ trả lời con số và đơn vị, không liệt kê danh sách nếu chưa được hỏi thêm.
- Nếu hỏi **tiến độ / trễ / lấy lại tiến độ**: phân tích theo chuỗi Project → milestone → construction → procurement → risk → site log. Trả lời: kết luận → điểm nghẽn → hành động (3 phần, không dài hơn).
- Khi phân tích đọc ghi chú: GHI_CHÚ, DAILY_NOTE, THỜI_TIẾT, BIỆN_PHÁP, VƯỚNG_MẮC.
- Thiếu data → nói rõ thiếu gì + gợi ý mở đúng trang app.
- Không tiết lộ source code, API key, .env.
- Khi hỏi "bảng có gì", "task nào": đọc "bang_du_lieu.du_lieu".
- Khi hỏi **vật tư**: dùng "vat_tu_mua_sam", đếm tinh_trang = "Đã tới site".
- Đang xem **chi tiết dự án** (có "du_an_dang_xem"): chỉ trả lời dự án đó.
- **Vật tư đã về**: dạng **X/Y (Z%)**, chỉ liệt kê hạng mục đã tới site (tên, ngày về, đánh giá, ghi chú). Không liệt kê chưa về trừ khi hỏi rõ.

## Hướng dẫn sử dụng app
${APP_USAGE_GUIDE}

${SOLAR_EPC_KNOWLEDGE}

## Dữ liệu thực tế (JSON):
\`\`\`json
${dataJson}
\`\`\``;
}

/** Gợi ý nhanh khi API lỗi — chỉ câu hỏi app phổ biến */
export function getOfflineAppHint(userMessage) {
  const q = (userMessage || '').toLowerCase();
  if (/thêm.*dự án|tạo.*dự án|add project/.test(q)) {
    return 'Vào menu DỰ ÁN (sidebar) → nút "+ Thêm dự án" màu tím ở góc phải header.';
  }
  if (/thêm.*(tác vụ|công việc|việc)|tạo.*việc/.test(q)) {
    return 'Vào CÔNG VIỆC → "+ Thêm tác vụ" góc phải (cạnh ô tìm kiếm).';
  }
  if (/s-curve|tiến độ|biểu đồ.*dự án/.test(q)) {
    return 'Mở chi tiết dự án (click dòng trong bảng Dự án) → cuộn xuống khối S-Curve.';
  }
  if (/nhật ký|site log|hiện trường/.test(q)) {
    return 'Chi tiết dự án → tab Nhật ký → **Sửa nhật ký** → nhập nhân lực/tiến độ thi công/ghi chú → **Lưu ngay** (mobile: thanh cuối). Công việc ngày mai: góc phải dưới; **Xem bảng ↓** cuộn tới module.';
  }
  if (/xem bảng|ngày mai|cong viec ngay mai/.test(q)) {
    return 'Trong Nhật ký ngày → khối **Công việc ngày mai** (góc phải). Bấm **Xem bảng ↓** cạnh Giấy phép/Thiết kế… để cuộn xuống bảng module tương ứng.';
  }
  if (/milestone|mốc|theo dõi hđ|sm\+/.test(q)) {
    return 'Tab Milestone → 7 mốc (Kickoff→COD). 4 màu: xanh lá=HT, xanh dương=đang làm (kể cả 100% chưa tới ngày KT), xám=chưa, đỏ=delay. **Theo dõi HĐ SM+** = mốc hợp đồng nội bộ (chỉ nội bộ).';
  }
  if (/pm\/sm|phân quyền|quyền|toàn quyền/.test(q)) {
    return 'PM/SM **toàn quyền** dự án được Admin gán (module, nhật ký, task…). Dự án không gán → **chỉ xem**. Liên hệ Admin nếu thiếu quyền sửa.';
  }
  if (/huong dan|hướng dẫn|hdvh|tài liệu|doc/.test(q)) {
    return 'Hướng dẫn A–Z trên web: https://vpeg-pxd-dashboard.vercel.app/huong-dan';
  }
  if (/xuất|export|excel|in /.test(q)) {
    return 'Excel: trang Dự án → Xuất Excel. In/PDF: chi tiết dự án → Export.';
  }
  if (/lọc|filter|tìm/.test(q)) {
    return 'Dự án: ô tìm kiếm + nút Lọc trên bảng. Công việc: ô Tìm kiếm tác vụ trên trang Công việc.';
  }
  if (/đăng xuất|logout|thoát|sign out/.test(q)) {
    return 'Mobile: Tài khoản (thanh dưới) → cuộn xuống → Đăng xuất.\nDesktop: icon thoát ở khung user cuối sidebar trái.';
  }
  if (/sáng|tối|giao diện|theme|dark|light|chế độ/.test(q)) {
    return 'Mobile: icon mặt trời/trăng góc phải trên → Sáng / Tối / Hệ thống.\nHoặc: Tài khoản → Giao diện & phiên đăng nhập → chọn 1 trong 3 nút.';
  }
  if (/apk|cài app|pwa|điện thoại|mobile/.test(q)) {
    return 'Android: cài file APK nội bộ VPEG-PXD (WebView trỏ Vercel, tự cập nhật giao diện).\niPhone: Safari → Chia sẻ → Thêm vào Màn hình chính.';
  }
  if (/gán|assignee|phụ trách|nhân sự task/.test(q)) {
    return 'Công việc → mở task → chỉnh NHÂN_SỰ (multi-select). Cột hiển thị tên ngắn gọn.';
  }
  if (/ảnh|hình|photo|site.*ảnh/.test(q)) {
    return 'Chi tiết dự án → Nhật ký site → tab Ngày → đính kèm ảnh hiện trường trong form.';
  }
  if (/pin|ghim|star/.test(q)) {
    return 'Trang Công việc → icon sao trên thẻ/lưới để ghim task quan trọng.';
  }
  return null;
}
