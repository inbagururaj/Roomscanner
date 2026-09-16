import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteLocalFiles } from './src/lib/cleanup';
import { extractFrames } from './src/lib/frames';
import { logStage, type Stage } from './src/lib/log';
import { requestRoast, RoastError } from './src/lib/roast';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { WorkingScreen } from './src/screens/WorkingScreen';
import { colors } from './src/theme';
import type { Frame, RoastResult } from './src/types';

type Recoverable = { videoUri: string; frames: Frame[] };

type Phase =
  | { name: 'record' }
  | { name: 'extracting' }
  | { name: 'review'; videoUri: string; frames: Frame[] }
  | { name: 'roasting'; videoUri: string; frames: Frame[] }
  | { name: 'result'; result: RoastResult }
  | { name: 'error'; message: string; recoverable: Recoverable | null };

const EXTRACTING_STEPS = [
  'Pulling stills out of your footage…',
  'Choosing the most incriminating angles…',
  'Compressing the evidence…',
];

const ROASTING_STEPS = [
  'Cataloguing the clutter…',
  'Measuring the lighting crimes…',
  'Consulting decades of taste…',
  'Sharpening the punchlines…',
  'Drafting fixes you can actually afford…',
];

const STAGE_LABELS: Record<Stage, string> = {
  record: 'Recording',
  extract: 'Frame extraction',
  config: 'Setup',
  upload: 'Upload',
  server: 'Server error',
  response: 'Server response',
  roast: 'Roast request',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RoomRoast />
    </SafeAreaProvider>
  );
}

function RoomRoast() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>({ name: 'record' });

  /** Every local file this session created, so no exit path leaves one behind. */
  const localFiles = useRef(new Set<string>());

  const track = useCallback((uris: string[]) => {
    for (const uri of uris) localFiles.current.add(uri);
  }, []);

  const purge = useCallback(() => {
    deleteLocalFiles(localFiles.current);
    localFiles.current.clear();
  }, []);

  const fail = useCallback((error: unknown, recoverable: Recoverable | null, fallbackStage?: Stage) => {
    const stage = error instanceof RoastError ? error.stage : fallbackStage;
    const rawMessage = error instanceof Error ? error.message : 'Something went wrong.';
    const label = stage ? STAGE_LABELS[stage] : null;
    logStage(stage ?? 'roast', 'failure', rawMessage);
    setPhase({
      name: 'error',
      message: label ? `${label} failed: ${rawMessage}` : rawMessage,
      recoverable,
    });
  }, []);

  const handleRecorded = useCallback(
    async (videoUri: string, durationMs: number) => {
      track([videoUri]);
      setPhase({ name: 'extracting' });
      logStage('extract', 'start', `${durationMs}ms clip`);
      try {
        const frames = await extractFrames(videoUri, durationMs);
        logStage('extract', 'success', `${frames.length} frames`);
        track(frames.map((frame) => frame.uri));
        setPhase({ name: 'review', videoUri, frames });
      } catch (error) {
        purge();
        fail(error, null, 'extract');
      }
    },
    [fail, purge, track],
  );

  const runRoast = useCallback(
    async (videoUri: string, frames: Frame[]) => {
      setPhase({ name: 'roasting', videoUri, frames });
      logStage('roast', 'start', `${frames.length} frames`);
      try {
        const result = await requestRoast(frames);
        logStage('roast', 'success', `score ${result.score}, ${result.tokensUsed} tokens`);
        // Result is in hand: the room never needs to exist on this device again.
        purge();
        setPhase({ name: 'result', result });
      } catch (error) {
        fail(error, { videoUri, frames }, 'roast');
      }
    },
    [fail, purge],
  );

  const restart = useCallback(() => {
    purge();
    setPhase({ name: 'record' });
  }, [purge]);

  const renderPhase = () => {
    switch (phase.name) {
      case 'record':
        return (
          <RecordScreen
            onRecorded={handleRecorded}
            onError={(message) => fail(new Error(message), null, 'record')}
          />
        );
      case 'extracting':
        return <WorkingScreen title="Reading the room" steps={EXTRACTING_STEPS} stepMs={1_400} />;
      case 'review': {
        const { videoUri, frames } = phase;
        return (
          <ReviewScreen
            key={videoUri}
            videoUri={videoUri}
            frames={frames}
            onRoast={() => void runRoast(videoUri, frames)}
            onRetake={restart}
          />
        );
      }
      case 'roasting':
        return <WorkingScreen title="Writing your roast" steps={ROASTING_STEPS} />;
      case 'result':
        return <ResultScreen result={phase.result} onRestart={restart} />;
      case 'error': {
        const { recoverable } = phase;
        return (
          <ErrorScreen
            message={phase.message}
            onRetry={
              recoverable
                ? () => void runRoast(recoverable.videoUri, recoverable.frames)
                : undefined
            }
            onRestart={restart}
          />
        );
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {renderPhase()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
