import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import type { PropertySchema } from '@/types';

async function runQuery(accessToken: string, projectId: string, sql: string): Promise<Array<{ f: Array<{ v: string | null }> }>> {
  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        useLegacySql: false,
        maximumBytesBilled: '536870912', // 512MB
        timeoutMs: 30000,
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json() as { rows?: Array<{ f: Array<{ v: string | null }> }> };
  return data.rows ?? [];
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    dataset: string;
    propertyId: string;
  };
  const { projectId, dataset, propertyId } = body;
  if (!projectId || !dataset || !propertyId) {
    return NextResponse.json({ error: 'projectId, dataset, propertyId required' }, { status: 400 });
  }

  const propNum = propertyId.replace('properties/', '');

  try {
    // カスタムディメンション取得（GA4 Admin API）
    const cdRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propNum}/customDimensions?pageSize=200`,
      { headers: { Authorization: `Bearer ${session.googleAccessToken}` } }
    );
    const cdData = cdRes.ok
      ? await cdRes.json() as {
          customDimensions?: Array<{
            displayName: string;
            scope: string;
            parameterName: string;
          }>;
        }
      : { customDimensions: [] };

    // カスタムメトリクス取得
    const cmRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propNum}/customMetrics?pageSize=200`,
      { headers: { Authorization: `Bearer ${session.googleAccessToken}` } }
    );
    const cmData = cmRes.ok
      ? await cmRes.json() as {
          customMetrics?: Array<{
            displayName: string;
            measurementUnit: string;
          }>;
        }
      : { customMetrics: [] };

    // event_params の実在キー検出
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ymd = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

    const epRows = await runQuery(
      session.googleAccessToken,
      projectId,
      `SELECT DISTINCT key
       FROM \`${projectId}.${dataset}.events_*\`, UNNEST(event_params) AS p
       WHERE _TABLE_SUFFIX = '${ymd}'
       LIMIT 300`
    );

    // user_properties の実在キー検出
    const upRows = await runQuery(
      session.googleAccessToken,
      projectId,
      `SELECT DISTINCT key
       FROM \`${projectId}.${dataset}.events_*\`, UNNEST(user_properties) AS p
       WHERE _TABLE_SUFFIX = '${ymd}'
       LIMIT 100`
    );

    const schema: PropertySchema = {
      propertyId: propNum,
      customDimensions: (cdData.customDimensions ?? []).map((d) => ({
        name: d.displayName,
        scope: d.scope,
        parameterName: d.parameterName,
      })),
      customMetrics: (cmData.customMetrics ?? []).map((m) => ({
        name: m.displayName,
        measurementUnit: m.measurementUnit,
      })),
      detectedEventParams: epRows.map((r) => r.f[0]?.v ?? '').filter(Boolean),
      detectedUserProperties: upRows.map((r) => r.f[0]?.v ?? '').filter(Boolean),
      lastScannedAt: new Date().toISOString(),
    };

    return NextResponse.json({ schema });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
