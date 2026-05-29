import React, { useRef, useState } from 'react';
import { Download, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { api } from '../services/api';
import { buildTaskPayload } from '../utils/taskFields';
import {
  formatFileSize,
  formatUploadedAt,
  getAttachmentDownloadUrl,
  getAttachmentFileId,
  MAX_TASK_ATTACHMENT_BYTES,
  parseTaskAttachments,
  readFileAsBase64,
} from '../utils/taskAttachments';

export default function TaskAttachmentsPanel({
  task,
  originalTask,
  canUpload,
  onAttachmentsUpdated,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const attachments = parseTaskAttachments(task?.TỆP_ĐÍNH_KÈM);

  const syncFromResponse = (result) => {
    const nextAttachments = result?.attachments || result?.data?.attachments || [];
    const tasks = result?.tasks || result?.data?.tasks;
    onAttachmentsUpdated?.(nextAttachments, tasks);
  };

  const handlePickFile = () => {
    if (!canUpload || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUpload) return;

    if (file.size > MAX_TASK_ATTACHMENT_BYTES) {
      setUploadError('Tệp quá lớn (tối đa 20 MB)');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const matchTask = originalTask || task;
      const payload = {
        ...buildTaskPayload(task, matchTask),
        base64,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      };
      const result = await api.uploadTaskAttachment(payload);
      syncFromResponse(result);
    } catch (err) {
      setUploadError(err.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (attachment) => {
    const fileId = getAttachmentFileId(attachment);
    if (!fileId || !canUpload) return;
    if (!window.confirm(`Xóa tệp "${attachment.name || 'đính kèm'}"?`)) return;

    setUploadError('');
    setRemovingId(fileId);
    try {
      const matchTask = originalTask || task;
      const result = await api.removeTaskAttachment({
        ...buildTaskPayload(task, matchTask),
        fileId,
      });
      syncFromResponse(result);
    } catch (err) {
      setUploadError(err.message || 'Không xóa được tệp');
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Tải tệp lên — <strong>lưu ngay</strong>, không cần bấm &quot;Lưu thay đổi&quot;.
        </p>
        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handlePickFile}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Đang tải lên...' : 'Chọn tệp tải lên'}
            </button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {uploadError}
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Chưa có tệp đính kèm</p>
          {canUpload && (
            <p className="text-xs text-slate-400 mt-1">PDF, Excel, Word, ảnh, ZIP… tối đa 20 MB</p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
          {attachments.map((item) => {
            const fileId = getAttachmentFileId(item);
            const key = fileId || item.name;
            const downloadUrl = getAttachmentDownloadUrl(item);
            return (
              <li key={key} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50">
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name || 'Tệp đính kèm'}</p>
                  <p className="text-[11px] text-slate-500">
                    {[formatFileSize(item.size), formatUploadedAt(item.uploadedAt), item.uploadedBy]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải về
                </a>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={removingId === fileId}
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Xóa tệp"
                  >
                    {removingId === fileId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
