import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  // Verificar que el llamador es admin
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await userClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden: admin only" }, 403);

  const { userId } = await req.json();
  if (!userId) return json({ error: "userId is required" }, 400);

  // Service role: bypasa RLS completamente
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [progressRes, subsRes, attemptsRes] = await Promise.all([
    admin.from("progress").upsert(
      { user_id: userId, xp: 0, completed: [], badges: [], updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    ),
    admin.from("submissions").delete().eq("student_id", userId),
    admin.from("challenge_attempts").delete().eq("student_id", userId),
  ]);

  const errors = [progressRes.error, subsRes.error, attemptsRes.error].filter(Boolean);
  if (errors.length > 0) {
    console.error("reset errors:", errors);
    return json({ error: errors[0]?.message }, 500);
  }

  return json({ ok: true });
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json", ...corsHeaders() } });
}
