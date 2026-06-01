import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  // Cliente con JWT del llamador — para verificar quién es
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

  // Cliente con service_role — solo en el servidor
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { users } = await req.json();
  if (!Array.isArray(users)) return json({ error: "users must be an array" }, 400);

  const results = [];
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.pass,
      email_confirm: true,
      user_metadata: {
        name: u.name, role: u.role || "student",
        area: u.area || null, institution_id: u.institution_id || null,
      },
    });
    results.push({ email: u.email, ok: !error, error: error?.message });
  }
  return json({ results });
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
    { status, headers: { "Content-Type": "application/json", ...corsHeaders() }});
}
