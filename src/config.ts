const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const roastEndpoint = `${supabaseUrl}/functions/v1/roast`;
export const anonKey = supabaseAnonKey ?? '';

export const MAX_RECORD_SECONDS = 15;
export const REQUEST_TIMEOUT_MS = 90_000;

export const PERSONA = 'Ramona Vex, Interior Critic';
