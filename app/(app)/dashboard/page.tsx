'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Send, Loader2, Menu, BarChart2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessageBubble } from '@/components/chat/ChatMessage';
import { Sidebar } from '@/components/chat/Sidebar';
import { useOnboardingStore } from '@/lib/store';
import {
  getChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  generateTitle,
} from '@/lib/firestore';
import type { ChatMessage, ChatSession, ToolCall } from '@/types';

const SUGGESTIONS = [
  '先月のランディングページ別セッション数トップ10を見せて',
  '直近30日のデイリーアクティブユーザー数の推移は？',
  'モバイルとデスクトップで直帰率はどう違う？',
  '流入元チャネル別のコンバージョン率を比較して',
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    selectedProjectId,
    selectedPropertyId,
    selectedDataset,
    selectedPropertyName,
    bqLinkStatus,
    schema,
    onboardingCompleted,
    reset,
  } = useOnboardingStore();

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
    else if (!onboardingCompleted) router.push('/onboarding');
  }, [authLoading, user, onboardingCompleted, router]);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    getChatSessions(user.uid)
      .then(setChatSessions)
      .catch(console.error);
  }, [user?.uid]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
  }, []);

  const handleSelectSession = useCallback(async (s: ChatSession) => {
    setMessages(s.messages);
    setCurrentSessionId(s.id);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteChatSession(sessionId);
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    if (!selectedProjectId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          projectId: selectedProjectId,
          dataset: selectedDataset,
          propertyId: selectedPropertyId ?? '',
          propertyName: selectedPropertyName ?? '',
          bqLinkStatus: bqLinkStatus ?? 'linked',
          schema: schema ?? null,
        }),
      });

      const data = await res.json() as {
        message: string;
        toolCalls: ToolCall[];
        chartSpec: Record<string, unknown> | null;
      };

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        toolCalls: data.toolCalls,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      // Firestore: create or update session
      if (!currentSessionId) {
        const title = generateTitle(text);
        const newId = await createChatSession({
          uid: user?.uid ?? 'unknown',
          email: user?.email ?? '',
          title,
          propertyName: selectedPropertyName ?? '',
          propertyId: selectedPropertyId ?? '',
          bqLinkStatus: bqLinkStatus ?? 'fallback_api',
          messages: finalMessages,
        });
        setCurrentSessionId(newId);
        setChatSessions((prev) => [{
          id: newId,
          title,
          propertyName: selectedPropertyName ?? '',
          propertyId: selectedPropertyId ?? '',
          bqLinkStatus: bqLinkStatus ?? 'fallback_api',
          messages: finalMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, ...prev]);
      } else {
        await updateChatSession(currentSessionId, finalMessages);
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: finalMessages, updatedAt: new Date().toISOString() }
              : s,
          ),
        );
      }
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `エラーが発生しました: ${String(e)}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [
    loading, messages, selectedProjectId, selectedDataset, selectedPropertyId,
    selectedPropertyName, bqLinkStatus, schema, user, currentSessionId,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={chatSessions}
        currentSessionId={currentSessionId}
        propertyName={selectedPropertyName}
        bqLinkStatus={bqLinkStatus}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onSettings={() => { reset(); router.push('/onboarding'); }}
        userEmail={user?.email}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 flex-shrink-0">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate">
              {selectedPropertyName ?? 'GA4 Analytics Agent'}
            </span>
            {bqLinkStatus === 'fallback_api' && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700 flex-shrink-0">
                Data API モード
              </span>
            )}
            {bqLinkStatus === 'linked' && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700 flex-shrink-0">
                BigQuery
              </span>
            )}
          </div>

          {/* New chat shortcut (desktop) */}
          <button
            onClick={handleNewChat}
            className="ml-auto hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            新しいチャット
          </button>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {messages.length === 0 ? (
              <div className="space-y-8 pt-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">何を分析しますか？</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    自然言語でGA4データに質問してください
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:shadow hover:text-gray-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            )}

            {/* First-time data discrepancy hint */}
            {messages.length >= 2 && messages.length <= 4 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  GA4管理画面の数値と異なる場合があります。{' '}
                  <a
                    href="/faq#data-discrepancy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2 hover:text-amber-900"
                  >
                    数値が合わないと感じたら →
                  </a>
                </span>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 pt-6 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">分析中...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="GA4データについて質問してください... (Enter で送信)"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }}
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 h-8 w-8 rounded-lg"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              BQクエリには料金が発生する場合があります（最大10GB/クエリ）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
