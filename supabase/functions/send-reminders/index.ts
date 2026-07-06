// @ts-nocheck
// Edge Function: send-reminders
// Envía emails a docentes que llevan 3+ días sin avanzar
// Requiere: secret RESEND_API_KEY en Supabase → Edge Functions → Secrets
// Invocación manual: POST /functions/v1/send-reminders (solo admin)
// O automática via pg_cron (Supabase Pro)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAYS_INACTIVE = 3;   // días sin actividad antes de enviar recordatorio
const RESEND_URL = "https://api.resend.com/emails";

Deno.serve(async (req) => {
  const H = corsHeaders(req);
  if (req.method === "OPTIONS") return ok(H);

  // Verificar que el llamador es admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401, H);

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

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500, H);

  // Buscar estudiantes inactivos
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_INACTIVE);

  const { data: inactive } = await admin
    .from("profiles")
    .select("id, name, email, area, last_seen")
    .eq("role", "student")
    .or(`last_seen.lte.${cutoff.toISOString()},last_seen.is.null`)
    .limit(50);

  if (!inactive || inactive.length === 0) {
    return json({ sent: 0, message: "No inactive students found" }, 200, H);
  }

  // Verificar cuáles tienen entregas aprobadas (no enviar a los que ya terminaron)
  const { data: approved } = await admin
    .from("submissions")
    .select("student_id")
    .eq("status", "approved");

  const approvedIds = new Set((approved || []).map(s => s.student_id));
  const toNotify = inactive.filter(s => !approvedIds.has(s.id));

  // Enviar emails
  const results = [];
  for (const student of toNotify) {
    const daysAgo = student.last_seen
      ? Math.floor((Date.now() - new Date(student.last_seen).getTime()) / 86400000)
      : DAYS_INACTIVE;

    const areaNames: Record<string,string> = {
      lectura: "Lectura Crítica", ciudadanas: "Competencias Ciudadanas",
      ingles: "Inglés", matematicas: "Matemáticas", ciencias: "Ciencias Naturales",
    };
    const areaName = student.area ? (areaNames[student.area] || student.area) : "tu área";

    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Experia CEINFES <noreply@ceinfes.com>",
        to: [student.email],
        subject: `${student.name}, continúa tu formación en Experia 📚`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
            <div style="background:linear-gradient(120deg,#7B3FA0,#B84B8A,#E87A48);padding:28px 24px;border-radius:12px;margin-bottom:28px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800;">Experia · CEINFES</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Formación Docente DCE</p>
            </div>

            <h2 style="font-size:20px;color:#1A1A2E;margin:0 0 12px;">Hola, ${student.name} 👋</h2>
            <p style="font-size:15px;color:#4A4A5E;line-height:1.7;margin:0 0 16px;">
              Notamos que llevas <strong>${daysAgo} día${daysAgo !== 1 ? 's' : ''}</strong> sin avanzar
              en tu ruta de formación en <strong>${areaName}</strong>.
            </p>
            <p style="font-size:15px;color:#4A4A5E;line-height:1.7;margin:0 0 24px;">
              Tu proceso formativo está en marcha — tómate un momento hoy para completar
              el siguiente módulo o reto. ¡Cada avance cuenta!
            </p>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="https://experia-app.pages.dev"
                style="display:inline-block;padding:14px 32px;background:linear-gradient(120deg,#7B3FA0,#E8732C);
                color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                Continuar mi formación →
              </a>
            </div>

            <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0;">
              Este es un recordatorio automático de CEINFES.<br/>
              Si ya completaste tu formación, ignora este mensaje.
            </p>
          </div>
        `,
      }),
    });

    results.push({ email: student.email, ok: res.ok, status: res.status });
  }

  const sent = results.filter(r => r.ok).length;
  return json({ sent, total: toNotify.length, results }, 200, H);
});

function ok(H: Record<string, string> = {}) { return new Response("ok", { headers: H }); }
function json(body: unknown, status = 200, H: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...H },
  });
}
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
