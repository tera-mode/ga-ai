import { getSession } from '@/lib/server-session';
import { NextRequest, NextResponse } from 'next/server';
import type { GCPProject } from '@/types';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(
      'https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState:ACTIVE',
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
          ? `Cloud Resource Manager API が有効化されていません（HTTP ${res.status}）。Google Cloud Console で「Cloud Resource Manager API」を有効化してください。`
          : `API error ${res.status}: ${text.slice(0, 200)}`;
      }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json() as { projects?: Array<{ projectId: string; name: string; lifecycleState: string }> };
    const projects: GCPProject[] = (data.projects ?? []).map((p) => ({
      projectId: p.projectId,
      name: p.name,
      lifecycleState: p.lifecycleState,
    }));

    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
