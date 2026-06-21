/**
 * supabaseClient.ts — Supabase auth stubs
 *
 * Replace these with real Supabase calls once you wire up
 * @supabase/supabase-js and set SUPABASE_URL / SUPABASE_ANON_KEY.
 */

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ data?: { user: unknown; session: unknown }; error?: { message: string } }> {
  console.log("[supabaseClient] signInWithEmail", { email });
  return { error: { message: "Supabase is not configured yet. Add your project credentials." } };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string,
  displayName: string,
): Promise<{ data?: { user: unknown; session: unknown | null }; error?: { message: string } }> {
  console.log("[supabaseClient] signUpWithEmail", { email, username, displayName });
  return { error: { message: "Supabase is not configured yet. Add your project credentials." } };
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<{ data?: unknown; error?: { message: string } }> {
  console.log("[supabaseClient] sendPasswordResetEmail", { email });
  return { error: { message: "Supabase is not configured yet. Add your project credentials." } };
}
