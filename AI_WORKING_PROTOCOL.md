# AI Assistant Working Protocol for VPEG-PXD Dashboard

Dưới đây là 4 nguyên tắc cốt lõi mà AI (Antigravity) phải tuân thủ tuyệt đối khi làm việc trên dự án này, được đúc kết từ yêu cầu của người dùng để đảm bảo chất lượng code và tiến độ:

1. **Sửa đồng bộ (Apply to similar cases)**
   - Khi người dùng yêu cầu sửa một lỗi ở một trang (VD: nút Sidebar ở trang Công việc), BẮT BUỘC phải tự động rà soát và áp dụng bản sửa lỗi đó cho tất cả các trang/component có cấu trúc tương tự (Trang Dự án, Chi tiết Dự án, v.v.) mà không cần đợi nhắc.

2. **Tập trung & Tự kiểm chứng (Focus & Auto-check)**
   - Phải tập trung giải quyết đúng trọng tâm ý người dùng. 
   - Lập trình xong không được báo cáo bừa. BẮT BUỘC phải tự động mở trình duyệt ảo (`browser_subagent`) để click/test trực tiếp hoặc chạy lệnh `npm run build` để xác nhận kết quả trên thực tế trước khi trả lời.

3. **Ghi nhớ & Không lặp lại lỗi (No repetitive mistakes)**
   - Phân tích kỹ nguyên nhân gốc rễ (VD: Không được đặt side-effects như `localStorage` và `dispatchEvent` bên trong hàm updater của `setState`).
   - Khắc ghi các bài học này vào bộ nhớ dài hạn của dự án để tuyệt đối không giẫm lại vết xe đổ ở các task lập trình tương tự.

4. **Kiểm tra toàn vẹn hệ thống (Global sanity checks)**
   - Trước khi kết thúc một phiên làm việc, phải tự động kiểm tra xem các thay đổi vừa tạo có vô tình phá hỏng các module khác hay không. 
   - Đảm bảo dự án luôn trong trạng thái "Build thành công" và không bị "phình to" hay chứa lỗi ngầm.

5. **Deploy backend tự động — AI tự sync, không nhờ user**
   - File backend chính: `backend/code.gs` (trên Google cũng là `code.gs` + `Triggers.js`).
   - **Mỗi khi AI sửa `backend/code.gs`**, phải **tự chạy `npm run gas:sync`** ngay trong cùng phiên làm việc — không hỏi, không nhắc user deploy.
   - Chỉ báo user nếu `gas:sync` lỗi auth (`npm run gas:login` chưa xong); còn lại AI tự xử lý.
   - **Tuyệt đối không** nhắc user "copy/dán code.gs", "Deploy New version", hay "chạy gas:sync giúp tôi".

---
*Ghi chú: File này được tự động tạo ra và AI sẽ luôn đọc file này trước khi bắt đầu bất kỳ chỉnh sửa nào trong dự án.*
