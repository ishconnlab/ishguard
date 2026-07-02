import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const faqData = [
  { keywords: ['what', 'ishguard', 'is'], answer: 'ISHGuard is an enterprise AI cybersecurity platform with AI-powered, offline-first threat detection for Windows, Android, and Web.' },
  { keywords: ['free', 'cost', 'price', 'pricing'], answer: 'ISHGuard is completely free. No subscriptions, no premium tiers, no hidden costs.' },
  { keywords: ['privacy', 'data', 'collect', 'track'], answer: 'ISHGuard collects zero data. All processing is 100% offline. No telemetry, no analytics, no data transmission.' },
  { keywords: ['offline', 'internet', 'online', 'cloud'], answer: 'Yes, ISHGuard works completely offline. All AI analysis and threat detection runs locally on your device.' },
  { keywords: ['download', 'install', 'get', 'windows'], answer: 'Visit our Download page to get ISHGuard for Windows. Android app is also available.' },
  { keywords: ['virus', 'malware', 'threat', 'ransomware'], answer: 'ISHGuard detects malware, ransomware, cryptominers, rootkits, trojans, worms, shortcut viruses, and more.' },
  { keywords: ['scan', 'scanning', 'quick', 'full'], answer: 'ISHGuard supports Quick Scan, Full System Scan, Custom File/Folder Scan, USB Drive Scan, and Registry Scan.' },
  { keywords: ['update', 'updates', 'latest'], answer: 'ISHGuard checks for updates automatically. You can also download the latest version from our website.' },
  { keywords: ['android', 'mobile', 'phone'], answer: 'Yes, ISHGuard has an Android companion app with device health monitoring, permission auditing, and AI analysis.' },
  { keywords: ['open source', 'source code', 'github'], answer: 'Yes, ISHGuard is open source. The code is available on GitHub for review and contribution.' },
  { keywords: ['api', 'api server', 'localhost'], answer: 'ISHGuard runs a local REST API at http://localhost:9721. Endpoints include /api/status, /api/full, /api/vault/items.' },
  { keywords: ['hello', 'hi', 'hey'], answer: 'Hello! How can I help you with ISHGuard today?' },
  { keywords: ['help', 'support', 'contact'], answer: 'Visit ishconnect.rw for support. Check our Documentation page for guides and API reference.' },
];

function findAnswer(input) {
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of faqData) {
    const score = entry.keywords.filter(kw => words.some(w => w.includes(kw) || kw.includes(w))).length / entry.keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch && bestScore > 0.2 ? bestMatch.answer : 'I\'m not sure about that. Try asking about features, privacy, installation, or scans. Or visit our FAQ page for more information.';
}

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: '👋 Hi! I\'m the ISHGuard AI assistant. Ask me anything about our cybersecurity platform.' }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const answer = findAnswer(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 p-3.5 bg-brand hover:bg-brand-dark text-white rounded-full shadow-2xl shadow-brand/30 transition-all duration-200 hover:scale-110 focus-ring" aria-label="Open AI Chat">
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-dark-900/50">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-white">AI Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand/20' : 'bg-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-brand" /> : <Bot className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-brand text-white rounded-tr-sm' : 'bg-dark-900/50 border border-white/5 text-gray-300 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="bg-dark-900/50 border border-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/5 p-3">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about ISHGuard..." className="flex-1 bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand/30" />
              <button onClick={handleSend} disabled={!input.trim()} className="p-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50" aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
