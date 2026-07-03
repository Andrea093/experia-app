import { supabase } from './supabaseClient.js'
import { mapSubmission, mapAttempt } from './mappers.js'
import { loadStudentSession } from './loadStudentSession.js'

// =============================================================================
// Carga de datos por rol tras autenticar — compartida por el LOGIN (login.jsx)
// y la RESTAURACIÓN de sesión (main.jsx). Antes cada flujo tenía su propia
// copia de esta lógica y divergían con el tiempo (p.ej. el login olvidó pasar
// institution_id a loadStudentSession y los estudiantes no veían la copia del
// curso de su colegio hasta recargar). Un solo lugar = un solo comportamiento.
// =============================================================================

const THIRTY_DAYS_MS = 30 * 86_400_000

// Datos de panel para admin/instructor: cuentas visibles + entregas e intentos
// recientes. `institutions` se usa solo para resolver nombres de colegio.
export async function loadStaffData(profile, institutions) {
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()
  const isInstructor = profile.role === 'instructor'
  const profilesQuery = isInstructor && profile.institution_id
    ? supabase.from('profiles').select('*').eq('institution_id', profile.institution_id).order('name')
    : supabase.from('profiles').select('*').order('name').limit(500)
  const [{ data: profilesData }, { data: subsData }, { data: attemptsData }] = await Promise.all([
    profilesQuery,
    supabase.from('submissions').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(300),
    supabase.from('challenge_attempts').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(300),
  ])
  const allProfiles = profilesData || []
  const instById = {}
  ;(institutions || []).forEach(i => { instById[i.id] = i.name })
  return {
    accounts: allProfiles.map(p => ({
      id: p.id, email: p.email, name: p.name, avatar: p.avatar,
      role: p.role, area: p.area || null,
      institution: instById[p.institution_id] || '',
      institution_id: p.institution_id || null,
      cohort_id: p.cohort_id || null,
      is_active: p.is_active !== false,
      pass: '',
    })),
    submissions: (subsData || []).map(s => mapSubmission(s, allProfiles, instById)),
    challengeAttempts: (attemptsData || []).map(a => mapAttempt(a, allProfiles)),
  }
}

// Datos de sesión del estudiante: sus entregas/intentos + curso activo, módulos
// (resolviendo la copia del colegio) y progreso. Devuelve también los campos de
// loadStudentSession: { enrolledCourseId, courseModules, allEnrollments, xp,
// completed, badges }.
export async function loadStudentData(userId, profile) {
  const me = [{ id: userId, ...profile }]
  const [{ data: subsData }, { data: attemptsData }, studentSess] = await Promise.all([
    supabase.from('submissions').select('*').eq('student_id', userId).limit(100),
    supabase.from('challenge_attempts').select('*').eq('student_id', userId).limit(200),
    loadStudentSession(userId, profile.area || null, profile.institution_id || null),
  ])
  return {
    submissions: (subsData || []).map(s => mapSubmission(s, me)),
    challengeAttempts: (attemptsData || []).map(a => mapAttempt(a, me)),
    ...studentSess,
  }
}
