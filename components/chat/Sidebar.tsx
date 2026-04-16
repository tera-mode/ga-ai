'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import {
  Plus, Settings, LogOut, MessageSquare, Trash2, BarChart2, X, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  propertyName: string | null;
  bqLinkStatus: 'linked' | 'not_linked' | 'fallback_api' | null;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onSettings: () => void;
  userEmail: string | null | undefined;
}

function groupByDate(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const last7 = new Date(today.getTime() - 7 * 86400000);
  const last30 = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, ChatSession[]> = {
    今日: [],
    昨日: [],
    '過去7日間': [],
    '過去30日間': [],
    それ以前: [],
  };

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (d >= today) groups['今日'].push(s);
    else if (d >= yesterday) groups['昨日'].push(s);
    else if (d >= last7) groups['過去7日間'].push(s);
    else if (d >= last30) groups['過去30日間'].push(s);
    else groups['それ以前'].push(s);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function Sidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  propertyName,
  bqLinkStatus,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onSettings,
  userEmail,
}: Props) {
  const { signOut } = useAuth();
  const groups = groupByDate(sessions);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click (mobile)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        ref={overlayRef}
        className={cn(
          'fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-gray-900 transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Top: logo + close */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">GA4 Agent</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Desktop collapse button */}
          <button
            onClick={onClose}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新しいチャット
          </button>
        </div>

        {/* Property badge */}
        {propertyName && (
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full flex-shrink-0',
                bqLinkStatus === 'linked' ? 'bg-emerald-400' : 'bg-amber-400',
              )} />
              <span className="text-xs text-gray-300 truncate">{propertyName}</span>
            </div>
          </div>
        )}

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 text-gray-600 mb-3" />
              <p className="text-xs text-gray-500">チャット履歴がありません</p>
            </div>
          ) : (
            groups.map(({ label, items }) => (
              <div key={label}>
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {items.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      isActive={s.id === currentSessionId}
                      onSelect={() => { onSelectSession(s); onClose(); }}
                      onDelete={() => onDeleteSession(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom: settings + sign out */}
        <div className="flex-shrink-0 border-t border-white/10 p-2 space-y-0.5">
          <button
            onClick={onSettings}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span>設定</span>
          </button>
          {userEmail && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
              <span className="text-xs text-gray-500 truncate">{userEmail}</span>
              <button
                onClick={() => signOut()}
                className="ml-2 flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-lg transition-colors cursor-pointer',
        isActive ? 'bg-white/15' : 'hover:bg-white/10',
      )}
    >
      <button
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
      >
        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className={cn(
          'truncate text-sm',
          isActive ? 'text-white' : 'text-gray-300',
        )}>
          {session.title}
        </span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="mr-1 flex-shrink-0 rounded p-1 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
        title="削除"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
