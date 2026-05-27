import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Sun } from 'lucide-react';
import { api } from '../services/api';
import VuPhongLogo from '../components/VuPhongLogo';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useTheme } from '../hooks/useTheme';
import { I18nProvider, useI18n } from '../context/I18nContext';
import ProjectSectionNav from '../components/project-details/ProjectSectionNav';
import KPIOverview from '../components/project-details/KPIOverview';
import MilestoneTimeline from '../components/project-details/MilestoneTimeline';
import SCurveChart from '../components/project-details/SCurveChart';
import SiteLogPanel from '../components/project-details/SiteLogPanel';
import WeeklyKPI from '../components/project-details/WeeklyKPI';
import PermitModule from '../components/project-details/modules/PermitModule';
import DesignModule from '../components/project-details/modules/DesignModule';
import ProcurementModule from '../components/project-details/modules/ProcurementModule';
import ConstructionModule from '../components/project-details/modules/ConstructionModule';
import HandoverModule from '../components/project-details/modules/HandoverModule';
import { ProjectEditProvider } from '../context/ProjectEditContext';
import {
  parseFlexibleDate as parseDateStr,
  formatDateStr,
  getMondayOfDate,
  getTodayDMY,
} from '../utils/timelineDates';

const pickLogSelections = (dailyRes = [], weeklyRes = [], monthlyRes = []) => {
  let selectedDate = getTodayDMY();
  if (dailyRes.length > 0) {
    const sorted = [...dailyRes].sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
    const latest = sorted[sorted.length - 1];
    selectedDate = latest ? (latest.LOG_DATE || latest.NGÀY) : getTodayDMY();
  }

  let selectedWeek = formatDateStr(getMondayOfDate(new Date()));
  if (weeklyRes.length > 0) {
    const latestWeekly = weeklyRes[weeklyRes.length - 1];
    if (latestWeekly?.LOG_DATE) selectedWeek = latestWeekly.LOG_DATE;
  }

  let selectedMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  if (monthlyRes.length > 0) {
    const latestMonthly = monthlyRes[monthlyRes.length - 1];
    const parts = latestMonthly?.LOG_DATE?.split('/');
    if (parts?.length === 3) selectedMonth = `${parts[1]}/${parts[2]}`;
  }

  return { selectedDate, selectedWeek, selectedMonth };
};

export default function ShareProjectPage() {
  return (
    <I18nProvider>
      <ShareProjectPageContent />
    </I18nProvider>
  );
}

function ShareProjectPageContent() {
  const { token } = useParams();
  useTheme();
  const { t, ts, tf } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [selectedView, setSelectedView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getTodayDMY());
  const [selectedWeek, setSelectedWeek] = useState(formatDateStr(getMondayOfDate(new Date())));
  const [selectedMonth, setSelectedMonth] = useState(`${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.getPublicShare(token);
        if (!cancelled) {
          setData(res);
          setError('');
          const daily = res?.siteLogs || [];
          const weekly = res?.weeklyLogs || [];
          const monthly = res?.monthlyLogs || [];
          setLogs(daily);
          setWeeklyLogs(weekly);
          setMonthlyLogs(monthly);
          const sel = pickLogSelections(daily, weekly, monthly);
          setSelectedDate(sel.selectedDate);
          setSelectedWeek(sel.selectedWeek);
          setSelectedMonth(sel.selectedMonth);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e.message || t('share.loadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const project = useMemo(() => {
    if (!data?.project) return null;
    const p = data.project;
    return {
      ...p,
      cod: p.cod || '-',
      delay: Number(p.delay ?? (Number(p.actualProgress) - Number(p.planProgress))),
    };
  }, [data]);

  const projectId = project?.id || project?.PROJECT_ID;

  const activeLog = useMemo(() => {
    if (!projectId) return null;
    if (selectedView === 'day') {
      return logs.find(l => (l.LOG_DATE === selectedDate || l.NGÀY === selectedDate)) || {
        PROJECT_ID: projectId,
        LOG_DATE: selectedDate,
        MANPOWER: 0,
        ENGINEERS: 0,
        WEATHER: '',
        INCIDENT_COUNT: 0,
        DAILY_NOTE: '',
        WEEKLY_ASSESSMENT: '',
        STATUS: 'Saved',
      };
    }
    if (selectedView === 'week') {
      return weeklyLogs.find(w => w.LOG_DATE === selectedWeek) || {
        PROJECT_ID: projectId,
        LOG_DATE: selectedWeek,
        avgManpower: 0,
        avgEngineers: 0,
        weatherSummary: ts('Chưa ghi nhận'),
        incidentCount: 0,
        loggedDaysCount: 0,
        weeklyAssessment: '',
      };
    }
    return monthlyLogs.find(m => {
      const parts = m.LOG_DATE ? m.LOG_DATE.split('/') : [];
      return parts.length === 3 && `${parts[1]}/${parts[2]}` === selectedMonth;
    }) || {
      PROJECT_ID: projectId,
      LOG_DATE: `01/${selectedMonth}`,
      monthLabel: tf('share.monthLabel', { month: selectedMonth }),
      avgManpower: 0,
      avgEngineers: 0,
      weatherSummary: ts('Chưa ghi nhận'),
      incidentCount: 0,
      loggedDaysCount: 0,
      monthlyReport: '',
    };
  }, [projectId, selectedView, selectedDate, selectedWeek, selectedMonth, logs, weeklyLogs, monthlyLogs, ts, tf]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5252ff]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] px-6 text-center gap-3">
        <Sun className="w-10 h-10 text-[#5252ff]/50" />
        <p className="text-sm font-semibold text-[var(--text-strong)]">{t('share.linkUnavailable')}</p>
        <p className="text-xs max-w-sm">{error || t('share.linkExpired')}</p>
      </div>
    );
  }

  return (
    <ProjectEditProvider canEdit={false}>
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
        <header className="border-b border-[var(--border-main)] bg-[var(--bg-panel)] px-6 py-4 flex items-center justify-between gap-4">
          <div className="h-11 flex items-center">
            <VuPhongLogo collapsed={false} className="max-w-[200px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hidden md:inline">
              {t('share.viewMode')}
            </span>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-6 shadow-lg">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('share.solarProject')}</p>
            <h1 className="text-2xl font-black text-[var(--text-strong)] tracking-tight">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--text-muted)]">
              <span>{t('share.client')}: <strong className="text-[var(--text-strong)]">{project.client}</strong></span>
              <span>{t('share.capacity')}: <strong className="text-[var(--text-strong)]">{Number(project.capacity || 0).toLocaleString()} kWp</strong></span>
              <span>{t('share.progress')}: <strong className="text-emerald-500">{project.actualProgress || 0}%</strong></span>
            </div>
          </div>

          <ProjectSectionNav />

          <section id="section-kpi" className="scroll-mt-20">
            <KPIOverview project={project} milestones={data.milestones || []} />
          </section>

          <section id="section-timeline" className="scroll-mt-20">
            <MilestoneTimeline
              project={project}
              moduleProgress={data.moduleProgress || {}}
              milestonesData={data.milestones || []}
            />
          </section>

          <section id="section-site-log" className="scroll-mt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={selectedView === 'day' ? 'lg:col-span-3' : 'lg:col-span-2'}>
                <SiteLogPanel
                  project={project}
                  logs={logs}
                  weeklyLogs={weeklyLogs}
                  monthlyLogs={monthlyLogs}
                  selectedView={selectedView}
                  setSelectedView={setSelectedView}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedWeek={selectedWeek}
                  setSelectedWeek={setSelectedWeek}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  activeLog={activeLog}
                  onUpdateLog={() => {}}
                  saveStatus="Saved"
                />
              </div>
              {selectedView !== 'day' && (
                <div className="lg:col-span-1">
                  <WeeklyKPI
                    project={project}
                    logs={logs}
                    weeklyLogs={weeklyLogs}
                    monthlyLogs={monthlyLogs}
                    selectedView={selectedView}
                    selectedDate={selectedDate}
                    selectedWeek={selectedWeek}
                    selectedMonth={selectedMonth}
                    activeLog={activeLog}
                    onUpdateLog={() => {}}
                    saveStatus="Saved"
                  />
                </div>
              )}
            </div>
          </section>

          <section id="section-scurve" className="scroll-mt-20">
            <SCurveChart
              project={project}
              milestonesData={data.milestones || []}
              initialData={data.scurve || []}
              moduleBundles={{
                permits: data.permits,
                designs: data.designs,
                procurements: data.procurements,
                constructions: data.constructions,
                handovers: data.handovers,
              }}
            />
          </section>

          <section id="section-modules" className="scroll-mt-20 space-y-4 pt-4">
            <div id="module-permit" className="scroll-mt-20">
              <PermitModule project={project} initialData={data.permits} />
            </div>
            <div id="module-design" className="scroll-mt-20">
              <DesignModule project={project} initialData={data.designs} />
            </div>
            <div id="module-procurement" className="scroll-mt-20">
              <ProcurementModule project={project} initialData={data.procurements} />
            </div>
            <div id="module-construction" className="scroll-mt-20">
              <ConstructionModule project={project} initialData={data.constructions} />
            </div>
            <div id="module-handover" className="scroll-mt-20">
              <HandoverModule project={project} initialData={data.handovers} />
            </div>
          </section>
        </main>

        <footer className="py-6 text-center text-[10px] text-[var(--text-muted)]">
          {t('share.footer')}
        </footer>
      </div>
    </ProjectEditProvider>
  );
}
