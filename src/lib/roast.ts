import { anonKey, isConfigured, REQUEST_TIMEOUT_MS, roastEndpoint } from '../config';
import { logStage, type Stage } from './log';
import type { Frame, RoastResult } from '../types';

export class RoastError extends Error {
  stage: Stage;
  constructor(message: string, stage: Stage) {
    super(message);
    this.name = 'RoastError';
    this.stage = stage;
  }
}

export async function requestRoast(frames: Frame[]): Promise<RoastResult> {
  if (!isConfigured) {
    const message = 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
    logStage('config', 'failure', message);
    throw new RoastError(message, 'config');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  logStage('upload', 'start', `${frames.length} frames`);
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
    logStage('upload', 'success', `HTTP ${response.status}`);
  } catch (error) {
    if (controller.signal.aborted) {
      logStage('upload', 'failure', 'timed out');
      throw new RoastError('The roast took too long. Check your connection and try again.', 'upload');
    }
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}${
            (error as { cause?: unknown }).cause ? ` (cause: ${String((error as { cause?: unknown }).cause)})` : ''
          }`
        : String(error);
    logStage('upload', 'failure', detail);
    throw new RoastError('Could not reach the roast service. Check your connection.', 'upload');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await describeFailure(response);
    logStage('server', 'failure', `HTTP ${response.status}: ${message}`);
    throw new RoastError(message, 'server');
  }

  const payload: unknown = await response.json().catch((error) => {
    logStage('response', 'failure', `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  });

  try {
    const result = parseResult(payload);
    logStage('response', 'success', `score ${result.score}, ${result.tokensUsed} tokens`);
    return result;
  } catch (error) {
    logStage('response', 'failure', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function describeFailure(response: Response): Promise<string> {
  const body = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(body) as { error?: unknown; reason?: unknown };
    if (typeof parsed.error === 'string') {
      const reason = typeof parsed.reason === 'string' ? ` [${parsed.reason}]` : '';
      return `${parsed.error}${reason}`;
    }
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
  const score = typeof candidate?.score === 'number' && Number.isFinite(candidate.score) ? candidate.score : null;
  const tokensUsed =
    typeof candidate?.tokensUsed === 'number' && Number.isFinite(candidate.tokensUsed)
      ? candidate.tokensUsed
      : 0;

  if (!roast || fixes.length === 0 || score === null) {
    throw new RoastError('The roast came back malformed. Try again.', 'response');
  }
  return { roast, fixes, score, tokensUsed };
}
