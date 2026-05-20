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
      case 'site-log':
        data = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == id || row.projectId == id));
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
      case 'update-site-log':
        sheetName = 'DAILY_SITE_LOG';
        break;
      case 'update-project':
        sheetName = 'PROJECT_MASTER';
        break;
      case 'add-project':
        sheetName = 'PROJECT_MASTER';
        break;
      default:
        return createResponse({ error: 'Invalid API endpoint for POST' }, 400);
    }
    
    if (sheetName) {
      if (action === 'add-project') {
        appendRow(ss, sheetName, payload);
      } else {
        // Fallback to payload.id if payload.PROJECT_ID is not provided (for older modules)
        updateRowById(ss, sheetName, payload.PROJECT_ID || payload.id, payload);
      }
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
  if (data.length <= 1) throw new Error("No data in sheet");
  
  const headers = data[0];
  let targetRowIndex = -1;
  
  // Use _rowIndex directly if valid to allow updating non-unique table rows (e.g. risks, design, permits)
  if (updatedData && updatedData._rowIndex && Number(updatedData._rowIndex) > 1 && Number(updatedData._rowIndex) <= data.length) {
    targetRowIndex = Number(updatedData._rowIndex);
  } else {
    // Find ID column (could be PROJECT_ID or id depending on sheet)
    let idColIndex = headers.indexOf('PROJECT_ID');
    if (idColIndex === -1) idColIndex = headers.indexOf('id');
    if (idColIndex === -1) idColIndex = headers.indexOf('projectId');
    
    if (idColIndex === -1) throw new Error("No ID column found in sheet");
    
    for (let i = 1; i < data.length; i++) {
      // Weak equality because sheet ID might be number but payload ID is string
      if (data[i][idColIndex] == recordId) {
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

function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function appendRow(ss, sheetName, payload) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  
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
