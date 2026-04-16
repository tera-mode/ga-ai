import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import type { BQDiagnostic } from '@/types';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId');
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  // properties/XXXXXXX → XXXXXXX
  const propNum = propertyId.replace('properties/', '');

  try {
    const res = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propNum}/bigQueryLinks`,
      { headers: { Authorization: `Bearer ${session.googleAccessToken}` } }
    );

    if (!res.ok) {
      // 404 = BigQuery Exportが未設定（bigQueryLinksリソース未存在）→ 未連携として扱う
      if (res.status === 404) {
        const result: BQDiagnostic = { linked: false };
        return NextResponse.json(result);
      }

      const text = await res.text();
      let errMsg: string;
      try {
        const errJson = JSON.parse(text) as { error?: { message?: string; status?: string } };
        errMsg = errJson.error?.message ?? `API error ${res.status}`;
      } catch {
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errMsg = `Analytics Admin API が有効化されていない可能性があります（HTTP ${res.status}）。Google Cloud Console で「Google Analytics Admin API」を有効化してください。`;
        } else {
          errMsg = `API error ${res.status}: ${text.slice(0, 200)}`;
        }
      }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json() as {
      bigqueryLinks?: Array<{
        name: string;
        project: string;
        defaultDatasetLocation?: string;
        dailyExportEnabled?: boolean;
        streamingExportEnabled?: boolean;
      }>;
    };

    if (!data.bigqueryLinks || data.bigqueryLinks.length === 0) {
      const result: BQDiagnostic = { linked: false };
      return NextResponse.json(result);
    }

    const link = data.bigqueryLinks[0];
    const dataset = `analytics_${propNum}`;

    const result: BQDiagnostic = {
      linked: true,
      link: {
        name: link.name,
        project: link.project,
        defaultDatasetLocation: link.defaultDatasetLocation,
        dailyExportEnabled: link.dailyExportEnabled,
        streamingExportEnabled: link.streamingExportEnabled,
      },
      dataset,
      projectId: link.project,
      canQuery: true,
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
