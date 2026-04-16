import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import type { ConnectionTestResult } from '@/types';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { projectId: string; dataset: string };
  const { projectId, dataset } = body;

  if (!projectId || !dataset) {
    return NextResponse.json({ error: 'projectId and dataset required' }, { status: 400 });
  }

  const sql = `
SELECT
  COUNT(*) AS event_count,
  MIN(event_date) AS oldest_date,
  MAX(event_date) AS latest_date
FROM \`${projectId}.${dataset}.events_*\`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
LIMIT 1
`.trim();

  try {
    // BigQuery REST APIでクエリ実行
    const queryRes = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql,
          useLegacySql: false,
          maximumBytesBilled: '1073741824', // 1GB
          timeoutMs: 30000,
        }),
      }
    );

    if (!queryRes.ok) {
      const err = await queryRes.json() as { error?: { message?: string } };
      return NextResponse.json(
        { success: false, error: err.error?.message ?? 'Query failed' },
        { status: 400 }
      );
    }

    const result = await queryRes.json() as {
      rows?: Array<{ f: Array<{ v: string | null }> }>;
      statistics?: { totalBytesProcessed?: string };
      jobComplete?: boolean;
      errors?: Array<{ message: string }>;
    };

    if (!result.jobComplete || result.errors?.length) {
      return NextResponse.json({
        success: false,
        error: result.errors?.[0]?.message ?? 'Job incomplete',
      });
    }

    const row = result.rows?.[0]?.f;
    const testResult: ConnectionTestResult = {
      success: true,
      eventCount: row ? parseInt(row[0]?.v ?? '0', 10) : 0,
      oldestDate: row ? (row[1]?.v ?? undefined) : undefined,
      latestDate: row ? (row[2]?.v ?? undefined) : undefined,
      scanBytes: parseInt(result.statistics?.totalBytesProcessed ?? '0', 10),
    };

    return NextResponse.json(testResult);
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
