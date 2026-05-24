const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';

function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

export async function sendGeminiChat({ messages, systemInstruction }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY. Thêm vào file .env rồi restart npm run dev.');
  }

  const groqMessages = [];

  if (systemInstruction) {
    groqMessages.push({ role: 'system', content: systemInstruction });
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      groqMessages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'ai') {
      groqMessages.push({ role: 'assistant', content: msg.content });
    }
  }

  const response = await fetch(GROQ_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.35,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();

  if (data.error) {
    const msg = data.error.message || 'Lỗi Groq API';
    if (response.status === 429) {
      throw new Error('⏳ API đang quá tải. Vui lòng thử lại sau 30 giây.');
    }
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Không nhận được phản hồi từ mô hình.');
  }
  return text;
}

export function hasGeminiApiKey() {
  return Boolean(getApiKey());
}
