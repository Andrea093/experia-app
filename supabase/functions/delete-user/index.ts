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

  // Obtener el email a eliminar
  const { email } = await req.json();
  if (!email) return json({ error: "email is required" }, 400);

  // Cliente con service_role para borrar de auth.users
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar el usuario por email
  const { data: users, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return json({ error: listErr.message }, 500);

  const target = users.users.find(u => u.email === email);
  if (!target) return json({ error: `Usuario ${email} no encontrado` }, 404);

  // Eliminar (la FK en profiles CASCADE borra el perfil automáticamente)
  const { error: delErr } = await admin.auth.admin.deleteUser(target.id);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true, deleted: email });
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
