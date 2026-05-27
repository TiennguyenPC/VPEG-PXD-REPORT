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
        break;
      case 'ai-context':
        data = getAllSheetDataForAI(ss);
        break;
      case 'projects':
        data = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
        break;
      case 'tasks': {
        var allTasks = getSheetDataAsObjects(ss, 'PROJECT_TASKS');
        var taskToken = e.parameter.token || '';
        var taskSession = getAuthSession_(taskToken);
        data = filterTasksForSession_(allTasks, taskSession, ss);
        break;
      }
      case 'employees':
        data = getSheetDataAsObjects(ss, 'EMPLOYEE').map(sanitizeEmployeeForClient_);
        break;
      case 'project':
        const allProjects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
        data = allProjects.find(p => (p.PROJECT_ID == id || p.id == id)) || null;
        break;
      case 'risk':
        data = getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(row => (row.PROJECT_ID == id || row.projectId == id));
        break;
      case 'risks':
        data = getSheetDataAsObjects(ss, 'PROJECT_RISK');
        break;
      case 'overview': {
        var overviewToken = e.parameter.token || '';
        var overviewSession = getAuthSession_(overviewToken);
        var overviewTasks = getSheetDataAsObjects(ss, 'PROJECT_TASKS');
        data = {
          projects: getSheetDataAsObjects(ss, 'PROJECT_MASTER'),
          tasks: filterTasksForSession_(overviewTasks, overviewSession, ss),
          risks: getSheetDataAsObjects(ss, 'PROJECT_RISK')
        };
        break;
      }
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
      case 'upload-image-commit':
        var commitSid = e.parameter.sessionId;
        if (!commitSid) {
          return createResponse({ status: 'error', message: 'Thiếu sessionId' }, 400);
        }
        var commitResult = commitSiteImageUpload_(commitSid);
        data = commitResult;
        break;
      case 'serve-site-image':
        return serveSiteImage_(e.parameter.id);
      case 'test-drive':
        var readFolder = getSiteImageUploadFolder_();
        var writeFolder = getWritableSiteImageFolder_();
        var probe = writeFolder.createFile(Utilities.newBlob('ok', 'text/plain', 'drive-probe.txt'));
        probe.setTrashed(true);
        data = {
          ok: true,
          readFolder: readFolder.getName(),
          readFolderId: readFolder.getId(),
          writeFolder: writeFolder.getName(),
          writeFolderId: writeFolder.getId(),
          message: 'Drive ghi OK. Quay lại dashboard và thử upload ảnh lại.'
        };
        break;
      case 'auth-me':
        var authToken = e.parameter.token || '';
        var authSession = getAuthSession_(authToken);
        if (!authSession) {
          return createResponse({ status: 'error', message: 'Phiên đănh nhập hết hạn hoặc không hợp lệ' }, 401);
        }
        data = authSession;
        break;
      case 'script-meta':
        data = {
          scriptId: ScriptApp.getScriptId(),
          spreadsheetId: SPREADSHEET_ID,
          timezone: Session.getScriptTimeZone()
        };
        break;
      case 'users': {
        var adminCheck = requireAdminSession_(null, e);
        if (adminCheck.error) {
          return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
        }
        data = listUsersForAdmin_(ss);
        break;
      }
      case 'audit-logs': {
        var auditAdminCheck = requireAdminSession_(null, e);
        if (auditAdminCheck.error) {
          return createResponse({ status: 'error', message: auditAdminCheck.error }, auditAdminCheck.code || 403);
        }
        var logLimit = parseInt(e.parameter.limit || '150', 10);
        var logOffset = parseInt(e.parameter.offset || '0', 10);
        data = listAuditLogs_(ss, logLimit, logOffset, e.parameter.userId, e.parameter.actionFilter);
        break;
      }
      case 'notifications': {
        var notifToken = e.parameter.token || '';
        var notifSession = getAuthSession_(notifToken);
        if (!notifSession) {
          return createResponse({ status: 'error', message: 'Vui lòng đăng nhập' }, 401);
        }
        var notifLimit = parseInt(e.parameter.limit || '50', 10);
        data = listNotificationsForUser_(ss, notifSession.userId, notifLimit);
        break;
      }
      case 'run-daily-notifications': {
        var dailyAdmin = requireAdminSession_(null, e);
        if (dailyAdmin.error) {
          return createResponse({ status: 'error', message: dailyAdmin.error }, dailyAdmin.code || 403);
        }
        data = runDailyNotificationChecks_();
        break;
      }
      case 'setup-notifications-trigger': {
        var triggerAdmin = requireAdminSession_(null, e);
        if (triggerAdmin.error) {
          return createResponse({ status: 'error', message: triggerAdmin.error }, triggerAdmin.code || 403);
        }
        data = installDailyNotificationTrigger_();
        break;
      }
      case 'notification-email-config': {
        var emailCfgAdmin = requireAdminSession_(null, e);
        if (emailCfgAdmin.error) {
          return createResponse({ status: 'error', message: emailCfgAdmin.error }, emailCfgAdmin.code || 403);
        }
        data = getNotificationEmailConfig_();
        break;
      }
      case 'authorize-mail-app': {
        var mailAuthAdmin = requireAdminSession_(null, e);
        if (mailAuthAdmin.error) {
          return createResponse({ status: 'error', message: mailAuthAdmin.error }, mailAuthAdmin.code || 403);
        }
        try {
          data = authorizeMailApp_();
        } catch (mailErr) {
          return createResponse({
            status: 'error',
            message: (mailErr && mailErr.message) || String(mailErr)
          }, 500);
        }
        break;
      }
      case 'share-public': {
        var shareToken = String(e.parameter.token || '').trim();
        data = getPublicShareData_(ss, shareToken);
        if (!data) {
          return createResponse({ status: 'error', message: 'Link chia sẻ không hợp lệ hoặc đã tắt' }, 404);
        }
        break;
      }
      case 'project-share-status': {
        var shareStatusCheck = requireProjectShareSession_(null, e, e.parameter.projectId);
        if (shareStatusCheck.error) {
          return createResponse({ status: 'error', message: shareStatusCheck.error }, shareStatusCheck.code || 403);
        }
        data = getProjectShareStatus_(ss, shareStatusCheck.projectId);
        break;
      }
      default:
        return createResponse({
          error: 'Invalid API endpoint',
          hint: 'Thêm ?action=... vào URL. Ví dụ: ?action=projects hoặc ?action=test-drive'
        }, 400);
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

    if (action === 'login') {
      return handleAuthLogin_(payload);
    }
    if (action === 'logout') {
      return handleAuthLogout_(payload);
    }
    if (action === 'add-user') {
      return handleAddUser_(payload);
    }
    if (action === 'update-user') {
      return handleUpdateUser_(payload);
    }
    if (action === 'deactivate-user') {
      return handleDeactivateUser_(payload);
    }
    if (action === 'delete-user') {
      return handleDeleteUser_(payload);
    }
    if (action === 'change-password') {
      return handleChangePassword_(payload);
    }
    if (action === 'mark-notification-read') {
      return handleMarkNotificationRead_(payload);
    }
    if (action === 'mark-all-notifications-read') {
      return handleMarkAllNotificationsRead_(payload);
    }
    if (action === 'enable-project-share') {
      return handleEnableProjectShare_(payload);
    }
    if (action === 'disable-project-share') {
      return handleDisableProjectShare_(payload);
    }
    if (action === 'update-notification-email-config') {
      return handleUpdateNotificationEmailConfig_(payload);
    }
    if (action === 'send-test-notification-email') {
      return handleSendTestNotificationEmail_(payload);
    }

    if (isProtectedMutation_(action)) {
      var authReq = requireAuthForMutation_(payload);
      if (authReq.error) {
        return createResponse({ status: 'error', message: authReq.error }, authReq.code || 401);
      }
      var permErr = checkMutationPermission_(action, payload, authReq.session);
      if (permErr) {
        return createResponse({ status: 'error', message: permErr }, 403);
      }
    }
    
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
      case 'update-task':
        sheetName = 'PROJECT_TASKS';
        break;
      case 'add-task':
        sheetName = 'PROJECT_TASKS';
        break;
      case 'delete-task':
        sheetName = 'PROJECT_TASKS';
        break;
      case 'delete-project':
        sheetName = 'PROJECT_MASTER';
        break;
      case 'upload-site-image':
        const uploadedUrl = uploadSiteImageToDrive_(payload);
        auditMutation_('upload-site-image', payload);
        var logsAfterUpload = attachUploadedPhotoToLog_(ss, payload, uploadedUrl);
        return createResponse({
          status: 'success',
          data: { url: uploadedUrl },
          dailyLogs: logsAfterUpload || undefined
        });
      case 'save-site-photos':
        saveSitePhotosForLog_(ss, payload);
        auditMutation_('save-site-photos', payload);
        var pidPhotos = payload.PROJECT_ID || payload.id;
        var dailyLogsPhotos = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(function(row) {
          return String(row.PROJECT_ID || row.projectId) === String(pidPhotos);
        });
        return createResponse({
          status: 'success',
          message: 'Site photos saved',
          dailyLogs: dailyLogsPhotos,
          weeklyLogs: getWeeklyAggregates(ss, pidPhotos, dailyLogsPhotos),
          monthlyLogs: getMonthlyAggregates(ss, pidPhotos, dailyLogsPhotos)
        });
      case 'upload-image-chunk':
        storeSiteImageChunk_(payload);
        return createResponse({ status: 'success', data: { ok: true } });
      default:
        return createResponse({ error: 'Invalid API endpoint for POST' }, 400);
    }
    
    if (sheetName) {
      if (sheetName === 'PROJECT_RISK') {
        ensureRiskSheetColumns_(ss);
      }
      if (sheetName === 'PROJECT_TASKS') {
        ensureTaskSheetColumns_(ss);
      }
      if (action.startsWith('add-')) {
        if (action === 'add-task') {
          var taskCreator = getActorFromPayload_(payload);
          payload.NGƯỜI_TẠO = String((taskCreator && taskCreator.displayName) || payload.NGƯỜI_TẠO || '').trim();
        }
        if (action === 'add-project') {
          ensureProjectMasterColumns_(ss);
          var projectCreator = getActorFromPayload_(payload);
          payload.NGƯỜI_TẠO = String((projectCreator && projectCreator.displayName) || payload.NGƯỜI_TẠO || '').trim();
        }
        appendRow(ss, sheetName, payload);
        if (action === 'add-project') {
          autoAssignProjectToUser_(ss, getActorFromPayload_(payload), payload.PROJECT_ID || payload.id);
        }
        if (action === 'add-project') {
          const projectId = payload.PROJECT_ID || payload.id;
          if (projectId) {
            initializeProjectDetails(ss, projectId, payload.KICKOFF_DATE, payload.KẾ_HOẠCH_COD);
          }
        }
        if (action === 'add-task') {
          notifyTaskAssigned_(ss, payload, getActorFromPayload_(payload), { reassigned: false });
        }
      } else if (action.startsWith('delete-')) {
        if (action === 'delete-task') {
          const deleted = deleteTaskRow(ss, payload);
          if (!deleted) {
            return createResponse({ status: 'error', message: 'Không tìm thấy tác vụ để xóa' }, 404);
          }
        } else if (payload._rowIndex) {
          deleteRowById(ss, sheetName, payload._rowIndex);
        } else if (action === 'delete-project') {
          var deletedProject = deleteProjectCompletely_(ss, payload.PROJECT_ID || payload.id);
          if (!deletedProject) {
            return createResponse({ status: 'error', message: 'Không tìm thấy dự án để xóa' }, 404);
          }
        } else {
          deleteProjectRow(ss, sheetName, payload.PROJECT_ID || payload.id);
        }
      } else if (action === 'update-task') {
        var oldTaskAssignee = getTaskAssigneeBeforeUpdate_(ss, payload);
        updateTaskRow(ss, payload);
        var newTaskAssignee = String(payload.NHÂN_SỰ || '').trim();
        if (newTaskAssignee && !namesMatch_(oldTaskAssignee, newTaskAssignee)) {
          notifyTaskAssigned_(ss, payload, getActorFromPayload_(payload), { reassigned: !!oldTaskAssignee });
        }
      } else if (action === 'update-project') {
        var pidForStatus = payload.PROJECT_ID || payload.id;
        var oldProjectStatus = getProjectFieldBeforeUpdate_(ss, pidForStatus, 'TRẠNG_THÁI');
        updateRowById(ss, sheetName, pidForStatus, payload);
        if (payload.KẾ_HOẠCH_COD || payload.COD_PLAN || payload.cod) {
          syncProjectCodToMilestone_(ss, pidForStatus, payload.KẾ_HOẠCH_COD || payload.COD_PLAN || payload.cod);
        }
        if (payload.KICKOFF_DATE || payload.kickoffDate) {
          syncProjectKickoffToMilestone_(ss, pidForStatus, payload.KICKOFF_DATE || payload.kickoffDate);
        }
        var newProjectStatus = payload.TRẠNG_THÁI != null ? payload.TRẠNG_THÁI : oldProjectStatus;
        if (isProjectCompleted_(newProjectStatus) && !isProjectCompleted_(oldProjectStatus)) {
          notifyProjectCompleted_(ss, pidForStatus, getActorFromPayload_(payload));
        }
      } else {
        // Fallback to payload.id if payload.PROJECT_ID is not provided (for older modules)
        updateRowById(ss, sheetName, payload.PROJECT_ID || payload.id, payload);
      }
      
      const projectId = payload.PROJECT_ID || payload.id || payload.projectId;
      if (projectId && ['PROJECT_PERMIT', 'PROJECT_DESIGN', 'PROJECT_PROCUREMENT', 'PROJECT_CONSTRUCTION', 'PROJECT_HANDOVER'].indexOf(sheetName) !== -1) {
        recalculateProjectProgress(ss, projectId);
      }
      
      if (action === 'add-task' || action === 'update-task' || action === 'delete-task') {
        auditMutation_(action, payload);
        return createResponse({
          status: 'success',
          message: 'Data saved successfully',
          data: getSheetDataAsObjects(ss, 'PROJECT_TASKS')
        });
      }
      
      if (action !== 'update-site-log' && action !== 'update-module-dates') {
        if (projectId) {
          auditMutation_(action, payload);
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
      let constructions = [];
      if (projectId) {
        constructions = replayConstructionProgressFromSiteLogs_(ss, projectId);
        recalculateProjectProgress(ss, projectId);
      }
      auditMutation_(action, payload);
      const dailyLogs = filterDailyLogsForProject_(getSheetDataAsObjects(ss, 'DAILY_SITE_LOG'), projectId);
      return createResponse({
        status: 'success',
        message: 'Data updated successfully',
        dailyLogs: dailyLogs,
        weeklyLogs: getWeeklyAggregates(ss, projectId, dailyLogs),
        monthlyLogs: getMonthlyAggregates(ss, projectId, dailyLogs),
        constructions: constructions
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
      auditMutation_(action, payload);
      return createResponse({ status: 'success', message: 'Dates updated across all rows' });
    }
    
    auditMutation_(action, payload);
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
  'dailynote': 'DAILY_NOTE',
  'sitephotos': 'SITE_PHOTOS',
  'anhhientruong': 'SITE_PHOTOS',
  'danhgiatuan': 'ĐÁNH_GIÁ_TUẦN',
  'weeklyassessment': 'ĐÁNH_GIÁ_TUẦN',
  'monthlyreport': 'MONTHLY_REPORT',
  
  // risk
  'mucdo': 'MỨC_ĐỘ',
  'noidung': 'NỘI_DUNG',
  'anhhuong': 'ẢNH_HƯỞNG',
  'phutrach': 'PHỤ_TRÁCH',
  'ngayhoanthanh': 'NGÀY_HOÀN_THÀNH',
  'ngay_hoan_thanh': 'NGÀY_HOÀN_THÀNH',
  
  // milestone
  'milestone': 'MILESTONE',
  'ngaykehoach': 'NGÀY_KẾ_HOẠCH',
  'ngaythucte': 'NGÀY_THỰC_TẾ',
  
  // scurve
  'kehoach%': 'KẾ_HOẠCH_%',
  'thucte%': 'THỰC_TẾ_%',

  // employee
  'employeeid': 'EMPLOYEE_ID',
  'manv': 'EMPLOYEE_ID',
  'manhanvien': 'EMPLOYEE_ID',
  'hoten': 'NAME',
  'hovaten': 'NAME',
  'name': 'NAME',
  'email': 'EMAIL',
  'mail': 'EMAIL',
  'thudientu': 'EMAIL',
  'emailcongty': 'EMAIL',
  'chucvu': 'CHUC_VU',
  'chucdanh': 'CHUC_VU',
  'position': 'CHUC_VU',
  'vaitro': 'CHUC_VU',
  'bophan': 'BO_PHAN',
  'phongban': 'BO_PHAN'
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
  if (sheetName === 'PROJECT_TASKS') {
    ensureTaskSheetColumns_(ss);
  }
  if (sheetName === 'PROJECT_MASTER') {
    ensureProjectMasterColumns_(ss);
  }
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

function getAllSheetDataForAI(ss) {
  const result = {};
  const sheets = ss.getSheets();

  sheets.forEach(function(sheet) {
    const sheetName = sheet.getName();
    result[sheetName] = getSheetDataAsObjects(ss, sheetName);
  });

  return result;
}

function updateRowById(ss, sheetName, recordId, updatedData) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    appendRow(ss, sheetName, updatedData);
    return;
  }
  
  let headers = data[0];
  let targetRowIndex = -1;
  
  // Use _rowIndex directly if valid — except DAILY_SITE_LOG (must match project + date)
  var canUseRowIndex = updatedData && updatedData._rowIndex && Number(updatedData._rowIndex) > 1
    && Number(updatedData._rowIndex) <= data.length && sheetName !== 'DAILY_SITE_LOG';
  if (canUseRowIndex) {
    targetRowIndex = Number(updatedData._rowIndex);
  } else {
    // Find ID column (could be PROJECT_ID or id depending on sheet)
    let idColIndex = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
    
    let dateColIndex = findColumnIndex(headers, ['LOG_DATE', 'NGÀY']);
    
    if (idColIndex === -1) throw new Error("No ID column found in sheet");
    
    // Secondary key columns for sheets with multiple rows per project
    const SECONDARY_KEYS = {
      'PROJECT_TASKS':      'TÁC_VỤ',
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
      const idMatch = projectIdsMatch_(data[i][idColIndex], recordId);
      
      let dateMatch = true;
      if (sheetName === 'DAILY_SITE_LOG' && updatedData) {
        const payloadDate = normalizeLogDateDMY_(updatedData.LOG_DATE || updatedData.NGÀY);
        const logDateCol = findColumnIndex(headers, ['LOG_DATE']);
        const ngayCol = findColumnIndex(headers, ['NGÀY']);
        let rowDateNorm = '';
        if (logDateCol !== -1) rowDateNorm = normalizeLogDateDMY_(data[i][logDateCol]);
        if (!rowDateNorm && ngayCol !== -1) rowDateNorm = normalizeLogDateDMY_(data[i][ngayCol]);
        if (!rowDateNorm && dateColIndex !== -1) rowDateNorm = normalizeLogDateDMY_(data[i][dateColIndex]);
        dateMatch = payloadDate ? (rowDateNorm === payloadDate) : true;
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
    'NGÀY_BẮT_ĐẦU':   ['NGÀY_BẮT_ĐẦU', 'NGAY_BAT_DAU', 'PROJECT_START', 'START_DATE'],
    'THEO_DÕI_HĐ':    ['THEO_DÕI_HĐ', 'THEO_DOI_HD', 'CONTRACT_TRACKING'],
    'TIẾN_ĐỘ_KẾ_HOẠCH':['TIẾN_ĐỘ_KẾ_HOẠCH', 'PLAN_PROGRESS'],
    'TIẾN_ĐỘ_THỰC_TẾ': ['TIẾN_ĐỘ_THỰC_TẾ', 'ACTUAL_PROGRESS'],
    // Vietnamese → English reverse aliases
    'NGÀY':                   ['NGÀY', 'LOG_DATE'],
    'NHÂN_LỰC_SITE':          ['NHÂN_LỰC_SITE', 'MANPOWER'],
    'KỸ_SƯ_GS':              ['KỸ_SƯ_GS', 'ENGINEERS'],
    'THỜI_TIẾT':              ['THỜI_TIẾT', 'WEATHER'],
    'SỰ_CỐ':                 ['SỰ_CỐ', 'INCIDENT_COUNT'],
    'GHI_CHÚ_HIỆN_TRƯỜNG':   ['GHI_CHÚ_HIỆN_TRƯỜNG', 'DAILY_NOTE'],
    'SITE_PHOTOS':           ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
    'ẢNH_HIỆN_TRƯỜNG':     ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
    'ĐÁNH_GIÁ_TUẦN':         ['ĐÁNH_GIÁ_TUẦN', 'WEEKLY_ASSESSMENT'],
    'GHI_CHÚ':               ['GHI_CHÚ', 'GHI_CHU', 'ghichu', 'NOTES']
  };

  // Update the row — try key directly first, then aliases
  for (const key in updatedData) {
    if (key === 'id' || key === 'projectId' || key === 'PROJECT_ID' || key === '_rowIndex') continue;
    
    // Find matching column: try exact match first, then aliases
    let colIndex = findColumnIndex(headers, key);
    if (colIndex === -1 && FIELD_ALIASES[key]) {
      colIndex = findColumnIndex(headers, FIELD_ALIASES[key]);
    }
    if (colIndex === -1 && (key === 'GHI_CHÚ' || key === 'ghichu')) {
      const lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue('GHI_CHÚ');
      headers = sheet.getRange(1, 1, 1, lastCol + 1).getValues()[0];
      colIndex = lastCol;
    }
    
    if (colIndex !== -1) {
      let val = updatedData[key];
      // Special handling: SỰ_CỐ in sheet stores as "X vụ" string format
      if ((normalizeString(headers[colIndex]) === 'suco') && typeof val === 'number') {
        val = val + ' vụ';
      }
      const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
      }
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);
    }
  }
}

function deleteRowById(ss, sheetName, rowIndex) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  // rowIndex is 1-based index (e.g., header is 1).
  if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
    sheet.deleteRow(rowIndex);
  }
}

function normalizeCellValue(val) {
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return d + '/' + m + '/' + y;
  }
  return String(val || '').trim().replace(/^'/, '');
}

function getTaskSheetContext_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const headers = data[0];
  return {
    data: data,
    headers: headers,
    pidCol: findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']),
    taskCol: findColumnIndex(headers, ['TÁC_VỤ', 'TASK', 'TAC_VU']),
    startCol: findColumnIndex(headers, ['NGÀY_BẮT_ĐẦU', 'START_DATE']),
    endCol: findColumnIndex(headers, ['NGÀY_KẾT_THÚC', 'END_DATE', 'DUE_DATE']),
    assigneeCol: findColumnIndex(headers, ['NHÂN_SỰ', 'ASSIGNEE'])
  };
}

function taskRowMatches_(ctx, i, payload) {
  const matchTask = normalizeCellValue(payload._matchTask || payload.TÁC_VỤ || payload.task || '');
  const matchPid = normalizeCellValue(payload._matchProjectId || payload.PROJECT_ID || payload.projectId || '');
  const matchStart = normalizeCellValue(payload._matchStart || payload.NGÀY_BẮT_ĐẦU || '');
  const matchEnd = normalizeCellValue(payload._matchEnd || payload.NGÀY_KẾT_THÚC || '');
  const matchAssignee = normalizeCellValue(payload._matchAssignee || payload.NHÂN_SỰ || '');

  const rowPid = ctx.pidCol !== -1 ? normalizeCellValue(ctx.data[i][ctx.pidCol]) : '';
  const rowTask = ctx.taskCol !== -1 ? normalizeCellValue(ctx.data[i][ctx.taskCol]) : '';
  if (matchTask && rowTask !== matchTask) return false;
  if (matchPid && rowPid !== matchPid) return false;
  if (matchStart && ctx.startCol !== -1 && normalizeCellValue(ctx.data[i][ctx.startCol]) !== matchStart) return false;
  if (matchEnd && ctx.endCol !== -1 && normalizeCellValue(ctx.data[i][ctx.endCol]) !== matchEnd) return false;
  if (matchAssignee && ctx.assigneeCol !== -1 && normalizeCellValue(ctx.data[i][ctx.assigneeCol]) !== matchAssignee) return false;
  return !!(matchTask || matchPid);
}

function findTaskRowIndex_(sheet, payload) {
  const ctx = getTaskSheetContext_(sheet);
  if (!ctx) return -1;

  const rowIndex = Number(payload._rowIndex);
  if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
    const dataIdx = rowIndex - 1;
    if (dataIdx < ctx.data.length && taskRowMatches_(ctx, dataIdx, payload)) {
      return rowIndex;
    }
  }

  for (let i = ctx.data.length - 1; i >= 1; i--) {
    if (taskRowMatches_(ctx, i, payload)) {
      return i + 1;
    }
  }
  return -1;
}

function getTaskFieldAliases_() {
  return {
    'TÊN_DỰ_ÁN': ['TÊN_DỰ_ÁN', 'PROJECT_NAME'],
    'GHI_CHÚ': ['GHI_CHÚ', 'MÔ_TẢ', 'MO_TA', 'DESCRIPTION'],
    'MÔ_TẢ': ['GHI_CHÚ', 'MÔ_TẢ', 'MO_TA', 'DESCRIPTION']
  };
}

function applyTaskPayloadToRow_(sheet, headers, targetRowIndex, payload) {
  const FIELD_ALIASES = getTaskFieldAliases_();
  const skipKeys = {
    id: true,
    projectId: true,
    _rowIndex: true,
    _matchTask: true,
    _matchProjectId: true,
    _matchStart: true,
    _matchEnd: true,
    _matchAssignee: true,
    PINNED: true,
    computedStatus: true,
    MÔ_TẢ: true,
    MO_TA: true
  };

  for (const key in payload) {
    if (skipKeys[key]) continue;
    let colIndex = findColumnIndex(headers, key);
    if (colIndex === -1 && FIELD_ALIASES[key]) {
      colIndex = findColumnIndex(headers, FIELD_ALIASES[key]);
    }
    if (colIndex === -1) continue;

    let val = payload[key];
    const hStr = String(headers[colIndex]).trim().toUpperCase();
    if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
      val = "'" + val;
    }
    sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);
  }
}

function updateTaskRow(ss, payload) {
  ensureTaskSheetColumns_(ss);
  const sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) {
    throw new Error('PROJECT_TASKS sheet not found');
  }

  const targetRowIndex = findTaskRowIndex_(sheet, payload);
  if (targetRowIndex === -1) {
    appendRow(ss, 'PROJECT_TASKS', payload);
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  applyTaskPayloadToRow_(sheet, headers, targetRowIndex, payload);
}

function deleteTaskRow(ss, payload) {
  ensureTaskSheetColumns_(ss);
  const sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return false;

  const targetRowIndex = findTaskRowIndex_(sheet, payload);
  if (targetRowIndex === -1) return false;

  sheet.deleteRow(targetRowIndex);
  return true;
}

function deleteProjectRow(ss, sheetName, projectId) {
  if (!projectId) return false;
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  const headers = data[0];
  const idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  if (idCol === -1) return false;

  const targetId = normalizeCellValue(projectId);
  for (let i = data.length - 1; i >= 1; i--) {
    if (normalizeCellValue(data[i][idCol]) === targetId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteAllProjectRows_(ss, sheetName, projectId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || !projectId) return 0;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  var headers = data[0];
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  if (idCol === -1) return 0;
  var targetId = normalizeCellValue(projectId);
  var deleted = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (normalizeCellValue(data[i][idCol]) === targetId) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }
  return deleted;
}

function deleteTasksForProject_(ss, projectId, projectName) {
  var sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return;
  ensureTaskSheetColumns_(ss);
  var ctx = getTaskSheetContext_(sheet);
  if (!ctx) return;
  var nameCol = findColumnIndex(ctx.headers, ['TÊN_DỰ_ÁN', 'PROJECT_NAME']);
  var targetId = normalizeCellValue(projectId);
  var targetName = normalizeCellValue(projectName);
  for (var i = ctx.data.length - 1; i >= 1; i--) {
    var rowPid = ctx.pidCol !== -1 ? normalizeCellValue(ctx.data[i][ctx.pidCol]) : '';
    var rowName = nameCol !== -1 ? normalizeCellValue(ctx.data[i][nameCol]) : '';
    if ((targetId && rowPid === targetId) || (targetName && rowName === targetName)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteProjectCompletely_(ss, projectId) {
  if (!projectId) return false;
  var projectName = getProjectDisplayName_(ss, projectId);
  var relatedSheets = [
    'PROJECT_RISK', 'PROJECT_PERMIT', 'PROJECT_DESIGN', 'PROJECT_PROCUREMENT',
    'PROJECT_CONSTRUCTION', 'PROJECT_HANDOVER', 'PROJECT_MILESTONE',
    'DAILY_SITE_LOG', 'PROJECT_SHARE'
  ];
  for (var s = 0; s < relatedSheets.length; s++) {
    deleteAllProjectRows_(ss, relatedSheets[s], projectId);
  }
  deleteTasksForProject_(ss, projectId, projectName);
  return deleteProjectRow(ss, 'PROJECT_MASTER', projectId);
}

function autoAssignProjectToUser_(ss, session, projectId) {
  if (!session || !projectId) return;
  var userId = String(session.userId || '').trim();
  if (!userId) return;
  ensureUsersSheet_(ss);
  var sheet = ss.getSheetByName('USERS');
  if (!sheet) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var assignCol = findColumnIndex(headers, ['ASSIGNED_PROJECTS']);
  var userIdCol = findColumnIndex(headers, ['USER_ID']);
  if (assignCol === -1 || userIdCol === -1) return;
  var data = sheet.getDataRange().getValues();
  var pid = String(projectId).trim();
  for (var i = 1; i < data.length; i++) {
    if (normalizeCellValue(data[i][userIdCol]) !== userId) continue;
    var current = parseAssignedProjects_(data[i][assignCol]);
    if (current.indexOf(pid) >= 0) return;
    current.push(pid);
    sheet.getRange(i + 1, assignCol + 1).setValue(current.join(', '));
    return;
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
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
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
    'SITE_PHOTOS':           ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
    'ẢNH_HIỆN_TRƯỜNG':     ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
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
      const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
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
      return ['PROJECT_ID', 'TÊN_DỰ_ÁN', 'KHÁCH_HÀNG', 'PM', 'SM', 'CÔNG_SUẤT_KWP', 'KẾ_HOẠCH_COD', 'DỰ_BÁO_COD', 'TIẾN_ĐỘ_KẾ_HOẠCH', 'TIẾN_ĐỘ_THỰC_TẾ', 'DELAY', 'TRẠNG_THÁI', 'RISK_LEVEL', 'CẬP_NHẬT_CUỐI', 'NGƯỜI_TẠO'];
    case 'PROJECT_RISK':
      return ['PROJECT_ID', 'MỨC_ĐỘ', 'NỘI_DUNG', 'ẢNH_HƯỞNG', 'TRẠNG_THÁI', 'PHỤ_TRÁCH', 'NGÀY', 'NGÀY_HOÀN_THÀNH', 'GHI_CHÚ'];
    case 'PROJECT_PERMIT':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾT_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'GHI_CHÚ', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_DESIGN':
      return ['PROJECT_ID', 'HẠNG_MỤC_BẢN_VẼ', 'TÌNH_TRẠNG', 'PHÊ_DUYỆT', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'GHI_CHÚ', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_PROCUREMENT':
      return ['PROJECT_ID', 'HẠNG_MỤC_MUA_HÀNG', 'NGÀY_VỀ_DỰ_KIẾN', 'NGÀY_VỀ_THỰC_TẾ', 'TÌNH_TRẠNG_VẬT_TƯ', 'ĐÁNH_GIÁ_TIẾN_ĐỘ', 'NCC', 'GHI_CHÚ'];
    case 'PROJECT_CONSTRUCTION':
      return ['PROJECT_ID', 'NHÓM_THI_CÔNG', 'MÃ_CV', 'HẠNG_MỤC_CÔNG_VIỆC', 'NGÀY_BẮT_ĐẦU', 'SỐ_NGÀY', 'NGÀY_KẾT_THÚC', 'NGÀY_HT_THỰC_TẾ', 'TIẾN_ĐỘ_THỰC_TẾ', 'TRỌNG_SỐ', 'GHI_CHÚ'];
    case 'PROJECT_HANDOVER':
      return ['PROJECT_ID', 'HẠNG_MỤC', 'TÌNH_TRẠNG', 'KẾT_QUẢ_PHẢN_HỒI', 'BƯỚC_TIẾP_THEO', 'KẾT_QUẢ_CUỐI', 'GHI_CHÚ', 'CẬP_NHẬT_BỞI', 'NGÀY_CẬP_NHẬT'];
    case 'PROJECT_MILESTONE':
      return ['PROJECT_ID', 'MILESTONE', 'NGÀY_KẾ_HOẠCH', 'NGÀY_THỰC_TẾ', 'STATUS'];
    case 'DAILY_SITE_LOG':
      return ['PROJECT_ID', 'LOG_DATE', 'NGÀY', 'MANPOWER', 'NHÂN_LỰC_SITE', 'ENGINEERS', 'KỸ_SƯ_GS', 'WEATHER', 'THỜI_TIẾT', 'INCIDENT_COUNT', 'SỰ_CỐ', 'DAILY_NOTE', 'GHI_CHÚ_HIỆN_TRƯỜNG', 'SITE_PHOTOS', 'WEEKLY_ASSESSMENT', 'ĐÁNH_GIÁ_TUẦN', 'MONTHLY_REPORT', 'STATUS', 'UPDATED_BY', 'UPDATED_AT'];
    case 'PROJECT_TASKS':
      return ['PROJECT_ID', 'TÊN_DỰ_ÁN', 'TÁC_VỤ', 'NHÂN_SỰ', 'NGÀY_BẮT_ĐẦU', 'NGÀY_KẾT_THÚC', 'BỘ_CHỨA', 'TRẠNG_THÁI', 'ƯU_TIÊN', 'GHI_CHÚ', 'NGƯỜI_TẠO'];
    case 'USERS':
      return ['USER_ID', 'USERNAME', 'PASSWORD_HASH', 'SALT', 'EMAIL', 'EMPLOYEE_ID', 'DISPLAY_NAME', 'ROLE', 'ASSIGNED_PROJECTS', 'ACTIVE', 'FAILED_LOGIN_COUNT', 'LOCKED', 'LAST_LOGIN', 'CREATED_AT'];
    case 'AUDIT_LOG':
      return ['LOG_ID', 'TIMESTAMP', 'USER_ID', 'USERNAME', 'DISPLAY_NAME', 'ACTION', 'RESOURCE_TYPE', 'PROJECT_ID', 'SUMMARY', 'DETAILS'];
    case 'NOTIFICATIONS':
      return ['NOTIF_ID', 'USER_ID', 'TYPE', 'TITLE', 'BODY', 'LINK', 'READ', 'CREATED_AT'];
    case 'PROJECT_SHARE':
      return ['PROJECT_ID', 'SHARE_TOKEN', 'ENABLED', 'CREATED_AT', 'UPDATED_AT'];
    default:
      return [];
  }
}

function extractDailyNoteSection_(text, heading) {
  if (!text) return null;
  var regex = new RegExp('### ' + heading + '\\n([\\s\\S]*?)(?=###|$)', 'i');
  var match = String(text).match(regex);
  return match ? match[1].trim() : null;
}

function parseSiteLogProgressEntries_(noteText) {
  var section = extractDailyNoteSection_(noteText, 'TIẾN ĐỘ HẠNG MỤC');
  if (!section) return [];
  try {
    var parsed = JSON.parse(section);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function taskProgressKey_(entry) {
  return String(entry.taskCode || entry.MÃ_CV || '').trim() + '::' + String(entry.taskName || entry.HẠNG_MỤC_CÔNG_VIỆC || '').trim();
}

function replayConstructionProgressFromSiteLogs_(ss, projectId) {
  if (!projectId) return [];
  var logs = filterDailyLogsForProject_(getSheetDataAsObjects(ss, 'DAILY_SITE_LOG'), projectId);
  var sums = {};
  logs.forEach(function(log) {
    var note = String(log.DAILY_NOTE || log.GHI_CHÚ_HIỆN_TRƯỜNG || '').trim();
    parseSiteLogProgressEntries_(note).forEach(function(entry) {
      var delta = Number(entry.deltaPercent || 0);
      if (!delta) return;
      var key = taskProgressKey_(entry);
      sums[key] = (sums[key] || 0) + delta;
    });
  });

  var sheet = ss.getSheetByName('PROJECT_CONSTRUCTION');
  if (!sheet) {
    return getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(function(r) {
      return String(r.PROJECT_ID || r.projectId) === String(projectId);
    });
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(function(r) {
      return String(r.PROJECT_ID || r.projectId) === String(projectId);
    });
  }

  var headers = data[0];
  var progressCol = findColumnIndex(headers, ['TIẾN_ĐỘ_THỰC_TẾ', 'ACTUAL_PROGRESS']);
  var codeCol = findColumnIndex(headers, ['MÃ_CV']);
  var itemCol = findColumnIndex(headers, ['HẠNG_MỤC_CÔNG_VIỆC']);
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);

  if (progressCol === -1 || idCol === -1) {
    return getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(function(r) {
      return String(r.PROJECT_ID || r.projectId) === String(projectId);
    });
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) !== String(projectId)) continue;
    var code = codeCol !== -1 ? String(data[i][codeCol] || '').trim() : '';
    var item = itemCol !== -1 ? String(data[i][itemCol] || '').trim() : '';
    var key = code + '::' + item;
    if (!Object.prototype.hasOwnProperty.call(sums, key)) continue;
    var newVal = Math.min(100, Math.max(0, Number(sums[key] || 0)));
    sheet.getRange(i + 1, progressCol + 1).setValue(newVal);
  }

  return getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(function(r) {
    return String(r.PROJECT_ID || r.projectId) === String(projectId);
  });
}

function normalizeProjectId_(id) {
  return String(id || '').replace(/^'/, '').trim();
}

function projectIdsMatch_(a, b) {
  return normalizeProjectId_(a) === normalizeProjectId_(b);
}

function normalizeLogDateDMY_(val) {
  if (val == null || val === '') return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return d + '/' + m + '/' + y;
  }
  var s = String(val).trim();
  var parts = s.split('/');
  if (parts.length === 3) {
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var yearRaw = String(parts[2] || '').trim();
    if (!Number.isFinite(day) || !Number.isFinite(month) || !yearRaw) return s;
    var year = parseInt(yearRaw, 10);
    if (yearRaw.length === 2) year = 2000 + year;
    if (!Number.isFinite(year)) return s;
    return String(day).padStart(2, '0') + '/' + String(month).padStart(2, '0') + '/' + year;
  }
  return s;
}

function filterDailyLogsForProject_(logs, projectId) {
  return (logs || []).filter(function(row) {
    return projectIdsMatch_(row.PROJECT_ID || row.projectId, projectId);
  });
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
  const overall = (permitProg * 0.10) + (designProg * 0.15) + (procurementProg * 0.25) + (constructionProg * 0.40) + (handoverProg * 0.10);
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
    'SITE_PHOTOS':           ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
    'ẢNH_HIỆN_TRƯỜNG':     ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG'],
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
        let val = rowObj[key];
        const hStr = String(headers[colIndex]).trim().toUpperCase();
        if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
          val = "'" + val;
        }
        newRow[colIndex] = val;
      }
    }
    return newRow;
  });
  
  if (rowsArray.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsArray.length, headers.length).setValues(rowsArray);
  }
}
function syncProjectCodToMilestone_(ss, projectId, codDate) {
  if (!projectId || !codDate) return;
  var sheet = ss.getSheetByName('PROJECT_MILESTONE');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  var headers = data[0];
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  var milestoneCol = findColumnIndex(headers, ['MILESTONE']);
  var planCol = findColumnIndex(headers, ['NGÀY_KẾ_HOẠCH', 'NGAY_KE_HOACH']);
  if (idCol === -1 || milestoneCol === -1 || planCol === -1) return;

  var codStr = formatLogDateCellValue_(codDate);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) != String(projectId)) continue;
    var title = String(data[i][milestoneCol] || '').toUpperCase();
    if (title === 'COD' || title.indexOf('COD') !== -1) {
      sheet.getRange(i + 1, planCol + 1).setValue(codStr);
    }
  }
  SpreadsheetApp.flush();
}

function syncProjectKickoffToMilestone_(ss, projectId, kickoffDate) {
  if (!projectId || !kickoffDate) return;
  var sheet = ss.getSheetByName('PROJECT_MILESTONE');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  var headers = data[0];
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  var milestoneCol = findColumnIndex(headers, ['MILESTONE']);
  var planCol = findColumnIndex(headers, ['NGÀY_KẾ_HOẠCH', 'NGAY_KE_HOACH']);
  if (idCol === -1 || milestoneCol === -1 || planCol === -1) return;

  var kickoffStr = formatLogDateCellValue_(kickoffDate);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) != String(projectId)) continue;
    var title = String(data[i][milestoneCol] || '').toUpperCase();
    if (title === 'KICKOFF') {
      sheet.getRange(i + 1, planCol + 1).setValue(kickoffStr);
    }
  }
  SpreadsheetApp.flush();
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

var SITE_IMAGE_FOLDER_ID_PREF = '1iUk7SQ8iqsjTkjGwtI0fVJuaoxQeLRo_';
var SITE_IMAGE_FOLDER_NAME = 'VPEG-PXD-BAO-CAO-HINH-ANH';
var SITE_IMAGE_CHUNK_TTL = 600;

function ensureDailySiteLogPhotoColumn_(ss) {
  var sheet = ss.getSheetByName('DAILY_SITE_LOG');
  if (!sheet) return -1;
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colIndex = findColumnIndex(headers, ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG']);
  if (colIndex === -1) {
    sheet.getRange(1, lastCol + 1).setValue('SITE_PHOTOS');
    colIndex = lastCol;
  }
  return colIndex;
}

function formatLogDateCellValue_(val) {
  if (val instanceof Date) {
    return formatDateString(val);
  }
  return String(val || '').trim().replace(/^'/, '');
}

function extractDriveFileId_(url) {
  if (!url) return '';
  var s = String(url);
  var patterns = [
    /[?&]id=([\w-]+)/,
    /\/file\/d\/([\w-]+)/,
    /\/d\/([\w-]+)/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = s.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return '';
}

function canonicalDriveViewUrl_(url) {
  var fileId = extractDriveFileId_(url);
  if (fileId) return 'https://drive.google.com/uc?export=view&id=' + fileId;
  return String(url || '').trim();
}

function mergePhotoUrlStrings_(existingStr, newUrl) {
  var seen = {};
  var out = [];
  function add(raw) {
    var u = canonicalDriveViewUrl_(raw);
    if (!u) return;
    var key = extractDriveFileId_(u) || u;
    if (seen[key]) return;
    seen[key] = true;
    out.push(u);
  }
  String(existingStr || '').split('\n').forEach(function(line) {
    add(line.trim());
  });
  add(newUrl);
  return out.slice(0, 4).join('\n');
}

function getSitePhotoUrlsCell_(ss, projectId, logDate, rowIndex) {
  ensureDailySiteLogPhotoColumn_(ss);
  var sheet = ss.getSheetByName('DAILY_SITE_LOG');
  if (!sheet) return { urls: '', rowIndex: -1 };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var photoCol = findColumnIndex(headers, ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG']);
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  var dateCol = findColumnIndex(headers, ['LOG_DATE', 'NGÀY', 'NGAY']);
  var targetRow = -1;

  if (rowIndex && Number(rowIndex) > 1 && Number(rowIndex) <= data.length) {
    targetRow = Number(rowIndex);
  } else if (idCol !== -1 && dateCol !== -1) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) == String(projectId)) {
        if (formatLogDateCellValue_(data[i][dateCol]) === String(logDate)) {
          targetRow = i + 1;
          break;
        }
      }
    }
  }

  if (targetRow === -1 || photoCol === -1) {
    return { urls: '', rowIndex: targetRow };
  }
  return {
    urls: String(sheet.getRange(targetRow, photoCol + 1).getValue() || ''),
    rowIndex: targetRow
  };
}

/** Sau upload Drive — ghi URL vào cột SITE_PHOTOS (mọi user đọc chung) */
function attachUploadedPhotoToLog_(ss, payload, uploadedUrl) {
  if (!uploadedUrl) return null;
  var projectId = String(payload.projectId || payload.PROJECT_ID || '').trim();
  var logDate = String(payload.logDate || payload.LOG_DATE || payload.NGÀY || '').trim();
  if (!projectId || !logDate) return null;

  var rowIndex = payload._rowIndex;
  var current = getSitePhotoUrlsCell_(ss, projectId, logDate, rowIndex);
  var merged = mergePhotoUrlStrings_(current.urls, uploadedUrl);
  saveSitePhotosForLog_(ss, {
    PROJECT_ID: projectId,
    LOG_DATE: logDate,
    NGÀY: logDate,
    SITE_PHOTOS: merged,
    _rowIndex: current.rowIndex > 0 ? current.rowIndex : rowIndex
  });
  return getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(function(row) {
    return String(row.PROJECT_ID || row.projectId) === String(projectId);
  });
}

/** Ghi URL ảnh hiện trường vào cột SITE_PHOTOS — mọi tài khoản đọc chung */
function saveSitePhotosForLog_(ss, payload) {
  payload = payload || {};
  var projectId = String(payload.PROJECT_ID || payload.id || '').trim();
  var logDate = String(payload.LOG_DATE || payload.NGÀY || '').trim();
  var urls = String(payload.SITE_PHOTOS || payload.urls || '').trim();
  if (!projectId || !logDate) {
    throw new Error('Thiếu PROJECT_ID hoặc LOG_DATE');
  }

  ensureDailySiteLogPhotoColumn_(ss);
  var sheet = ss.getSheetByName('DAILY_SITE_LOG');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var photoCol = findColumnIndex(headers, ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG']);
  var idCol = findColumnIndex(headers, ['PROJECT_ID', 'id', 'projectId']);
  var dateCol = findColumnIndex(headers, ['LOG_DATE', 'NGÀY', 'NGAY']);

  var targetRowIndex = -1;
  if (payload._rowIndex && Number(payload._rowIndex) > 1 && Number(payload._rowIndex) <= data.length) {
    targetRowIndex = Number(payload._rowIndex);
  } else if (idCol !== -1 && dateCol !== -1) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) == projectId) {
        var rowDateStr = formatLogDateCellValue_(data[i][dateCol]);
        if (rowDateStr === logDate) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }
  }

  if (targetRowIndex === -1) {
    appendRow(ss, 'DAILY_SITE_LOG', {
      PROJECT_ID: projectId,
      LOG_DATE: logDate,
      NGÀY: logDate,
      SITE_PHOTOS: urls,
      MANPOWER: 0,
      ENGINEERS: 0,
      WEATHER: '',
      INCIDENT_COUNT: 0,
      SỰ_CỐ: '0 vụ',
      STATUS: 'Saved'
    });
    SpreadsheetApp.flush();
    return;
  }

  if (photoCol === -1) {
    photoCol = ensureDailySiteLogPhotoColumn_(ss);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    photoCol = findColumnIndex(headers, ['SITE_PHOTOS', 'ẢNH_HIỆN_TRƯỜNG', 'ANH_HIEN_TRUONG']);
  }

  sheet.getRange(targetRowIndex, photoCol + 1).setValue(urls);
  SpreadsheetApp.flush();
}

function buildDriveImageViewUrl_(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}

function serveSiteImage_(fileId) {
  var id = String(fileId || '').trim();
  if (!id) {
    return createResponse({ status: 'error', message: 'Thiếu id ảnh' }, 400);
  }
  try {
    var file = DriveApp.getFileById(id);
    var blob = file.getBlob();
    var mime = blob.getContentType() || 'image/jpeg';
    if (mime.indexOf('image/') !== 0) {
      return createResponse({ status: 'error', message: 'File không phải ảnh' }, 400);
    }
    return ContentService.createBlobOutput(blob).setMimeType(mime);
  } catch (err) {
    return createResponse({ status: 'error', message: 'Không đọc được ảnh: ' + err }, 404);
  }
}

function storeSiteImageChunk_(payload) {
  payload = payload || {};
  var sid = String(payload.sessionId || '');
  var idx = Number(payload.index);
  var total = Number(payload.total);
  var chunk = String(payload.chunk || '');
  if (!sid || !chunk || !Number.isFinite(idx) || !Number.isFinite(total)) {
    throw new Error('Thiếu dữ liệu chunk upload');
  }
  if (chunk.length > 100000) {
    throw new Error('Chunk ảnh quá lớn (tối đa 100KB). Tải lại trang và thử lại.');
  }
  var cache = CacheService.getScriptCache();
  cache.put('img_' + sid + '_' + idx, chunk, SITE_IMAGE_CHUNK_TTL);
  cache.put('img_' + sid + '_meta', JSON.stringify({
    total: total,
    projectId: payload.projectId || 'project',
    logDate: payload.logDate || payload.LOG_DATE || payload.NGÀY || '',
    _rowIndex: payload._rowIndex || null
  }), SITE_IMAGE_CHUNK_TTL);
}

function uploadBlobToDriveViaApi_(blob, fileName, folderId) {
  var token = ScriptApp.getOAuthToken();
  var createResp = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ name: fileName, parents: [folderId] }),
    muteHttpExceptions: true
  });
  var createJson = JSON.parse(createResp.getContentText());
  if (!createJson.id) {
    var apiErr = (createJson.error && createJson.error.message) ? createJson.error.message : createResp.getContentText();
    throw new Error('Drive API: ' + apiErr);
  }
  var fileId = createJson.id;

  var uploadResp = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media',
    {
      method: 'patch',
      contentType: blob.getContentType() || 'image/jpeg',
      headers: { Authorization: 'Bearer ' + token },
      payload: blob.getBytes(),
      muteHttpExceptions: true
    }
  );
  if (uploadResp.getResponseCode() >= 400) {
    throw new Error('Drive API upload: ' + uploadResp.getContentText());
  }

  UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '/permissions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ role: 'reader', type: 'anyone' }),
    muteHttpExceptions: true
  });

  return buildDriveImageViewUrl_(fileId);
}

function commitSiteImageUpload_(sessionId) {
  var cache = CacheService.getScriptCache();
  var metaRaw = cache.get('img_' + sessionId + '_meta');
  if (!metaRaw) {
    throw new Error('Phiên upload hết hạn. Chọn ảnh và thử lại.');
  }
  var meta = JSON.parse(metaRaw);
  var parts = [];
  for (var i = 0; i < meta.total; i++) {
    var part = cache.get('img_' + sessionId + '_' + i);
    if (!part) {
      throw new Error('Thiếu dữ liệu chunk ' + i);
    }
    parts.push(part);
  }

  var base64 = parts.join('');
  if (base64.indexOf('base64,') >= 0) {
    base64 = base64.split('base64,')[1];
  }

  var projectId = String(meta.projectId || 'project').replace(/[^\w\-]/g, '_');
  var fileName = projectId + '-' + Date.now() + '.jpg';
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);

  var folder = getWritableSiteImageFolder_();
  var url = saveSiteImageBlobToFolder_(folder, blob, folder.getId());

  var dailyLogs = null;
  if (meta.logDate) {
    var ss = getSpreadsheet();
    dailyLogs = attachUploadedPhotoToLog_(ss, {
      projectId: meta.projectId,
      PROJECT_ID: meta.projectId,
      logDate: meta.logDate,
      LOG_DATE: meta.logDate,
      _rowIndex: meta._rowIndex
    }, url);
  }

  for (var j = 0; j < meta.total; j++) {
    cache.remove('img_' + sessionId + '_' + j);
  }
  cache.remove('img_' + sessionId + '_meta');
  return { url: url, dailyLogs: dailyLogs };
}

/** Ghi blob lên folder — chỉ dùng DriveApp, không fallback UrlFetchApp */
function saveSiteImageBlobToFolder_(folder, blob, folderId) {
  try {
    var file = folder.createFile(blob);
    var fileId = file.getId();
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}
    return buildDriveImageViewUrl_(fileId);
  } catch (driveAppErr) {
    throw new Error('Không ghi được ảnh lên Drive: ' + driveAppErr);
  }
}

/** Folder script chắc chắn ghi được — thử folder chỉ định trước, không ghi được thì fallback cạnh Sheet */
function folderIsWritable_(folder) {
  try {
    var probe = folder.createFile(Utilities.newBlob('1', 'text/plain', '.epc-write-test.txt'));
    probe.setTrashed(true);
    return true;
  } catch (e) {
    return false;
  }
}

function getWritableSiteImageFolder_() {
  var candidates = [];

  try {
    candidates.push(DriveApp.getFolderById(SITE_IMAGE_FOLDER_ID_PREF));
  } catch (e) {}

  try {
    var ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    var parents = ssFile.getParents();
    if (parents.hasNext()) {
      var parent = parents.next();
      var subs = parent.getFoldersByName(SITE_IMAGE_FOLDER_NAME);
      if (subs.hasNext()) {
        candidates.push(subs.next());
      } else {
        var created = parent.createFolder(SITE_IMAGE_FOLDER_NAME);
        return created;
      }
    }
  } catch (e) {}

  var roots = DriveApp.getFoldersByName(SITE_IMAGE_FOLDER_NAME);
  while (roots.hasNext()) {
    candidates.push(roots.next());
  }

  for (var i = 0; i < candidates.length; i++) {
    if (folderIsWritable_(candidates[i])) return candidates[i];
  }

  return DriveApp.createFolder(SITE_IMAGE_FOLDER_NAME);
}

/** Kiểm tra / hiển thị folder (có thể chỉ đọc được folder chia sẻ) */
function getSiteImageUploadFolder_() {
  try {
    return DriveApp.getFolderById(SITE_IMAGE_FOLDER_ID_PREF);
  } catch (e) {}
  return getWritableSiteImageFolder_();
}

/**
 * Upload ảnh hiện trường lên Google Drive, trả về link xem công khai.
 * payload: { base64, projectId?, fileName? }
 */
function uploadSiteImageToDrive_(payload) {
  payload = payload || {};
  var base64 = String(payload.base64 || '');
  if (!base64) {
    throw new Error('Thiếu dữ liệu ảnh (base64)');
  }
  if (base64.indexOf('base64,') >= 0) {
    base64 = base64.split('base64,')[1];
  }

  var projectId = String(payload.projectId || 'project').replace(/[^\w\-]/g, '_');
  var fileName = projectId + '-' + Date.now() + '.jpg';
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
  var folder = getWritableSiteImageFolder_();
  return saveSiteImageBlobToFolder_(folder, blob, folder.getId());
}

/**
 * Chạy 1 lần từ trình soạn Apps Script (Run → authorizeDriveForUpload)
 * để cấp quyền Google Drive. KHÔNG tạo file .gs riêng cho scope.
 */
function authorizeDriveForUpload() {
  var folder = getWritableSiteImageFolder_();
  var test = folder.createFile(Utilities.newBlob('ok', 'text/plain', 'drive-test.txt'));
  test.setTrashed(true);
  Logger.log('OK – folder ghi được: ' + folder.getName() + ' (id=' + folder.getId() + ')');
}

/**
 * Chạy 1 lần từ Apps Script (Run → authorizeMailApp) để cấp quyền gửi email.
 * Hiện trong dropdown Run cạnh authorizeDriveForUpload.
 */
function authorizeMailApp() {
  var quota = MailApp.getRemainingDailyQuota();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('NOTIF_EMAIL_ENABLED', 'true');
  if (!props.getProperty('DASHBOARD_APP_URL')) {
    props.setProperty('DASHBOARD_APP_URL', 'http://localhost:5181');
  }
  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);
  var users = getSheetDataAsObjects(ss, 'USERS');
  var adminUser = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].ROLE || '').toLowerCase() === 'admin' && isUserActive_(users[i])) {
      adminUser = users[i];
      break;
    }
  }
  var to = adminUser ? String(adminUser.EMAIL || '').trim().toLowerCase() : Session.getActiveUser().getEmail();
  if (!to) throw new Error('Không tìm thấy email admin');
  try {
    MailApp.sendEmail({
      to: to,
      subject: '[EPC Solar] Email authorize test',
      body: 'MailApp OK. Quota còn hôm nay: ' + quota + '\n\nEPC Solar Dashboard',
      name: 'EPC Solar Dashboard'
    });
  } catch (mailErr) {
    GmailApp.sendEmail(to, '[EPC Solar] Email authorize test', 'GmailApp OK. Quota MailApp: ' + quota);
  }
  Logger.log('OK – email thử gửi tới: ' + to + ', quota còn lại hôm nay=' + quota);
  return { ok: true, to: to, quota: quota };
}

function authorizeMailApp_() {
  return authorizeMailApp();
}

// ================= AUTH / USERS =================

var AUTH_SESSION_TTL_SEC = 8 * 60 * 60;
var MAX_FAILED_LOGINS_ = 3;

function ensureUsersSheet_(ss) {
  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('USERS');
  if (!sheet) {
    sheet = ss.insertSheet('USERS');
  }
  initializeSheetIfEmpty(sheet, 'USERS');
  ensureUserLockColumns_(sheet);
  seedAdminIfNeeded_(ss, sheet);
  return sheet;
}

function ensureUserLockColumns_(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var needed = ['FAILED_LOGIN_COUNT', 'LOCKED'];
  var toAdd = [];
  for (var i = 0; i < needed.length; i++) {
    if (findColumnIndex(headers, needed[i]) === -1) toAdd.push(needed[i]);
  }
  if (!toAdd.length) return;
  for (var j = 0; j < toAdd.length; j++) {
    sheet.getRange(1, lastCol + 1 + j).setValue(toAdd[j]);
  }
}

function isUserLocked_(user) {
  return String(user.LOCKED || '').trim().toUpperCase() === 'TRUE';
}

function getFailedLoginCount_(user) {
  var n = parseInt(user.FAILED_LOGIN_COUNT, 10);
  return isNaN(n) ? 0 : n;
}

function recordFailedLogin_(ss, user) {
  var count = getFailedLoginCount_(user) + 1;
  var updates = { FAILED_LOGIN_COUNT: count };
  if (count >= MAX_FAILED_LOGINS_) {
    updates.LOCKED = 'TRUE';
  }
  updateUserSheetRow_(ss, user, updates);
  return count;
}

function resetLoginAttempts_(ss, user) {
  updateUserSheetRow_(ss, user, { FAILED_LOGIN_COUNT: 0, LOCKED: 'FALSE' });
}

function seedAdminIfNeeded_(ss, sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length > 1) return;

  var salt = generateAuthSalt_();
  var hash = hashPassword_('tien@123', salt);
  var now = new Date().toISOString();
  var employeeId = findEmployeeIdByName_(ss, 'Nguyễn Đức Tiến');

  appendRow(ss, 'USERS', {
    USER_ID: 'U001',
    USERNAME: 'tien.nguyen',
    PASSWORD_HASH: hash,
    SALT: salt,
    EMAIL: 'tien.nguyen@vuphong.com',
    EMPLOYEE_ID: employeeId || '',
    DISPLAY_NAME: 'Nguyễn Đức Tiến',
    ROLE: 'admin',
    ASSIGNED_PROJECTS: '',
    ACTIVE: 'TRUE',
    FAILED_LOGIN_COUNT: 0,
    LOCKED: 'FALSE',
    LAST_LOGIN: '',
    CREATED_AT: now
  });
}

function findEmployeeIdByName_(ss, displayName) {
  var employees = getSheetDataAsObjects(ss, 'EMPLOYEE');
  var target = normalizeAuthName_(displayName);
  for (var i = 0; i < employees.length; i++) {
    var emp = employees[i];
    var name = String(emp.NAME || emp.name || emp['HỌ TÊN'] || emp['Họ tên'] || '').trim();
    if (normalizeAuthName_(name) === target) {
      return String(emp.EMPLOYEE_ID || emp.ID || emp.id || emp._rowIndex || '');
    }
  }
  return '';
}

function generateAuthSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function hashPassword_(password, salt) {
  var raw = String(salt || '') + String(password || '');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function normalizeAuthName_(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch_(a, b) {
  var na = normalizeAuthName_(a);
  var nb = normalizeAuthName_(b);
  if (!na || !nb) return false;
  return na === nb;
}

function isProjectEditorRole_(role) {
  var r = String(role || '').toLowerCase();
  return r === 'pm' || r === 'sm';
}

function isAssignedToProject_(session, projectId) {
  if (!session || !projectId) return false;
  var pid = String(projectId).trim();
  var assigned = session.assignedProjects || [];
  for (var i = 0; i < assigned.length; i++) {
    if (String(assigned[i]).trim() === pid) return true;
  }
  return false;
}

function canEditProject_(session, projectId) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  if (isAssignedToProject_(session, projectId)) return true;
  return isProjectCreatorById_(session, projectId, getSpreadsheet());
}

function canViewContractTracking_(session, projectId) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  var role = String(session.role || '').toLowerCase();
  if (role !== 'pm' && role !== 'sm') return false;
  return isAssignedToProject_(session, projectId);
}

function payloadHasContractTracking_(payload) {
  if (!payload) return false;
  if (payload['THEO_DÕI_HĐ'] != null || payload.THEO_DOI_HD != null || payload.CONTRACT_TRACKING != null) return true;
  if (payload.contractTracking != null) return true;
  return false;
}

function getProjectCreatorFromMaster_(projectId, ss) {
  ss = ss || getSpreadsheet();
  if (!projectId) return '';
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  var targetId = String(projectId).trim();
  for (var i = 0; i < projects.length; i++) {
    var pid = String(projects[i].PROJECT_ID || projects[i].id || '').trim();
    if (pid !== targetId) continue;
    return String(projects[i].NGƯỜI_TẠO || projects[i].NGUOI_TAO || projects[i].CREATED_BY || '').trim();
  }
  return '';
}

function isProjectCreatorById_(session, projectId, ss) {
  var creator = getProjectCreatorFromMaster_(projectId, ss);
  if (!creator) return false;
  return namesMatch_(session.displayName, creator);
}

function canDeleteProject_(session, projectId, ss) {
  if (!session || !projectId) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  return isProjectCreatorById_(session, projectId, ss);
}

function canDeleteTask_(session, payload, ss) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  payload = payload || {};
  ss = ss || getSpreadsheet();
  var creator = getTaskCreatorFromSheet_(payload, ss);
  if (!creator) return false;
  return namesMatch_(session.displayName, creator);
}

function canCreateProject_(session) {
  return !!(session && session.username && session.username !== 'unknown');
}

function canEditTask_(session, payload) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  payload = payload || {};

  if (hasFullTaskEditRights_(session, payload, getSpreadsheet())) return true;

  var assignee = resolveTaskAssigneeForPermission_(payload);
  var assignees = parseAssigneeNames_(assignee);
  for (var a = 0; a < assignees.length; a++) {
    if (namesMatch_(session.displayName, assignees[a])) return true;
  }
  if (namesMatch_(session.displayName, assignee)) return true;

  return false;
}

function getTaskCreatorFromSheet_(payload, ss) {
  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return '';
  var ctx = getTaskSheetContext_(sheet);
  if (!ctx) return '';
  var rowIndex = findTaskRowIndex_(sheet, payload);
  if (rowIndex <= 1) return '';
  var creatorCol = findColumnIndex(ctx.headers, ['NGƯỜI_TẠO', 'NGUOI_TAO', 'CREATED_BY']);
  if (creatorCol === -1) return '';
  return normalizeCellValue(ctx.data[rowIndex - 1][creatorCol]);
}

function isTaskCreator_(session, payload, ss) {
  var creator = getTaskCreatorFromSheet_(payload, ss);
  if (!creator) return false;
  return namesMatch_(session.displayName, creator);
}

function hasFullTaskEditRights_(session, payload, ss) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  payload = payload || {};
  ss = ss || getSpreadsheet();
  if (isTaskCreator_(session, payload, ss)) return true;

  if (isProjectEditorRole_(session.role)) {
    if (isUserAssignedToTaskProject_(session, payload, ss)) return true;
    if (isOfficeTask_(payload, ss) && canViewOfficeTasks_(session)) return true;
  }

  return false;
}

function isCompletedTaskStatus_(status) {
  var s = normalizeCellValue(status);
  return s === 'Đã hoàn thành' || s === 'Hoàn thành';
}

function checkAssigneeTaskFieldRestrictions_(session, payload, ss) {
  if (hasFullTaskEditRights_(session, payload, ss)) return null;

  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return null;
  var rowIndex = findTaskRowIndex_(sheet, payload);
  if (rowIndex <= 1) return null;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var oldRow = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  var restricted = ['NHÂN_SỰ', 'NGÀY_BẮT_ĐẦU', 'NGÀY_KẾT_THÚC', 'ƯU_TIÊN', 'BỘ_CHỨA', 'NGƯỜI_TẠO'];
  for (var r = 0; r < restricted.length; r++) {
    var key = restricted[r];
    if (payload[key] == null) continue;
    var col = findColumnIndex(headers, key);
    if (col === -1) continue;
    var oldVal = normalizeCellValue(oldRow[col]);
    var newVal = normalizeCellValue(payload[key]);
    if (oldVal !== newVal) {
      return 'Bạn chỉ được sửa tên tác vụ, mô tả và dự án';
    }
  }

  if (payload.TRẠNG_THÁI != null) {
    var statusCol = findColumnIndex(headers, ['TRẠNG_THÁI', 'STATUS']);
    var oldStatus = statusCol !== -1 ? normalizeCellValue(oldRow[statusCol]) : '';
    var newStatus = normalizeCellValue(payload.TRẠNG_THÁI);
    if (oldStatus !== newStatus) {
      var oldCompleted = isCompletedTaskStatus_(oldStatus);
      var newCompleted = isCompletedTaskStatus_(newStatus);
      if (oldCompleted === newCompleted) {
        return 'Trạng thái tự động theo ngày — chỉ bấm Hoàn thành';
      }
    }
  }

  return null;
}

function isUserAssignedToTaskProject_(session, payload, ss) {
  var assigned = session.assignedProjects || [];
  if (!assigned.length || !payload) return false;

  var projectId = resolveTaskProjectId_(payload, ss);
  var taskName = String(payload.TÊN_DỰ_ÁN || '').trim();
  var projects = ss ? getSheetDataAsObjects(ss, 'PROJECT_MASTER') : [];

  for (var i = 0; i < assigned.length; i++) {
    var token = String(assigned[i] || '').trim();
    if (!token) continue;
    if (projectId && token === projectId) return true;
    if (taskName && (token === taskName || namesMatch_(token, taskName))) return true;

    for (var j = 0; j < projects.length; j++) {
      var pid = String(projects[j].PROJECT_ID || '');
      var pname = String(projects[j].TÊN_DỰ_ÁN || '');
      if (token !== pid && token !== pname) continue;
      if (projectId && pid === projectId) return true;
      if (taskName && pname === taskName) return true;
    }
  }
  return false;
}

function parseAssigneeNames_(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;|/]+/)
    .map(function(s) { return String(s).trim(); })
    .filter(function(s) { return s.length > 0; });
}

function normalizeContainer_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toUpperCase();
}

function resolveTaskProjectId_(payload, ss) {
  var pid = String(payload.PROJECT_ID || '').trim();
  if (pid) return pid;
  var name = String(payload.TÊN_DỰ_ÁN || '').trim();
  if (!name || !ss) return '';
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  for (var i = 0; i < projects.length; i++) {
    if (String(projects[i].TÊN_DỰ_ÁN || '') === name || String(projects[i].PROJECT_ID || '') === name) {
      return String(projects[i].PROJECT_ID || '');
    }
  }
  return '';
}

function isOfficeTask_(payload, ss) {
  var container = normalizeContainer_(payload.BỘ_CHỨA);
  var projectName = normalizeContainer_(payload.TÊN_DỰ_ÁN);
  var projectId = resolveTaskProjectId_(payload, ss);
  var hasProject = Boolean(String(payload.PROJECT_ID || '').trim() || projectId);
  return container.indexOf('VAN PHONG') >= 0 || projectName.indexOf('VAN PHONG') >= 0 || !hasProject;
}

function canViewOfficeTasks_(session) {
  if (!session) return false;
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  var username = String(session.username || '').trim().toLowerCase();
  if (username === 'tien.nguyen') return true;
  var norm = normalizeAuthName_(session.displayName || '');
  var tokens = ['thieu', 'doan', 'sang', 'quang', 'thuan', 'cuong', 'duy', 'tien'];
  for (var i = 0; i < tokens.length; i++) {
    if (norm.indexOf(tokens[i]) >= 0) return true;
  }
  return false;
}

function filterTasksForSession_(tasks, session, ss) {
  if (!tasks || !tasks.length) return tasks || [];
  if (canViewOfficeTasks_(session)) return tasks;
  return tasks.filter(function(t) { return !isOfficeTask_(t, ss); });
}

function resolveTaskAssigneeForPermission_(payload) {
  payload = payload || {};
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('PROJECT_TASKS');
    if (sheet) {
      var rowIndex = findTaskRowIndex_(sheet, payload);
      var ctx = getTaskSheetContext_(sheet);
      if (rowIndex > 0 && ctx && ctx.assigneeCol !== -1) {
        var fromSheet = String(ctx.data[rowIndex - 1][ctx.assigneeCol] || '').trim();
        if (fromSheet) return fromSheet;
      }
    }
  } catch (e) {
    Logger.log('resolveTaskAssigneeForPermission_: ' + e);
  }
  return payload._matchAssignee || payload.NHÂN_SỰ || '';
}

function canCreateTask_(session, payload) {
  if (!session) return false;
  payload = payload || {};
  var ss = getSpreadsheet();
  if (isOfficeTask_(payload, ss)) {
    return canViewOfficeTasks_(session);
  }
  if (String(session.role || '').toLowerCase() === 'admin') return true;
  if (isProjectEditorRole_(session.role)) return true;
  return namesMatch_(session.displayName, payload.NHÂN_SỰ || '');
}

function requireAuthForMutation_(payload) {
  var session = getActorFromPayload_(payload);
  if (!session || !session.username || session.username === 'unknown') {
    return { error: 'Vui lòng đăng nhập để thực hiện thao tác này', code: 401 };
  }
  return { session: session };
}

function checkMutationPermission_(action, payload, session) {
  if (String(session.role || '').toLowerCase() === 'admin') return null;

  payload = payload || {};
  var pid = String(payload.PROJECT_ID || payload.id || payload.projectId || '').trim();

  if (action === 'update-task' || action === 'delete-task') {
    if (!canEditTask_(session, payload)) {
      return 'Bạn chỉ được sửa công việc được phân công cho mình';
    }
    if (action === 'delete-task' && !canDeleteTask_(session, payload, getSpreadsheet())) {
      return 'Chỉ người tạo task mới được xóa (Admin có toàn quyền)';
    }
    if (action === 'update-task') {
      var assigneeFieldErr = checkAssigneeTaskFieldRestrictions_(session, payload, getSpreadsheet());
      if (assigneeFieldErr) return assigneeFieldErr;
    }
    return null;
  }

  if (action === 'add-task') {
    if (!canCreateTask_(session, payload)) {
      return 'Bạn không có quyền tạo công việc này';
    }
    return null;
  }

  if (action === 'add-project') {
    return canCreateProject_(session) ? null : 'Vui lòng đăng nhập để tạo dự án';
  }

  if (action === 'delete-project') {
    if (!pid) return 'Thiếu mã dự án';
    if (!canDeleteProject_(session, pid, getSpreadsheet())) {
      return 'Chỉ người tạo dự án mới được xóa (Admin có toàn quyền)';
    }
    return null;
  }

  var projectMutations = [
    'update-project',
    'update-risk', 'add-risk',
    'update-permit', 'add-permit',
    'update-design', 'add-design',
    'update-procurement', 'add-procurement',
    'update-construction', 'update-handover',
    'update-site-log', 'update-module-dates', 'upload-site-image', 'save-site-photos'
  ];

  if (projectMutations.indexOf(action) >= 0) {
    if (!pid) return 'Thiếu mã dự án';
    if (action === 'update-project' && payloadHasContractTracking_(payload)) {
      if (!canViewContractTracking_(session, pid)) {
        return 'Theo dõi HĐ chỉ dành cho SM/PM nội bộ được gán dự án';
      }
    }
    if (isAssignedToProject_(session, pid)) return null;
    if (isProjectCreatorById_(session, pid, getSpreadsheet())) return null;
    return 'Bạn chưa được gán dự án này (Cài đặt → Tài khoản → Sửa → Gán dự án)';
  }

  return 'Không có quyền thực hiện thao tác này';
}

function isProtectedMutation_(action) {
  if (!action) return false;
  if (action === 'login' || action === 'logout') return false;
  if (action === 'add-user' || action === 'update-user' || action === 'deactivate-user' || action === 'delete-user') return false;
  if (action === 'upload-image-chunk') return false;
  return true;
}

function parseAssignedProjects_(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(function(id) { return String(id).trim(); })
    .filter(function(id) { return id.length > 0; });
}

function sanitizeUserForClient_(user) {
  return {
    userId: String(user.USER_ID || ''),
    username: String(user.USERNAME || ''),
    displayName: String(user.DISPLAY_NAME || user.USERNAME || ''),
    email: String(user.EMAIL || ''),
    role: String(user.ROLE || 'employee').toLowerCase(),
    employeeId: String(user.EMPLOYEE_ID || ''),
    assignedProjects: parseAssignedProjects_(user.ASSIGNED_PROJECTS)
  };
}

function findUserByUsername_(ss, username) {
  ensureUsersSheet_(ss);
  var users = getSheetDataAsObjects(ss, 'USERS');
  var target = String(username || '').trim().toLowerCase();
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.USERNAME || '').trim().toLowerCase() === target) {
      return u;
    }
  }
  return null;
}

function isUserActive_(user) {
  var active = String(user.ACTIVE || 'TRUE').trim().toUpperCase();
  return active === 'TRUE' || active === '1' || active === 'YES';
}

function createAuthSession_(user) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var session = sanitizeUserForClient_(user);
  CacheService.getScriptCache().put('auth_' + token, JSON.stringify(session), AUTH_SESSION_TTL_SEC);
  return { token: token, user: session };
}

function getAuthSession_(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get('auth_' + String(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function destroyAuthSession_(token) {
  if (!token) return;
  CacheService.getScriptCache().remove('auth_' + String(token));
}

function updateUserLastLogin_(ss, user) {
  if (!user || user._rowIndex == null) return;
  var sheet = ss.getSheetByName('USERS');
  if (!sheet) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var col = findColumnIndex(headers, ['LAST_LOGIN']);
  if (col === -1) return;
  sheet.getRange(user._rowIndex, col + 1).setValue(new Date().toISOString());
}

function handleAuthLogin_(payload) {
  payload = payload || {};
  var username = String(payload.username || '').trim();
  var password = String(payload.password || '');

  if (!username || !password) {
    return createResponse({ status: 'error', message: 'Vui lòng nhập username và mật khẩu' }, 400);
  }

  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);
  var user = findUserByUsername_(ss, username);

  if (!user) {
    return createResponse({ status: 'error', message: 'Tên đăng nhập hoặc mật khẩu không đúng' }, 401);
  }
  if (isUserLocked_(user)) {
    return createResponse({
      status: 'error',
      message: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá 3 lần. Liên hệ Admin để mở khóa.'
    }, 403);
  }
  if (!isUserActive_(user)) {
    return createResponse({ status: 'error', message: 'Tài khoản đã bị vô hiệu hóa' }, 403);
  }

  var hash = hashPassword_(password, user.SALT || '');
  if (hash !== String(user.PASSWORD_HASH || '')) {
    var fails = recordFailedLogin_(ss, user);
    if (fails >= MAX_FAILED_LOGINS_) {
      writeAuditLog_({
        userId: String(user.USER_ID || ''),
        username: String(user.USERNAME || username),
        displayName: String(user.DISPLAY_NAME || user.USERNAME || username)
      }, 'account-locked', { username: username, failedAttempts: fails });
      return createResponse({
        status: 'error',
        message: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá 3 lần. Liên hệ Admin để mở khóa.'
      }, 403);
    }
    var left = MAX_FAILED_LOGINS_ - fails;
    return createResponse({
      status: 'error',
      message: 'Tên đăng nhập hoặc mật khẩu không đúng. Còn ' + left + ' lần thử.'
    }, 401);
  }

  resetLoginAttempts_(ss, user);
  updateUserLastLogin_(ss, user);
  var session = createAuthSession_(user);
  writeAuditLog_(session.user, 'login', { username: username });
  return createResponse({
    status: 'success',
    data: session
  });
}

function handleAuthLogout_(payload) {
  payload = payload || {};
  var token = payload.token || payload._token || '';
  var session = getAuthSession_(token);
  if (session) {
    writeAuditLog_(session, 'logout', {});
  }
  destroyAuthSession_(token);
  return createResponse({ status: 'success', message: 'Đã đăng xuất' });
}

/**
 * Chạy 1 lần từ Apps Script (Run → setupInitialAdmin) nếu cần tạo lại admin.
 */
function setupInitialAdmin() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('USERS');
  if (sheet && sheet.getLastRow() > 1) {
    Logger.log('USERS đã có dữ liệu — bỏ qua seed.');
    return;
  }
  if (sheet) sheet.clear();
  ensureUsersSheet_(ss);
  Logger.log('Đã tạo admin: tien.nguyen / (mật khẩu đã cấu hình trong seedAdminIfNeeded_)');
}

// --- User management (Admin only) ---

var VALID_USER_ROLES_ = ['admin', 'pm', 'sm', 'gs', 'sa', 'tk', 'psc', 'employee'];
var CREATABLE_USER_ROLES_ = ['pm', 'sm', 'gs', 'sa', 'tk', 'psc', 'employee'];
var PROJECT_EDITOR_ROLES_ = ['pm', 'sm'];

function getAuthTokenFromRequest_(payload, e) {
  var fromPayload = payload && (payload._token || payload.token);
  var fromQuery = e && e.parameter && e.parameter.token;
  return String(fromPayload || fromQuery || '').trim();
}

function requireAdminSession_(payload, e) {
  var token = getAuthTokenFromRequest_(payload, e);
  var session = getAuthSession_(token);
  if (!session) {
    return { error: 'Phiên đăng nhập hết hạn hoặc không hợp lệ', code: 401 };
  }
  if (String(session.role || '').toLowerCase() !== 'admin') {
    return { error: 'Chỉ Admin mới có quyền thao tác này', code: 403 };
  }
  return { session: session };
}

/** Admin hoặc PM/SM được gán dự án — bật/tắt link chia sẻ khách */
function canShareProjectWithClient_(session, projectId) {
  if (!session || !projectId) return false;
  var role = String(session.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (isProjectEditorRole_(session.role) && isAssignedToProject_(session, projectId)) return true;
  return false;
}

function requireProjectShareSession_(payload, e, projectId) {
  var token = getAuthTokenFromRequest_(payload, e);
  var session = getAuthSession_(token);
  if (!session) {
    return { error: 'Phiên đăng nhập hết hạn hoặc không hợp lệ', code: 401 };
  }
  var ss = getSpreadsheet();
  var pid = resolveProjectIdFlexible_(ss, projectId);
  if (!pid) {
    return { error: 'Thiếu projectId', code: 400 };
  }
  if (!canShareProjectWithClient_(session, pid)) {
    return { error: 'Bạn không có quyền chia sẻ link khách cho dự án này', code: 403 };
  }
  return { session: session, projectId: pid };
}

function requireProjectShareAdminSession_(payload, e) {
  return requireProjectShareSession_(payload, e, (payload && (payload.projectId || payload.id)) || (e && e.parameter && e.parameter.projectId));
}

function validateVuphongEmail_(email) {
  var normalized = String(email || '').trim().toLowerCase();
  var domain = '@vuphong.com';
  if (!normalized || normalized.indexOf('@') <= 0 || normalized.slice(-domain.length) !== domain) {
    throw new Error('Email phải thuộc domain @vuphong.com');
  }
  return normalized;
}

/** Nhận phần tên hoặc email đầy đủ — luôn trả về email @vuphong.com hợp lệ */
function normalizeEmailInput_(input) {
  var raw = String(input || '').trim().toLowerCase();
  if (!raw) {
    throw new Error('Vui lòng nhập email');
  }
  if (raw.indexOf('@') === -1) {
    return validateVuphongEmail_(raw + '@vuphong.com');
  }
  return validateVuphongEmail_(raw);
}

function normalizeUserRole_(role) {
  var r = String(role || '').trim().toLowerCase().replace(/\./g, '');
  if (r === 'nhanvien' || r === 'nv') return 'employee';
  return r;
}

function sanitizeUserForAdminList_(user) {
  var base = sanitizeUserForClient_(user);
  base.active = isUserActive_(user);
  base.locked = isUserLocked_(user);
  base.failedLoginCount = getFailedLoginCount_(user);
  base.lastLogin = String(user.LAST_LOGIN || '');
  base.createdAt = String(user.CREATED_AT || '');
  base._rowIndex = user._rowIndex;
  return base;
}

function listUsersForAdmin_(ss) {
  ensureUsersSheet_(ss);
  return getSheetDataAsObjects(ss, 'USERS').map(sanitizeUserForAdminList_);
}

function findUserByUserId_(ss, userId) {
  ensureUsersSheet_(ss);
  var target = String(userId || '').trim();
  var users = getSheetDataAsObjects(ss, 'USERS');
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].USER_ID || '') === target) return users[i];
  }
  return null;
}

function generateNextUserId_(ss) {
  var users = getSheetDataAsObjects(ss, 'USERS');
  var maxNum = 0;
  for (var i = 0; i < users.length; i++) {
    var match = String(users[i].USER_ID || '').match(/^U(\d+)$/i);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }
  return 'U' + String(maxNum + 1).padStart(3, '0');
}

function formatAssignedProjects_(projects) {
  if (!projects) return '';
  if (Array.isArray(projects)) {
    return projects.map(function(id) { return String(id).trim(); }).filter(Boolean).join(',');
  }
  return String(projects).trim();
}

function getEmployeeDisplayName_(emp) {
  if (!emp) return '';
  return String(emp.NAME || emp.name || emp['HỌ TÊN'] || emp['Họ tên'] || '').trim();
}

function pickEmployeeField_(emp, exactKeys, includePatterns) {
  if (!emp) return '';
  var k;
  for (k = 0; k < exactKeys.length; k++) {
    var exactVal = emp[exactKeys[k]];
    if (exactVal != null && String(exactVal).trim()) {
      return String(exactVal).trim();
    }
  }
  for (var key in emp) {
    if (!emp.hasOwnProperty(key) || key === '_rowIndex') continue;
    var val = emp[key];
    if (val == null || !String(val).trim()) continue;
    var norm = normalizeString(key);
    for (k = 0; k < includePatterns.length; k++) {
      if (norm === includePatterns[k] || norm.indexOf(includePatterns[k]) >= 0) {
        return String(val).trim();
      }
    }
  }
  return '';
}

function getEmployeeEmailFromRow_(emp) {
  return pickEmployeeField_(emp,
    ['EMAIL', 'email', 'Email', 'MAIL', 'Mail'],
    ['email', 'mail', 'thudientu']
  ).toLowerCase();
}

function getEmployeePositionFromRow_(emp) {
  return pickEmployeeField_(emp,
    ['CHUC_VU', 'CHỨC_VỤ', 'Chức vụ', 'POSITION', 'position', 'VAI_TRO', 'VAI TRÒ', 'ROLE', 'role'],
    ['chucvu', 'chucdanh', 'position', 'vaitro']
  );
}

function sanitizeEmployeeForClient_(emp) {
  if (!emp) return emp;
  var out = {};
  for (var key in emp) {
    if (emp.hasOwnProperty(key)) out[key] = emp[key];
  }
  out.EMPLOYEE_ID = String(emp.EMPLOYEE_ID || emp.ID || emp.id || emp._rowIndex || '');
  out.NAME = getEmployeeDisplayName_(emp) || out.NAME || '';
  out.EMAIL = getEmployeeEmailFromRow_(emp) || out.EMAIL || '';
  out.CHUC_VU = getEmployeePositionFromRow_(emp) || out.CHUC_VU || '';
  return out;
}

function findEmployeeById_(ss, employeeId) {
  var employees = getSheetDataAsObjects(ss, 'EMPLOYEE');
  var target = String(employeeId || '').trim();
  for (var i = 0; i < employees.length; i++) {
    var emp = employees[i];
    var id = String(emp.EMPLOYEE_ID || emp.ID || emp.id || emp._rowIndex || '');
    if (id === target) return emp;
  }
  return null;
}

function updateUserSheetRow_(ss, userRow, updates) {
  var sheet = ss.getSheetByName('USERS');
  if (!sheet || !userRow || userRow._rowIndex == null) {
    throw new Error('Không tìm thấy user để cập nhật');
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var key in updates) {
    if (!updates.hasOwnProperty(key)) continue;
    var col = findColumnIndex(headers, key);
    if (col !== -1) {
      sheet.getRange(userRow._rowIndex, col + 1).setValue(updates[key]);
    }
  }
}

function handleAddUser_(payload) {
  var adminCheck = requireAdminSession_(payload, null);
  if (adminCheck.error) {
    return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
  }

  payload = payload || {};
  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);

  var username = String(payload.username || '').trim().toLowerCase();
  var password = String(payload.password || '');
  var email = normalizeEmailInput_(payload.email);
  var role = normalizeUserRole_(payload.role);
  var employeeId = String(payload.employeeId || '').trim();
  var displayName = String(payload.displayName || '').trim();
  var assignedProjects = formatAssignedProjects_(payload.assignedProjects);

  if (!username || username.length < 3) {
    return createResponse({ status: 'error', message: 'Username phải có ít nhất 3 ký tự' }, 400);
  }
  if (!password || password.length < 6) {
    return createResponse({ status: 'error', message: 'Mật khẩu phải có ít nhất 6 ký tự' }, 400);
  }
  if (CREATABLE_USER_ROLES_.indexOf(role) === -1) {
    return createResponse({ status: 'error', message: 'Role không hợp lệ' }, 400);
  }
  if (!employeeId) {
    return createResponse({ status: 'error', message: 'Vui lòng chọn nhân viên từ danh sách EMPLOYEE' }, 400);
  }

  var emp = findEmployeeById_(ss, employeeId);
  if (!emp) {
    return createResponse({ status: 'error', message: 'Không tìm thấy nhân viên đã chọn' }, 400);
  }
  if (!displayName) displayName = getEmployeeDisplayName_(emp);

  if (findUserByUsername_(ss, username)) {
    return createResponse({ status: 'error', message: 'Username đã tồn tại' }, 409);
  }

  var salt = generateAuthSalt_();
  var hash = hashPassword_(password, salt);
  var now = new Date().toISOString();

  var newUserId = generateNextUserId_(ss);
  appendRow(ss, 'USERS', {
    USER_ID: newUserId,
    USERNAME: username,
    PASSWORD_HASH: hash,
    SALT: salt,
    EMAIL: email,
    EMPLOYEE_ID: employeeId,
    DISPLAY_NAME: displayName,
    ROLE: role,
    ASSIGNED_PROJECTS: assignedProjects,
    ACTIVE: 'TRUE',
    FAILED_LOGIN_COUNT: 0,
    LOCKED: 'FALSE',
    LAST_LOGIN: '',
    CREATED_AT: now
  });

  if (assignedProjects) {
    notifyProjectAssignmentChanges_(ss, { USER_ID: newUserId }, '', assignedProjects, adminCheck.session);
  }

  auditMutation_('add-user', payload, adminCheck.session);

  return createResponse({
    status: 'success',
    message: 'Đã tạo tài khoản',
    data: listUsersForAdmin_(ss)
  });
}

function handleUpdateUser_(payload) {
  var adminCheck = requireAdminSession_(payload, null);
  if (adminCheck.error) {
    return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
  }

  payload = payload || {};
  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);

  var userId = String(payload.userId || '').trim();
  var user = findUserByUserId_(ss, userId);
  if (!user) {
    return createResponse({ status: 'error', message: 'Không tìm thấy user' }, 404);
  }

  var oldAssignedProjects = String(user.ASSIGNED_PROJECTS || '');

  var updates = {};
  var role = payload.role != null ? normalizeUserRole_(payload.role) : null;

  if (payload.email != null) {
    updates.EMAIL = normalizeEmailInput_(payload.email);
  }
  if (payload.displayName != null) {
    updates.DISPLAY_NAME = String(payload.displayName || '').trim();
  }
  if (payload.employeeId != null) {
    var employeeId = String(payload.employeeId || '').trim();
    if (!employeeId) {
      return createResponse({ status: 'error', message: 'Vui lòng chọn nhân viên' }, 400);
    }
    var emp = findEmployeeById_(ss, employeeId);
    if (!emp) {
      return createResponse({ status: 'error', message: 'Không tìm thấy nhân viên' }, 400);
    }
    updates.EMPLOYEE_ID = employeeId;
    if (!payload.displayName) {
      updates.DISPLAY_NAME = getEmployeeDisplayName_(emp);
    }
  }
  if (role != null) {
    if (String(user.USER_ID) === String(adminCheck.session.userId) && role !== 'admin') {
      return createResponse({ status: 'error', message: 'Không thể đổi role của chính mình' }, 400);
    }
    if (String(user.ROLE || '').toLowerCase() === 'admin') {
      return createResponse({ status: 'error', message: 'Không thể sửa tài khoản Admin qua UI' }, 400);
    }
    if (CREATABLE_USER_ROLES_.indexOf(role) === -1 && role !== 'admin') {
      return createResponse({ status: 'error', message: 'Role không hợp lệ' }, 400);
    }
    updates.ROLE = role;
  }
  if (payload.assignedProjects != null) {
    updates.ASSIGNED_PROJECTS = formatAssignedProjects_(payload.assignedProjects);
  }
  if (payload.active != null) {
    var willActive = payload.active === true || String(payload.active).toUpperCase() === 'TRUE';
    if (String(user.USER_ID) === String(adminCheck.session.userId) && !willActive) {
      return createResponse({ status: 'error', message: 'Không thể vô hiệu hóa tài khoản của chính mình' }, 400);
    }
    if (String(user.ROLE || '').toLowerCase() === 'admin' && !willActive) {
      return createResponse({ status: 'error', message: 'Không thể vô hiệu hóa tài khoản Admin' }, 400);
    }
    updates.ACTIVE = willActive ? 'TRUE' : 'FALSE';
  }
  if (payload.unlock === true || payload.locked === false) {
    updates.FAILED_LOGIN_COUNT = 0;
    updates.LOCKED = 'FALSE';
  }
  if (payload.lock === true || payload.locked === true) {
    if (String(user.USER_ID) === String(adminCheck.session.userId)) {
      return createResponse({ status: 'error', message: 'Không thể khóa tài khoản của chính mình' }, 400);
    }
    if (String(user.ROLE || '').toLowerCase() === 'admin') {
      return createResponse({ status: 'error', message: 'Không thể khóa tài khoản Admin' }, 400);
    }
    updates.LOCKED = 'TRUE';
  }
  if (payload.password) {
    var newPass = String(payload.password);
    if (newPass.length < 6) {
      return createResponse({ status: 'error', message: 'Mật khẩu phải có ít nhất 6 ký tự' }, 400);
    }
    var newSalt = generateAuthSalt_();
    updates.SALT = newSalt;
    updates.PASSWORD_HASH = hashPassword_(newPass, newSalt);
  }

  if (Object.keys(updates).length === 0) {
    return createResponse({ status: 'error', message: 'Không có dữ liệu để cập nhật' }, 400);
  }

  updateUserSheetRow_(ss, user, updates);

  if (payload.assignedProjects != null) {
    notifyProjectAssignmentChanges_(
      ss,
      user,
      oldAssignedProjects,
      formatAssignedProjects_(payload.assignedProjects),
      adminCheck.session
    );
  }

  auditMutation_('update-user', payload, adminCheck.session);

  return createResponse({
    status: 'success',
    message: 'Đã cập nhật tài khoản',
    data: listUsersForAdmin_(ss)
  });
}

function handleDeactivateUser_(payload) {
  payload = payload || {};
  payload.active = false;
  return handleUpdateUser_(payload);
}

function handleDeleteUser_(payload) {
  var adminCheck = requireAdminSession_(payload, null);
  if (adminCheck.error) {
    return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
  }

  payload = payload || {};
  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);

  var userId = String(payload.userId || '').trim();
  var user = findUserByUserId_(ss, userId);
  if (!user) {
    return createResponse({ status: 'error', message: 'Không tìm thấy user' }, 404);
  }

  if (String(user.USER_ID) === String(adminCheck.session.userId)) {
    return createResponse({ status: 'error', message: 'Không thể xóa tài khoản của chính mình' }, 400);
  }
  if (String(user.ROLE || '').toLowerCase() === 'admin') {
    return createResponse({ status: 'error', message: 'Không thể xóa tài khoản Admin' }, 400);
  }
  if (user._rowIndex == null) {
    return createResponse({ status: 'error', message: 'Không xác định được dòng user' }, 400);
  }

  deleteRowById(ss, 'USERS', user._rowIndex);
  auditMutation_('delete-user', {
    userId: userId,
    username: user.USERNAME,
    displayName: user.DISPLAY_NAME
  }, adminCheck.session);

  return createResponse({
    status: 'success',
    message: 'Đã xóa tài khoản',
    data: listUsersForAdmin_(ss)
  });
}

function handleChangePassword_(payload) {
  var authReq = requireAuthForMutation_(payload);
  if (authReq.error) {
    return createResponse({ status: 'error', message: authReq.error }, authReq.code || 401);
  }

  payload = payload || {};
  var currentPassword = String(payload.currentPassword || '');
  var newPassword = String(payload.newPassword || '');

  if (!currentPassword || !newPassword) {
    return createResponse({ status: 'error', message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' }, 400);
  }
  if (newPassword.length < 6) {
    return createResponse({ status: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400);
  }
  if (currentPassword === newPassword) {
    return createResponse({ status: 'error', message: 'Mật khẩu mới phải khác mật khẩu hiện tại' }, 400);
  }

  var ss = getSpreadsheet();
  ensureUsersSheet_(ss);
  var user = findUserByUserId_(ss, authReq.session.userId);
  if (!user) {
    return createResponse({ status: 'error', message: 'Không tìm thấy tài khoản' }, 404);
  }

  var hash = hashPassword_(currentPassword, user.SALT || '');
  if (hash !== String(user.PASSWORD_HASH || '')) {
    return createResponse({ status: 'error', message: 'Mật khẩu hiện tại không đúng' }, 401);
  }

  var newSalt = generateAuthSalt_();
  updateUserSheetRow_(ss, user, {
    SALT: newSalt,
    PASSWORD_HASH: hashPassword_(newPassword, newSalt)
  });

  auditMutation_('change-password', { userId: authReq.session.userId }, authReq.session);

  return createResponse({ status: 'success', message: 'Đã đổi mật khẩu thành công' });
}

// ================= NOTIFICATIONS =================

var NOTIFICATIONS_MAX_ROWS_ = 2000;

function ensureNotificationsSheet_(ss) {
  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('NOTIFICATIONS');
  if (!sheet) {
    sheet = ss.insertSheet('NOTIFICATIONS');
  }
  initializeSheetIfEmpty(sheet, 'NOTIFICATIONS');
  return sheet;
}

function trimNotificationsIfNeeded_(ss) {
  var sheet = ss.getSheetByName('NOTIFICATIONS');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= NOTIFICATIONS_MAX_ROWS_ + 1) return;
  sheet.deleteRows(2, lastRow - NOTIFICATIONS_MAX_ROWS_ - 1);
}

function createNotification_(userId, type, title, body, link) {
  if (!userId) return;
  try {
    var ss = getSpreadsheet();
    ensureNotificationsSheet_(ss);
    appendRow(ss, 'NOTIFICATIONS', {
      NOTIF_ID: 'N' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      USER_ID: String(userId),
      TYPE: String(type || 'info'),
      TITLE: String(title || '').slice(0, 200),
      BODY: String(body || '').slice(0, 500),
      LINK: String(link || ''),
      READ: 'FALSE',
      CREATED_AT: new Date().toISOString()
    });
    trimNotificationsIfNeeded_(ss);
    sendNotificationEmail_(userId, type, title, body, link);
  } catch (err) {
    Logger.log('createNotification_ error: ' + err);
  }
}

function getNotificationEmailConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    appUrl: String(props.getProperty('DASHBOARD_APP_URL') || '').trim().replace(/\/$/, ''),
    enabled: props.getProperty('NOTIF_EMAIL_ENABLED') === 'true'
  };
}

function escapeHtmlForEmail_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getUserEmailForNotification_(ss, userId) {
  var user = findUserByUserId_(ss, userId);
  if (!user || !isUserActive_(user)) return '';
  var email = String(user.EMAIL || '').trim().toLowerCase();
  if (!email || email.indexOf('@vuphong.com') === -1) return '';
  return email;
}

function buildAbsoluteNotificationLink_(link) {
  var base = getNotificationEmailConfig_().appUrl;
  var path = String(link || '').split('#')[0];
  if (!path) return base || '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!base) return '';
  return base + (path.charAt(0) === '/' ? path : '/' + path);
}

function buildNotificationEmailHtml_(title, body, link) {
  var absLink = buildAbsoluteNotificationLink_(link);
  var linkHtml = absLink
    ? '<p style="margin:20px 0 0"><a href="' + escapeHtmlForEmail_(absLink) + '" style="background:#5252ff;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Mở dashboard</a></p>'
    : '';
  return '<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1e293b;max-width:520px">' +
    '<p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">EPC Solar Dashboard</p>' +
    '<h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">' + escapeHtmlForEmail_(title) + '</h2>' +
    '<p style="margin:0;font-size:14px;color:#334155">' + escapeHtmlForEmail_(body) + '</p>' +
    linkHtml +
    '<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">' +
    '<p style="margin:0;font-size:11px;color:#94a3b8">Email tự động — vui lòng không trả lời.</p></div>';
}

function sendNotificationEmail_(userId, type, title, body, link) {
  var config = getNotificationEmailConfig_();
  if (!config.enabled || !config.appUrl) {
    return { ok: false, error: 'Email chưa bật hoặc thiếu URL dashboard' };
  }
  try {
    var ss = getSpreadsheet();
    var to = getUserEmailForNotification_(ss, userId);
    if (!to) return { ok: false, error: 'User không có email @vuphong.com hợp lệ' };
    var subject = '[EPC Solar] ' + String(title || 'Thông báo');
    var plain = String(title || '') + '\n\n' + String(body || '');
    var absLink = buildAbsoluteNotificationLink_(link);
    if (absLink) plain += '\n\nMở: ' + absLink;
    var htmlBody = buildNotificationEmailHtml_(title, body, link);
    try {
      MailApp.sendEmail({
        to: to,
        subject: subject,
        body: plain,
        htmlBody: htmlBody,
        name: 'EPC Solar Dashboard'
      });
      return { ok: true, to: to, via: 'mailapp' };
    } catch (mailErr) {
      var mailMsg = mailErr && mailErr.message ? String(mailErr.message) : String(mailErr);
      try {
        GmailApp.sendEmail(to, subject, plain, { htmlBody: htmlBody, name: 'EPC Solar Dashboard' });
        return { ok: true, to: to, via: 'gmail' };
      } catch (gmailErr) {
        var gmailMsg = gmailErr && gmailErr.message ? String(gmailErr.message) : String(gmailErr);
        return { ok: false, error: mailMsg + ' | GmailApp: ' + gmailMsg };
      }
    }
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    Logger.log('sendNotificationEmail_ error: ' + msg);
    return { ok: false, error: msg };
  }
}

function handleUpdateNotificationEmailConfig_(payload) {
  var adminCheck = requireAdminSession_(payload, null);
  if (adminCheck.error) {
    return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
  }
  var appUrl = String(payload.appUrl || '').trim().replace(/\/$/, '');
  var enabled = payload.enabled === true || String(payload.enabled || '').toLowerCase() === 'true';
  if (enabled && !appUrl) {
    return createResponse({ status: 'error', message: 'Cần URL dashboard khi bật gửi email' }, 400);
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('DASHBOARD_APP_URL', appUrl);
  props.setProperty('NOTIF_EMAIL_ENABLED', enabled ? 'true' : 'false');
  auditMutation_('update-notification-email-config', { appUrl: appUrl, enabled: enabled });
  return createResponse({
    status: 'success',
    message: enabled ? 'Đã bật email thông báo' : 'Đã tắt email thông báo',
    data: getNotificationEmailConfig_()
  });
}

function handleSendTestNotificationEmail_(payload) {
  var adminCheck = requireAdminSession_(payload, null);
  if (adminCheck.error) {
    return createResponse({ status: 'error', message: adminCheck.error }, adminCheck.code || 403);
  }
  var config = getNotificationEmailConfig_();
  if (!config.enabled || !config.appUrl) {
    return createResponse({ status: 'error', message: 'Bật email và nhập URL dashboard trước khi gửi thử' }, 400);
  }
  var ss = getSpreadsheet();
  var userId = adminCheck.session.userId;
  var result = sendNotificationEmail_(
    userId,
    'info',
    'Email thử nghiệm',
    'Hệ thống EPC Solar Dashboard gửi email thử. Nếu bạn nhận được, cấu hình email đang hoạt động.',
    '/'
  );
  if (!result.ok) {
    var email = getUserEmailForNotification_(ss, userId);
    if (!email) {
      return createResponse({ status: 'error', message: 'Tài khoản admin chưa có email @vuphong.com hợp lệ' }, 400);
    }
    var errMsg = result.error || 'Không gửi được email';
    if (/authorization|permission|quyền|scope|auth/i.test(errMsg)) {
      errMsg += ' — mở script.google.com → chọn project → Run hàm authorizeMailApp_ → Allow quyền gửi mail';
    }
    return createResponse({ status: 'error', message: errMsg }, 500);
  }
  return createResponse({ status: 'success', message: 'Đã gửi email thử tới ' + result.to });
}

function getActorUserId_(actor) {
  return actor && actor.userId ? String(actor.userId) : '';
}

function shouldNotifyUser_(actorUserId, targetUserId) {
  if (!targetUserId) return false;
  if (actorUserId && actorUserId === targetUserId) return false;
  return true;
}

function findUserIdsByDisplayName_(ss, displayName) {
  if (!displayName) return [];
  ensureUsersSheet_(ss);
  var users = getSheetDataAsObjects(ss, 'USERS');
  var ids = [];
  for (var i = 0; i < users.length; i++) {
    if (!isUserActive_(users[i])) continue;
    if (namesMatch_(users[i].DISPLAY_NAME, displayName)) {
      ids.push(String(users[i].USER_ID || ''));
    }
  }
  return ids;
}

function getProjectDisplayName_(ss, projectId) {
  var pid = String(projectId || '').trim();
  if (!pid) return '';
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  for (var i = 0; i < projects.length; i++) {
    if (String(projects[i].PROJECT_ID || '') === pid) {
      return String(projects[i].TÊN_DỰ_ÁN || pid);
    }
  }
  return pid;
}

function buildProjectLink_(ss, projectId, projectName) {
  var pid = String(projectId || '').trim();
  if (pid) return '/projects/' + encodeURIComponent(pid);
  var label = String(projectName || '').trim() || getProjectDisplayName_(ss, projectId);
  if (!label) return '/projects';
  return '/projects/' + encodeURIComponent(label);
}

function buildTaskLink_(projectId, taskName) {
  var q = encodeURIComponent(String(taskName || '').trim());
  var link = '/tasks?q=' + q;
  var pid = String(projectId || '').trim();
  if (pid) link += '&project=' + encodeURIComponent(pid);
  return link;
}

function notifyTaskAssigned_(ss, payload, actor, opts) {
  opts = opts || {};
  payload = payload || {};
  var assignee = String(payload.NHÂN_SỰ || '').trim();
  if (!assignee) return;

  var taskName = String(payload.TÁC_VỤ || payload._matchTask || 'Tác vụ').trim();
  var projectName = String(payload.TÊN_DỰ_ÁN || '').trim();
  var projectId = String(payload.PROJECT_ID || payload.projectId || '').trim();
  if (!projectName && projectId) {
    projectName = getProjectDisplayName_(ss, projectId);
  }

  var actorName = String((actor && actor.displayName) || 'Hệ thống');
  var actorUserId = getActorUserId_(actor);
  var userIds = findUserIdsByDisplayName_(ss, assignee);
  var title = opts.reassigned ? 'Task được chuyển giao' : 'Task mới được giao';
  var body = actorName + (opts.reassigned ? ' chuyển cho bạn task "' : ' giao cho bạn task "') + taskName + '"';
  if (projectName) body += ' (' + projectName + ')';
  var taskLink = buildTaskLink_(projectId, taskName);

  for (var i = 0; i < userIds.length; i++) {
    if (shouldNotifyUser_(actorUserId, userIds[i])) {
      createNotification_(userIds[i], 'task_assigned', title, body, taskLink);
    }
  }
}

function getTaskAssigneeBeforeUpdate_(ss, payload) {
  var sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return '';
  var ctx = getTaskSheetContext_(sheet);
  if (!ctx || ctx.assigneeCol === -1) return '';
  var rowIndex = findTaskRowIndex_(sheet, payload);
  if (rowIndex <= 1) return '';
  var dataIdx = rowIndex - 1;
  if (dataIdx >= ctx.data.length) return '';
  return normalizeCellValue(ctx.data[dataIdx][ctx.assigneeCol]);
}

function notifyProjectAssignmentChanges_(ss, user, oldProjectsStr, newProjectsStr, actor) {
  var oldList = parseAssignedProjects_(oldProjectsStr);
  var newList = parseAssignedProjects_(newProjectsStr);
  var userId = String(user.USER_ID || '');
  var actorUserId = getActorUserId_(actor);
  if (!shouldNotifyUser_(actorUserId, userId)) return;

  var oldSet = {};
  for (var o = 0; o < oldList.length; o++) oldSet[oldList[o]] = true;
  var newSet = {};
  for (var n = 0; n < newList.length; n++) newSet[newList[n]] = true;

  for (var a = 0; a < newList.length; a++) {
    var pidAdded = newList[a];
    if (!oldSet[pidAdded]) {
      var nameAdded = getProjectDisplayName_(ss, pidAdded);
      createNotification_(
        userId,
        'project_assigned',
        'Dự án mới được gán',
        'Bạn được gán dự án ' + nameAdded,
        buildProjectLink_(ss, pidAdded, nameAdded)
      );
    }
  }

  for (var r = 0; r < oldList.length; r++) {
    var pidRemoved = oldList[r];
    if (!newSet[pidRemoved]) {
      var nameRemoved = getProjectDisplayName_(ss, pidRemoved);
      createNotification_(
        userId,
        'project_unassigned',
        'Dự án bị gỡ gán',
        'Bạn không còn được gán dự án ' + nameRemoved,
        '/projects'
      );
    }
  }
}

function sanitizeNotificationForClient_(row) {
  var link = String(row.LINK || '');
  var hashIdx = link.indexOf('#n:');
  if (hashIdx >= 0) link = link.slice(0, hashIdx);
  return {
    notifId: String(row.NOTIF_ID || ''),
    type: String(row.TYPE || ''),
    title: String(row.TITLE || ''),
    body: String(row.BODY || ''),
    link: link,
    read: String(row.READ || '').toUpperCase() === 'TRUE',
    createdAt: String(row.CREATED_AT || '')
  };
}

function listNotificationsForUser_(ss, userId, limit) {
  ensureNotificationsSheet_(ss);
  var uid = String(userId || '');
  var rows = getSheetDataAsObjects(ss, 'NOTIFICATIONS').filter(function(r) {
    return String(r.USER_ID || '') === uid;
  });
  rows.sort(function(a, b) {
    return String(b.CREATED_AT || '').localeCompare(String(a.CREATED_AT || ''));
  });
  limit = limit || 50;
  var slice = rows.slice(0, limit);
  var unreadCount = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].READ || '').toUpperCase() !== 'TRUE') unreadCount++;
  }
  return {
    items: slice.map(sanitizeNotificationForClient_),
    unreadCount: unreadCount
  };
}

function setNotificationRead_(ss, userId, notifId, readValue) {
  ensureNotificationsSheet_(ss);
  var sheet = ss.getSheetByName('NOTIFICATIONS');
  var rows = getSheetDataAsObjects(ss, 'NOTIFICATIONS');
  var uid = String(userId || '');
  var nid = String(notifId || '');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].USER_ID || '') === uid && String(rows[i].NOTIF_ID || '') === nid) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var readCol = findColumnIndex(headers, ['READ']);
      if (readCol !== -1 && rows[i]._rowIndex) {
        sheet.getRange(rows[i]._rowIndex, readCol + 1).setValue(readValue ? 'TRUE' : 'FALSE');
      }
      return true;
    }
  }
  return false;
}

function markAllNotificationsReadForUser_(ss, userId) {
  ensureNotificationsSheet_(ss);
  var sheet = ss.getSheetByName('NOTIFICATIONS');
  var rows = getSheetDataAsObjects(ss, 'NOTIFICATIONS');
  var uid = String(userId || '');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var readCol = findColumnIndex(headers, ['READ']);
  if (readCol === -1) return 0;
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].USER_ID || '') !== uid) continue;
    if (String(rows[i].READ || '').toUpperCase() === 'TRUE') continue;
    if (rows[i]._rowIndex) {
      sheet.getRange(rows[i]._rowIndex, readCol + 1).setValue('TRUE');
      count++;
    }
  }
  return count;
}

function handleMarkNotificationRead_(payload) {
  var authReq = requireAuthForMutation_(payload);
  if (authReq.error) {
    return createResponse({ status: 'error', message: authReq.error }, authReq.code || 401);
  }
  var notifId = String(payload.notifId || '').trim();
  if (!notifId) {
    return createResponse({ status: 'error', message: 'Thiếu notifId' }, 400);
  }
  var ss = getSpreadsheet();
  setNotificationRead_(ss, authReq.session.userId, notifId, true);
  return createResponse({
    status: 'success',
    message: 'Đã đánh dấu đã đọc',
    data: listNotificationsForUser_(ss, authReq.session.userId, 50)
  });
}

function handleMarkAllNotificationsRead_(payload) {
  var authReq = requireAuthForMutation_(payload);
  if (authReq.error) {
    return createResponse({ status: 'error', message: authReq.error }, authReq.code || 401);
  }
  var ss = getSpreadsheet();
  markAllNotificationsReadForUser_(ss, authReq.session.userId);
  return createResponse({
    status: 'success',
    message: 'Đã đánh dấu tất cả đã đọc',
    data: listNotificationsForUser_(ss, authReq.session.userId, 50)
  });
}

function startOfDayLocal_(date) {
  var d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayFingerprint_() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function isTaskCompleted_(status) {
  var s = String(status || '').toLowerCase();
  return s.indexOf('hoàn thành') >= 0 || s.indexOf('hoan thanh') >= 0 || s.indexOf('completed') >= 0 || s === 'done';
}

function isProjectCompleted_(status) {
  var s = String(status || '').toUpperCase();
  return s === 'ĐÃ HOÀN THÀNH' || s === 'HOÀN THÀNH' || s === 'COMPLETED';
}

function hasRecentNotificationFingerprint_(ss, userId, type, fingerprint) {
  var rows = getSheetDataAsObjects(ss, 'NOTIFICATIONS');
  var fp = String(fingerprint || '');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].USER_ID || '') !== String(userId)) continue;
    if (String(rows[i].TYPE || '') !== String(type)) continue;
    if (String(rows[i].LINK || '').indexOf(fp) >= 0) return true;
  }
  return false;
}

function createNotificationIfNew_(userId, type, title, body, link, fingerprint) {
  if (!userId) return;
  var ss = getSpreadsheet();
  if (hasRecentNotificationFingerprint_(ss, userId, type, fingerprint)) return;
  var linkWithFp = String(link || '') + (fingerprint ? '#n:' + fingerprint : '');
  createNotification_(userId, type, title, body, linkWithFp);
}

function findUserIdsAssignedToProject_(ss, projectId) {
  ensureUsersSheet_(ss);
  var pid = String(projectId || '').trim();
  if (!pid) return [];
  var users = getSheetDataAsObjects(ss, 'USERS');
  var ids = [];
  var seen = {};
  for (var i = 0; i < users.length; i++) {
    if (!isUserActive_(users[i])) continue;
    var list = parseAssignedProjects_(users[i].ASSIGNED_PROJECTS);
    var matched = false;
    for (var j = 0; j < list.length; j++) {
      if (String(list[j]) === pid) { matched = true; break; }
    }
    if (!matched) continue;
    var uid = String(users[i].USER_ID || '');
    if (uid && !seen[uid]) {
      seen[uid] = true;
      ids.push(uid);
    }
  }
  return ids;
}

function findProjectStakeholderUserIds_(ss, project) {
  project = project || {};
  var seen = {};
  var ids = [];
  function addIds(fromList) {
    for (var i = 0; i < fromList.length; i++) {
      if (fromList[i] && !seen[fromList[i]]) {
        seen[fromList[i]] = true;
        ids.push(fromList[i]);
      }
    }
  }
  addIds(findUserIdsByDisplayName_(ss, project.PM));
  addIds(findUserIdsByDisplayName_(ss, project.SM));
  addIds(findUserIdsAssignedToProject_(ss, project.PROJECT_ID || project.id));
  return ids;
}

function wasProjectCompletedNotified_(projectId) {
  return PropertiesService.getScriptProperties().getProperty('notif_completed_' + String(projectId)) === '1';
}

function markProjectCompletedNotified_(projectId) {
  PropertiesService.getScriptProperties().setProperty('notif_completed_' + String(projectId), '1');
}

function getProjectById_(ss, projectId) {
  var pid = String(projectId || '').trim();
  if (!pid) return null;
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  for (var i = 0; i < projects.length; i++) {
    if (String(projects[i].PROJECT_ID || projects[i].id || '') === pid) return projects[i];
  }
  return null;
}

function getProjectFieldBeforeUpdate_(ss, projectId, fieldName) {
  var project = getProjectById_(ss, projectId);
  return project ? project[fieldName] : '';
}

function notifyProjectCompleted_(ss, projectId, actor) {
  var project = getProjectById_(ss, projectId);
  if (!project || !isProjectCompleted_(project.TRẠNG_THÁI || project.STATUS)) return;
  if (wasProjectCompletedNotified_(projectId)) return;

  var projectName = String(project.TÊN_DỰ_ÁN || project.PROJECT_NAME || projectId);
  var link = buildProjectLink_(ss, projectId, projectName);
  var actorUserId = getActorUserId_(actor);
  var userIds = findProjectStakeholderUserIds_(ss, project);
  var title = 'Dự án hoàn thành';
  var body = 'Dự án ' + projectName + ' đã hoàn thành (COD).';
  var fp = 'project_completed_' + projectId;

  for (var i = 0; i < userIds.length; i++) {
    if (shouldNotifyUser_(actorUserId, userIds[i])) {
      createNotificationIfNew_(userIds[i], 'project_completed', title, body, link, fp);
    }
  }
  markProjectCompletedNotified_(projectId);
}

function runTaskDeadlineNotifications_(ss) {
  var tasks = getSheetDataAsObjects(ss, 'PROJECT_TASKS');
  var today = startOfDayLocal_(new Date());
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var fpDay = todayFingerprint_();

  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    if (isTaskCompleted_(task.TRẠNG_THÁI || task.STATUS)) continue;

    var endDate = parseDateString(task.NGÀY_KẾT_THÚC || task.endDate);
    if (!endDate) continue;
    endDate = startOfDayLocal_(endDate);

    var taskName = String(task.TÁC_VỤ || task.task || 'Tác vụ').trim();
    var projectName = String(task.TÊN_DỰ_ÁN || '').trim();
    var projectId = String(task.PROJECT_ID || task.projectId || '').trim();
    var taskKey = projectId + '|' + taskName;
    var assignee = String(task.NHÂN_SỰ || '').trim();
    var suffix = projectName ? ' (' + projectName + ')' : '';
    var taskLink = buildTaskLink_(projectId, taskName);

    if (endDate.getTime() === tomorrow.getTime()) {
      var assigneeIds = findUserIdsByDisplayName_(ss, assignee);
      for (var a = 0; a < assigneeIds.length; a++) {
        createNotificationIfNew_(
          assigneeIds[a],
          'task_due_soon',
          'Task sắp đến hạn',
          'Task "' + taskName + '"' + suffix + ' đến hạn ngày mai',
          taskLink,
          taskKey + '_due_soon_' + fpDay
        );
      }
    }

    if (endDate.getTime() < today.getTime()) {
      var daysLate = Math.max(1, Math.floor((today.getTime() - endDate.getTime()) / 86400000));
      var overdueBody = 'Task "' + taskName + '"' + suffix + ' đã trễ ' + daysLate + ' ngày';
      var overdueFp = taskKey + '_overdue_' + fpDay;

      var assigneeIdsOverdue = findUserIdsByDisplayName_(ss, assignee);
      for (var b = 0; b < assigneeIdsOverdue.length; b++) {
        createNotificationIfNew_(
          assigneeIdsOverdue[b],
          'task_overdue',
          'Task quá hạn',
          overdueBody,
          taskLink,
          overdueFp
        );
      }

      if (projectId) {
        var project = getProjectById_(ss, projectId);
        if (project) {
          var pmIds = findUserIdsByDisplayName_(ss, project.PM);
          var smIds = findUserIdsByDisplayName_(ss, project.SM);
          var leaderIds = pmIds.concat(smIds);
          var seenLeader = {};
          for (var c = 0; c < leaderIds.length; c++) {
            var lid = leaderIds[c];
            if (!lid || seenLeader[lid]) continue;
            seenLeader[lid] = true;
            createNotificationIfNew_(
              lid,
              'task_overdue',
              'Task quá hạn (dự án)',
              overdueBody,
              taskLink,
              taskKey + '_overdue_pm_' + fpDay
            );
          }
        }
      }
    }
  }
}

function runProjectCompletedScan_(ss) {
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  for (var i = 0; i < projects.length; i++) {
    var pid = projects[i].PROJECT_ID || projects[i].id;
    if (!pid) continue;
    if (isProjectCompleted_(projects[i].TRẠNG_THÁI || projects[i].STATUS)) {
      notifyProjectCompleted_(ss, pid, null);
    }
  }
}

function buildRiskLink_(projectId) {
  var pid = String(projectId || '').trim();
  if (!pid) return '/projects';
  return '/projects/' + encodeURIComponent(pid) + '#section-modules';
}

function isRiskClosed_(status) {
  var s = String(status || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s === 'DA DONG' || s === 'CLOSED';
}

function ensureRiskSheetColumns_(ss) {
  var sheet = ss.getSheetByName('PROJECT_RISK');
  if (!sheet) return;
  initializeSheetIfEmpty(sheet, 'PROJECT_RISK');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var needed = ['NGÀY_HOÀN_THÀNH'];
  for (var i = 0; i < needed.length; i++) {
    if (findColumnIndex(headers, needed[i]) === -1) {
      var col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(needed[i]);
      headers.push(needed[i]);
    }
  }
}

/** Tự thêm cột NGƯỜI_TẠO trên PROJECT_TASKS nếu sheet cũ chưa có */
function ensureTaskSheetColumns_(ss) {
  var sheet = ss.getSheetByName('PROJECT_TASKS');
  if (!sheet) return;
  initializeSheetIfEmpty(sheet, 'PROJECT_TASKS');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var needed = ['NGƯỜI_TẠO'];
  for (var i = 0; i < needed.length; i++) {
    if (findColumnIndex(headers, needed[i]) === -1) {
      var col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(needed[i]);
      headers.push(needed[i]);
    }
  }
}

/** Tự thêm cột NGƯỜI_TẠO trên PROJECT_MASTER nếu sheet cũ chưa có */
function ensureProjectMasterColumns_(ss) {
  var sheet = ss.getSheetByName('PROJECT_MASTER');
  if (!sheet) return;
  initializeSheetIfEmpty(sheet, 'PROJECT_MASTER');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var needed = ['NGƯỜI_TẠO'];
  for (var i = 0; i < needed.length; i++) {
    if (findColumnIndex(headers, needed[i]) === -1) {
      var col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(needed[i]);
      headers.push(needed[i]);
    }
  }
}

function runRiskDeadlineNotifications_(ss) {
  ensureRiskSheetColumns_(ss);
  var risks = getSheetDataAsObjects(ss, 'PROJECT_RISK');
  var today = startOfDayLocal_(new Date());
  var fpDay = todayFingerprint_();

  for (var i = 0; i < risks.length; i++) {
    var risk = risks[i];
    if (isRiskClosed_(risk.TRẠNG_THÁI || risk.STATUS)) continue;

    var dueRaw = risk.NGÀY_HOÀN_THÀNH || risk['NGAY_HOAN_THANH'] || '';
    var dueDate = parseDateString(dueRaw);
    if (!dueDate) continue;
    dueDate = startOfDayLocal_(dueDate);
    if (dueDate.getTime() >= today.getTime()) continue;

    var projectId = String(risk.PROJECT_ID || risk.projectId || '').trim();
    var project = projectId ? getProjectById_(ss, projectId) : null;
    var projectName = project ? String(project.TÊN_DỰ_ÁN || project.PROJECT_NAME || projectId) : projectId;
    var riskTitle = String(risk.NỘI_DUNG || 'Rủi ro').trim();
    var assignee = String(risk.PHỤ_TRÁCH || '').trim();
    var daysLate = Math.max(1, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
    var link = buildRiskLink_(projectId);
    var rowKey = String(risk._rowIndex || i);
    var riskKey = projectId + '|' + rowKey + '|' + riskTitle;
    var suffix = projectName ? ' (' + projectName + ')' : '';
    var dueLabel = Utilities.formatDate(dueDate, Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
    var body = 'Rủi ro "' + riskTitle + '"' + suffix + ' đã trễ ' + daysLate + ' ngày (Hạn HT: ' + dueLabel + ')';

    if (assignee) {
      var assigneeIds = findUserIdsByDisplayName_(ss, assignee);
      for (var a = 0; a < assigneeIds.length; a++) {
        createNotificationIfNew_(
          assigneeIds[a],
          'risk_overdue',
          'Rủi ro quá hạn',
          body,
          link,
          riskKey + '_assignee_' + fpDay
        );
      }
    }

    if (project) {
      var pmIds = findUserIdsByDisplayName_(ss, project.PM);
      var smIds = findUserIdsByDisplayName_(ss, project.SM);
      var leaderIds = pmIds.concat(smIds);
      var ccBody = body + (assignee ? '. Phụ trách: ' + assignee : '');
      var seenLeader = {};
      for (var c = 0; c < leaderIds.length; c++) {
        var lid = leaderIds[c];
        if (!lid || seenLeader[lid]) continue;
        seenLeader[lid] = true;
        createNotificationIfNew_(
          lid,
          'risk_overdue',
          'Rủi ro quá hạn (CC PM/SM)',
          ccBody,
          link,
          riskKey + '_leader_' + lid + '_' + fpDay
        );
      }
    }
  }
}

function runDailyNotificationChecks_() {
  var ss = getSpreadsheet();
  ensureNotificationsSheet_(ss);
  ensureRiskSheetColumns_(ss);
  runTaskDeadlineNotifications_(ss);
  runRiskDeadlineNotifications_(ss);
  runProjectCompletedScan_(ss);
  return { ok: true, ranAt: new Date().toISOString() };
}

/** Time-based trigger — chạy mỗi sáng 8h (Asia/Ho_Chi_Minh) */
function dailyNotificationTrigger() {
  runDailyNotificationChecks_();
}

function installDailyNotificationTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyNotificationTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('dailyNotificationTrigger')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('Asia/Ho_Chi_Minh')
    .create();
  return { ok: true, message: 'Đã cài trigger thông báo hàng ngày (8:00 ICT)' };
}

// ================= PUBLIC SHARE =================

function ensureProjectShareSheet_(ss) {
  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('PROJECT_SHARE');
  if (!sheet) sheet = ss.insertSheet('PROJECT_SHARE');
  initializeSheetIfEmpty(sheet, 'PROJECT_SHARE');
  return sheet;
}

function generateShareToken_() {
  return 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function findShareRowByProjectId_(ss, projectId) {
  ensureProjectShareSheet_(ss);
  var pid = String(projectId || '').trim();
  var rows = getSheetDataAsObjects(ss, 'PROJECT_SHARE');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].PROJECT_ID || '') === pid) return rows[i];
  }
  return null;
}

function findShareRowByToken_(ss, token) {
  ensureProjectShareSheet_(ss);
  var tok = String(token || '').trim();
  if (!tok) return null;
  var rows = getSheetDataAsObjects(ss, 'PROJECT_SHARE');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].SHARE_TOKEN || '') === tok) return rows[i];
  }
  return null;
}

function resolveProjectIdFlexible_(ss, projectIdOrName) {
  var key = String(projectIdOrName || '').trim();
  if (!key) return '';
  var projects = getSheetDataAsObjects(ss, 'PROJECT_MASTER');
  for (var i = 0; i < projects.length; i++) {
    var p = projects[i];
    if (String(p.PROJECT_ID || p.id || '') === key) return String(p.PROJECT_ID || p.id);
    var name = String(p.TÊN_DỰ_ÁN || p.name || '');
    if (name && name.toUpperCase() === key.toUpperCase()) return String(p.PROJECT_ID || p.id || '');
  }
  return key;
}

function getProjectShareStatus_(ss, projectIdOrName) {
  var projectId = resolveProjectIdFlexible_(ss, projectIdOrName);
  var row = findShareRowByProjectId_(ss, projectId);
  return {
    projectId: projectId,
    enabled: row ? String(row.ENABLED || '').toUpperCase() === 'TRUE' : false,
    token: row ? String(row.SHARE_TOKEN || '') : ''
  };
}

function setProjectShareEnabled_(ss, projectId, enabled, token) {
  ensureProjectShareSheet_(ss);
  var sheet = ss.getSheetByName('PROJECT_SHARE');
  var row = findShareRowByProjectId_(ss, projectId);
  var now = new Date().toISOString();
  if (!row) {
    appendRow(ss, 'PROJECT_SHARE', {
      PROJECT_ID: String(projectId),
      SHARE_TOKEN: token || generateShareToken_(),
      ENABLED: enabled ? 'TRUE' : 'FALSE',
      CREATED_AT: now,
      UPDATED_AT: now
    });
    return findShareRowByProjectId_(ss, projectId);
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var enabledCol = findColumnIndex(headers, ['ENABLED']);
  var tokenCol = findColumnIndex(headers, ['SHARE_TOKEN']);
  var updatedCol = findColumnIndex(headers, ['UPDATED_AT']);
  if (enabledCol !== -1 && row._rowIndex) {
    sheet.getRange(row._rowIndex, enabledCol + 1).setValue(enabled ? 'TRUE' : 'FALSE');
  }
  if (token && tokenCol !== -1 && row._rowIndex) {
    sheet.getRange(row._rowIndex, tokenCol + 1).setValue(token);
  }
  if (updatedCol !== -1 && row._rowIndex) {
    sheet.getRange(row._rowIndex, updatedCol + 1).setValue(now);
  }
  return findShareRowByProjectId_(ss, projectId);
}

function handleEnableProjectShare_(payload) {
  var shareCheck = requireProjectShareSession_(payload, null, payload.projectId || payload.id);
  if (shareCheck.error) {
    return createResponse({ status: 'error', message: shareCheck.error }, shareCheck.code || 403);
  }
  var ss = getSpreadsheet();
  var projectId = shareCheck.projectId;
  if (!getProjectById_(ss, projectId)) {
    return createResponse({ status: 'error', message: 'Không tìm thấy dự án' }, 404);
  }
  var existing = findShareRowByProjectId_(ss, projectId);
  var token = existing && existing.SHARE_TOKEN ? String(existing.SHARE_TOKEN) : generateShareToken_();
  setProjectShareEnabled_(ss, projectId, true, token);
  auditMutation_('enable-project-share', { projectId: projectId }, shareCheck.session);
  return createResponse({
    status: 'success',
    data: { projectId: projectId, token: token, enabled: true }
  });
}

function handleDisableProjectShare_(payload) {
  var shareCheck = requireProjectShareSession_(payload, null, payload.projectId || payload.id);
  if (shareCheck.error) {
    return createResponse({ status: 'error', message: shareCheck.error }, shareCheck.code || 403);
  }
  var ss = getSpreadsheet();
  var projectId = shareCheck.projectId;
  setProjectShareEnabled_(ss, projectId, false);
  auditMutation_('disable-project-share', { projectId: projectId }, shareCheck.session);
  return createResponse({
    status: 'success',
    data: { projectId: projectId, enabled: false }
  });
}

function getModuleProgressSnapshot_(ss, projectId) {
  var permits = getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(function(r) { return r.PROJECT_ID == projectId; });
  var permitsComp = permits.filter(function(p) {
    return p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && String(p.KẾT_QUẢ_CUỐI).trim() !== '';
  }).length;
  var permitProg = permits.length > 0 ? (permitsComp / permits.length) * 100 : 0;

  var designs = getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(function(r) { return r.PROJECT_ID == projectId; });
  var designsComp = designs.filter(function(d) {
    return d.KẾT_QUẢ_CUỐI && d.KẾT_QUẢ_CUỐI !== '-' && d.KẾT_QUẢ_CUỐI !== '---' && d.KẾT_QUẢ_CUỐI !== 'N/A' && String(d.KẾT_QUẢ_CUỐI).trim() !== '';
  }).length;
  var designProg = designs.length > 0 ? (designsComp / designs.length) * 100 : 0;

  var procurements = getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(function(r) { return r.PROJECT_ID == projectId; });
  var procurementsComp = procurements.filter(function(p) { return p.TÌNH_TRẠNG_VẬT_TƯ === 'Đã tới site'; }).length;
  var procurementProg = procurements.length > 0 ? (procurementsComp / procurements.length) * 100 : 0;

  var constructions = getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(function(r) { return r.PROJECT_ID == projectId; });
  var groupWeights = { 'A': 15, 'B': 40, 'C': 30, 'D': 15 };
  var groupTasks = { 'A': [], 'B': [], 'C': [], 'D': [] };
  var getGroupKeyFromRow = function(r) {
    var g = r.NHÓM_THI_CÔNG || '';
    if (g.indexOf('[A]') >= 0) return 'A';
    if (g.indexOf('[B]') >= 0) return 'B';
    if (g.indexOf('[C]') >= 0) return 'C';
    if (g.indexOf('[D]') >= 0) return 'D';
    var code = String(r.MÃ_CV || '').charAt(0);
    if (code === '1') return 'A';
    if (code === '2') return 'B';
    if (code === '3') return 'C';
    if (code === '4') return 'D';
    return null;
  };
  constructions.forEach(function(task) {
    var key = getGroupKeyFromRow(task);
    if (key) groupTasks[key].push(Number(task.TIẾN_ĐỘ_THỰC_TẾ || 0));
  });
  var constructionProg = 0;
  for (var k in groupWeights) {
    var tasks = groupTasks[k];
    var avg = tasks.length > 0 ? (tasks.reduce(function(s, v) { return s + v; }, 0) / tasks.length) : 0;
    constructionProg += avg * (groupWeights[k] / 100);
  }

  var handovers = getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(function(r) { return r.PROJECT_ID == projectId; });
  var handoversComp = handovers.filter(function(h) {
    return h.KẾT_QUẢ_CUỐI && h.KẾT_QUẢ_CUỐI !== '-' && h.KẾT_QUẢ_CUỐI !== 'N/A' && String(h.KẾT_QUẢ_CUỐI).trim() !== '';
  }).length;
  var handoverProg = handovers.length > 0 ? (handoversComp / handovers.length) * 100 : 0;

  return {
    permit: Math.round(permitProg * 100) / 100,
    design: Math.round(designProg * 100) / 100,
    procurement: Math.round(procurementProg * 100) / 100,
    construction: Math.round(constructionProg * 100) / 100,
    handover: Math.round(handoverProg * 100) / 100
  };
}

function sanitizeProjectForPublic_(project) {
  if (!project) return null;
  return {
    id: String(project.PROJECT_ID || project.id || ''),
    name: String(project.TÊN_DỰ_ÁN || project.name || '-'),
    client: String(project.KHÁCH_HÀNG || project.client || '-'),
    capacity: Number(project.CÔNG_SUẤT_KWP || project.capacity || 0),
    cod: String(project.KẾ_HOẠCH_COD || project.cod || '-'),
    kickoffDate: String(project.KICKOFF_DATE || project.kickoffDate || '-'),
    planProgress: Number(project.TIẾN_ĐỘ_KẾ_HOẠCH || project.planProgress || 0),
    actualProgress: Number(project.TIẾN_ĐỘ_THỰC_TẾ || project.actualProgress || 0),
    delay: Number(project.DELAY || project.delay || 0),
    status: String(project.TRẠNG_THÁI || project.status || '-')
  };
}

function getPublicShareData_(ss, token) {
  var shareRow = findShareRowByToken_(ss, token);
  if (!shareRow || String(shareRow.ENABLED || '').toUpperCase() !== 'TRUE') return null;
  var projectId = String(shareRow.PROJECT_ID || '');
  var project = getProjectById_(ss, projectId);
  if (!project) return null;

  recalculateProjectProgress(ss, projectId);
  project = getProjectById_(ss, projectId);

  var moduleProgress = getModuleProgressSnapshot_(ss, projectId);
  var actualFromModules = Math.round(
    (moduleProgress.permit * 0.10) +
    (moduleProgress.design * 0.15) +
    (moduleProgress.procurement * 0.25) +
    (moduleProgress.construction * 0.40) +
    (moduleProgress.handover * 0.10)
  );
  var sanitized = sanitizeProjectForPublic_(project);
  if (actualFromModules > 0) sanitized.actualProgress = actualFromModules;

  var siteLogs = getSheetDataAsObjects(ss, 'DAILY_SITE_LOG').filter(function(row) {
    return String(row.PROJECT_ID || row.projectId) === String(projectId);
  });
  var filterByProject = function(row) {
    return String(row.PROJECT_ID || row.projectId) === String(projectId);
  };

  return {
    project: sanitized,
    milestones: getSheetDataAsObjects(ss, 'PROJECT_MILESTONE').filter(filterByProject),
    scurve: getSheetDataAsObjects(ss, 'PROJECT_S_CURVE').filter(filterByProject),
    moduleProgress: moduleProgress,
    siteLogs: siteLogs,
    weeklyLogs: getWeeklyAggregates(ss, projectId, siteLogs),
    monthlyLogs: getMonthlyAggregates(ss, projectId, siteLogs),
    risks: getSheetDataAsObjects(ss, 'PROJECT_RISK').filter(filterByProject),
    permits: getSheetDataAsObjects(ss, 'PROJECT_PERMIT').filter(filterByProject),
    designs: getSheetDataAsObjects(ss, 'PROJECT_DESIGN').filter(filterByProject),
    procurements: getSheetDataAsObjects(ss, 'PROJECT_PROCUREMENT').filter(filterByProject),
    constructions: getSheetDataAsObjects(ss, 'PROJECT_CONSTRUCTION').filter(filterByProject),
    handovers: getSheetDataAsObjects(ss, 'PROJECT_HANDOVER').filter(filterByProject)
  };
}

// ================= AUDIT LOG =================

var AUDIT_LOG_MAX_ROWS_ = 3000;

function ensureAuditLogSheet_(ss) {
  ss = ss || getSpreadsheet();
  var sheet = ss.getSheetByName('AUDIT_LOG');
  if (!sheet) {
    sheet = ss.insertSheet('AUDIT_LOG');
  }
  initializeSheetIfEmpty(sheet, 'AUDIT_LOG');
  return sheet;
}

function getActorFromPayload_(payload) {
  var token = getAuthTokenFromRequest_(payload, null);
  var session = getAuthSession_(token);
  if (session) return session;
  return {
    userId: '',
    username: 'unknown',
    displayName: 'Không xác định',
    role: ''
  };
}

function auditMutation_(action, payload, actorOverride) {
  var actor = actorOverride || getActorFromPayload_(payload);
  writeAuditLog_(actor, action, payload || {});
}

function getResourceTypeForAction_(action) {
  var a = String(action || '').toLowerCase();
  if (a.indexOf('user') >= 0 || a === 'login' || a === 'logout') return 'USER';
  if (a.indexOf('task') >= 0) return 'TASK';
  if (a.indexOf('project') >= 0) return 'PROJECT';
  if (a.indexOf('site') >= 0 || a.indexOf('upload') >= 0) return 'SITE';
  if (a.indexOf('risk') >= 0) return 'RISK';
  if (a.indexOf('permit') >= 0) return 'PERMIT';
  if (a.indexOf('design') >= 0) return 'DESIGN';
  if (a.indexOf('procurement') >= 0) return 'PROCUREMENT';
  if (a.indexOf('construction') >= 0) return 'CONSTRUCTION';
  if (a.indexOf('handover') >= 0) return 'HANDOVER';
  if (a.indexOf('module') >= 0) return 'MODULE';
  return 'DATA';
}

function buildAuditSummary_(action, payload) {
  payload = payload || {};
  var pid = String(payload.PROJECT_ID || payload.id || payload.projectId || '').trim();
  var name = String(payload.TÊN_DỰ_ÁN || payload.name || payload.TÁC_VỤ || payload._matchTask || '').trim();
  switch (action) {
    case 'login':
      return 'Đăng nhập — ' + (payload.username || '');
    case 'account-locked':
      return 'Khóa tài khoản — ' + (payload.username || '');
    case 'logout':
      return 'Đăng xuất';
    case 'add-user':
      return 'Tạo tài khoản: ' + (payload.username || '');
    case 'update-user':
      if (payload.unlock === true || payload.locked === false) {
        return 'Mở khóa tài khoản: ' + (payload.userId || payload.username || '');
      }
      if (payload.lock === true || payload.locked === true) {
        return 'Tạm khóa tài khoản: ' + (payload.userId || payload.username || '');
      }
      if (payload.active === false || String(payload.active).toUpperCase() === 'FALSE') {
        return 'Vô hiệu hóa tài khoản: ' + (payload.userId || payload.username || '');
      }
      return 'Cập nhật tài khoản: ' + (payload.userId || payload.username || '');
    case 'deactivate-user':
      return 'Vô hiệu hóa tài khoản: ' + (payload.userId || '');
    case 'delete-user':
      return 'Xóa tài khoản: ' + (payload.userId || payload.username || payload.displayName || '');
    case 'change-password':
      return 'Đổi mật khẩu tài khoản';
    case 'add-project':
      return 'Tạo dự án: ' + (payload.TÊN_DỰ_ÁN || payload.name || pid);
    case 'delete-project':
      return 'Xóa dự án: ' + pid;
    case 'update-project':
      return 'Cập nhật dự án: ' + (payload.TÊN_DỰ_ÁN || payload.name || pid);
    case 'add-task':
      return 'Tạo task: ' + (payload.TÁC_VỤ || name) + (pid ? ' (' + pid + ')' : '');
    case 'update-task':
      return 'Sửa task: ' + (payload.TÁC_VỤ || payload._matchTask || name) + (pid ? ' (' + pid + ')' : '');
    case 'delete-task':
      return 'Xóa task: ' + (payload.TÁC_VỤ || payload._matchTask || name) + (pid ? ' (' + pid + ')' : '');
    case 'update-site-log':
      return 'Cập nhật nhật ký hiện trường — dự án ' + pid;
    case 'upload-site-image':
      return 'Upload ảnh hiện trường — dự án ' + pid;
    case 'update-module-dates':
      return 'Cập nhật ngày module — dự án ' + pid;
    default:
      if (action && action.indexOf('update-') === 0) {
        return 'Cập nhật ' + action.replace('update-', '') + (pid ? ' — dự án ' + pid : '');
      }
      if (action && action.indexOf('add-') === 0) {
        return 'Thêm ' + action.replace('add-', '') + (pid ? ' — dự án ' + pid : '');
      }
      return String(action || 'unknown');
  }
}

function trimAuditDetails_(payload) {
  var copy = {};
  var p = payload || {};
  var skip = ['password', 'currentPassword', 'newPassword', 'passwordConfirm', 'PASSWORD_HASH', 'SALT', '_token', 'token', 'base64', 'chunk'];
  for (var key in p) {
    if (!p.hasOwnProperty(key)) continue;
    if (skip.indexOf(key) >= 0) continue;
    var val = p[key];
    if (val == null) continue;
    if (typeof val === 'string' && val.length > 300) {
      val = val.slice(0, 300) + '…';
    }
    try {
      copy[key] = val;
    } catch (e) {}
  }
  try {
    return JSON.stringify(copy).slice(0, 2000);
  } catch (e2) {
    return '';
  }
}

function writeAuditLog_(actor, action, payload) {
  try {
    var ss = getSpreadsheet();
    ensureAuditLogSheet_(ss);
    actor = actor || {};
    payload = payload || {};
    var pid = String(payload.PROJECT_ID || payload.id || payload.projectId || '').trim();
    appendRow(ss, 'AUDIT_LOG', {
      LOG_ID: 'L' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      TIMESTAMP: new Date().toISOString(),
      USER_ID: String(actor.userId || ''),
      USERNAME: String(actor.username || ''),
      DISPLAY_NAME: String(actor.displayName || actor.username || 'Không xác định'),
      ACTION: String(action || ''),
      RESOURCE_TYPE: getResourceTypeForAction_(action),
      PROJECT_ID: pid,
      SUMMARY: buildAuditSummary_(action, payload),
      DETAILS: trimAuditDetails_(payload)
    });
    trimAuditLogIfNeeded_(ss);
  } catch (err) {
    Logger.log('Audit log error: ' + err);
  }
}

function trimAuditLogIfNeeded_(ss) {
  var sheet = ss.getSheetByName('AUDIT_LOG');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= AUDIT_LOG_MAX_ROWS_ + 1) return;
  sheet.deleteRows(2, lastRow - AUDIT_LOG_MAX_ROWS_ - 1);
}

function sanitizeAuditLogForClient_(row) {
  return {
    logId: String(row.LOG_ID || ''),
    timestamp: String(row.TIMESTAMP || ''),
    userId: String(row.USER_ID || ''),
    username: String(row.USERNAME || ''),
    displayName: String(row.DISPLAY_NAME || ''),
    action: String(row.ACTION || ''),
    resourceType: String(row.RESOURCE_TYPE || ''),
    projectId: String(row.PROJECT_ID || ''),
    summary: String(row.SUMMARY || ''),
    details: String(row.DETAILS || '')
  };
}

function listAuditLogs_(ss, limit, offset, userIdFilter, actionFilter) {
  ensureAuditLogSheet_(ss);
  var rows = getSheetDataAsObjects(ss, 'AUDIT_LOG');
  rows.sort(function(a, b) {
    return String(b.TIMESTAMP || '').localeCompare(String(a.TIMESTAMP || ''));
  });

  if (userIdFilter) {
    var uid = String(userIdFilter).trim();
    rows = rows.filter(function(r) {
      return String(r.USER_ID || '') === uid || String(r.USERNAME || '') === uid;
    });
  }
  if (actionFilter) {
    var act = String(actionFilter).trim().toLowerCase();
    rows = rows.filter(function(r) {
      return String(r.ACTION || '').toLowerCase().indexOf(act) >= 0;
    });
  }

  var total = rows.length;
  limit = Math.min(Math.max(limit || 150, 1), 500);
  offset = Math.max(offset || 0, 0);
  var slice = rows.slice(offset, offset + limit).map(sanitizeAuditLogForClient_);

  return { logs: slice, total: total, limit: limit, offset: offset };
}
