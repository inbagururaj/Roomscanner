import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

import type { Frame } from '../types';
import { deleteLocalFiles } from './cleanup';

export const FRAME_COUNT = 5;

/** Caps the long edge. Keeps each base64 payload around 60-100 KB. */
const MAX_EDGE = 768;
const JPEG_QUALITY = 0.5;

/** Sample window, as a fraction of duration. Avoids the shaky first and last moments. */
const FIRST_SAMPLE = 0.08;
const LAST_SAMPLE = 0.88;

export async function extractFrames(videoUri: string, durationMs: number): Promise<Frame[]> {
  const span = Math.max(durationMs, 1_000);
  const step = (LAST_SAMPLE - FIRST_SAMPLE) / Math.max(FRAME_COUNT - 1, 1);
  const times = Array.from({ length: FRAME_COUNT }, (_, i) =>
    Math.round(span * (FIRST_SAMPLE + step * i)),
  );

  const grabbed = await Promise.all(
    times.map(async (timeMs) => {
      try {
        return await grabFrame(videoUri, timeMs);
      } catch (error) {
        if (__DEV__) console.warn(`[frames] skipped ${timeMs}ms`, error);
        return null;
      }
    }),
  );

  const frames = grabbed.filter((frame): frame is Frame => frame !== null);
  if (frames.length === 0) {
    throw new Error('Could not read any frames from that recording.');
  }
  return frames;
}

async function grabFrame(videoUri: string, timeMs: number): Promise<Frame> {
  const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: timeMs,
    quality: 0.8,
  });

  const size =
    thumbnail.width >= thumbnail.height ? { width: MAX_EDGE } : { height: MAX_EDGE };

  const rendered = await ImageManipulator.manipulate(thumbnail.uri).resize(size).renderAsync();
  const saved = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  // The full-resolution intermediate is never needed again.
  deleteLocalFiles([thumbnail.uri]);

  if (!saved.base64) {
    throw new Error('Frame encoding produced no data.');
  }
  return { uri: saved.uri, base64: saved.base64, timeMs };
}
