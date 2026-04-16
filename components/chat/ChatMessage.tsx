'use client';

import { Bot } from 'lucide-react';
import { ToolCallCard } from './ToolCallCard';
import { DataChart } from './DataChart';
import type { ChatMessage as ChatMessageType } from '@/types';

interface Props {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  const execCall = message.toolCalls?.find((t) => t.name === 'execute_sql' || t.name === 'run_report');
  const execOutput = execCall?.output as {
    success?: boolean;
    rows?: Array<Record<string, string | null>>;
    fields?: Array<{ name: string }>;
  } | undefined;

  const chartCall = message.toolCalls?.find((t) => t.name === 'visualize');
  const chartSpec = chartCall?.output as { chartSpec?: Record<string, unknown> } | undefined;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* アバター */}
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`flex max-w-[80%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 本文 */}
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white shadow-sm'
              : 'rounded-tl-sm bg-white border border-gray-100 text-gray-800 shadow-sm'
          }`}>
            {message.content}
          </div>
        )}

        {/* ツール実行ログ */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-1.5 max-w-2xl">
            {message.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} toolCall={tc} />
            ))}
          </div>
        )}

        {/* グラフ */}
        {chartSpec?.chartSpec && execOutput?.rows && execOutput.rows.length > 0 && (
          <div className="w-full max-w-2xl">
            <DataChart
              chartSpec={chartSpec.chartSpec as unknown as Parameters<typeof DataChart>[0]['chartSpec']}
              data={execOutput.rows}
            />
          </div>
        )}
      </div>
    </div>
  );
}
