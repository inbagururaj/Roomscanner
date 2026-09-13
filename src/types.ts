export type Frame = {
  /** Local file URI of the compressed JPEG. Deleted once the roast is rendered. */
  uri: string;
  /** Base64 JPEG payload held in memory only, for the upload and any retry. */
  base64: string;
  timeMs: number;
};

export type RoastResult = {
  roast: string;
  fixes: string[];
};
