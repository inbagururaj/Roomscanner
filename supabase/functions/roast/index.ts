// RoomRoast — vision roast endpoint.
//
// Privacy contract: the incoming images live only in this request's scope. They are
// never written to disk, never put in a bucket, never inserted into a table, and never
// logged. When the handler returns, the only thing that leaves is the text.

import Anthropic from 'npm:@anthropic-ai/sdk@0.125.0';

const MODEL = 'claude-opus-5';
/** Roasting a room is not hard reasoning; low effort keeps the demo wait short. */
const EFFORT = 'low' as const;
const MAX_IMAGES = 6;
/** Per-image ceiling on the base64 string. The client sends ~100 KB frames. */
const MAX_BASE64_CHARS = 900_000;
const TOOL_NAME = 'deliver_roast';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are Ramona Vex, a celebrated interior critic with a merciless wit and a genuinely good eye.

You are shown several stills from a short phone video of one room. Your job has two halves and you are excellent at both.

The roast:
- 70 to 110 words, one paragraph, second person ("your", "you").
- Funny because it is specific and true, never because it is mean about the person. Roast the room, never the human who lives in it.
- Name concrete things you can actually see: the pile on the chair, the single sad overhead bulb, the cable nest, the art hung at forehead height, the furniture pushed flat against every wall.
- No pleasantries, no preamble, no "overall". Open with the strongest observation.
- Keep it PG-13. Nothing about the occupant's body, income, hygiene, family, or intelligence.

The fixes:
- Exactly 3 fixes, or 2 if the room genuinely only has two problems worth naming.
- Each one is a single sentence, an imperative, and specific to what you saw — not generic advice.
- Free or under about 30 dollars, and doable in an afternoon. Rearranging, decluttering, a lamp, hooks, a rug pad, curtain rings.
- No renovations, no "hire a designer", no buying furniture.

The score:
- An integer 0-10 rating the room's current state. 0 is a disaster zone, 10 is immaculate and well-composed.
- Judge clutter, layout and traffic flow, and lighting together. Be honest and use the full range — most real rooms land in the middle.

If the stills are too dark or too blurry to judge, say so in the roast — wittily — and give fixes about how to shoot it again.`;

const USER_INSTRUCTION = `These are stills from one walkthrough of a single room, in order.

Assess the clutter, the layout and traffic flow, and the lighting. Then call the ${TOOL_NAME} tool exactly once with your roast and your fixes. Do not reply with plain text.`;

const ROAST_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    'Return the finished roast and the accompanying cheap, concrete fixes for the room in the images.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      roast: {
        type: 'string',
        description: 'The comedic roast of the room. One paragraph, 70-110 words, in Ramona Vex’s voice.',
      },
      fixes: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Two or three fixes. Each is one imperative sentence, specific to this room, free or under $30.',
      },
      score: {
        type: 'integer',
        description: "Integer 0-10 rating the room's current state. 0 is a disaster, 10 is immaculate.",
        minimum: 0,
        maximum: 10,
      },
    },
    required: ['roast', 'fixes', 'score'],
    additionalProperties: false,
  },
};

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  logStage('request', 'start', request.method);

  if (request.method !== 'POST') {
    logStage('request', 'failure', `unsupported method ${request.method}`);
    return json({ error: 'Use POST.', stage: 'request', reason: 'bad_method' }, 405);
  }
  if (!Deno.env.get('ANTHROPIC_API_KEY')) {
    logStage('config', 'failure', 'ANTHROPIC_API_KEY is not set');
    return json(
      { error: 'The roast service is missing its API key.', stage: 'config', reason: 'missing_api_key' },
      500,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logStage('request', 'failure', `invalid JSON body: ${describe(error)}`);
    return json({ error: 'Request body must be JSON.', stage: 'request', reason: 'invalid_json' }, 400);
  }

  let images: ImagePart[];
  try {
    images = parseImages(body);
    logStage('request', 'success', `${images.length} images`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request body.';
    logStage('request', 'failure', message);
    return json({ error: message, stage: 'request', reason: 'invalid_images' }, 400);
  }

  let message: Anthropic.Message;
  try {
    logStage('llm_call', 'start', `${images.length} images, model ${MODEL}`);
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4_000,
      system: SYSTEM_PROMPT,
      output_config: { effort: EFFORT },
      tools: [ROAST_TOOL],
      messages: [
        {
          role: 'user',
          content: [
            ...images.map(
              (image): Anthropic.ImageBlockParam => ({
                type: 'image',
                source: { type: 'base64', media_type: image.mediaType, data: image.data },
              }),
            ),
            { type: 'text', text: USER_INSTRUCTION },
          ],
        },
      ],
    });
    logStage('llm_call', 'success', `stop_reason ${message.stop_reason}`);
  } catch (error) {
    // Deliberately logs only the failure shape — never the request body or image bytes.
    logStage('llm_call', 'failure', describe(error));
    if (error instanceof Anthropic.RateLimitError) {
      return json(
        { error: 'The critic is overbooked. Try again in a moment.', stage: 'llm', reason: 'rate_limit' },
        429,
      );
    }
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      // Bad or revoked key: retrying will not help.
      return json(
        { error: 'The roast service is misconfigured. Check its API key.', stage: 'config', reason: 'llm_auth' },
        500,
      );
    }
    if (error instanceof Anthropic.BadRequestError) {
      // Malformed request to the LLM, or out of credit — surfaced as a 400/402 upstream.
      return json(
        {
          error: 'The roast service could not process this request. Check its credit balance.',
          stage: 'llm',
          reason: 'llm_bad_request',
        },
        500,
      );
    }
    return json(
      { error: 'The critic could not be reached. Try again.', stage: 'llm', reason: 'llm_unreachable' },
      502,
    );
  }

  if (message.stop_reason === 'refusal') {
    logStage('parse_response', 'failure', 'model refused');
    return json(
      { error: 'This one is off limits for the critic. Try a different room.', stage: 'llm', reason: 'refusal' },
      422,
    );
  }

  const result = readResult(message);
  if (!result) {
    logStage('parse_response', 'failure', 'no valid tool_use block in response');
    return json(
      { error: 'The critic went quiet. Try again.', stage: 'llm', reason: 'malformed_response' },
      502,
    );
  }
  const tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);
  logStage('parse_response', 'success', `score ${result.score}, ${tokensUsed} tokens`);
  return json({ ...result, tokensUsed }, 200);
});

type ImagePart = { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };

function parseImages(body: unknown): ImagePart[] {
  const raw = (body as { images?: unknown } | null)?.images;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Send an "images" array of base64 frames.');
  }
  if (raw.length > MAX_IMAGES) {
    throw new Error(`Send at most ${MAX_IMAGES} frames.`);
  }
  return raw.map((entry, index) => {
    if (typeof entry !== 'string' || entry.length === 0) {
      throw new Error(`Frame ${index + 1} is not a base64 string.`);
    }
    const part = splitDataUri(entry);
    if (part.data.length > MAX_BASE64_CHARS) {
      throw new Error(`Frame ${index + 1} is too large.`);
    }
    return part;
  });
}

function splitDataUri(value: string): ImagePart {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.*)$/s.exec(value);
  if (match) {
    return { mediaType: match[1] as ImagePart['mediaType'], data: match[2] };
  }
  // The client sends bare base64 JPEG.
  return { mediaType: 'image/jpeg', data: value };
}

function readResult(message: Anthropic.Message): { roast: string; fixes: string[]; score: number } | null {
  for (const block of message.content) {
    if (block.type !== 'tool_use' || block.name !== TOOL_NAME) continue;
    const input = block.input as { roast?: unknown; fixes?: unknown; score?: unknown };
    const roast = typeof input.roast === 'string' ? input.roast.trim() : '';
    const fixes = Array.isArray(input.fixes)
      ? input.fixes
          .filter((fix): fix is string => typeof fix === 'string')
          .map((fix) => fix.trim())
          .filter((fix) => fix.length > 0)
          .slice(0, 3)
      : [];
    const score =
      typeof input.score === 'number' && Number.isFinite(input.score)
        ? Math.min(10, Math.max(0, Math.round(input.score)))
        : null;
    if (roast && fixes.length > 0 && score !== null) return { roast, fixes, score };
  }
  return null;
}

function describe(error: unknown): string {
  if (error instanceof Anthropic.APIError) return `APIError ${error.status}: ${error.message}`;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return 'unknown error';
}

/** Stage + status only — never image bytes or request body. */
function logStage(stage: string, status: 'start' | 'success' | 'failure', detail?: string) {
  const line = `[${new Date().toISOString()}] [roast:${stage}] ${status}`;
  if (status === 'failure') {
    console.error(line, detail ?? '');
  } else {
    console.log(line, detail ?? '');
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
