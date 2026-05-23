const GEMINI_MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

function toGeminiContents(messages, systemText) {
  const contents = [];
  if (systemText) {
    contents.push({
      role: 'user',
      parts: [{ text: `[Hệ thống — chỉ đọc, không trả lời riêng]\n${systemText}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Đã hiểu. Tôi là AI PXD, sẵn sàng hỗ trợ theo hướng dẫn và dữ liệu bạn cung cấp.' }],
    });
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'ai') {
      contents.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }
  return contents;
}

export async function sendGeminiChat({ messages, systemInstruction }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY. Thêm vào file .env ở thư mục gốc dự án.');
  }

  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const history = messages.filter((m) => m.role === 'user' || m.role === 'ai');
  const contents = toGeminiContents(history, systemInstruction);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 4096,
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Lỗi Gemini API');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Không nhận được phản hồi từ mô hình.');
  }
  return text;
}

export function hasGeminiApiKey() {
  return Boolean(getApiKey());
}
