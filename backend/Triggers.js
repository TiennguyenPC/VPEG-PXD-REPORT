function onEdit(e) {
  const ss = e.source;
  const activeSheet = ss.getActiveSheet();
  const editedRange = e.range;

  // Kiểm tra nếu sửa ở sheet PROJECT_MASTER, cột A, dòng > 1
  if (activeSheet.getName() === "PROJECT_MASTER" && editedRange.getColumn() === 1 && editedRange.getRow() > 1) {
    
    const projectId = editedRange.getValue(); // ID mới sau khi sửa
    const oldProjectId = e.oldValue;          // ID cũ trước khi xóa/sửa

    // TRƯỜNG HỢP 1: NHẬP ID MỚI (Tự tạo hạng mục mẫu)
    if (projectId !== "") {
      initializeProjectDetails(ss, projectId);
    } 
    
    // TRƯỜNG HỢP 2: XÓA ID (Dòng Master bị xóa trắng ID)
    else if (oldProjectId) {
      // Danh sách các sheet cần dọn dẹp dữ liệu liên quan
      const sheetsToClean = [
        'PROJECT_PERMIT', 
        'PROJECT_DESIGN', 
        'PROJECT_PROCUREMENT', 
        'PROJECT_CONSTRUCTION', 
        'PROJECT_HANDOVER', 
        'PROJECT_MILESTONE',
        'DAILY_SITE_LOG',
        'PROJECT_S_CURVE'
      ];

      sheetsToClean.forEach(function(sheetName) {
        const targetSheet = ss.getSheetByName(sheetName);
        if (targetSheet) {
          const data = targetSheet.getDataRange().getValues();
          // Duyệt ngược từ dưới lên trên để xóa không bị lệch dòng
          for (let i = data.length - 1; i >= 1; i--) {
            // Kiểm tra cột A (index 0) của sheet đó có khớp với ID vừa bị xóa không
            if (String(data[i][0]) === String(oldProjectId)) {
              targetSheet.deleteRow(i + 1);
            }
          }
        }
      });
      
      // Hiển thị thông báo nhỏ để bạn biết là hệ thống đã dọn dẹp xong
      ss.toast("Đã xóa toàn bộ dữ liệu liên quan đến dự án: " + oldProjectId, "Thông báo hệ thống");
    }
  }
}

/** Chạy 1 lần sau deploy để bật trigger 8h sáng (hoặc gọi GET ?action=setup-notifications-trigger) */
function installDailyNotificationTrigger() {
  return installDailyNotificationTrigger_();
}
