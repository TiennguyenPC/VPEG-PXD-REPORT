import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { buildSystemInstruction, getLocalDataAnswer, getOfflineAppHint } from '../data/aiKnowledge';
import { sendGeminiChat, hasGeminiApiKey } from '../services/geminiChat';
import { api } from '../services/api';
import { getPageLabel, updateDashboardContext, resolveProjectFromPath } from '../utils/dashboardContext';
import AIMessageContent from './AIMessageContent';

const WELCOME =
  'Xin chào! Tôi là **AI PXD** — trợ lý trên Dashboard VPEG-PXD.\n\n' +
  'Tôi có thể:\n' +
  '- **Hướng dẫn sử dụng** từng màn hình (thêm dự án, công việc, nhật ký site, S-Curve…)\n' +
  '- **Đọc số liệu** dự án/công việc bạn đang xem\n' +
  '- **Tư vấn kỹ thuật** Solar EPC\n\n' +
  'Thử hỏi: *"Làm sao thêm dự án?"* hoặc *"Trang này dùng để làm gì?"*';

const QUICK_PROMPTS = [
  'Hướng dẫn trang tôi đang xem',
  'Làm sao thêm dự án?',
  'Làm sao thêm công việc?',
  'Giải thích S-Curve và milestone',
];

function readLocalJson(key, fallback = []) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildFallbackTables(data = {}) {
  const projects = Array.isArray(data.projects) && data.projects.length > 0
    ? data.projects
    : readLocalJson('epc_projects_cache', []);
  const tasks = Array.isArray(data.tasks) && data.tasks.length > 0
    ? data.tasks
    : readLocalJson('epc_tasks_cache', []);
  const employees = readLocalJson('epc_employees_cache', []);

  return {
    PROJECT_MASTER: projects,
    PROJECT_TASKS: tasks,
    EMPLOYEE: employees,
    PROJECT_RISK: data.risks || [],
    PROJECT_PERMIT: data.permits || [],
    PROJECT_DESIGN: data.designs || [],
    PROJECT_PROCUREMENT: data.procurements || [],
    PROJECT_CONSTRUCTION: data.constructions || [],
    DAILY_SITE_LOG: data.siteLogs || [],
    PROJECT_MILESTONE: data.milestones || [],
  };
}

export default function AIAssistant() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: WELCOME }]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const buildContext = useCallback(() => {
    const data = typeof window !== 'undefined' ? window.__DASHBOARD_DATA__ || {} : {};
    const fallbackTables = buildFallbackTables(data);
    const projects = data.projects || fallbackTables.PROJECT_MASTER;
    const pathResolved = resolveProjectFromPath(location.pathname, projects);
    const projectId = data.projectId || pathResolved.projectId;
    const currentProject = data.currentProject || pathResolved.project;

    return {
      currentPath: location.pathname,
      currentPage: getPageLabel(location.pathname),
      currentDateTime: new Date().toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      projects,
      tasks: data.tasks || fallbackTables.PROJECT_TASKS,
      currentProject,
      projectId,
      milestones: data.milestones,
      risks: data.risks,
      procurements: data.procurements,
      constructions: data.constructions,
      siteLogs: data.siteLogs,
      permits: data.permits,
      designs: data.designs,
      tables: data.tables || fallbackTables,
    };
  }, [location.pathname]);

  const buildContextWithTables = useCallback(async () => {
    const context = buildContext();
    try {
      const tables = await api.getAIContext();
      const mergedTables = { ...(context.tables || {}), ...(tables || {}) };
      updateDashboardContext({ tables: mergedTables });
      return { ...context, tables: mergedTables };
    } catch (error) {
      console.warn('Không tải được dữ liệu bảng đầy đủ cho AI:', error);
      return context;
    }
  }, [buildContext]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (textOverride) => {
    const userMsg = (textOverride ?? inputValue).trim();
    if (!userMsg || isTyping) return;

    const snapshot = [...messages, { role: 'user', content: userMsg }];
    setMessages(snapshot);
    setInputValue('');

    const context = await buildContextWithTables();
    const localAnswer = getLocalDataAnswer(userMsg, context, snapshot);
    if (localAnswer) {
      setMessages([...snapshot, { role: 'ai', content: localAnswer }]);
      return;
    }

    if (!hasGeminiApiKey()) {
      const hint = getOfflineAppHint(userMsg);
      const fallback =
        hint ||
        '⚠️ Chưa cấu hình Groq API. Tạo file `.env` với `VITE_GROQ_API_KEY=...` rồi khởi động lại `npm run dev`.';
      setMessages([...snapshot, { role: 'ai', content: fallback }]);
      return;
    }

    setIsTyping(true);
    try {
      const systemInstruction = buildSystemInstruction(context);
      const aiText = await sendGeminiChat({
        messages: snapshot,
        systemInstruction,
      });
      setMessages([...snapshot, { role: 'ai', content: aiText }]);
    } catch (err) {
      console.error(err);
      const hint = getOfflineAppHint(userMsg);
      const errMsg = hint
        ? `${hint}\n\n_(API tạm lỗi: ${err.message}. Thử lại sau.)_`
        : `❌ ${err.message}. Kiểm tra API key hoặc kết nối mạng.`;
      setMessages([...snapshot, { role: 'ai', content: errMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-1 w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-50 print:hidden ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        title="Trợ lý AI PXD"
        type="button"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
      </button>

        <div
        className={`fixed bottom-6 right-6 w-80 md:w-[400px] bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-300 z-50 print:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          height: '580px',
          maxHeight: '85vh',
          transform: isOpen
            ? `translate(${position.x}px, ${position.y}px) scale(1)`
            : `translate(${position.x}px, ${position.y}px) scale(0.5)`,
          transformOrigin: 'bottom right',
        }}
      >
        <div
          className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between text-white shadow-md relative overflow-hidden cursor-move select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">AI PXD</h3>
              <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Hướng dẫn app · Solar EPC
              </p>
            </div>
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10 cursor-pointer"
            title="Ẩn xuống"
          >
            <div className="w-4 h-0.5 bg-white rounded-full" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-main)]/40 min-h-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'}`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm text-sm'
                      : 'bg-[var(--bg-panel)] border border-[var(--border-main)] text-[var(--text-main)] rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-sm whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <AIMessageContent content={msg.content} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-main)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isTyping && messages.length <= 2 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-[var(--bg-panel)] border-t border-[var(--border-main)]">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] hover:border-indigo-400 hover:text-indigo-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 bg-[var(--bg-panel)] border-t border-[var(--border-main)] rounded-b-2xl shrink-0">
          <div className="flex items-end gap-2 bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-xl p-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi cách dùng app, số liệu dự án, kỹ thuật Solar..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none resize-none p-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
              rows={1}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0 mb-0.5 mr-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center mt-1.5 text-[9px] text-[var(--text-muted)]">
            {getPageLabel(location.pathname)}
          </p>
        </div>
      </div>
    </>
  );
}
