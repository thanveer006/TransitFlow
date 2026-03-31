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
          isBot ? 'bg-[#b026ff]/20 border border-[#b026ff]/40' : 'bg-white/10 border border-white/20'
        }`}
      >
        {isBot
          ? <Bot className="w-3.5 h-3.5 text-[#b026ff]" />
          : <User className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      {/* Bubble */}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-white/5 border border-white/8 text-gray-200 rounded-tl-sm'
            : 'bg-[#b026ff]/20 border border-[#b026ff]/30 text-white rounded-tr-sm'
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
      <div className="flex flex-col h-full bg-[#050505]/95 backdrop-blur-2xl border-l border-white/8 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-[#b026ff]/15 border border-[#b026ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.2)]">
            <Bot className="w-4.5 h-4.5 text-[#b026ff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Mova AI</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
              Online
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => <Message key={`${msg.role}-${i}`} msg={msg} />)}
          {isTyping && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#b026ff]/20 border border-[#b026ff]/40 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#b026ff]" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
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
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#b026ff]/40 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-5 pt-2 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 focus-within:border-[#b026ff]/40 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about routes, traffic…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button onClick={handleVoice} className="text-gray-600 hover:text-[#b026ff] transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-xl bg-[#b026ff] flex items-center justify-center disabled:opacity-40 hover:shadow-[0_0_12px_rgba(176,38,255,0.5)] transition-all"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
