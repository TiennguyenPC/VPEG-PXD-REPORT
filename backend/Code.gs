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
        data = {
          project: getSheetDataAsObjects(ss, 'PROJECT_MASTER').find(p => (p.PROJECT_ID == projectId || p.id == projectId)) || null,
          scurve: getSheetDataAsObjects(ss, 'PROJECT_S_CURVE').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          risks: getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          permits: getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          designs: getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          procurements: getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          constructions: getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          handovers: getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          siteLogs: getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
          weeklyLogs: getWeeklyAggregates(ss, projectId),
          monthlyLogs: getMonthlyAggregates(ss, projectId),
          milestones: getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId))
        };
        break;
      case 'projects':
        data = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
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
    const payload = JSON.parse(e.postData.contents);
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
      } else {
        // Fallback to payload.id if payload.PROJECT_ID is not provided (for older modules)
        updateRowById(ss, sheetName, payload.PROJECT_ID || payload.id, payload);
      }
    }
    
    if (action === 'update-site-log') {
      const projectId = payload.PROJECT_ID || payload.id;
      return createResponse({
        status: 'success',
        message: 'Data updated successfully',
        dailyLogs: getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == projectId || row.projectId == projectId)),
        weeklyLogs: getWeeklyAggregates(ss, projectId),
        monthlyLogs: getMonthlyAggregates(ss, projectId)
      });
    }
    
    return createResponse({ status: 'success', message: 'Data updated successfully' });
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() }, 500);
  }
}

// ================= UTILITIES =================

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
      // Assume first row is header keys, match exactly with JS object keys
      if (headers[j]) {
        let val = row[j];
        // Handle dates properly if needed
        if (val instanceof Date) {
          // simple formatting for frontend
          const y = val.getFullYear();
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          val = `${d}/${m}/${y}`;
        }
        obj[headers[j]] = val;
      }
    }
    // inject row index for update logic if needed
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
    let idColIndex = headers.indexOf('PROJECT_ID');
    if (idColIndex === -1) idColIndex = headers.indexOf('id');
    if (idColIndex === -1) idColIndex = headers.indexOf('projectId');
    
    let dateColIndex = headers.indexOf('LOG_DATE');
    if (dateColIndex === -1) dateColIndex = headers.indexOf('NGÀY');
    
    if (idColIndex === -1) throw new Error("No ID column found in sheet");
    
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
      
      if (idMatch && dateMatch) {
        targetRowIndex = i + 1; // 1-based index for sheet
        break;
      }
    }
  }
  
  if (targetRowIndex === -1) {
    appendRow(ss, sheetName, updatedData);
    return;
  }
  
  // Update the row
  for (const key in updatedData) {
    if (key === 'id' || key === 'projectId' || key === 'PROJECT_ID' || key === '_rowIndex') continue; // Don't modify keys
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(updatedData[key]);
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

function getWeeklyAggregates(ss, projectId) {
  const logs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => {
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

function getMonthlyAggregates(ss, projectId) {
  const logs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => {
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
  
  for (const key in payload) {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      newRow[colIndex] = payload[key];
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

/**
 * Aggregate daily logs into weekly summaries.
 * Groups by ISO week (Monday to Sunday). No separate sheet needed.
 */
function getWeeklyAggregates(ss, projectId) {
  var allLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(function(row) {
    return String(row.PROJECT_ID) == String(projectId);
  });
  
  if (allLogs.length === 0) return [];
  
  // Helper: parse dd/mm/yyyy to Date
  function parseDate(dateStr) {
    if (!dateStr) return null;
    var parts = String(dateStr).split('/');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  
  // Helper: format Date to dd/mm/yyyy
  function formatDate(d) {
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    return dd + '/' + mm + '/' + d.getFullYear();
  }
  
  // Helper: get Monday of given date
  function getMonday(d) {
    var date = new Date(d);
    var day = date.getDay();
    var diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
  
  // Group logs by week (keyed by Monday date string)
  var weekMap = {};
  allLogs.forEach(function(log) {
    var dateStr = log.LOG_DATE || log.NGÀY;
    var d = parseDate(dateStr);
    if (!d) return;
    
    var monday = getMonday(d);
    var mondayKey = formatDate(monday);
    
    if (!weekMap[mondayKey]) {
      weekMap[mondayKey] = [];
    }
    weekMap[mondayKey].push(log);
  });
  
  // Build aggregated results
  var results = [];
  var keys = Object.keys(weekMap).sort(function(a, b) {
    return parseDate(a) - parseDate(b);
  });
  
  keys.forEach(function(mondayKey) {
    var logsInWeek = weekMap[mondayKey];
    var count = logsInWeek.length;
    
    var totalManpower = 0;
    var totalEngineers = 0;
    var totalIncidents = 0;
    var weatherCounts = {};
    var weeklyAssessment = '';
    
    logsInWeek.forEach(function(log) {
      totalManpower += Number(log.MANPOWER || log.NHÂN_LỰC_SITE || 0);
      totalEngineers += Number(log.ENGINEERS || log.KỸ_SƯ_GS || 0);
      totalIncidents += Number(log.INCIDENT_COUNT || log.SỰ_CỐ || 0);
      
      // Weather: extract condition (before '|' if structured)
      var w = String(log.WEATHER || log.THỜI_TIẾT || '');
      var condition = w.indexOf('|') > -1 ? w.split('|')[0] : w;
      if (condition) {
        weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
      }
      
      // Use latest weekly assessment if available
      if (log.WEEKLY_ASSESSMENT || log.ĐÁNH_GIÁ_TUẦN) {
        weeklyAssessment = log.WEEKLY_ASSESSMENT || log.ĐÁNH_GIÁ_TUẦN;
      }
    });
    
    // Find most common weather
    var topWeather = '';
    var topCount = 0;
    for (var w in weatherCounts) {
      if (weatherCounts[w] > topCount) {
        topCount = weatherCounts[w];
        topWeather = w;
      }
    }
    
    results.push({
      PROJECT_ID: String(projectId),
      LOG_DATE: mondayKey,
      avgManpower: count > 0 ? Math.round(totalManpower / count) : 0,
      avgEngineers: count > 0 ? Math.round(totalEngineers / count) : 0,
      weatherSummary: topWeather || 'Chưa ghi nhận',
      incidentCount: totalIncidents,
      loggedDaysCount: count,
      weeklyAssessment: weeklyAssessment
    });
  });
  
  return results;
}

/**
 * Aggregate daily logs into monthly summaries.
 * Groups by calendar month. No separate sheet needed.
 */
function getMonthlyAggregates(ss, projectId) {
  var allLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(function(row) {
    return String(row.PROJECT_ID) == String(projectId);
  });
  
  if (allLogs.length === 0) return [];
  
  function parseDate(dateStr) {
    if (!dateStr) return null;
    var parts = String(dateStr).split('/');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  
  // Group logs by month key "MM/YYYY"
  var monthMap = {};
  allLogs.forEach(function(log) {
    var dateStr = log.LOG_DATE || log.NGÀY;
    var d = parseDate(dateStr);
    if (!d) return;
    
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var monthKey = mm + '/' + d.getFullYear();
    
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = [];
    }
    monthMap[monthKey].push(log);
  });
  
  var results = [];
  var keys = Object.keys(monthMap).sort(function(a, b) {
    var pa = a.split('/');
    var pb = b.split('/');
    return new Date(pa[1], pa[0] - 1) - new Date(pb[1], pb[0] - 1);
  });
  
  keys.forEach(function(monthKey) {
    var logsInMonth = monthMap[monthKey];
    var count = logsInMonth.length;
    
    var totalManpower = 0;
    var totalEngineers = 0;
    var totalIncidents = 0;
    var weatherCounts = {};
    var monthlyReport = '';
    
    logsInMonth.forEach(function(log) {
      totalManpower += Number(log.MANPOWER || log.NHÂN_LỰC_SITE || 0);
      totalEngineers += Number(log.ENGINEERS || log.KỸ_SƯ_GS || 0);
      totalIncidents += Number(log.INCIDENT_COUNT || log.SỰ_CỐ || 0);
      
      var w = String(log.WEATHER || log.THỜI_TIẾT || '');
      var condition = w.indexOf('|') > -1 ? w.split('|')[0] : w;
      if (condition) {
        weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
      }
      
      if (log.MONTHLY_REPORT) {
        monthlyReport = log.MONTHLY_REPORT;
      }
    });
    
    var topWeather = '';
    var topCount = 0;
    for (var w in weatherCounts) {
      if (weatherCounts[w] > topCount) {
        topCount = weatherCounts[w];
        topWeather = w;
      }
    }
    
    results.push({
      PROJECT_ID: String(projectId),
      LOG_DATE: '01/' + monthKey,
      monthLabel: 'Tháng ' + monthKey,
      avgManpower: count > 0 ? Math.round(totalManpower / count) : 0,
      avgEngineers: count > 0 ? Math.round(totalEngineers / count) : 0,
      weatherSummary: topWeather || 'Chưa ghi nhận',
      incidentCount: totalIncidents,
      loggedDaysCount: count,
      monthlyReport: monthlyReport
    });
  });
  
  return results;
}

function getDefaultHeaders(sheetName) {
  switch (sheetName) {
    case 'PROJECT_MASTER':
      return ['PROJECT_ID', 'TÊN_DỰ_ÁN', 'KHÁCH_HÀNG', 'PM', 'SM', 'CÔNG_SUẤT_KWP', 'KẾ_HOẠCH_COD', 'DỰ_BÁO_COD', 'TIẾN_ĐỘ_KẾ_HOẠCH', 'TIẾN_ĐỘ_THỰC_TẾ', 'DELAY', 'TRẠNG_THÁI', 'RISK_LEVEL', 'CẬP_NHẬT_CUỐI'];
    case 'PROJECT_RISK':
      return ['PROJECT_ID', 'MỨC_ĐỘ', 'NỘI_DUNG', 'ẢNH_HƯỞNG', 'TRẠNG_THÁI', 'PHỤ_TRÁCH', 'NGÀY', 'GHI_CHÚ'];
    case 'PROJECT_PERMIT':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾ_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾ_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_DESIGN':
      return ['PROJECT_ID', 'HẠNG_MỤC_BẢN_VẼ', 'TÌNH_TRẠNG', 'PHÊ_DUYỆT', 'BƯỚC_TIẾP_THEO', 'KẾ_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_PROCUREMENT':
      return ['PROJECT_ID', 'HẠNG_MỤC_MUA_HÀNG', 'NGÀY_VỀ_DỰ_KIẾN', 'NGÀY_VỀ_THỰC_TẾ', 'TÌNH_TRẠNG_VẬT_TƯ', 'ĐÁNH_GIÁ_TIẾN_ĐỘ', 'NCC', 'GHI_CHÚ'];
    case 'PROJECT_CONSTRUCTION':
      return ['PROJECT_ID', 'NHÓM_THI_CÔNG', 'MÃ_CV', 'HẠNG_MỤC_CÔNG_VIỆC', 'NGÀY_BẮT_ĐẦU', 'SỐ_NGÀY', 'NGÀY_KẾT_THÚC', 'NGÀY_HT_THỰC_TẾ', 'TIẾN_ĐỘ_THỰC_TẾ', 'TRỌNG_SỐ'];
    case 'PROJECT_HANDOVER':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾ_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾ_QUẢ_CUỐI', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'DAILY_SITE_LOG':
      return ['PROJECT_ID', 'LOG_DATE', 'NGÀY', 'MANPOWER', 'NHÂN_LỰC_SITE', 'ENGINEERS', 'KỸ_SƯ_GS', 'WEATHER', 'THỜI_TIẾT', 'INCIDENT_COUNT', 'SỰ_CỐ', 'DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG', 'WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN', 'MONTHLY_REPORT', 'STATUS', 'UPDATED_BY', 'UPDATED_AT'];
    default:
      return [];
  }
}
