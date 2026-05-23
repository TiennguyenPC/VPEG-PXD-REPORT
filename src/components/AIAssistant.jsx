import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { buildSystemInstruction, getOfflineAppHint } from '../data/aiKnowledge';
import { sendGeminiChat, hasGeminiApiKey } from '../services/geminiChat';
import { getPageLabel } from '../utils/dashboardContext';
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
    return {
      currentPath: location.pathname,
      currentPage: getPageLabel(location.pathname),
      projects: data.projects,
      tasks: data.tasks,
      currentProject: data.currentProject,
      projectId: data.projectId,
    };
  }, [location.pathname]);

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

    let snapshot;
    setMessages((prev) => {
      snapshot = [...prev, { role: 'user', content: userMsg }];
      return snapshot;
    });
    setInputValue('');

    if (!hasGeminiApiKey()) {
      const hint = getOfflineAppHint(userMsg);
      const fallback =
        hint ||
        '⚠️ Chưa cấu hình API Gemini. Tạo file `.env` với `VITE_GEMINI_API_KEY=...` rồi khởi động lại `npm run dev`.';
      setMessages([...snapshot, { role: 'ai', content: fallback }]);
      return;
    }

    setIsTyping(true);
    try {
      const systemInstruction = buildSystemInstruction(buildContext());
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
        className={`fixed bottom-6 right-6 w-80 md:w-[400px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-300 z-50 print:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 min-h-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm text-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center gap-1">
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
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-slate-50/80 border-t border-slate-100">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[10px] px-2 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi cách dùng app, số liệu dự án, kỹ thuật Solar..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none resize-none p-3 text-sm text-slate-700"
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
          <p className="text-center mt-1.5 text-[9px] text-slate-400">
            {getPageLabel(location.pathname)} · Gemini
          </p>
        </div>
      </div>
    </>
  );
}
