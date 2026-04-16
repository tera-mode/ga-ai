import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import type { GA4Property } from '@/types';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // GA4 Admin API: アカウントサマリー取得
    const res = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
      { headers: { Authorization: `Bearer ${session.googleAccessToken}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      let errMsg: string;
      try {
        const errJson = JSON.parse(text) as { error?: { message?: string } };
        errMsg = errJson.error?.message ?? `API error ${res.status}`;
      } catch {
        errMsg = (text.includes('<!DOCTYPE') || text.includes('<html'))
          ? `Analytics Admin API が有効化されていません（HTTP ${res.status}）。Google Cloud Console で「Google Analytics Admin API」を有効化してください。`
          : `API error ${res.status}: ${text.slice(0, 200)}`;
      }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json() as {
      accountSummaries?: Array<{
        account: string;
        displayName: string;
        propertySummaries?: Array<{
          property: string;
          displayName: string;
          propertyType?: string;
        }>;
      }>;
    };

    const properties: GA4Property[] = [];
    for (const account of data.accountSummaries ?? []) {
      for (const prop of account.propertySummaries ?? []) {
        properties.push({
          name: prop.property,
          displayName: prop.displayName,
          propertyType: prop.propertyType,
          account: account.displayName,
        });
      }
    }

    return NextResponse.json({ properties });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
