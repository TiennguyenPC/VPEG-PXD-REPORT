const SPREADSHEET_ID = '1EGqvpOd_ih46SvQRARLiu0iCR3fWScO-_jN0DJwkTjA';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const id = e.parameter.id;
    let data = [];
    
    const ss = getSpreadsheet();
    
    switch (action) {
      case 'debug-headers':
        data = {
          PROJECT_MASTER: ss.getSheetByName('PROJECT_MASTER') ? ss.getSheetByName('PROJECT_MASTER').getDataRange().getValues()[0] : null,
          PROJECT_RISK: ss.getSheetByName('PROJECT_RISK') ? ss.getSheetByName('PROJECT_RISK').getDataRange().getValues()[0] : null,
          PROJECT_PERMIT: ss.getSheetByName('PROJECT_PERMIT') ? ss.getSheetByName('PROJECT_PERMIT').getDataRange().getValues()[0] : null,
          PROJECT_DESIGN: ss.getSheetByName('PROJECT_DESIGN') ? ss.getSheetByName('PROJECT_DESIGN').getDataRange().getValues()[0] : null,
          PROJECT_PROCUREMENT: ss.getSheetByName('PROJECT_PROCUREMENT') ? ss.getSheetByName('PROJECT_PROCUREMENT').getDataRange().getValues()[0] : null,
          PROJECT_CONSTRUCTION: ss.getSheetByName('PROJECT_CONSTRUCTION') ? ss.getSheetByName('PROJECT_CONSTRUCTION').getDataRange().getValues()[0] : null,
          DAILY_SITE_LOG: ss.getSheetByName('DAILY_SITE_LOG') ? ss.getSheetByName('DAILY_SITE_LOG').getDataRange().getValues()[0] : null,
          PROJECT_MILESTONE: ss.getSheetByName('PROJECT_MILESTONE') ? ss.getSheetByName('PROJECT_MILESTONE').getDataRange().getValues()[0] : null,
          PROJECT_S_CURVE: ss.getSheetByName('PROJECT_S_CURVE') ? ss.getSheetByName('PROJECT_S_CURVE').getDataRange().getValues()[0] : null,
        };
        break;
      case 'dashboard-bundle':
        const projectId = id;
        initializeProjectDetails(ss, projectId);
        const siteLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId));
        data = {
          project: getSheetDataAsObjects(ss, 'PROJECT_MASTER').find(p => (p.PROJECT_ID == projectId || p.id == projectId)) || null,
          scurve: getSheetDataAsObjects(ss, 'PROJECT_S_CURVE').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          risks: getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          permits: getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          designs: getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          procurements: getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          constructions: getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          handovers: getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          siteLogs: siteLogs,
          weeklyLogs: getWeeklyAggregates(ss, projectId, siteLogs),
          monthlyLogs: getMonthlyAggregates(ss, projectId, siteLogs),
          milestones: getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId))
        };
        break;
      case 'projects':
        data = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
        break;
      case 'employees':
        data = getSheetDataAsObjects(ss, 'EMPLOYEE');
        break;
      case 'project':
        const allProjects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
        data = allProjects.find(p => (p.PROJECT_ID == id || p.id == id)) || null;
        break;
      case 'risk':
        data = getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'permit':
        data = getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'design':
        data = getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'procurement':
        data = getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'construction':
        data = getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'handover':
        data = getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'site-log':
        data = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'weeklyLog':
        data = getWeeklyAggregates(ss, id);
        break;
      case 'monthlyLog':
        data = getMonthlyAggregates(ss, id);
        break;
      case 'milestone':
        data = getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'scurve':
        data = getSheetDataAsObjects(ss, 'PROJECT_S_CURVE').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      default:
        return createResponse({ error: 'Invalid API endpoint' }, 400);
    }
    
    return createResponse({ status: 'success', data: data });
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    // We expect payload to be sent as stringified JSON in postData
    // Note: When calling from frontend, set Content-Type to text/plain to avoid CORS preflight OPTIONS request
    const payload = JSON.parse(e.postData.getDataAsString("UTF-8"));
    const ss = getSpreadsheet();
    
    let sheetName = '';
    
    switch(action) {
      case 'update-risk':
        sheetName = 'PROJECT_RISK';
        break;
      case 'update-permit':
        sheetName = 'PROJECT_PERMIT';
        break;
      case 'update-design':
        sheetName = 'PROJECT_DESIGN';
        break;
      case 'update-procurement':
        sheetName = 'PROJECT_PROCUREMENT';
        break;
      case 'update-construction':
        sheetName = 'PROJECT_CONSTRUCTION';
        break;
      case 'update-handover':
        sheetName = 'PROJECT_HANDOVER';
        break;
      case 'update-site-log':
        sheetName = 'DAILY_SITE_LOG';
        break;
      case 'update-module-dates':
        sheetName = payload.sheetName; // passed from web
        break;
      case 'update-project':
        sheetName = 'PROJECT_MASTER';
        break;
      case 'add-project':
        sheetName = 'PROJECT_MASTER';
        break;
      case 'add-risk':
        sheetName = 'PROJECT_RISK';
        break;
      case 'add-permit':
        sheetName = 'PROJECT_PERMIT';
        break;
      case 'add-design':
        sheetName = 'PROJECT_DESIGN';
        break;
      case 'add-procurement':
        sheetName = 'PROJECT_PROCUREMENT';
        break;
      default:
        return createResponse({ error: 'Invalid API endpoint for POST' }, 400);
    }
    
    if (sheetName) {
      if (action.startsWith('add-')) {
        appendRow(ss, sheetName, payload);
        if (action === 'add-project') {
          const projectId = payload.PROJECT_ID || payload.id;
          if (projectId) {
            initializeProjectDetails(ss, projectId, payload.KICKOFF_DATE, payload.KẾ_HOẠCH_COD);
          }
        }
      } else {
        // Fallback to payload.id if payload.PROJECT_ID is not provided (for older modules)
        updateRowById(ss, sheetName, payload.PROJECT_ID || payload.id, payload);
      }
      
      const projectId = payload.PROJECT_ID || payload.id || payload.projectId;
      if (projectId && ['PROJECT_PERMIT', 'PROJECT_DESIGN', 'PROJECT_PROCUREMENT', 'PROJECT_CONSTRUCTION', 'PROJECT_HANDOVER'].indexOf(sheetName) !== -1) {
        recalculateProjectProgress(ss, projectId);
      }
      
      if (action !== 'update-site-log' && action !== 'update-module-dates') {
        if (projectId) {
          const updatedList = getSheetDataAsObjects(ss, sheetName).filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId));
          return createResponse({
            status: 'success',
            message: 'Data saved successfully',
            data: updatedList
          });
        }
      }
    }
    
    if (action === 'update-site-log') {
      const projectId = payload.PROJECT_ID || payload.id;
      const dailyLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId));
      return createResponse({
        status: 'success',
        message: 'Data updated successfully',
        dailyLogs: dailyLogs,
        weeklyLogs: getWeeklyAggregates(ss, projectId, dailyLogs),
        monthlyLogs: getMonthlyAggregates(ss, projectId, dailyLogs)
      });
    }
    if (action === 'update-module-dates') {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const projectId = payload.PROJECT_ID || payload.id;
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idColIndex = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
        const startDateColIndex = findColumnIndex(headers, ['NGÀY_BẮT_ĐẦU_MODULE', 'NGÀY_BẮT_ĐẦU']);
        const daysColIndex = findColumnIndex(headers, ['SỐ_NGÀY_MODULE', 'NGÀY', 'SỐ_NGÀY']);
        
        if (idColIndex !== -1 && startDateColIndex !== -1 && daysColIndex !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (data[i][idColIndex] == projectId) {
              sheet.getRange(i + 1, startDateColIndex + 1).setValue(payload.NGÀY_BẮT_ĐẦU_MODULE);
              sheet.getRange(i + 1, daysColIndex + 1).setValue(payload.SỐ_NGÀY_MODULE);
            }
          }
        }
      }
      return createResponse({ status: 'success', message: 'Dates updated across all rows' });
    }
    
    return createResponse({ status: 'success', message: 'Data updated successfully' });
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() }, 500);
  }
}
// ================= UTILITIES =================

function normalizeString(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9%]/g, ""); // remove spaces, underscores, dashes, keep %
}

const STANDARD_KEYS_MAP = {
  'projectid': 'PROJECT_ID',
  
  // master
  'tenduan': 'TÊN_DỰ_ÁN',
  'projectname': 'TÊN_DỰ_ÁN',
  'khachhang': 'KHÁCH_HÀNG',
  'client': 'KHÁCH_HÀNG',
  'pm': 'PM',
  'sm': 'SM',
  'congsuatkwp': 'CÔNG_SUẤT_KWP',
  'capacitykwp': 'CÔNG_SUẤT_KWP',
  'kehoachcod': 'KẾ_HOẠCH_COD',
  'codplan': 'KẾ_HOẠCH_COD',
  'dubaocod': 'DỰ_BÁO_COD',
  'tiendokehoach': 'TIẾN_ĐỘ_KẾ_HOẠCH',
  'planprogress': 'TIẾN_ĐỘ_KẾ_HOẠCH',
  'tiendothucte': 'TIẾN_ĐỘ_THỰC_TẾ',
  'actualprogress': 'TIẾN_ĐỘ_THỰC_TẾ',
  'delay': 'DELAY',
  'trangthai': 'TRẠNG_THÁI',
  'status': 'TRẠNG_THÁI',
  'risklevel': 'RISK_LEVEL',
  'capnhatcuoi': 'CẬP_NHẬT_CUỐI',
  
  // permit/handover
  'hangmuc': 'HẠNG_MỤC',
  'tinhtrang': 'TÌNH_TRẠNG',
  'ketquaphanhoi': 'KẾT_QUẢ_PHẢN_HỒI',
  'phanhoi': 'KẾT_QUẢ_PHẢN_HỒI',
  'buoctieptheo': 'BƯỚC_TIẾP_THEO',
  'buoctiep': 'BƯỚC_TIẾP_THEO',
  'ketquacuoi': 'KẾT_QUẢ_CUỐI',
  'capnhatboi': 'CẬP_NHẬT_BỞI',
  'ngaycapnhat': 'NGÀY_CẬP_NHẬT',
  
  // design
  'hangmucbanve': 'HẠNG_MỤC_BẢN_VẼ',
  'pheduyet': 'PHÊ_DUYỆT',
  
  // procurement
  'hangmucmuahang': 'HẠNG_MỤC_MUA_HÀNG',
  'ngayvedukien': 'NGÀY_VỀ_DỰ_KIẾN',
  'ngayvethucte': 'NGÀY_VỀ_THỰC_TẾ',
  'tinhtrangvattu': 'TÌNH_TRẠNG_VẬT_TƯ',
  'danhgiatiento': 'ĐÁNH_GIÁ_TIẾN_ĐỘ',
  'danhgiatiendo': 'ĐÁNH_GIÁ_TIẾN_ĐỘ',
  'ncc': 'NCC',
  'ghichu': 'GHI_CHÚ',
  
  // construction
  'nhomthicong': 'NHÓM_THI_CÔNG',
  'macv': 'MÃ_CV',
  'hangmuccongviec': 'HẠNG_MỤC_CÔNG_VIỆC',
  'ngaybatdau': 'NGÀY_BẮT_ĐẦU',
  'songay': 'SỐ_NGÀY',
  'ngayketthuc': 'NGÀY_KẾT_THÚC',
  'ngayhtthucte': 'NGÀY_HT_THỰC_TẾ',
  'tiendothucte': 'TIẾN_ĐỘ_THỰC_TẾ',
  'trongso': 'TRỌNG_SỐ',
  
  // daily log
  'ngay': 'NGÀY',
  'logdate': 'NGÀY',
  'nhanlucsite': 'NHÂN_LỰC_SITE',
  'manpower': 'NHÂN_LỰC_SITE',
  'kysugs': 'KỸ_SƯ_GS',
  'engineers': 'KỸ_SƯ_GS',
  'thoitiet': 'THỜI_TIẾT',
  'weather': 'THỜI_TIẾT',
  'suco': 'SỰ_CỐ',
  'incidentcount': 'SỰ_CỐ',
  'ghichuhientruong': 'GHI_CHÚ_HIỆN_TRƯỜNG',
  'dailynote': 'GHI_CHÚ_HIỆN_TRƯỜNG',
  'danhgiatuan': 'ĐÁNH_GIÁ_TUẦN',
  'weeklyassessment': 'ĐÁNH_GIÁ_TUẦN',
  'monthlyreport': 'GHI_CHÚ_HIỆN_TRƯỜNG',
  
  // risk
  'mucdo': 'MỨC_ĐỘ',
  'noidung': 'NỘI_DUNG',
  'anhhuong': 'ẢNH_HƯỞNG',
  'phutrach': 'PHỤ_TRÁCH',
  
  // milestone
  'milestone': 'MILESTONE',
  'ngaykehoach': 'NGÀY_KẾ_HOẠCH',
  'ngaythucte': 'NGÀY_THỰC_TẾ',
  
  // scurve
  'kehoach%': 'KẾ_HOẠCH_%',
  'thucte%': 'THỰC_TẾ_%'
};

function findColumnIndex(headers, possibleNames) {
  if (!headers || headers.length === 0) return -1;
  if (!Array.isArray(possibleNames)) {
    possibleNames = [possibleNames];
  }
  for (let k = 0; k < possibleNames.length; k++) {
    const normTarget = normalizeString(possibleNames[k]);
    for (let i = 0; i < headers.length; i++) {
      if (normalizeString(headers[i]) === normTarget) {
        return i;
      }
    }
  }
  return -1;
}

function getSheetDataAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  const headers = data[0];
  const objects = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        let val = row[j];
        if (val instanceof Date) {
          const y = val.getFullYear();
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          val = `${d}/${m}/${y}`;
        }
        const normKey = normalizeString(headers[j]);
        const stdKey = STANDARD_KEYS_MAP[normKey] || headers[j];
        obj[stdKey] = val;
      }
    }
    obj._rowIndex = i + 1; 
    objects.push(obj);
  }
  
  return objects;
}

function updateRowById(ss, sheetName, recordId, updatedData) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    appendRow(ss, sheetName, updatedData);
    return;
  }
  
  const headers = data[0];
  let targetRowIndex = -1;
  
  // Use _rowIndex directly if valid to allow updating non-unique table rows
  if (updatedData && updatedData._rowIndex && Number(updatedData._rowIndex) > 1 && Number(updatedData._rowIndex) <= data.length) {
    targetRowIndex = Number(updatedData._rowIndex);
  } else {
    // Find ID column (could be PROJECT_ID or id depending on sheet)
    let idColIndex = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
    
    let dateColIndex = findColumnIndex(headers, ['LOG_DATE', 'NGÀY']);
    
    if (idColIndex === -1) throw new Error("No ID column found in sheet");
    
    // Secondary key columns for sheets with multiple rows per project
    const SECONDARY_KEYS = {
      'PROJECT_PERMIT':       'HẠNG_MỤC',
      'PROJECT_DESIGN':       'HẠNG_MỤC_BẢN_VẼ',
      'PROJECT_PROCUREMENT':  'HẠNG_MỤC_MUA_HÀNG',
      'PROJECT_HANDOVER':     'HẠNG_MỤC',
      'PROJECT_CONSTRUCTION': 'HẠNG_MỤC_CÔNG_VIỆC',
      'PROJECT_RISK':         'NỘI_DUNG'
    };
    const secondaryKeyName = SECONDARY_KEYS[sheetName];
    const secondaryKeyColIndex = secondaryKeyName ? findColumnIndex(headers, secondaryKeyName) : -1;
    const secondaryKeyValue = secondaryKeyName && updatedData ? updatedData[secondaryKeyName] : undefined;
    
    for (let i = 1; i < data.length; i++) {
      // Weak equality because sheet ID might be number but payload ID is string
      const idMatch = (data[i][idColIndex] == recordId);
      
      let dateMatch = true;
      if (sheetName === 'DAILY_SITE_LOG' && dateColIndex !== -1 && updatedData) {
        const payloadDate = updatedData.LOG_DATE || updatedData.NGÀY;
        const rowDateVal = data[i][dateColIndex];
        
        let rowDateStr = String(rowDateVal);
        if (rowDateVal instanceof Date) {
          const y = rowDateVal.getFullYear();
          const m = String(rowDateVal.getMonth() + 1).padStart(2, '0');
          const d = String(rowDateVal.getDate()).padStart(2, '0');
          rowDateStr = `${d}/${m}/${y}`;
        }
        
        dateMatch = (rowDateStr === String(payloadDate));
      }
      
      // For multi-row sheets, also match by secondary key (item name)
      let secondaryMatch = true;
      if (secondaryKeyColIndex !== -1 && secondaryKeyValue !== undefined) {
        secondaryMatch = (String(data[i][secondaryKeyColIndex]).trim() === String(secondaryKeyValue).trim());
      }
      
      if (idMatch && dateMatch && secondaryMatch) {
        targetRowIndex = i + 1; // 1-based index for sheet
        break;
      }
    }
  }
  
  if (targetRowIndex === -1) {
    appendRow(ss, sheetName, updatedData);
    return;
  }
  
  // Alias map: frontend English keys → possible Vietnamese column header names in the sheet
  const FIELD_ALIASES = {
    'LOG_DATE':        ['LOG_DATE', 'NGÀY'],
    'MANPOWER':        ['MANPOWER', 'NHÂN_LỰC_SITE'],
    'ENGINEERS':       ['ENGINEERS', 'KỸ_SƯ_GS'],
    'WEATHER':         ['WEATHER', 'THỜI_TIẾT'],
    'INCIDENT_COUNT':  ['INCIDENT_COUNT', 'SỰ_CỐ'],
    'DAILY_NOTE':      ['DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'WEEKLY_ASSESSMENT': ['WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN'],
    'MONTHLY_REPORT':  ['MONTHLY_REPORT', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'TÊN_DỰ_ÁN':       ['TÊN_DỰ_ÁN', 'PROJECT_NAME'],
    'KHÁCH_HÀNG':      ['KHÁCH_HÀNG', 'CLIENT'],
    'CÔNG_SUẤT_KWP':   ['CÔNG_SUẤT_KWP', 'CAPACITY_KWP'],
    'KẾ_HOẠCH_COD':    ['KẾ_HOẠCH_COD', 'COD_PLAN', 'NGÀY_ĐÓNG_ĐIỆN', 'NGÀY_ĐÓNG_ĐIỆN_COD'],
    'KICKOFF_DATE':    ['KICKOFF_DATE', 'NGÀY_KICKOFF', 'KICKOFF'],
    'TIẾN_ĐỘ_KẾ_HOẠCH':['TIẾN_ĐỘ_KẾ_HOẠCH', 'PLAN_PROGRESS'],
    'TIẾN_ĐỘ_THỰC_TẾ': ['TIẾN_ĐỘ_THỰC_TẾ', 'ACTUAL_PROGRESS'],
    // Vietnamese → English reverse aliases
    'NGÀY':                   ['NGÀY', 'LOG_DATE'],
    'NHÂN_LỰC_SITE':          ['NHÂN_LỰC_SITE', 'MANPOWER'],
    'KỸ_SƯ_GS':              ['KỸ_SƯ_GS', 'ENGINEERS'],
    'THỜI_TIẾT':              ['THỜI_TIẾT', 'WEATHER'],
    'SỰ_CỐ':                 ['SỰ_CỐ', 'INCIDENT_COUNT'],
    'GHI_CHÚ_HIỆN_TRƯỜNG':   ['GHI_CHÚ_HIỆN_TRƯỜNG', 'DAILY_NOTE'],
    'ĐÁNH_GIÁ_TUẦN':         ['ĐÁNH_GIÁ_TUẦN', 'WEEKLY_ASSESSMENT']
  };

  // Update the row — try key directly first, then aliases
  for (const key in updatedData) {
    if (key === 'id' || key === 'projectId' || key === 'PROJECT_ID' || key === '_rowIndex') continue;
    
    // Find matching column: try exact match first, then aliases
    let colIndex = findColumnIndex(headers, key);
    if (colIndex === -1 && FIELD_ALIASES[key]) {
      colIndex = findColumnIndex(headers, FIELD_ALIASES[key]);
    }
    
    if (colIndex !== -1) {
      let val = updatedData[key];
      // Special handling: SỰ_CỐ in sheet stores as "X vụ" string format
      if ((normalizeString(headers[colIndex]) === 'suco') && typeof val === 'number') {
        val = val + ' vụ';
      }
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);
    }
  }
}

// ================= AGGREGATION UTILITIES =================

function parseDateString(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const parts = String(dateStr).split('/');
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function getMondayOfDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateString(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function getWeeklyAggregates(ss, projectId, preloadedLogs) {
  const logs = preloadedLogs || getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => {
    return String(row.PROJECT_ID) === String(projectId);
  });
  
  const weeksMap = {};
  
  logs.forEach(log => {
    const dateStr = log.LOG_DATE || log.NGÀY || '';
    const date = parseDateString(dateStr);
    if (!date) return;
    
    const monday = getMondayOfDate(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const weekKey = formatDateString(monday);
    const weekLabel = `Tuần ${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
    
    if (!weeksMap[weekKey]) {
      weeksMap[weekKey] = {
        weekKey: weekKey,
        weekLabel: weekLabel,
        logs: []
      };
    }
    weeksMap[weekKey].logs.push(log);
  });
  
  const results = [];
  for (const weekKey in weeksMap) {
    const item = weeksMap[weekKey];
    const itemLogs = item.logs;
    
    let sumManpower = 0;
    let sumEngineers = 0;
    let incidentCount = 0;
    const weatherList = [];
    let weeklyAssessment = '';
    
    itemLogs.sort((a, b) => {
      const da = parseDateString(a.LOG_DATE || a.NGÀY) || new Date(0);
      const db = parseDateString(b.LOG_DATE || b.NGÀY) || new Date(0);
      return da - db;
    });
    
    itemLogs.forEach(l => {
      const mp = Number(l.MANPOWER !== undefined ? l.MANPOWER : (l.NHÂN_LỰC_SITE || 0));
      const eng = Number(l.ENGINEERS !== undefined ? l.ENGINEERS : (l.KỸ_SƯ_GS || 0));
      const weather = String(l.WEATHER !== undefined ? l.WEATHER : (l.THỜI_TIẾT || '')).trim();
      
      let inc = 0;
      if (l.INCIDENT_COUNT !== undefined) inc = Number(l.INCIDENT_COUNT || 0);
      else if (l.SỰ_CỐ !== undefined) {
        const parsedInc = parseInt(l.SỰ_CỐ);
        inc = isNaN(parsedInc) ? 0 : parsedInc;
      }
      
      sumManpower += mp;
      sumEngineers += eng;
      incidentCount += inc;
      
      if (weather && weatherList.indexOf(weather) === -1) {
        weatherList.push(weather);
      }
      
      const ass = String(l.WEEKLY_ASSESSMENT !== undefined ? l.WEEKLY_ASSESSMENT : (l.ĐÁNH_GIÁ_TUẦN || '')).trim();
      if (ass) {
        weeklyAssessment = ass;
      }
    });
    
    results.push({
      PROJECT_ID: projectId,
      LOG_DATE: weekKey,
      weekLabel: item.weekLabel,
      avgManpower: itemLogs.length > 0 ? Math.round(sumManpower / itemLogs.length) : 0,
      avgEngineers: itemLogs.length > 0 ? Math.round(sumEngineers / itemLogs.length) : 0,
      weatherSummary: weatherList.join(', ') || 'Chưa ghi nhận',
      incidentCount: incidentCount,
      loggedDaysCount: itemLogs.length,
      weeklyAssessment: weeklyAssessment || ''
    });
  }
  
  results.sort((a, b) => {
    return parseDateString(a.LOG_DATE) - parseDateString(b.LOG_DATE);
  });
  
  return results;
}

function getMonthlyAggregates(ss, projectId, preloadedLogs) {
  const logs = preloadedLogs || getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => {
    return String(row.PROJECT_ID) === String(projectId);
  });
  
  const monthsMap = {};
  
  logs.forEach(log => {
    const dateStr = log.LOG_DATE || log.NGÀY || '';
    const date = parseDateString(dateStr);
    if (!date) return;
    
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const monthKey = `${m}/${y}`;
    const monthLabel = `Tháng ${monthKey}`;
    
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        monthKey: monthKey,
        monthLabel: monthLabel,
        logs: []
      };
    }
    monthsMap[monthKey].logs.push(log);
  });
  
  const results = [];
  for (const monthKey in monthsMap) {
    const item = monthsMap[monthKey];
    const itemLogs = item.logs;
    
    let sumManpower = 0;
    let sumEngineers = 0;
    let incidentCount = 0;
    const weatherList = [];
    let monthlyReport = '';
    
    itemLogs.sort((a, b) => {
      const da = parseDateString(a.LOG_DATE || a.NGÀY) || new Date(0);
      const db = parseDateString(b.LOG_DATE || b.NGÀY) || new Date(0);
      return da - db;
    });
    
    itemLogs.forEach(l => {
      const mp = Number(l.MANPOWER !== undefined ? l.MANPOWER : (l.NHÂN_LỰC_SITE || 0));
      const eng = Number(l.ENGINEERS !== undefined ? l.ENGINEERS : (l.KỸ_SƯ_GS || 0));
      const weather = String(l.WEATHER !== undefined ? l.WEATHER : (l.THỜI_TIẾT || '')).trim();
      
      let inc = 0;
      if (l.INCIDENT_COUNT !== undefined) inc = Number(l.INCIDENT_COUNT || 0);
      else if (l.SỰ_CỐ !== undefined) {
        const parsedInc = parseInt(l.SỰ_CỐ);
        inc = isNaN(parsedInc) ? 0 : parsedInc;
      }
      
      sumManpower += mp;
      sumEngineers += eng;
      incidentCount += inc;
      
      if (weather && weatherList.indexOf(weather) === -1) {
        weatherList.push(weather);
      }
      
      const rep = String(l.MONTHLY_REPORT !== undefined ? l.MONTHLY_REPORT : (l.GHI_CHÚ_HIỆN_TRƯỜNG || '')).trim();
      if (rep) {
        monthlyReport = rep;
      }
    });
    
    results.push({
      PROJECT_ID: projectId,
      LOG_DATE: `01/${monthKey}`,
      monthLabel: item.monthLabel,
      avgManpower: itemLogs.length > 0 ? Math.round(sumManpower / itemLogs.length) : 0,
      avgEngineers: itemLogs.length > 0 ? Math.round(sumEngineers / itemLogs.length) : 0,
      weatherSummary: weatherList.join(', ') || 'Chưa ghi nhận',
      incidentCount: incidentCount,
      loggedDaysCount: itemLogs.length,
      monthlyReport: monthlyReport || ''
    });
  }
  
  results.sort((a, b) => {
    return parseDateString(a.LOG_DATE) - parseDateString(b.LOG_DATE);
  });
  
  return results;
}

function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function appendRow(ss, sheetName, payload) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  
  initializeSheetIfEmpty(sheet, sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = new Array(headers.length).fill("");
  
  // Same alias map used in updateRowById
  const FIELD_ALIASES = {
    'LOG_DATE':          ['LOG_DATE', 'NGÀY'],
    'MANPOWER':          ['MANPOWER', 'NHÂN_LỰC_SITE'],
    'ENGINEERS':         ['ENGINEERS', 'KỸ_SƯ_GS'],
    'WEATHER':           ['WEATHER', 'THỜI_TIẾT'],
    'INCIDENT_COUNT':    ['INCIDENT_COUNT', 'SỰ_CỐ'],
    'DAILY_NOTE':        ['DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'WEEKLY_ASSESSMENT': ['WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN'],
    'MONTHLY_REPORT':    ['MONTHLY_REPORT', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'TÊN_DỰ_ÁN':         ['TÊN_DỰ_ÁN', 'PROJECT_NAME'],
    'KHÁCH_HÀNG':        ['KHÁCH_HÀNG', 'CLIENT'],
    'CÔNG_SUẤT_KWP':     ['CÔNG_SUẤT_KWP', 'CAPACITY_KWP'],
    'KẾ_HOẠCH_COD':      ['KẾ_HOẠCH_COD', 'COD_PLAN', 'NGÀY_ĐÓNG_ĐIỆN', 'NGÀY_ĐÓNG_ĐIỆN_COD'],
    'KICKOFF_DATE':      ['KICKOFF_DATE', 'NGÀY_KICKOFF', 'KICKOFF'],
    'TIẾN_ĐỘ_KẾ_HOẠCH':  ['TIẾN_ĐỘ_KẾ_HOẠCH', 'PLAN_PROGRESS'],
    'TIẾN_ĐỘ_THỰC_TẾ':   ['TIẾN_ĐỘ_THỰC_TẾ', 'ACTUAL_PROGRESS'],
    'NGÀY':                   ['NGÀY', 'LOG_DATE'],
    'NHÂN_LỰC_SITE':          ['NHÂN_LỰC_SITE', 'MANPOWER'],
    'KỸ_SƯ_GS':              ['KỸ_SƯ_GS', 'ENGINEERS'],
    'THỜI_TIẾT':              ['THỜI_TIẾT', 'WEATHER'],
    'SỰ_CỐ':                 ['SỰ_CỐ', 'INCIDENT_COUNT'],
    'GHI_CHÚ_HIỆN_TRƯỜNG':   ['GHI_CHÚ_HIỆN_TRƯỜNG', 'DAILY_NOTE'],
    'ĐÁNH_GIÁ_TUẦN':         ['ĐÁNH_GIÁ_TUẦN', 'WEEKLY_ASSESSMENT']
  };
  
  for (const key in payload) {
    if (key === '_rowIndex') continue;
    let colIndex = findColumnIndex(headers, key);
    if (colIndex === -1 && FIELD_ALIASES[key]) {
      colIndex = findColumnIndex(headers, FIELD_ALIASES[key]);
    }
    if (colIndex !== -1) {
      let val = payload[key];
      if ((normalizeString(headers[colIndex]) === 'suco') && typeof val === 'number') {
        val = val + ' vụ';
      }
      newRow[colIndex] = val;
    }
  }
  
  sheet.appendRow(newRow);
}

function initializeSheetIfEmpty(sheet, sheetName) {
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  
  let isEmpty = false;
  if (lastCol === 0 || lastRow === 0) {
    isEmpty = true;
  } else if (lastCol === 1 && lastRow === 1) {
    if (sheet.getRange(1, 1).getValue() === "") {
      isEmpty = true;
    }
  }
  
  if (isEmpty) {
    const headers = getDefaultHeaders(sheetName);
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      SpreadsheetApp.flush();
    }
  }
}



function getDefaultHeaders(sheetName) {
  switch (sheetName) {
    case 'PROJECT_MASTER':
      return ['PROJECT_ID', 'TÊN_DỰ_ÁN', 'KHÁCH_HÀNG', 'PM', 'SM', 'CÔNG_SUẤT_KWP', 'KẾ_HOẠCH_COD', 'DỰ_BÁO_COD', 'TIẾN_ĐỘ_KẾ_HOẠCH', 'TIẾN_ĐỘ_THỰC_TẾ', 'DELAY', 'TRẠNG_THÁI', 'RISK_LEVEL', 'CẬP_NHẬT_CUỐI'];
    case 'PROJECT_RISK':
      return ['PROJECT_ID', 'MỨC_ĐỘ', 'NỘI_DUNG', 'ẢNH_HƯỞNG', 'TRẠNG_THÁI', 'PHỤ_TRÁCH', 'NGÀY', 'GHI_CHÚ'];
    case 'PROJECT_PERMIT':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾT_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_DESIGN':
      return ['PROJECT_ID', 'HẠNG_MỤC_BẢN_VẼ', 'TÌNH_TRẠNG', 'PHÊ_DUYỆT', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_PROCUREMENT':
      return ['PROJECT_ID', 'HẠNG_MỤC_MUA_HÀNG', 'NGÀY_VỀ_DỰ_KIẾN', 'NGÀY_VỀ_THỰC_TẾ', 'TÌNH_TRẠNG_VẬT_TƯ', 'ĐÁNH_GIÁ_TIẾN_ĐỘ', 'NCC', 'GHI_CHÚ'];
    case 'PROJECT_CONSTRUCTION':
      return ['PROJECT_ID', 'NHÓM_THI_CÔNG', 'MÃ_CV', 'HẠNG_MỤC_CÔNG_VIỆC', 'NGÀY_BẮT_ĐẦU', 'SỐ_NGÀY', 'NGÀY_KẾT_THÚC', 'NGÀY_HT_THỰC_TẾ', 'TIẾN_ĐỘ_THỰC_TẾ', 'TRỌNG_SỐ'];
    case 'PROJECT_HANDOVER':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾT_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_MILESTONE':
      return ['PROJECT_ID', 'MILESTONE', 'NGÀY_KẾ_HOẠCH', 'NGÀY_THỰC_TẾ', 'STATUS'];
    case 'DAILY_SITE_LOG':
      return ['PROJECT_ID', 'LOG_DATE', 'NGÀY', 'MANPOWER', 'NHÂN_LỰC_SITE', 'ENGINEERS', 'KỸ_SƯ_GS', 'WEATHER', 'THỜI_TIẾT', 'INCIDENT_COUNT', 'SỰ_CỐ', 'DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG', 'WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN', 'MONTHLY_REPORT', 'STATUS', 'UPDATED_BY', 'UPDATED_AT'];
    default:
      return [];
  }
}

function recalculateProjectProgress(ss, projectId) {
  if (!projectId) return;
  
  // 1. Permits (10%)
  const permits = getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(r => r.PROJECT_ID == projectId);
  const permitsComp = permits.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && String(p.KẾT_QUẢ_CUỐI).trim() !== '').length;
  const permitProg = permits.length > 0 ? (permitsComp / permits.length) * 100 : 0;
  
  // 2. Designs (15%)
  const designs = getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(r => r.PROJECT_ID == projectId);
  const designsComp = designs.filter(d => d.KẾT_QUẢ_CUỐI && d.KẾT_QUẢ_CUỐI !== '-' && d.KẾT_QUẢ_CUỐI !== '---' && d.KẾT_QUẢ_CUỐI !== 'N/A' && String(d.KẾT_QUẢ_CUỐI).trim() !== '').length;
  const designProg = designs.length > 0 ? (designsComp / designs.length) * 100 : 0;
  
  // 3. Procurement (25%)
  const procurements = getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(r => r.PROJECT_ID == projectId);
  const procurementsComp = procurements.filter(p => p.TÌNH_TRẠNG_VẬT_TƯ === 'Đã tới site').length;
  const procurementProg = procurements.length > 0 ? (procurementsComp / procurements.length) * 100 : 0;
  
  // 4. Construction (40%)
  const constructions = getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(r => r.PROJECT_ID == projectId);
  const groupWeights = { 'A': 15, 'B': 40, 'C': 30, 'D': 15 };
  const groupTasks = { 'A': [], 'B': [], 'C': [], 'D': [] };
  
  const getGroupKey = (groupName) => {
    if (!groupName) return null;
    if (groupName.includes('[A]')) return 'A';
    if (groupName.includes('[B]')) return 'B';
    if (groupName.includes('[C]')) return 'C';
    if (groupName.includes('[D]')) return 'D';
    return null;
  };
  
  const getGroupKeyByCode = (code) => {
    if (!code) return null;
    const prefix = String(code).charAt(0);
    if (prefix === '1') return 'A';
    if (prefix === '2') return 'B';
    if (prefix === '3') return 'C';
    if (prefix === '4') return 'D';
    return null;
  };
  
  const getGroupKeyFromRow = (r) => {
    return getGroupKey(r.NHÓM_THI_CÔNG) || getGroupKeyByCode(r.MÃ_CV);
  };
  
  const defaultConstructionRows = [
    { code: '1.1', item: 'Nhận mặt bằng bàn giao' },
    { code: '1.2', item: 'Gia công lắp đặt khung móng pin' },
    { code: '1.3', item: 'Lắp ráp khung móng/khung đỡ' },
    { code: '2.1', item: 'Lắp đặt pin mặt trời (PV panels)' },
    { code: '2.2', item: 'Lắp đặt Inverter' },
    { code: '2.3', item: 'Lắp đặt tủ SMC' },
    { code: '2.4', item: 'Lắp đặt máng cáp và ống luồn dây' },
    { code: '3.1', item: 'Đấu nối cáp DC (từ string pin về tủ SMC/Inverter)' },
    { code: '3.2', item: 'Lắp đặt cáp AC (Inverter về tủ điện chính MSB)' },
    { code: '3.3', item: 'Lắp đặt hệ thống giám sát (Meters, Dataloggers)' },
    { code: '3.4', item: 'Lắp đặt tủ Zero export' },
    { code: '3.5', item: 'Lắp đặt hệ thống tiếp địa AC/DC' },
    { code: '3.6', item: 'Lắp đặt hệ thống PCCC' },
    { code: '3.7', item: 'Lắp đặt hệ thống chiếu sáng' },
    { code: '3.8', item: 'Ngắt điện để đấu nối và chỉnh sửa tủ MSB (Nếu cần)' },
    { code: '4.1', item: 'Đóng điện cho T&C (Thử nghiệm & Nghiệm thu)' },
    { code: '4.2', item: 'T&C (Thử nghiệm & Nghiệm thu)' },
    { code: '4.3', item: 'Phân tích chất lượng điện của Inverter' },
    { code: '4.4', item: 'Ngày vận hành thương mại (COD)' },
    { code: '4.5', item: 'Kiểm tra hiệu suất PR' }
  ];
  
  const rowsToUse = constructions.length > 0 ? constructions : defaultConstructionRows;
  rowsToUse.forEach(task => {
    const key = getGroupKeyFromRow(task);
    if (key) {
      const prog = Number(task.TIẾN_ĐỘ_THỰC_TẾ || task.progress || 0);
      groupTasks[key].push(prog);
    }
  });
  
  let constructionProg = 0;
  for (const key in groupWeights) {
    const tasks = groupTasks[key];
    const avg = tasks.length > 0 ? (tasks.reduce((sum, v) => sum + v, 0) / tasks.length) : 0;
    constructionProg += avg * (groupWeights[key] / 100);
  }
  
  // 5. Handovers (10%)
  const handovers = getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(r => r.PROJECT_ID == projectId);
  const handoversComp = handovers.filter(h => h.KẾT_QUẢ_CUỐI && h.KẾT_QUẢ_CUỐI !== '-' && h.KẾT_QUẢ_CUỐI !== 'N/A' && String(h.KẾT_QUẢ_CUỐI).trim() !== '').length;
  const handoverProg = handovers.length > 0 ? (handoversComp / handovers.length) * 100 : 0;
  
  // 6. Overall calculation
  const overall = (permitProg * 0.10) + (designProg * 0.15) + (procurementProg * 0.20) + (constructionProg * 0.45) + (handoverProg * 0.10);
  const roundedOverall = Math.round(overall * 100) / 100;
  
  // 7. Update PROJECT_MASTER sheet
  const masterSheet = ss.getSheetByName('PROJECT_MASTER');
  if (masterSheet) {
    const masterData = masterSheet.getDataRange().getValues();
    const headers = masterData[0];
    const idIndex = findColumnIndex(headers, 'PROJECT_ID');
    const actualIndex = findColumnIndex(headers, 'TIẾN_ĐỘ_THỰC_TẾ');
    const planIndex = findColumnIndex(headers, 'TIẾN_ĐỘ_KẾ_HOẠCH');
    const delayIndex = findColumnIndex(headers, 'DELAY');
    
    if (idIndex !== -1) {
      for (let i = 1; i < masterData.length; i++) {
        if (masterData[i][idIndex] == projectId) {
          if (actualIndex !== -1) {
            masterSheet.getRange(i + 1, actualIndex + 1).setValue(roundedOverall);
          }
          if (delayIndex !== -1 && planIndex !== -1) {
            const planVal = Number(masterData[i][planIndex] || 0);
            
            const deviation = roundedOverall - planVal;
            masterSheet.getRange(i + 1, delayIndex + 1).setValue(deviation);
            
            // Auto Update Risk based on deviation
            const riskIndex = findColumnIndex(headers, 'RISK_LEVEL');
            const mucDoRuiRoIndex = findColumnIndex(headers, 'MỨC_ĐỘ_RỦI_RO');
            const targetRiskIndex = riskIndex !== -1 ? riskIndex : mucDoRuiRoIndex;
            if (targetRiskIndex !== -1) {
              let computedRisk = "LOW";
              if (deviation < -10) computedRisk = "HIGH";
              else if (deviation < -5) computedRisk = "MEDIUM";
              masterSheet.getRange(i + 1, targetRiskIndex + 1).setValue(computedRisk);
            }

          }
          break;
        }
      }
    }
  }
}


function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetIfEmpty(sheet, sheetName);
  }
  return sheet;
}


function batchAppendRows(ss, sheetName, rowsData) {
  if (!rowsData || rowsData.length === 0) return;
  const sheet = getOrCreateSheet(ss, sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const FIELD_ALIASES = {
    'LOG_DATE':          ['LOG_DATE', 'NGÀY'],
    'MANPOWER':          ['MANPOWER', 'NHÂN_LỰC_SITE'],
    'ENGINEERS':         ['ENGINEERS', 'KỸ_SƯ_GS'],
    'WEATHER':           ['WEATHER', 'THỜI_TIẾT'],
    'INCIDENT_COUNT':    ['INCIDENT_COUNT', 'SỰ_CỐ'],
    'DAILY_NOTE':        ['DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'WEEKLY_ASSESSMENT': ['WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN'],
    'MONTHLY_REPORT':    ['MONTHLY_REPORT', 'GHI_CHÚ_HIỆN_TRƯỜNG'],
    'NGÀY':                   ['NGÀY', 'LOG_DATE'],
    'NHÂN_LỰC_SITE':          ['NHÂN_LỰC_SITE', 'MANPOWER'],
    'KỸ_SƯ_GS':              ['KỸ_SƯ_GS', 'ENGINEERS'],
    'THỜI_TIẾT':              ['THỜI_TIẾT', 'WEATHER'],
    'SỰ_CỐ':                 ['SỰ_CỐ', 'INCIDENT_COUNT'],
    'GHI_CHÚ_HIỆN_TRƯỜNG':   ['GHI_CHÚ_HIỆN_TRƯỜNG', 'DAILY_NOTE'],
    'ĐÁNH_GIÁ_TUẦN':         ['ĐÁNH_GIÁ_TUẦN', 'WEEKLY_ASSESSMENT']
  };

  const rowsArray = rowsData.map(rowObj => {
    const newRow = new Array(headers.length).fill("");
    for (const key in rowObj) {
      if (key === '_rowIndex') continue;
      let colIndex = findColumnIndex(headers, key);
      if (colIndex === -1 && FIELD_ALIASES[key]) {
        colIndex = findColumnIndex(headers, FIELD_ALIASES[key]);
      }
      if (colIndex === -1 && STANDARD_KEYS_MAP[key.toLowerCase().replace(/\s+/g, '')]) {
        const standardHeader = STANDARD_KEYS_MAP[key.toLowerCase().replace(/\s+/g, '')];
        colIndex = findColumnIndex(headers, standardHeader);
      }
      if (colIndex !== -1) {
        newRow[colIndex] = rowObj[key];
      }
    }
    return newRow;
  });
  
  if (rowsArray.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsArray.length, headers.length).setValues(rowsArray);
  }
}
function initializeProjectDetails(ss, projectId, kickoffDate = '', codDate = '') {
  if (!projectId) return;

  // 1. Permits
  const permitSheet = getOrCreateSheet(ss, 'PROJECT_PERMIT');
  if (permitSheet) {
    const permits = getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(r => r.PROJECT_ID == projectId);
    if (permits.length === 0) {
      const defaultPermits = [
        'Sở công thương',
        'EVN (Pmax, Scada)',
        'PCCC (Thông báo)',
        'Đăng ký môi trường',
        'Sở xây dựng/BQL'
      ];
      const data = defaultPermits.map(function(item) { return {
          PROJECT_ID: projectId,
          HẠNG_MỤC: item,
          TÌNH_TRẠNG: 'Chưa làm',
          KẾ_QUẢ_PHẢN_HỒI: 'Chưa có phản hồi',
          BƯỚC_TIẾP_THEO: 'Nộp hồ sơ',
          KẾ_QUẢ_CUỐI: 'N/A'
        }; }); batchAppendRows(ss, 'PROJECT_PERMIT', data);
    }
  }

  // 2. Designs
  const designSheet = getOrCreateSheet(ss, 'PROJECT_DESIGN');
  if (designSheet) {
    const designs = getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(r => r.PROJECT_ID == projectId);
    if (designs.length === 0) {
      const defaultDesigns = [
        'Bản vẽ sơ bộ làm giấy phép',
        'Bản vẽ thi công',
        'BOQ',
        'Bản vẽ hoàn công'
      ];
      const data = defaultDesigns.map(function(item) { return {
          PROJECT_ID: projectId,
          HẠNG_MỤC_BẢN_VẼ: item,
          TÌNH_TRẠNG: 'Chưa làm',
          PHÊ_DUYỆT: 'Chưa phản hồi',
          BƯỚC_TIẾP_THEO: 'Vẽ mới',
          KẾ_QUẢ_CUỐI: '-'
        }; }); batchAppendRows(ss, 'PROJECT_DESIGN', data);
    }
  }

  // 3. Procurements
  const procurementSheet = getOrCreateSheet(ss, 'PROJECT_PROCUREMENT');
  if (procurementSheet) {
    const procurements = getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(r => r.PROJECT_ID == projectId);
    if (procurements.length === 0) {
      const defaultProcurements = [
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
        'Hệ thống vệ sinh pin (Bơm, phụ kiện bơm, bồn nước, CB bơm, ống nước, khơi thủy)'
      ];
      const data = defaultProcurements.map(function(item) { return {
          PROJECT_ID: projectId,
          HẠNG_MỤC_MUA_HÀNG: item,
          NGÀY_VỀ_DỰ_KIẾN: '',
          NGÀY_VỀ_THỰC_TẾ: '',
          TÌNH_TRẠNG_VẬT_TƯ: '',
          ĐÁNH_GIÁ_TIẾN_ĐỘ: ''
        }; }); batchAppendRows(ss, 'PROJECT_PROCUREMENT', data);
    }
  }

  // 4. Constructions
  const constructionSheet = getOrCreateSheet(ss, 'PROJECT_CONSTRUCTION');
  if (constructionSheet) {
    const constructions = getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(r => r.PROJECT_ID == projectId);
    if (constructions.length === 0) {
      const defaultConstructions = [
        { group: '[A] CÔNG TÁC TẠM BAN ĐẦU', code: '1', item: 'Đặt văn phòng BCH', start: '01/05/2026', endPlan: '-', endActual: '15/05/2026', weight: 15 },
        { group: '[A] CÔNG TÁC TẠM BAN ĐẦU', code: '1', item: 'Khu vực tập kết vật tư', start: '02/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[A] CÔNG TÁC TẠM BAN ĐẦU', code: '1', item: 'Lắp đặt lối truy cập mái', start: '03/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[A] CÔNG TÁC TẠM BAN ĐẦU', code: '1', item: 'Lắp đặt các công tác tạm', start: '04/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[A] CÔNG TÁC TẠM BAN ĐẦU', code: '1', item: 'Nhận bàn giao mặt bằng thi công (Nhà biến tần, mặt bằng mái...)', start: '05/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt lan can cứng', start: '06/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt lối đi bộ', start: '07/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Định vị & lắp đặt kẹp', start: '08/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt thanh rail', start: '09/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt giá đỡ máng cáp DC/AC', start: '10/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt máng cáp DC/AC', start: '11/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Kéo cáp DC từ chuỗi PV đến Inverter', start: '12/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt tấm pin mặt trời (PV Module)', start: '13/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt hệ thống nối đất DC trên mái (Kẹp tiếp địa, cáp nối đất DC)', start: '14/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt trạm thời tiết (cảm biến, kéo cáp)', start: '15/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt hệ thống rửa nước', start: '16/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        { group: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI', code: '2', item: 'Lắp đặt thang truy cập mái', start: '17/05/2026', endPlan: '-', endActual: '-', weight: 40 },
        
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt khung inverter (Đổ bê tông nếu cần)', start: '18/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt biến tần', start: '19/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt tủ ACDB và tủ trung gian, đấu nối', start: '20/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt máng cáp DC/AC tại trạm inverter/ Tủ MSB của nhà máy', start: '21/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Kéo cáp AC từ Inverter đến tủ ACDB Solar', start: '22/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Kéo cáp AC từ tủ ACDB solar đến tủ MSB hiện hữu của nhà máy', start: '23/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt hệ thống giám sát (lắp datalogger, UPS, nguồn điện, router và cài đặt)', start: '24/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt tủ Zero export', start: '25/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt hệ thống tiếp địa AC/DC', start: '26/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt hệ thống PCCC (Bảng tiêu lệnh, quả cầu PCCC, bình PCCC)', start: '27/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Lắp đặt hệ thống chiếu sáng', start: '28/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        { group: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN', code: '3', item: 'Ngắt điện để đấu nối và chỉnh sửa tủ MSB (Nếu cần)', start: '29/05/2026', endPlan: '-', endActual: '-', weight: 30 },
        
        { group: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN', code: '4', item: 'Đóng điện cho T&C (Thử nghiệm & Nghiệm thu)', start: '30/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN', code: '4', item: 'T&C (Thử nghiệm & Nghiệm thu)', start: '31/05/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN', code: '4', item: 'Phân tích chất lượng điện của Inverter', start: '01/06/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN', code: '4', item: 'Ngày vận hành thương mại (COD)', start: '15/06/2026', endPlan: '-', endActual: '-', weight: 15 },
        { group: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN', code: '4', item: 'Kiểm tra hiệu suất PR', start: '16/06/2026', endPlan: '-', endActual: '-', weight: 15 }
      ];
      const data = defaultConstructions.map(function(task) { return {
          PROJECT_ID: projectId,
          NHÓM_THI_CÔNG: task.group,
          MÃ_CV: task.code,
          HẠNG_MỤC_CÔNG_VIỆC: task.item,
          NGÀY_BẮT_ĐẦU: task.start,
          SỐ_NGÀY: '',
          NGÀY_KẾT_THÚC: task.endPlan,
          NGÀY_HT_THỰC_TẾ: task.endActual,
          TIẾN_ĐỘ_THỰC_TẾ: 0,
          TRỌNG_SỐ: task.weight
        }; }); batchAppendRows(ss, 'PROJECT_CONSTRUCTION', data);
    }
  }

  // 5. Handovers
  const handoverSheet = getOrCreateSheet(ss, 'PROJECT_HANDOVER');
  if (handoverSheet) {
    const handovers = getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(r => r.PROJECT_ID == projectId);
    if (handovers.length === 0) {
      const defaultHandovers = [
        'Hồ sơ thiết kế hoàn công',
        'Tài liệu hướng dẫn vận hành & bảo trì (O&M Manuals)',
        'Biên bản nghiệm thu hoàn thành T&C và chạy thử',
        'Giấy chứng nhận/biên bản kiểm định thiết bị',
        'Biên bản nghiệm thu COD & Bàn giao đưa vào sử dụng'
      ];
        const data = defaultHandovers.map(function(item) { return {
          PROJECT_ID: projectId,
          HẠNG_MỤC: item,
          TÌNH_TRẠNG: 'Chưa làm',
          KẾ_QUẢ_PHẢN_HỒI: 'Chưa có phản hồi',
          BƯỚC_TIẾP_THEO: 'Chuẩn bị hồ sơ',
          KẾ_QUẢ_CUỐI: 'N/A'
        }; }); batchAppendRows(ss, 'PROJECT_HANDOVER', data);
    }
  }

  // 6. Milestones
  const milestoneSheet = getOrCreateSheet(ss, 'PROJECT_MILESTONE');
  if (milestoneSheet) {
    const milestones = getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(r => r.PROJECT_ID == projectId);
    if (milestones.length === 0) {
      const defaultMilestones = [
        { title: 'KICKOFF', date: kickoffDate, status: kickoffDate ? 'completed' : 'pending' },
        { title: 'PHÁP LÝ', date: '', status: 'pending' },
        { title: 'THIẾT KẾ', date: '', status: 'pending' },
        { title: 'VẬT TƯ', date: '', status: 'pending' },
        { title: 'THI CÔNG', date: '', status: 'pending' },
        { title: 'COD', date: codDate, status: codDate ? 'delay' : 'pending' },
        { title: 'BÀN GIAO HỒ SƠ', date: '', status: 'pending' }
      ];
      const data = defaultMilestones.map(function(m) { return {
          PROJECT_ID: projectId,
          MILESTONE: m.title,
          NGÀY_KẾ_HOẠCH: m.date || "",
          NGÀY_THỰC_TẾ: '',
          STATUS: m.status
        }; }); batchAppendRows(ss, 'PROJECT_MILESTONE', data);
    }
  }
}

function onEdit(e) {
  if (!e) return;
  const ss = e.source;
  if (!ss) return;
  
  const activeSheet = ss.getActiveSheet();
  const editedRange = e.range;

  // Kiểm tra nếu sửa ở sheet PROJECT_MASTER, cột A (PROJECT_ID), dòng > 1
  if (activeSheet.getName() === "PROJECT_MASTER") {
    
    // Nếu là nhập ID mới ở cột 1
    if (editedRange.getColumn() === 1 && editedRange.getRow() > 1) {
      const projectId = editedRange.getValue(); // ID mới sau khi sửa
      if (projectId && projectId !== "") {
        initializeProjectDetails(ss, projectId);
      }
    }
    
    // Luôn dọn dẹp các dự án rác sau mỗi lần sửa đổi ở Master (như xóa hàng)
    cleanupOrphanedProjects(ss);
  }
}

function cleanupOrphanedProjects(ss) {
  const masterSheet = ss.getSheetByName('PROJECT_MASTER');
  if (!masterSheet) return;
  
  // Lấy danh sách ID dự án đang có
  const masterData = masterSheet.getDataRange().getValues();
  if (masterData.length <= 1) return;
  
  const activeProjectIds = new Set();
  for (let i = 1; i < masterData.length; i++) {
    const id = String(masterData[i][0]).trim();
    if (id) activeProjectIds.add(id);
  }

  const sheetsToClean = [
    'PROJECT_RISK', 'PROJECT_PERMIT', 'PROJECT_DESIGN', 
    'PROJECT_PROCUREMENT', 'PROJECT_CONSTRUCTION',
    'PROJECT_HANDOVER', 'PROJECT_MILESTONE', 'PROJECT_S_CURVE', 'DAILY_SITE_LOG'
  ];

  sheetsToClean.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    
    // Tìm cột PROJECT_ID
    let idColIndex = -1;
    for (let j = 0; j < headers.length; j++) {
      const h = String(headers[j]).trim().toUpperCase();
      if (h === 'PROJECT_ID' || h === 'ID' || h === 'PROJECTID') {
        idColIndex = j;
        break;
      }
    }
    
    if (idColIndex !== -1) {
      let deletedCount = 0;
      for (let i = data.length - 1; i > 0; i--) {
        const id = String(data[i][idColIndex]).trim();
        // Nếu ID trong sheet phụ KHÔNG có mặt trong tập hợp ID của sheet Master thì xóa
        if (id && !activeProjectIds.has(id)) {
          sheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        SpreadsheetApp.flush();
      }
    }
  });
}
