import { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Trash2, MessageSquareText
} from 'lucide-react';
import apiClient from '../services/apiClient';
import PwaPageHeader from '../components/PwaPageHeader';
import PwaTabMenu from '../components/PwaTabMenu';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý kỹ thuật canh tác cây sầu riêng và cà phê. Câu trả lời được trích dẫn từ tài liệu BVTV chính thức.\n\n📌 Một số câu mày có thể hỏi:\n• "Bệnh rỉ sắt cà phê chữa bằng thuốc gì?"\n• "Các loại sâu bệnh hại cây cà phê"\n• "Bệnh thán thư sầu riêng triệu chứng và cách trị"\n• "Lịch phun thuốc cho cà phê mùa mưa"\n• "Liều dùng Hexaconazole 5% cho rust"\n• "Phòng bệnh thối lá Phytophthora trên sầu riêng"\n\n💡 Tip: ghi rõ tên cây (cà phê / sầu riêng) trong câu hỏi để tôi tìm đúng tài liệu.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chat/ask', {
        question: userMessage.content,
      });

      // BE wrap response: { success, data: { answer, citations } }
      // Axios `response.data` chính là body, nên cần `.data.data.answer`.
      const payload = response.data?.data ?? response.data;
      const answer: string =
        payload?.answer ||
        'Xin lỗi, tôi không thể trả lời câu hỏi này.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      // Hiện message lỗi cụ thể từ BE (giúp debug rate-limit, API key, etc.)
      const apiError = err as { response?: { data?: { message?: string } } };
      const detail =
        apiError.response?.data?.message ||
        'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: detail,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý kỹ thuật canh tác cây sầu riêng và cà phê. Câu trả lời được trích dẫn từ tài liệu BVTV chính thức.\n\n📌 Một số câu mày có thể hỏi:\n• "Bệnh rỉ sắt cà phê chữa bằng thuốc gì?"\n• "Các loại sâu bệnh hại cây cà phê"\n• "Bệnh thán thư sầu riêng triệu chứng và cách trị"\n• "Lịch phun thuốc cho cà phê mùa mưa"\n• "Liều dùng Hexaconazole 5% cho rust"\n• "Phòng bệnh thối lá Phytophthora trên sầu riêng"\n\n💡 Tip: ghi rõ tên cây (cà phê / sầu riêng) trong câu hỏi để tôi tìm đúng tài liệu.',
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex flex-col pb-24">
      <PwaPageHeader
        title="Trợ lý canh tác"
        subtitle="Hỏi đáp kỹ thuật mùa vụ"
        icon={MessageSquareText}
        actions={
          <button
            onClick={clearChat}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 transition hover:bg-red-50 hover:text-red-500"
            title="Xóa cuộc trò chuyện"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Đang xử lý...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="bg-white border-t border-gray-200 p-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary-dark text-white p-3 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by RAG • Trợ lý kỹ thuật canh tác
          </p>
        </div>
      </div>
      <PwaTabMenu />
    </div>
  );
}
