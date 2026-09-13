import { anonKey, isConfigured, REQUEST_TIMEOUT_MS, roastEndpoint } from '../config';
import type { Frame, RoastResult } from '../types';

export class RoastError extends Error {}

export async function requestRoast(frames: Frame[]): Promise<RoastResult> {
  if (!isConfigured) {
    throw new RoastError(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(roastEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ images: frames.map((frame) => frame.base64) }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new RoastError('The roast took too long. Check your connection and try again.');
    }
    throw new RoastError('Could not reach the roast service. Check your connection.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new RoastError(await describeFailure(response));
  }

  const payload: unknown = await response.json().catch(() => null);
  return parseResult(payload);
}

async function describeFailure(response: Response): Promise<string> {
  const body = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Non-JSON error body; fall through to the status line.
  }
  return `The roast service returned ${response.status}.`;
}

function parseResult(payload: unknown): RoastResult {
  const candidate = payload as Partial<RoastResult> | null;
  const roast = typeof candidate?.roast === 'string' ? candidate.roast.trim() : '';
  const fixes = Array.isArray(candidate?.fixes)
    ? candidate.fixes.filter((fix): fix is string => typeof fix === 'string' && fix.trim() !== '')
    : [];

  if (!roast || fixes.length === 0) {
    throw new RoastError('The roast came back malformed. Try again.');
  }
  return { roast, fixes };
}
