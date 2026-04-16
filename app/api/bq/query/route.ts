import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';

const MAX_BYTES_DEFAULT = 10 * 1024 * 1024 * 1024; // 10GB

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    sql: string;
    projectId: string;
    dryRun?: boolean;
    maxBytesBilled?: number;
  };
  const { sql, projectId, dryRun = false, maxBytesBilled = MAX_BYTES_DEFAULT } = body;

  if (!sql || !projectId) {
    return NextResponse.json({ error: 'sql and projectId required' }, { status: 400 });
  }

  try {
    if (dryRun) {
      // Dry Run
      const res = await fetch(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/jobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.googleAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            configuration: {
              query: {
                query: sql,
                useLegacySql: false,
              },
              dryRun: true,
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } };
        return NextResponse.json(
          { success: false, error: err.error?.message ?? 'Dry run failed' },
          { status: 400 }
        );
      }

      const data = await res.json() as {
        statistics?: { totalBytesProcessed?: string };
        status?: { state?: string; errors?: Array<{ message: string }> };
      };

      const bytes = parseInt(data.statistics?.totalBytesProcessed ?? '0', 10);
      return NextResponse.json({
        success: true,
        dryRun: true,
        totalBytesProcessed: bytes,
        exceedsLimit: bytes > MAX_BYTES_DEFAULT,
      });
    }

    // 実クエリ実行
    const res = await fetch(
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
          maximumBytesBilled: String(maxBytesBilled),
          timeoutMs: 60000,
          useQueryCache: true,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json() as { error?: { message?: string } };
      return NextResponse.json(
        { success: false, error: err.error?.message ?? 'Query failed' },
        { status: 400 }
      );
    }

    const data = await res.json() as {
      schema?: { fields?: Array<{ name: string; type: string }> };
      rows?: Array<{ f: Array<{ v: string | null }> }>;
      statistics?: { totalBytesProcessed?: string };
      jobComplete?: boolean;
      pageToken?: string;
      totalRows?: string;
    };

    if (!data.jobComplete) {
      return NextResponse.json({ success: false, error: 'Query timed out' }, { status: 408 });
    }

    const fields = data.schema?.fields ?? [];
    const rows = (data.rows ?? []).map((row) => {
      const obj: Record<string, string | null> = {};
      row.f.forEach((cell, i) => {
        obj[fields[i]?.name ?? `col${i}`] = cell.v;
      });
      return obj;
    });

    return NextResponse.json({
      success: true,
      fields: fields.map((f) => ({ name: f.name, type: f.type })),
      rows,
      totalRows: parseInt(data.totalRows ?? '0', 10),
      totalBytesProcessed: parseInt(data.statistics?.totalBytesProcessed ?? '0', 10),
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
