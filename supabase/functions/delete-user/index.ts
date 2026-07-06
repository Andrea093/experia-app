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

  // Obtener el email a eliminar
  const { email } = await req.json();
  if (!email) return json({ error: "email is required" }, 400, H);

  // Cliente con service_role para borrar de auth.users
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar el usuario por email
  const { data: users, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return json({ error: listErr.message }, 500, H);

  const target = users.users.find(u => u.email === email);
  if (!target) return json({ error: `Usuario ${email} no encontrado` }, 404, H);

  // Eliminar (la FK en profiles CASCADE borra el perfil automáticamente)
  const { error: delErr } = await admin.auth.admin.deleteUser(target.id);
  if (delErr) return json({ error: delErr.message }, 500, H);

  return json({ ok: true, deleted: email }, 200, H);
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
