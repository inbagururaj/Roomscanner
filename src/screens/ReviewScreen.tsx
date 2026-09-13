import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { GhostButton, PrimaryButton } from '../components/Buttons';
import { colors, mono, radius, space, type } from '../theme';
import type { Frame } from '../types';

type Props = {
  videoUri: string;
  frames: Frame[];
  onRoast: () => void;
  onRetake: () => void;
};

export function ReviewScreen({ videoUri, frames, onRoast, onRetake }: Props) {
  const player = useVideoPlayer(videoUri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>EVIDENCE COLLECTED</Text>
        <Text style={[type.title, styles.heading]}>
          {frames.length} frames ready for judgement
        </Text>

        <View style={styles.playerCard}>
          <VideoView player={player} style={styles.player} contentFit="cover" nativeControls />
        </View>

        <Text style={[type.section, styles.sectionLabel]}>FRAMES TO BE SENT</Text>
        <View style={styles.grid}>
          {frames.map((frame) => (
            <View key={frame.uri} style={styles.tile}>
              <Image source={{ uri: frame.uri }} style={styles.thumb} resizeMode="cover" />
              <Text style={styles.stamp}>{(frame.timeMs / 1000).toFixed(1)}s</Text>
            </View>
          ))}
        </View>

        <View style={styles.privacy}>
          <Text style={styles.privacyTitle}>Nothing is kept</Text>
          <Text style={styles.privacyBody}>
            These frames go straight to the roast function and are never stored on a server. The
            video and the frames are wiped from this phone as soon as your verdict appears.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Roast my room" onPress={onRoast} />
        <GhostButton label="Retake" onPress={onRetake} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space(6), paddingTop: space(4), paddingBottom: space(6) },
  kicker: { color: colors.ember, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  heading: { marginTop: space(2), marginBottom: space(5) },

  playerCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    aspectRatio: 16 / 10,
  },
  player: { width: '100%', height: '100%' },

  sectionLabel: { marginTop: space(7), marginBottom: space(3) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  tile: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  thumb: { width: '100%', height: '100%' },
  stamp: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.overlay,
    color: colors.text,
    fontFamily: mono,
    fontSize: 10,
  },

  privacy: {
    marginTop: space(7),
    padding: space(4),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space(1.5),
  },
  privacyTitle: { color: colors.mint, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  privacyBody: { color: colors.textDim, fontSize: 13, lineHeight: 19 },

  footer: {
    paddingHorizontal: space(6),
    paddingTop: space(3),
    paddingBottom: space(8),
    gap: space(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
