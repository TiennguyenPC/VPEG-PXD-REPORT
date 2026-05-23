import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2 } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Xin chào, tôi là trợ lý toàn năng của PXD. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Hardcoded API Key to prevent employees from tampering
  const apiKey = 'AIzaSyBVvLtBMF7pfIeiLq3kbT9yw57Qh_Y0UKU';
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Lỗi cấu hình hệ thống: Không tìm thấy API Key.' }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    try {
      // Chuẩn bị dữ liệu ngữ cảnh (Context)
      const contextData = window.__DASHBOARD_DATA__ || {};
      let systemPrompt = "Bạn là AI PXD - Trợ lý ảo phân tích dự án EPC Solar xuất sắc. Dưới đây là dữ liệu hiện tại của hệ thống dưới dạng JSON (bao gồm danh sách dự án và công việc):\\n";
      systemPrompt += JSON.stringify(contextData) + "\\n";
      systemPrompt += "Ngoài ra, đây là hướng dẫn sử dụng giao diện phần mềm để bạn hướng dẫn người dùng khi được hỏi:\\n";
      systemPrompt += "- Để THÊM CÔNG VIỆC (TÁC VỤ): Hướng dẫn họ bấm vào nút '+ Thêm tác vụ' màu xanh ở góc trên bên phải màn hình Danh sách công việc.\\n";
      systemPrompt += "- Để THÊM DỰ ÁN: Hướng dẫn họ bấm vào nút '+ Thêm dự án' màu xanh ở góc trên bên phải màn hình Tổng quan.\\n";
      systemPrompt += "- Để XEM CHI TIẾT/CẬP NHẬT CÔNG VIỆC: Nhấn đúp (click) vào một dòng công việc trong bảng hoặc nhấn vào nút 3 chấm ở cuối dòng.\\n";
      systemPrompt += "- Để XEM BIỂU ĐỒ: Chọn tab 'Biểu đồ' hoặc 'Tiến độ S-Curve'.\\n";
      systemPrompt += "Nhiệm vụ của bạn: Hãy trả lời câu hỏi của người dùng thật ngắn gọn, chính xác, lịch sử dựa trên dữ liệu và hướng dẫn trên. Trả lời bằng tiếng Việt. Dùng Markdown để in đậm nếu cần.";

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: userMsg }] }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Lỗi API');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: `❌ Lỗi khi phân tích: ${err.message}. Có thể API Key không đúng hoặc lỗi mạng.` }]);
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
      {/* Nút bấm mở chat - print:hidden giúp ẩn khi in ấn */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-1 w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-50 print:hidden ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        title="Trợ lý ảo Gemini"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
      </button>

      {/* Cửa sổ Chat - print:hidden giúp ẩn khi in ấn */}
      <div 
        className={`fixed bottom-6 right-6 w-80 md:w-[380px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-300 transform origin-bottom-right z-50 print:hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
        style={{ height: '550px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">AI PXD</h3>
              <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Sẵn sàng hỗ trợ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 relative z-10">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>

              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%] flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm bg-indigo-100 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 rounded-bl-sm flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi AI về dự án của bạn..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none resize-none p-3 text-sm text-slate-700"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0 mb-0.5 mr-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Gemini AI Engine</span>
          </div>
        </div>
      </div>
    </>
  );
}
