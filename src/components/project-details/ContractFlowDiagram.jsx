import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowDown,
  List,
  Banknote,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import {
  buildContractFlowState,
  buildPaymentPhaseState,
  countFlowProgress,
  resolveFlowPosition,
  CONTRACT_FLOW_STEPS,
} from '../../utils/contractTracking';

const STATUS_STYLE = {
  done: {
    ring: 'border-emerald-500/60 bg-emerald-500/10',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-300',
    icon: CheckCircle2,
  },
  current: {
    ring: 'border-blue-500 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
    badge: 'bg-blue-500 text-white animate-pulse',
    text: 'text-blue-300',
    icon: Circle,
  },
  blocked: {
    ring: 'border-slate-600/50 bg-slate-800/40',
    badge: 'bg-slate-600 text-slate-300',
    text: 'text-slate-500',
    icon: Lock,
  },
  waiting: {
    ring: 'border-slate-600/40 bg-[#141d30]',
    badge: 'bg-slate-700 text-slate-400',
    text: 'text-slate-400',
    icon: Circle,
  },
};

function CurrentStepBanner({ position }) {
  if (!position) return null;

  const isComplete = position.kind === 'complete';
  const isCurrent = position.kind === 'current';

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isComplete
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
      }`}
    >
      <div className="flex items-start gap-2">
        <MapPin
          className={`mt-0.5 h-4 w-4 shrink-0 ${isComplete ? 'text-emerald-400' : 'text-blue-400'}`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-[12px] font-bold ${isComplete ? 'text-emerald-300' : 'text-blue-200'}`}
          >
            {position.headline}
          </p>
          {position.action && !isComplete && (
            <p className="mt-0.5 text-[10px] text-blue-300/90">{position.action}</p>
          )}
          {isCurrent && position.parallel?.length > 0 && (
            <p className="mt-1.5 text-[9px] text-blue-300/70">
              Song song:{' '}
              {position.parallel.map((s) => `B${s.step} ${s.label}`).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const PAYMENT_STATUS = {
  done: 'border-emerald-500/40 bg-emerald-500/5',
  ready: 'border-blue-500/40 bg-blue-500/10',
  blocked: 'border-slate-600/40 bg-[#141d30]',
};

function PaymentPhaseView({ paymentState }) {
  const { payments, cod } = paymentState;

  const renderGate = (gate, title) => {
    const statusLabel =
      gate.status === 'done' ? 'Đã xong' : gate.status === 'ready' ? 'Đủ điều kiện TT' : 'Chưa đủ';

    return (
      <div key={gate.key} className={`rounded-lg border p-3 ${PAYMENT_STATUS[gate.status]}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-slate-200">
            {title}
            {gate.flowStep ? (
              <span className="ml-1.5 text-[9px] font-normal text-slate-500">(B{gate.flowStep})</span>
            ) : null}
          </p>
          <span
            className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
              gate.status === 'done'
                ? 'bg-emerald-500/20 text-emerald-300'
                : gate.status === 'ready'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-700 text-slate-400'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Cần:</p>
        <ul className="space-y-1">
          {gate.checkpoints.map((cp) => (
            <li key={cp.key} className="flex items-center gap-2 text-[10px]">
              {cp.done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
              <span className={cp.done ? 'text-emerald-300/90' : 'text-slate-400'}>
                {cp.fullLabel}
                {cp.planDate && !cp.done && (
                  <span className="ml-1 tabular-nums text-slate-500">· KH {cp.planDate}</span>
                )}
                {cp.moduleNote && !cp.done && (
                  <span className="ml-1 text-amber-400/90">· {cp.moduleNote}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {gate.status === 'done' && gate.date && (
          <p className="mt-2 text-[10px] tabular-nums text-emerald-400">✓ {gate.date}</p>
        )}
        {gate.status === 'ready' && (
          <p className="mt-2 text-[9px] text-blue-300/90">→ Có thể xác nhận {gate.label}</p>
        )}
        {gate.status === 'blocked' && gate.missing.length > 0 && (
          <p className="mt-2 text-[9px] text-amber-400/90">Thiếu: {gate.missing.join(', ')}</p>
        )}
        {gate.planDate && gate.status !== 'done' && (
          <p className="mt-2 text-[9px] tabular-nums text-slate-500">KH COD: {gate.planDate}</p>
        )}
        {gate.unlocks && (
          <p className="mt-2 text-[9px] text-slate-500">Sau TT: {gate.unlocks}</p>
        )}
        {gate.note && (
          <p className="mt-1 text-[8px] italic text-slate-600">{gate.note}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {payments.map((p) => renderGate(p, `Đợt ${p.phase} · ${p.label}`))}
      {renderGate(cod, cod.label)}
    </div>
  );
}

function FlowListView({ steps, primaryStep }) {
  return (
    <div className="max-h-[360px] space-y-0 overflow-y-auto pr-1 custom-scrollbar">
      {steps.map((step, index) => {
        const style = STATUS_STYLE[step.status] || STATUS_STYLE.waiting;
        const Icon = style.icon;
        const isLast = index === steps.length - 1;
        const isPrimary = primaryStep === step.step && step.status === 'current';

        return (
          <div key={step.key} className="relative">
            <div
              className={`flex gap-3 rounded-lg border p-2.5 ${style.ring} ${
                isPrimary ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${style.badge}`}
              >
                {step.status === 'done' ? <Icon className="h-4 w-4" /> : `B${step.step}`}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`text-[11px] font-bold ${style.text}`}>{step.label}</span>
                  {step.date && (
                    <span className="text-[10px] tabular-nums text-emerald-400/90">✓ {step.date}</span>
                  )}
                  {step.status === 'current' && !step.date && (
                    <span className="text-[9px] font-bold uppercase text-blue-400">Đang làm</span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">{step.action}</p>
                {step.status === 'blocked' && step.blockedReason && (
                  <p className="mt-1 text-[9px] text-amber-500/90">{step.blockedReason}</p>
                )}
                {step.softWarning && step.status !== 'done' && (
                  <p className="mt-1 text-[9px] text-amber-400/80">{step.softWarning}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="flex justify-center py-0.5 text-slate-600">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ContractFlowDiagram({ data, moduleContext = null }) {
  const [view, setView] = useState('payment');
  const steps = useMemo(() => buildContractFlowState(data, moduleContext), [data, moduleContext]);
  const progress = useMemo(() => countFlowProgress(steps), [steps]);
  const position = useMemo(() => resolveFlowPosition(steps), [steps]);
  const paymentState = useMemo(
    () => buildPaymentPhaseState(data, steps, moduleContext),
    [data, steps, moduleContext]
  );
  const primaryStep = position?.primary?.step;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap rounded-md border border-[#22304a] p-0.5">
          <button
            type="button"
            onClick={() => setView('payment')}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
              view === 'payment' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Banknote className="h-3 w-3" /> TT đợt
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
              view === 'list' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <List className="h-3 w-3" /> B1–B14
          </button>
        </div>
        <p className="text-[10px] tabular-nums text-slate-500">
          {progress.done}/{CONTRACT_FLOW_STEPS.length} · {progress.percent}%
        </p>
      </div>

      <CurrentStepBanner position={position} />

      <div className="h-1.5 overflow-hidden rounded-full border border-[#22304a] bg-[#141d30]">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {view === 'payment' && <PaymentPhaseView paymentState={paymentState} />}
      {view === 'list' && <FlowListView steps={steps} primaryStep={primaryStep} />}
    </div>
  );
}
