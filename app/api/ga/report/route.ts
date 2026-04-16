import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    propertyId: string;
    dimensions: Array<{ name: string }>;
    metrics: Array<{ name: string }>;
    dateRanges: Array<{ startDate: string; endDate: string }>;
    dimensionFilter?: Record<string, unknown>;
    orderBys?: Array<Record<string, unknown>>;
    limit?: number;
  };

  const propNum = body.propertyId.replace('properties/', '');

  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propNum}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dimensions: body.dimensions,
          metrics: body.metrics,
          dateRanges: body.dateRanges,
          dimensionFilter: body.dimensionFilter,
          orderBys: body.orderBys,
          limit: body.limit ?? 100,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      let errMsg: string;
      try {
        const errJson = JSON.parse(text) as { error?: { message?: string } };
        errMsg = errJson.error?.message ?? `API error ${res.status}`;
      } catch {
        errMsg = `GA4 Data API error ${res.status}`;
      }
      return NextResponse.json({ success: false, error: errMsg }, { status: res.status });
    }

    const data = await res.json() as {
      dimensionHeaders?: Array<{ name: string }>;
      metricHeaders?: Array<{ name: string; type: string }>;
      rows?: Array<{
        dimensionValues: Array<{ value: string }>;
        metricValues: Array<{ value: string }>;
      }>;
      rowCount?: number;
    };

    // フラット化してBQのrows形式に合わせる
    const dimHeaders = (data.dimensionHeaders ?? []).map((h) => h.name);
    const metHeaders = (data.metricHeaders ?? []).map((h) => h.name);
    const fields = [...dimHeaders, ...metHeaders].map((name) => ({ name }));

    const rows = (data.rows ?? []).map((row) => {
      const out: Record<string, string> = {};
      dimHeaders.forEach((name, i) => {
        out[name] = row.dimensionValues[i]?.value ?? '';
      });
      metHeaders.forEach((name, i) => {
        out[name] = row.metricValues[i]?.value ?? '';
      });
      return out;
    });

    return NextResponse.json({
      success: true,
      fields,
      rows,
      totalRows: data.rowCount ?? rows.length,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
