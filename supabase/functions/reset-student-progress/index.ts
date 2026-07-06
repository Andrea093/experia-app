import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const H = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405, H);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401, H);

  // Verificar que el llamador es admin
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401, H);

  const { data: profile } = await userClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden: admin only" }, 403, H);

  const { userId } = await req.json();
  if (!userId) return json({ error: "userId is required" }, 400, H);

  // Service role: bypasa RLS completamente
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();
  // Operaciones obligatorias: si alguna falla, el reinicio falla
  const [progressRes, courseProgRes, subsRes, attemptsRes] = await Promise.all([
    // Progreso legacy (tabla progress)
    admin.from("progress").upsert(
      { user_id: userId, xp: 0, completed: [], badges: [], updated_at: now },
      { onConflict: "user_id" }
    ),
    // Progreso por curso (todas las inscripciones del estudiante)
    admin.from("course_progress")
      .update({ xp: 0, completed: [], badges: [], updated_at: now })
      .eq("user_id", userId),
    admin.from("submissions").delete().eq("student_id", userId),
    admin.from("challenge_attempts").delete().eq("student_id", userId),
  ]);

  const errors = [progressRes.error, courseProgRes.error, subsRes.error, attemptsRes.error].filter(Boolean);
  if (errors.length > 0) {
    console.error("reset errors:", errors);
    return json({ error: errors[0]?.message }, 500, H);
  }

  // Revocar certificados: best-effort. Si la tabla 'certificates' no existe
  // (migración 0010 no aplicada), no bloquea el reinicio del progreso.
  const certsRes = await admin.from("certificates").delete().eq("user_id", userId);
  if (certsRes.error) console.warn("certificates no revocados:", certsRes.error.message);

  return json({ ok: true }, 200, H);
});

// Allowlist de orígenes: producción + previews de Cloudflare Pages + dev local.
function allowOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || "";
  const ok =
    origin === "https://experia-app.pages.dev" ||
    /^https:\/\/[a-z0-9-]+\.experia-app\.pages\.dev$/.test(origin) ||
    /^http:\/\/localhost:(5173|4173)$/.test(origin);
  return ok ? origin : "https://experia-app.pages.dev";
}
function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowOrigin(req),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status = 200, H: Record<string, string> = {}) {
  return new Response(JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json", ...H } });
}
