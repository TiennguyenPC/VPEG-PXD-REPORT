/**
 * Kiến thức Solar EPC cho AI PXD
 * ─────────────────────────────────────────────────────────────
 * CÁCH NẠP THÊM (bạn tự sửa file này, không cần đụng code khác):
 *
 * 1. SOLAR_EPC_KNOWLEDGE — thêm section Markdown mới (## Tiêu đề)
 *    → AI đọc khi gọi API (Groq/Gemini), dùng cho câu hỏi kỹ thuật phức tạp.
 *
 * 2. SOLAR_FAQ — thêm object { match: /regex/i, answer: '...' }
 *    → Trả lời tức thì, không cần API, đúng trọng tâm.
 *    match: regex test trên câu hỏi đã bỏ dấu (normalize).
 *    answer: plain text, không dùng ** in đậm.
 *
 * 3. Lưu file → reload app (npm run dev) là xong.
 */

export const SOLAR_EPC_KNOWLEDGE = `
## Quy trình EPC (VPEG-PXD)
1. Khởi động — khảo sát, BOQ, lịch COD, phân công PM/SM.
2. Thiết kế (15%) — layout mái, single-line, bản vẽ thi công, as-built.
3. Giấy phép (10%) — PCCC, môi trường, đấu nối EVN, zero-export (nếu có).
4. Mua sắm (25%) — 15 hạng mục chuẩn trên Dashboard; ưu tiên vật tư đường găng (khung, pin, inverter, cáp DC).
5. Thi công (40%) — khung → pin → DC → inverter → AC → tiếp địa → PCCC → monitoring.
6. Commissioning — OCV/SCC, IV curve mẫu, test relay, đồng bộ EVN, chạy thử 72h.
7. Bàn giao (10%) — hồ sơ as-built, O&M manual, training, COD.

## Thành phần hệ thống mái (rooftop C&I)
- Module PV: Mono PERC/TOPCon 540–600Wp phổ biến; Voc/Isc theo datasheet.
- Inverter: String (≤125kW) hoặc central; MPPT tracker; IP65; zero-export qua meter/CT.
- Khung đỡ: Rail + kẹp giữa/biên; chống ăn mòn; bảo đảm khe hở thông gió.
- DC: Cáp PV 4–6mm², MC4, combiner (nếu nhiều chuỗi), SPD DC.
- AC: ACDB, isolator, CB, cáp AC, nối MDB/MSB.
- An toàn: Lan can, walkway, PCCC, tiếp địa ≤4Ω (theo thiết kế), GFDI/RCD.

## Tiêu chuẩn tham chiếu
- Module: IEC 61215 (hiệu năng), IEC 61730 (an toàn).
- Inverter: IEC 62109, grid code EVN.
- Việt Nam: TCVN 9207 (hệ thống PV nối lưới), QCVN về PCCC, ATĐ.
- Thi công: NEC 690 (tham khảo), IEC 60364-7-712.

## Chỉ số quan trọng
- PR (Performance Ratio): >75% tốt; 70–75% chấp nhận; <70% cần rà soát shading/soiling/mismatch.
- Yield: ~1200–1400 kWh/kWp/năm (miền Nam VN); Bắc thấp hơn ~10–15%.
- GHI: ~1600–1900 kWh/m²/năm (Nam); dùng cho dự báo sản lượng.
- DC/AC ratio: 1.1–1.3 thường gặp rooftop; tránh clipping quá mức nếu không có lý do kinh tế.

## Lỗi phổ biến & xử lý nhanh
- Hot spot / cell nứt: Kiểm tra shading, vệ sinh, EL test; thay module lỗi.
- PID: Module âm mass/ground; kiểm tra inverter grounding scheme.
- Mismatch: Chuỗi lệch số module hoặc hướng mái → tách MPPT.
- Connector lỏng/MC4 sai: Nhiệt IR, siết đúng tool, không mix hãng.
- Inverter fault: Đọc mã lỗi, check DC polarity, grid voltage, insulation test.
- Zero-export lỗi: Hiệu chuẩn CT, kiểm tra meter, cấu hình inverter.

## Mua sắm — lead time tham khảo
- Module: 4–8 tuần (container).
- Inverter: 2–4 tuần.
- Khung/cáp/phụ kiện: 1–3 tuần.
- Tủ điện custom: 2–4 tuần.
- Blocking items: inverter, module, khung — phải về trước khi lắp tương ứng.

## Thi công — thứ tự & lưu ý
1. Khung đỡ + lan can/walkway (an toàn trước).
2. Module (không giẫm, không kéo cáp sau khi lắp).
3. DC string → test insulation trước nối inverter.
4. Inverter + AC + tiếp địa.
5. PCCC + monitoring + labeling.
- Mưa: dừng lắp module/inverter ngoài trời; làm việc trong nhà (tủ, pre-assembly).
- Nghiệm thu cuốn chiếu: không dồn commissioning cuối COD.

## Commissioning checklist (rút gọn)
- Visual: label, torque MC4, grounding, PCCC.
- DC: Voc/Isc từng string, polarity, IR test.
- AC: voltage, phase, CB rating, RCD test.
- Inverter: grid sync, export limit, remote monitoring.
- EVN: đồng hồ, hợp đồng đấu nối, biên bản nghiệm thu.
- Chạy thử 72h, ghi PR/sản lượng ngày đầu.

## Quản lý rủi ro (trên Dashboard)
- Cao: action plan + owner + deadline trong 24h.
- Trung bình: theo dõi weekly, escalation nếu quá 1 tuần.
- Thấp: ghi nhận, không lan man trong báo cáo.

## Thuật ngữ hay hỏi
- COD: Commercial Operation Date — ngày vận hành thương mại.
- S-Curve: đường tiến độ kế hoạch vs thực tế theo thời gian.
- Zero export: không phát ngược lên lưới — cần meter + CT/inverter setting.
- String: chuỗi module nối tiếp; MPPT: tracker điểm công suất tối đa.
`;

/** FAQ offline — trả lời ngắn, không cần API */
export const SOLAR_FAQ = [
  {
    match: /prlagi|performanceratio|tylehieuqua|hieuquahethong/,
    answer:
      'PR (Performance Ratio) = sản lượng thực / sản lượng lý thuyết.\n\n' +
      '- >75%: tốt\n- 70–75%: chấp nhận\n- <70%: kiểm tra shading, bụi, mismatch, inverter\n\n' +
      'Yield tham khảo miền Nam: ~1200–1400 kWh/kWp/năm.',
  },
  {
    match: /scurvelagi|scurve|duongcong/,
    answer:
      'S-Curve so sánh tiến độ kế hoạch vs thực tế theo thời gian.\n\n' +
      'Xem trên Dashboard: mở chi tiết dự án → cuộn xuống khối S-Curve.\n' +
      'Đường thực tế thấp hơn kế hoạch = dự án đang chậm.',
  },
  {
    match: /milestoneam|sonam|amngay|delayam/,
    answer:
      'Số âm ở milestone/COD trên Dashboard = TRỄ tiến độ (vd: -3 ngày = trễ 3 ngày).\n\n' +
      'Đây là quy ước hiển thị, không phải lỗi nhập và không phải hoàn thành sớm.',
  },
  {
    match: /commissioning|nghiemthu|chaythu/,
    answer:
      'Commissioning (rút gọn):\n' +
      '1. Kiểm tra visual + label + tiếp địa\n' +
      '2. Test DC: Voc/Isc, polarity, insulation\n' +
      '3. Test AC + bảo vệ (RCD/CB)\n' +
      '4. Sync inverter, zero-export (nếu có)\n' +
      '5. Chạy thử 72h + bàn giao EVN',
  },
  {
    match: /zeroexport|khongphatnguoc|phatnguoc/,
    answer:
      'Zero export = hệ thống không phát điện ngược lên lưới.\n\n' +
      'Cần: meter/CT đo chiều công suất + cấu hình inverter giới hạn export.\n' +
      'Trên Dashboard: hạng mục "Hệ thống tủ thông tin/không phát ngược lưới" trong module Mua sắm.',
  },
  {
    match: /hotspot|pid|mismatch/,
    answer:
      'Hot spot: module bị che/bẩn → cell quá nhiệt → EL test, vệ sinh, thay module.\n' +
      'PID: suy giảm do điện thế âm → kiểm tra grounding/inverter type.\n' +
      'Mismatch: chuỗi lệch công suất/hướng → tách MPPT hoặc cân chuỗi.',
  },
  {
    match: /leadtime|thoigianchohang|baolauve/,
    answer:
      'Lead time tham khảo:\n' +
      '- Module: 4–8 tuần\n' +
      '- Inverter: 2–4 tuần\n' +
      '- Khung/cáp/phụ kiện: 1–3 tuần\n' +
      '- Tủ điện: 2–4 tuần\n\n' +
      'Ưu tiên vật tư blocking (khung, pin, inverter) trước khi vào lắp.',
  },
  {
    match: /inverterstring|invertercentral|bientan/,
    answer:
      'String inverter: 1–125kW, gắn mái/tường, phổ biến rooftop C&I.\n' +
      'Central inverter: công suất lớn, thường ground-mount/utility.\n\n' +
      'Rooftop VPEG thường dùng string; chọn theo số MPPT và chuỗi module.',
  },
  {
    match: /quytrinhepc|epclagi|cacthangepc/,
    answer:
      'Quy trình EPC trên Dashboard (trọng số tiến độ):\n' +
      'Permit 10% → Design 15% → Procurement 25% → Construction 40% → Handover 10%.\n\n' +
      'Luồng thực tế: Khảo sát → Thiết kế → GP → Mua sắm → Thi công → Commissioning → COD.',
  },
  {
    match: /15hangmuc|hangmucmuasam|danhsachvattu/,
    answer:
      'Dashboard chuẩn hóa 15 hạng mục mua sắm: An toàn tạm, Dây cáp, Lan can, Walkway, Khung đỡ, Tấm pin, Máng cáp, Nhà inverter, Biến tần, Tủ điện, Tiếp địa, PCCC, Giám sát, Zero export, Vệ sinh pin.\n\n' +
      'Xem/sửa tại chi tiết dự án → Mua sắm (Procurement).',
  },
  {
    match: /tcvn9207|tieu chuan|iec61215/,
    answer:
      'Tiêu chuẩn tham chiếu:\n' +
      '- TCVN 9207 — hệ PV nối lưới VN\n' +
      '- IEC 61215 — module\n' +
      '- IEC 61730 — an toàn module\n' +
      '- IEC 62109 — inverter\n' +
      '- QCVN PCCC/ATĐ — an toàn PCCC và điện',
  },
  {
    match: /trangnay|trangdangxem|huongdantrang/,
    answer: null,
  },
];

/**
 * Trả lời FAQ Solar offline (không cần API).
 * @param {string} userMessage
 * @returns {string|null}
 */
export function getSolarFaqAnswer(userMessage) {
  const q = String(userMessage || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  for (const item of SOLAR_FAQ) {
    if (!item.answer) continue;
    if (item.match.test(q)) return item.answer;
  }
  return null;
}

/** Câu hỏi kỹ thuật Solar (không phải dữ liệu dự án) */
export function isSolarTechnicalQuestion(userMessage) {
  const q = String(userMessage || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return /solar|nangluongmattroi|pv|inverter|bientan|module|pinmatroi|mppt|string|commissioning|pr|performanceratio|zeroexport|hotspot|pid|mismatch|tcvn|iec61215|leadtime|epc|cod|ghi|yield|tiendoidien|dau noi|daunoi|evn|pccc|tiepdia|grounding|scurve|khungdo|rail|mc4|combiner|spd|acdb|dcdb/.test(q);
}
