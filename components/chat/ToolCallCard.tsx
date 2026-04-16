'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Zap, BarChart2, Lightbulb, Code2 } from 'lucide-react';
import { formatBytes, estimateCost, formatNumber } from '@/lib/utils';
import type { ToolCall } from '@/types';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  generate_sql: <Code2 className="h-4 w-4 text-gray-500" />,
  dry_run_sql: <Zap className="h-4 w-4 text-amber-500" />,
  execute_sql: <Database className="h-4 w-4 text-blue-500" />,
  visualize: <BarChart2 className="h-4 w-4 text-purple-500" />,
  generate_insight: <Lightbulb className="h-4 w-4 text-yellow-500" />,
};

const TOOL_LABELS: Record<string, string> = {
  generate_sql: 'SQL生成',
  dry_run_sql: 'Dry Run',
  execute_sql: 'SQL実行',
  visualize: 'グラフ化',
  generate_insight: '示唆生成',
};

interface Props {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: Props) {
  const [open, setOpen] = useState(false);

  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;
  const icon = TOOL_ICONS[toolCall.name] ?? <Database className="h-4 w-4 text-gray-500" />;

  const output = toolCall.output as Record<string, unknown>;
  const success = output.success !== false;
  const inputSql = typeof toolCall.input.sql === 'string' ? toolCall.input.sql : null;
  const outputError = typeof output.error === 'string' ? output.error : null;
  const totalBytes = typeof output.totalBytesProcessed === 'number' ? output.totalBytesProcessed : null;
  const exceedsLimit = output.exceedsLimit === true;
  const totalRows = typeof output.totalRows === 'number' ? output.totalRows : null;
  const outputRows = Array.isArray(output.rows) ? (output.rows as Array<Record<string, string | null>>) : null;
  const outputFields = Array.isArray(output.fields) ? (output.fields as Array<{ name: string }>) : [];

  return (
    <div className={`rounded-lg border text-xs ${success ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-700">{label}</span>
          {toolCall.name === 'dry_run_sql' && totalBytes !== null && (
            <span className="text-gray-400">
              {formatBytes(totalBytes)}
              {exceedsLimit && (
                <span className="ml-1 text-amber-600 font-semibold">⚠️ 10GB超</span>
              )}
            </span>
          )}
          {toolCall.name === 'execute_sql' && totalRows !== null && (
            <span className="text-gray-400">{formatNumber(totalRows)}行</span>
          )}
          {!success && <span className="text-red-500">失敗</span>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-3 py-2 space-y-2">
          {inputSql && (
            <div>
              <p className="text-gray-400 mb-1">SQL:</p>
              <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-gray-100 text-xs leading-relaxed whitespace-pre-wrap break-words">
                {inputSql}
              </pre>
            </div>
          )}
          {outputError && (
            <p className="text-red-500">{outputError}</p>
          )}
          {toolCall.name === 'execute_sql' && outputRows && outputRows.length > 0 && (
            <ResultTable fields={outputFields} rows={outputRows} />
          )}
        </div>
      )}
    </div>
  );
}

function ResultTable({
  fields,
  rows,
}: {
  fields: Array<{ name: string }>;
  rows: Array<Record<string, string | null>>;
}) {
  const display = rows.slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.name} className="border-b border-gray-200 px-2 py-1 text-left text-gray-500 font-semibold">
                {f.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              {fields.map((f) => (
                <td key={f.name} className="px-2 py-1 text-gray-700 font-mono">
                  {row[f.name] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <p className="mt-1 text-gray-400">他 {rows.length - 10} 行...</p>
      )}
    </div>
  );
}
