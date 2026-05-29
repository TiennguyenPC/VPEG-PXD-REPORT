import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Link2, Pencil } from 'lucide-react';
import DateInputDMY from '../DateInputDMY';
import {
  CONTRACT_TRACKING_GROUPS,
  calcContractDeadlines,
  deadlineStatus,
  enrichContractTrackingWithModuleDates,
  formatDeadlineLabel,
  isAutoContractTrackingField,
  parseContractTracking,
  serializeContractTracking,
} from '../../utils/contractTracking';
import ContractFlowDiagram from './ContractFlowDiagram';

export default function ContractTrackingPanel({ project, canEdit, onSave, moduleBundles }) {
  const projectId = project?.PROJECT_ID || project?.id;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('flow');
  const [datesVersion, setDatesVersion] = useState(0);
  const [draft, setDraft] = useState(() => parseContractTracking(project?.THEO_DÕI_HĐ || project?.contractTracking, project));
  const [constructionsLive, setConstructionsLive] = useState(() => moduleBundles?.constructions || []);

  useEffect(() => {
    setDraft(parseContractTracking(project?.THEO_DÕI_HĐ || project?.contractTracking, project));
  }, [project]);

  useEffect(() => {
    setConstructionsLive(moduleBundles?.constructions || []);
  }, [moduleBundles?.constructions]);

  useEffect(() => {
    if (!projectId) return undefined;
    const handler = (e) => {
      if (String(e.detail?.projectId) === String(projectId)) {
        setDatesVersion((v) => v + 1);
      }
    };
    window.addEventListener('module-dates-updated', handler);
    return () => window.removeEventListener('module-dates-updated', handler);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return undefined;
    const handler = (e) => {
      if (String(e.detail?.projectId) === String(projectId) && Array.isArray(e.detail?.data)) {
        setConstructionsLive(e.detail.data);
        setDatesVersion((v) => v + 1);
      }
    };
    window.addEventListener('construction-data-updated', handler);
    return () => window.removeEventListener('construction-data-updated', handler);
  }, [projectId]);

  const moduleContext = useMemo(() => ({
    projectId,
    procurements: moduleBundles?.procurements,
    handovers: moduleBundles?.handovers,
    constructions: constructionsLive,
  }), [projectId, moduleBundles?.procurements, moduleBundles?.handovers, constructionsLive]);

  const merged = useMemo(
    () => enrichContractTrackingWithModuleDates(draft, projectId, moduleContext),
    [draft, projectId, datesVersion, moduleContext]
  );

  const deadlines = useMemo(
    () => calcContractDeadlines(merged, moduleContext),
    [merged, moduleContext]
  );

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveField = async (key, value) => {
    if (!onSave || !value) return;
    const merged = serializeContractTracking({ ...draft, [key]: value });
    setDraft(merged);
    await onSave(merged);
    setView('flow');
  };

  if (!canEdit && !Object.values(merged).some(Boolean)) return null;

  const hasAnyDate = Object.values(merged).some(Boolean);

  return (
    <div className="mb-4 print:hidden">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span>Theo dõi HĐ</span>
          <span className="text-[9px] font-normal text-slate-500">SM+</span>
          {hasAnyDate && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
              title="Đã có dữ liệu"
            />
          )}
        </button>
        {open && canEdit && onSave && (
          <button
            type="button"
            onClick={() => setView((v) => (v === 'input' ? 'flow' : 'input'))}
            className={`p-1 rounded-md transition-colors ${
              view === 'input'
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--bg-hover)]'
            }`}
            title={view === 'input' ? 'Xem sơ đồ' : 'Nhập ngày'}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 border border-[var(--border-main)] rounded-lg p-3 bg-[#0f1628] space-y-4">
          {view === 'flow' && <ContractFlowDiagram data={merged} moduleContext={moduleContext} />}

          {view === 'input' && canEdit && onSave && (
            <>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Nội bộ SM/PM — không hiện trên link khách.
          </p>

          {CONTRACT_TRACKING_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#22304a] pb-1">
                {group.title}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      {field.label}
                    </label>
                    {field.hint && (
                      <p className="text-[9px] text-slate-600 mb-1">{field.hint}</p>
                    )}
                    {isAutoContractTrackingField(field) ? (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-2">
                        <p className="text-xs font-semibold tabular-nums text-white">
                          {merged[field.key] || '—'}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[9px] text-emerald-400/90">
                          <Link2 className="w-3 h-3 shrink-0" />
                          Tự động · {field.linkedLabel || field.label}
                        </p>
                      </div>
                    ) : canEdit && onSave ? (
                      <DateInputDMY
                        value={draft[field.key] || ''}
                        onChange={(val) => setField(field.key, val)}
                        onBlur={(_e, val) => {
                          const next = val || draft[field.key];
                          if (next) saveField(field.key, next);
                        }}
                        showCalendar
                        calendarTitle={field.label}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    ) : (
                      <p className="text-xs text-white py-1.5">{merged[field.key] || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {deadlines.length > 0 && (
            <div className="border-t border-[#22304a] pt-3 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Hạn kế hoạch theo HĐ (tham chiếu)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {deadlines.map((row) => {
                  const status = deadlineStatus(row.date, row.actual);
                  const statusClass =
                    status === 'ok'
                      ? 'text-emerald-400 border-emerald-500/30'
                      : status === 'late' || status === 'overdue'
                        ? 'text-red-400 border-red-500/30'
                        : 'text-slate-400 border-slate-600/30';
                  return (
                    <div
                      key={row.key}
                      className={`text-[10px] rounded-md border px-2 py-1.5 bg-[#141d30] ${statusClass}`}
                    >
                      <span className="font-semibold">{row.label}</span>
                      <span className="ml-2 tabular-nums">{formatDeadlineLabel(row.date)}</span>
                      {row.actual && (
                        <span className="ml-2 opacity-80">· TT: {row.actual}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </>
          )}

          {view === 'flow' && deadlines.length > 0 && (
            <div className="border-t border-[#22304a] pt-3 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Hạn kế hoạch theo HĐ (tham chiếu)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {deadlines.map((row) => {
                  const status = deadlineStatus(row.date, row.actual);
                  const statusClass =
                    status === 'ok'
                      ? 'text-emerald-400 border-emerald-500/30'
                      : status === 'late' || status === 'overdue'
                        ? 'text-red-400 border-red-500/30'
                        : 'text-slate-400 border-slate-600/30';
                  return (
                    <div
                      key={row.key}
                      className={`text-[10px] rounded-md border px-2 py-1.5 bg-[#141d30] ${statusClass}`}
                    >
                      <span className="font-semibold">{row.label}</span>
                      <span className="ml-2 tabular-nums">{formatDeadlineLabel(row.date)}</span>
                      {row.actual && (
                        <span className="ml-2 opacity-80">· TT: {row.actual}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
