'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PLACEHOLDER_REPLIES = [
  'Maaf, AI agent belum tersedia. Fitur ini akan segera hadir.',
  'Dalam pengembangan. Nantikan update berikutnya!',
  'Fitur chat AI sedang dalam tahap persiapan.',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Halo! Saya asisten AI Tagira. dummy for now.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Placeholder reply
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: PLACEHOLDER_REPLIES[Math.floor(Math.random() * PLACEHOLDER_REPLIES.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  };

  return (
    <DashboardLayout>
      <main className="px-4 py-6 h-[calc(100vh-48px)] flex flex-col">
        {/* Messages */}
        <Card className="flex-1 overflow-hidden mb-4">
          <CardContent className="p-4 h-full overflow-y-auto">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent-stamp text-white'
                        : 'bg-ink/5 text-ink border border-border-hairline'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-ink/40'}`}>
                      {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <div className="w-1/2 mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ketik pesan..."
            className="w-full px-4 py-2.5 pr-12 rounded-xl border border-border-hairline bg-bg-base text-ink text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent-stamp/30"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </main>
    </DashboardLayout>
  );
}
