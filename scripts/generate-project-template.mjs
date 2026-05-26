/**
 * File Excel 1 sheet — chỉ nhập thông tin tổng, hệ thống tự loop hạng mục chi tiết.
 * Chạy: node scripts/generate-project-template.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'templates');
const outFile = path.join(outDir, 'MAU_TAO_DU_AN_VPEG_v2.xlsx');

const rows = [
  ['TẠO DỰ ÁN MỚI — VPEG-PXD (1 sheet, điền cột B)'],
  ['Ngày: DD/MM/YYYY. Chi tiết GP / TK / VT / TC / BG → hệ thống tự tạo.'],
  [''],
  ['Thông tin', 'Giá trị'],
  ['Tên dự án *', 'AEON LONG BIÊN GĐ2'],
  ['Khách hàng *', 'AEON'],
  ['PM', 'Lê Văn C.'],
  ['SM', 'Bùi M. T.'],
  ['Công suất (kWp)', 1500],
  ['Ngày Kickoff', '01/06/2026'],
  ['Ngày COD dự kiến', '15/12/2026'],
  [''],
  ['Giai đoạn', 'Ngày bắt đầu', 'Số ngày'],
  ['Giấy phép', '01/06/2026', 45],
  ['Thiết kế', '15/06/2026', 30],
  ['Cung cấp vật tư', '01/07/2026', 60],
  ['Thi công', '01/08/2026', 90],
  ['Bàn giao hồ sơ', '01/11/2026', 14],
];

const ws = XLSX.utils.aoa_to_sheet(rows);
ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 12 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'DU_AN_MOI');

fs.mkdirSync(outDir, { recursive: true });
XLSX.writeFile(wb, outFile);
console.log(`✅ ${outFile}`);
