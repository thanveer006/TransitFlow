import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/chatService';

const SUGGESTED_PROMPTS = [
  'Best way to avoid Edappally traffic?',
  'How to reach airport quickly?',
  'Metro vs auto — which is faster?',
  'Rain alert — what should I do?',
];

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isBot ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100 border border-gray-200'
        }`}
      >
        {isBot
          ? <Bot className="w-3.5 h-3.5 text-blue-600" />
          : <User className="w-3.5 h-3.5 text-gray-500" />}
      </div>
      {/* Bubble */}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'
            : 'bg-blue-100 border border-blue-200 text-blue-900 rounded-tr-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatDrawer({ isOpen, onClose, journeyContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Mova, your Kerala mobility assistant 🚇 Ask me anything about routes, traffic, or transport options!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    setInput('');
    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(updated, journeyContext);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Try again in a moment!' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // Voice input via Web Speech API
  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 z-20 w-[340px] pointer-events-auto flex flex-col animate-fade-up">
      <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
            <Bot className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Mova AI</p>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => <Message key={`${msg.role}-${i}`} msg={msg} />)}
          {isTyping && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all font-medium"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-5 pt-2 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about routes, traffic…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            <button onClick={handleVoice} className="text-gray-500 hover:text-blue-600 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-lg bg-[#1a73e8] flex items-center justify-center disabled:opacity-40 hover:bg-[#1557b0] transition-all"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
