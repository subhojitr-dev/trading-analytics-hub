import { get, put } from '@vercel/blob';
import { listAll } from './blob';

export const REQUESTS_PREFIX = 'requests/';

export interface AnalysisRequest {
  id: string;
  submittedAt: string; // ISO
  stock: { symbol: string; extraCriteria: string | null } | null;
  optionsTest: { symbol: string; strategy: string; notes: string | null } | null;
}

export async function saveAnalysisRequest(
  record: Omit<AnalysisRequest, 'id'>
): Promise<void> {
  const id = record.submittedAt.replace(/[:.]/g, '-');
  await put(`${REQUESTS_PREFIX}${id}.json`, JSON.stringify({ id, ...record }, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: 'application/json',
  });
}

export async function listAnalysisRequests(): Promise<AnalysisRequest[]> {
  const blobs = await listAll(REQUESTS_PREFIX);
  const records: AnalysisRequest[] = [];
  for (const { pathname } of blobs) {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) continue;
    try {
      const text = await new Response(result.stream).text();
      records.push(JSON.parse(text));
    } catch {
      continue;
    }
  }
  records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return records;
}

export function filterWithinDays(records: AnalysisRequest[], days: number): AnalysisRequest[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.submittedAt).getTime() >= cutoff);
}
