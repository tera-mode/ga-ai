import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, type FunctionDeclaration, type Content, type Part } from '@google/genai';
import type { PropertySchema } from '@/types';
import { formatBytes, estimateCost } from '@/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MAX_BQ_BYTES = 10 * 1024 * 1024 * 1024;
const MODEL = 'gemini-2.5-flash';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ===== BigQuery モード ツール =====
const BQ_TOOLS: FunctionDeclaration[] = [
  {
    name: 'generate_sql',
    description: 'ユーザーの質問からBigQuery用のSQLを生成する。GA4のBQ Exportスキーマに準拠。必ず WHERE _TABLE_SUFFIX で日付範囲を絞り、SELECT * は使用しない。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'ユーザーの質問' },
        sql: { type: 'string', description: '生成したBigQuery SQL' },
        explanation: { type: 'string', description: 'SQLの説明（日本語）' },
      },
      required: ['question', 'sql', 'explanation'],
    },
  },
  {
    name: 'dry_run_sql',
    description: 'SQLをDry Runして構文確認と推定スキャンバイト数を取得。execute_sqlの前に必ず呼ぶ。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'execute_sql',
    description: 'dry_run_sqlで確認済みのSQLを実行。推定スキャンが10GBを超える場合はユーザーに確認してから呼ぶ。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string' },
        max_bytes_billed: { type: 'number', description: 'バイト上限（デフォルト10GB）' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'visualize',
    description: 'クエリ結果をチャート化する指示を返す。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', description: 'bar / line / table / number' },
        x_field: { type: 'string' },
        y_field: { type: 'string' },
        title: { type: 'string' },
      },
      required: ['chart_type'],
    },
  },
  {
    name: 'generate_insight',
    description: 'クエリ結果から簡潔な示唆を3〜5文で生成する。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        insight: { type: 'string', description: '日本語の示唆テキスト（3〜5文）' },
      },
      required: ['question', 'insight'],
    },
  },
];

// ===== GA4 Data API モード ツール =====
const GA4_TOOLS: FunctionDeclaration[] = [
  {
    name: 'run_report',
    description: 'GA4 Data APIでレポートを取得する。BigQueryなしで直接GA4データを取得できる。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        dimensions: {
          type: 'array',
          description: 'ディメンション名の配列。例: ["date"], ["pagePath"], ["sessionSource","sessionMedium"]',
          items: { type: 'string' },
        },
        metrics: {
          type: 'array',
          description: 'メトリクス名の配列。例: ["sessions"], ["activeUsers","newUsers"]',
          items: { type: 'string' },
        },
        start_date: { type: 'string', description: '開始日。例: "7daysAgo", "30daysAgo", "yesterday"' },
        end_date: { type: 'string', description: '終了日。例: "today", "yesterday"' },
        limit: { type: 'number', description: '取得行数上限（デフォルト50）' },
        order_by_metric: { type: 'string', description: '降順ソートするメトリクス名（省略可）' },
      },
      required: ['dimensions', 'metrics', 'start_date', 'end_date'],
    },
  },
  {
    name: 'visualize',
    description: 'レポート結果をチャート化する指示を返す。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', description: 'bar / line / table / number' },
        x_field: { type: 'string' },
        y_field: { type: 'string' },
        title: { type: 'string' },
      },
      required: ['chart_type'],
    },
  },
  {
    name: 'generate_insight',
    description: 'レポート結果から簡潔な示唆を3〜5文で生成する。',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        insight: { type: 'string' },
      },
      required: ['question', 'insight'],
    },
  },
];

function buildBQSystemPrompt(projectId: string, dataset: string, propertyName: string, schema: PropertySchema | null): string {
  const today = new Date().toISOString().slice(0, 10);
  const customDimsJson = JSON.stringify(schema?.customDimensions ?? [], null, 2);
  const eventParamsJson = JSON.stringify(schema?.detectedEventParams ?? [], null, 2);
  return `あなたはGA4データ分析の専門家エージェントです。ユーザーの質問をBigQuery SQLに変換し、実行して結果を解釈します。

【重要】今日の日付: ${today}（この日付を基準に相対日付を計算すること）

【接続情報】
- プロジェクト: ${projectId} / データセット: ${dataset} / プロパティ: ${propertyName}
- テーブル: \`${projectId}.${dataset}.events_*\`

【GA4 BQスキーマ】
- テーブルは events_YYYYMMDD 形式。_TABLE_SUFFIXで日付絞り込み必須。
- event_params は REPEATED RECORD。UNNEST(event_params)で展開。
- セッション数: COUNT(DISTINCT CONCAT(user_pseudo_id, CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)))
- トラフィックソース: session_traffic_source_last_click.*
- ページ: event_params の 'page_location'/'page_path'

【コスト】execute_sqlの前に必ずdry_run_sql。SELECT *禁止。

カスタムディメンション: ${customDimsJson}
event_paramsキー: ${eventParamsJson}

SQLはdry_run→実行→visualize→insightの順で回答。簡潔に。`;
}

function buildGA4SystemPrompt(propertyName: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `あなたはGA4データ分析の専門家エージェントです。GA4 Data APIでユーザーの質問に答えます。

【重要】今日の日付: ${today}
この日付を基準に「直近1週間」「先月」などの相対日付を計算すること。
"today"や"Xdaysago"を積極的に使い、絶対日付も${today}を基準にすること。

対象プロパティ: ${propertyName}

主要ディメンション: date, pagePath, pageTitle, landingPage, sessionSource, sessionMedium, sessionCampaignName, deviceCategory, country, city, eventName, newVsReturning
主要メトリクス: sessions, activeUsers, newUsers, screenPageViews, bounceRate, averageSessionDuration, engagedSessions, engagementRate, conversions
日付指定: "7daysAgo"/"30daysAgo"/"yesterday"/"today" または "YYYY-MM-DD"

run_report→visualize→generate_insightの順で回答。簡潔に。`;
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session?.googleAccessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      projectId: string;
      dataset: string | null;
      propertyId: string;
      propertyName: string;
      bqLinkStatus: 'linked' | 'fallback_api' | 'not_linked';
      schema: PropertySchema | null;
    };

    const { messages, projectId, dataset, propertyId, propertyName, bqLinkStatus, schema } = body;
    const isFallback = bqLinkStatus === 'fallback_api';

    const systemInstruction = isFallback
      ? buildGA4SystemPrompt(propertyName)
      : buildBQSystemPrompt(projectId, dataset ?? '', propertyName, schema);

    const tools = isFallback ? GA4_TOOLS : BQ_TOOLS;

    // 会話履歴を新SDK形式に変換（最後のユーザーメッセージ以外）
    const history: Content[] = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];

    const chat = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: tools }],
        maxOutputTokens: 4096,
      },
      history,
    });

    const toolCallsLog: Array<{ name: string; input: Record<string, unknown>; output: Record<string, unknown> }> = [];
    let finalText = '';
    let chartSpec: Record<string, unknown> | null = null;

    // 初回送信（リトライ付き）
    let response = await sendWithRetry(() => chat.sendMessage({ message: lastMessage.content }));

    for (let iteration = 0; iteration < 10; iteration++) {
      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        finalText = response.text ?? '';
        break;
      }

      // ツール実行
      const funcResultParts: Part[] = [];

      for (const call of functionCalls) {
        const toolName = call.name ?? '';
        const toolInput = (call.args ?? {}) as Record<string, unknown>;
        let toolOutput: Record<string, unknown> = {};

        if (toolName === 'generate_sql') {
          toolOutput = { sql: toolInput.sql, explanation: toolInput.explanation };

        } else if (toolName === 'dry_run_sql') {
          const dryRes = await fetch(`${req.nextUrl.origin}/api/bq/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
            body: JSON.stringify({ sql: toolInput.sql, projectId, dryRun: true }),
          });
          const dryData = await dryRes.json() as { success: boolean; totalBytesProcessed?: number; exceedsLimit?: boolean; error?: string };
          if (dryData.success) {
            const bytes = dryData.totalBytesProcessed ?? 0;
            toolOutput = {
              success: true, totalBytesProcessed: bytes,
              formattedSize: formatBytes(bytes), estimatedCost: estimateCost(bytes),
              exceedsLimit: dryData.exceedsLimit ?? false,
              message: dryData.exceedsLimit
                ? `${formatBytes(bytes)} スキャン（推定${estimateCost(bytes)}）。10GB超のためユーザー確認が必要。`
                : `Dry Run成功。スキャン量: ${formatBytes(bytes)}（${estimateCost(bytes)}）`,
            };
          } else {
            toolOutput = { success: false, error: dryData.error };
          }

        } else if (toolName === 'execute_sql') {
          const maxBytes = (toolInput.max_bytes_billed as number | undefined) ?? MAX_BQ_BYTES;
          const execRes = await fetch(`${req.nextUrl.origin}/api/bq/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
            body: JSON.stringify({ sql: toolInput.sql, projectId, dryRun: false, maxBytesBilled: maxBytes }),
          });
          toolOutput = await execRes.json() as Record<string, unknown>;

        } else if (toolName === 'run_report') {
          const rawDims = toolInput.dimensions;
          const rawMets = toolInput.metrics;
          const dims = Array.isArray(rawDims) ? (rawDims as string[]).map((n) => ({ name: n })) : [];
          const mets = Array.isArray(rawMets) ? (rawMets as string[]).map((n) => ({ name: n })) : [];
          const reportRes = await fetch(`${req.nextUrl.origin}/api/ga/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
            body: JSON.stringify({
              propertyId,
              dimensions: dims,
              metrics: mets,
              dateRanges: [{ startDate: toolInput.start_date, endDate: toolInput.end_date }],
              orderBys: toolInput.order_by_metric
                ? [{ metric: { metricName: toolInput.order_by_metric }, desc: true }]
                : undefined,
              limit: toolInput.limit ?? 50,
            }),
          });
          toolOutput = await reportRes.json() as Record<string, unknown>;

        } else if (toolName === 'visualize') {
          chartSpec = {
            chartType: toolInput.chart_type,
            xField: toolInput.x_field,
            yField: toolInput.y_field,
            title: toolInput.title,
          };
          toolOutput = { success: true, chartSpec };

        } else if (toolName === 'generate_insight') {
          finalText += `\n\n${toolInput.insight as string}`;
          toolOutput = { success: true };
        }

        toolCallsLog.push({ name: toolName, input: toolInput, output: toolOutput });
        funcResultParts.push({
          functionResponse: { name: toolName, response: toolOutput },
        } as Part);
      }

      await sleep(1000);
      response = await sendWithRetry(() => chat.sendMessage({ message: funcResultParts }));

      if (iteration === 9) finalText = response.text ?? '';
    }

    return NextResponse.json({ message: finalText.trim(), toolCalls: toolCallsLog, chartSpec });
  } catch (e) {
    console.error('[chat/route]', e);
    return NextResponse.json(
      { message: `エラーが発生しました: ${String(e)}`, toolCalls: [], chartSpec: null },
      { status: 500 }
    );
  }
}

async function sendWithRetry(
  fn: () => Promise<import('@google/genai').GenerateContentResponse>,
  retries = 3
): Promise<import('@google/genai').GenerateContentResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('429') && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 15_000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}
