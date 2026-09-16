/** Pipeline stage logging. Never pass frame/image data as `detail` — stage names and error text only. */
export type Stage = 'record' | 'extract' | 'config' | 'upload' | 'server' | 'response' | 'roast';

export function logStage(stage: Stage | string, status: 'start' | 'success' | 'failure', detail?: string) {
  const line = `[${new Date().toISOString()}] [roomroast:${stage}] ${status}`;
  if (status === 'failure') {
    console.error(line, detail ?? '');
  } else {
    console.log(line, detail ?? '');
  }
}
