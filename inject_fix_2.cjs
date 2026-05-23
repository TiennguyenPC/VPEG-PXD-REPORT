const fs = require('fs');
let code = fs.readFileSync('backend/Code.gs', 'utf8');

// Fix 1: appendRow
code = code.replace(
  "newRow[colIndex] = val;",
  `const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
      }
      newRow[colIndex] = val;`
);

// Fix 2: batchAppendRows
code = code.replace(
  "newRow[colIndex] = rowObj[key];",
  `let val = rowObj[key];
        const hStr = String(headers[colIndex]).trim().toUpperCase();
        if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
          val = "'" + val;
        }
        newRow[colIndex] = val;`
);

// Fix 3: updateRowById
code = code.replace(
  "sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);",
  `const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
      }
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);`
);

// Fix 4: dashboard-bundle name matching
const oldDashboardCode = `      case 'dashboard-bundle':
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
        break;`;

const newDashboardCode = `      case 'dashboard-bundle':
        let reqProjectId = id;
        const allMasterProjects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
        let matchedProject = allMasterProjects.find(p => (
          String(p.PROJECT_ID) === String(reqProjectId) || 
          String(p.id) === String(reqProjectId) || 
          (p['TÊN_DỰ_ÁN'] && String(p['TÊN_DỰ_ÁN']).toUpperCase() === String(reqProjectId).toUpperCase()) ||
          (p.PROJECT_NAME && String(p.PROJECT_NAME).toUpperCase() === String(reqProjectId).toUpperCase()) ||
          (p.name && String(p.name).toUpperCase() === String(reqProjectId).toUpperCase())
        ));
        
        const actualProjectId = matchedProject ? (matchedProject.PROJECT_ID || matchedProject.id) : reqProjectId;
        
        initializeProjectDetails(ss, actualProjectId);
        const siteLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId));
        data = {
          project: matchedProject || null,
          scurve: getSheetDataAsObjects(ss, 'PROJECT_S_CURVE').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          risks: getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          permits: getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          designs: getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          procurements: getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          constructions: getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          handovers: getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId)),
          siteLogs: siteLogs,
          weeklyLogs: getWeeklyAggregates(ss, actualProjectId, siteLogs),
          monthlyLogs: getMonthlyAggregates(ss, actualProjectId, siteLogs),
          milestones: getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(row => (row.PROJECT_ID == actualProjectId || row.projectId == actualProjectId))
        };
        break;`;

if (code.includes(oldDashboardCode)) {
  code = code.replace(oldDashboardCode, newDashboardCode);
} else {
  console.log("Could not find old dashboard-bundle code to replace.");
}

fs.writeFileSync('backend/Code.gs', code, 'utf8');
