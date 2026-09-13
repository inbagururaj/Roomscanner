import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GhostButton, PrimaryButton } from '../components/Buttons';
import { MAX_RECORD_SECONDS } from '../config';
import { colors, mono, radius, space, type } from '../theme';

type Props = {
  onRecorded: (videoUri: string, durationMs: number) => void;
  onError: (message: string) => void;
};

const TICK_MS = 100;

export function RecordScreen({ onRecorded, onError }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const stop = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  const start = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || isRecording) return;

    setIsRecording(true);
    setElapsedMs(0);
    startedAt.current = Date.now();

    clearTimer();
    timer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setElapsedMs(elapsed);
      // Native maxDuration is the primary cap; this is the JS safety net.
      if (elapsed >= MAX_RECORD_SECONDS * 1_000) stop();
    }, TICK_MS);

    try {
      const recording = await camera.recordAsync({ maxDuration: MAX_RECORD_SECONDS });
      const duration = Math.min(Date.now() - startedAt.current, MAX_RECORD_SECONDS * 1_000);
      if (recording?.uri) {
        onRecorded(recording.uri, duration);
      } else {
        onError('The recording did not save. Give it another go.');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Recording failed.');
    } finally {
      clearTimer();
      setIsRecording(false);
      setElapsedMs(0);
    }
  }, [clearTimer, isRecording, onError, onRecorded, stop]);

  const granted = cameraPermission?.granted && micPermission?.granted;

  if (!granted) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateKicker}>ROOMROAST</Text>
        <Text style={[type.display, styles.gateTitle]}>Point.{'\n'}Pan.{'\n'}Get judged.</Text>
        <Text style={[type.dim, styles.gateBody]}>
          RoomRoast needs the camera to film your room. Nothing is stored — frames are deleted from
          your phone the moment the verdict lands.
        </Text>
        <PrimaryButton
          label="Allow camera access"
          onPress={() => {
            void requestCameraPermission();
            void requestMicPermission();
          }}
        />
        {cameraPermission?.canAskAgain === false ? (
          <Text style={styles.gateHint}>
            Permission was denied. Enable Camera and Microphone for Expo Go in system settings.
          </Text>
        ) : null}
      </View>
    );
  }

  const progress = Math.min(elapsedMs / (MAX_RECORD_SECONDS * 1_000), 1);
  const seconds = (elapsedMs / 1_000).toFixed(1);

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} mode="video" facing="back" mute />

      <View style={styles.topBar} pointerEvents="none">
        <View style={[styles.badge, isRecording && styles.badgeLive]}>
          <View style={[styles.dot, isRecording && styles.dotLive]} />
          <Text style={styles.badgeText}>{isRecording ? 'RECORDING' : 'READY'}</Text>
        </View>
        <Text style={styles.clock}>
          {seconds}
          <Text style={styles.clockUnit}>s</Text>
        </Text>
      </View>

      <View style={styles.progressTrack} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.controls}>
        <Text style={styles.hint}>
          {isRecording
            ? `Walk the room slowly. Auto-stops at ${MAX_RECORD_SECONDS}s.`
            : 'Film a slow lap of the room — up to 15 seconds.'}
        </Text>

        {isRecording ? (
          <GhostButton label="Stop recording" onPress={stop} style={styles.stopButton} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={start}
            style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}>
            <View style={styles.shutterInner} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  camera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  gate: { flex: 1, justifyContent: 'center', paddingHorizontal: space(7), gap: space(5) },
  gateKicker: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  gateTitle: { marginTop: space(-1) },
  gateBody: { marginBottom: space(2) },
  gateHint: { ...type.dim, color: colors.textFaint, fontSize: 13, textAlign: 'center' },

  topBar: {
    position: 'absolute',
    top: space(4),
    left: space(5),
    right: space(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  badgeLive: { backgroundColor: 'rgba(230,57,70,0.85)' },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textDim },
  dotLive: { backgroundColor: colors.text },
  clock: {
    color: colors.text,
    fontFamily: mono,
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
  },
  clockUnit: { fontSize: 15, color: colors.textDim },

  progressTrack: {
    position: 'absolute',
    left: space(5),
    right: space(5),
    top: space(14),
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.ember },

  controls: {
    position: 'absolute',
    left: space(6),
    right: space(6),
    bottom: space(10),
    alignItems: 'center',
    gap: space(5),
  },
  hint: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 10,
  },
  stopButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.overlay,
    borderColor: colors.emberDeep,
  },
  shutter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.emberDeep,
  },
});
