import { supabase } from './supabaseClient.js'
import { dbRowsToCourseModules } from '../store/store.jsx'

/**
 * Loads all course-related state for a student in a single optimised call.
 * - If enrolled: fetches course_modules + course_progress in parallel.
 * - If not enrolled: falls back to legacy `progress` table.
 * - Resolves a tutor's fork of the course for the student's institution
 *   (if one exists) so the student sees the customised version.
 * Returns { enrolledCourseId, effectiveCourseId, courseModules, allEnrollments, unlockedPresenceModules, xp, completed, badges }
 * `effectiveCourseId` is the course row whose modules/certificate the student
 * actually sees (the fork if one exists, otherwise same as enrolledCourseId).
 */
export async function loadStudentSession(userId, area, institutionId) {
  // Auto-conceder los cursos habilitados para el colegio del estudiante que aún
  // no tenga (modelo estricto user_courses). Cierra el hueco de los estudiantes
  // que se registran DESPUÉS de habilitar el curso por colegio: autoEnroll solo
  // corre sobre los existentes al momento del toggle. La RPC (SECURITY DEFINER,
  // migración 0028) se acota al propio colegio y respeta revocaciones por usuario.
  // Se espera ANTES de leer las tablas para que el acceso recién dado ya cuente.
  // Si la migración 0028 aún no está aplicada, no bloquear el login.
  try { await supabase.rpc('sync_my_institution_courses') } catch (_) { /* noop */ }

  const [{ data: enrollmentsData }, { data: legacyProgress }, { data: accessData }, { data: unlocksData }, { data: quizAttemptsData }] = await Promise.all([
    supabase.from('course_enrollments').select('course_id').eq('student_id', userId),
    supabase.from('progress').select('xp,completed,badges').eq('user_id', userId).maybeSingle(),
    supabase.from('user_courses').select('course_id').eq('user_id', userId).eq('is_active', true),
    supabase.from('presence_unlocks').select('module_id').eq('user_id', userId),
    supabase.from('quiz_attempts').select('module_id, attempts, passed').eq('user_id', userId),
  ])
  const unlockedPresenceModules = (unlocksData || []).map(u => u.module_id)
  const quizAttempts = quizAttemptsData || []

  const allEnrollments = (enrollmentsData || []).map(e => e.course_id)
  const allowedIds     = new Set((accessData || []).map(a => a.course_id))
  // user_courses es el gate estricto: si el estudiante tiene acceso gestionado
  // (alguna fila en user_courses), la matrícula "actual" debe ser una a la que
  // siga teniendo acceso activo — nunca una matrícula vieja/revocada que quedó
  // en course_enrollments (revocar acceso no borra la matrícula, ver CLAUDE.md).
  // Si no tiene NINGUNA fila en user_courses (acceso aún no gestionado para
  // este usuario), se conserva el comportamiento legacy de usar la primera matrícula.
  const enrolledCourseId =
    allEnrollments.find(id => allowedIds.has(id)) ??
    (allowedIds.size === 0 ? (allEnrollments[0] || null) : null)

  if (!enrolledCourseId) {
    return {
      enrolledCourseId: null,
      effectiveCourseId: null,
      courseModules: [],
      allEnrollments: [],
      unlockedPresenceModules,
      quizAttempts,
      xp:        legacyProgress?.xp        || 0,
      completed: legacyProgress?.completed || [],
      badges:    legacyProgress?.badges    || [],
    }
  }

  // Resolver si existe una copia del tutor para el colegio del estudiante
  let effectiveCourseId = enrolledCourseId
  if (institutionId) {
    const { data: fork } = await supabase.from('courses')
      .select('id')
      .eq('parent_course_id', enrolledCourseId)
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .maybeSingle()
    if (fork?.id) effectiveCourseId = fork.id
  }

  // RPC en vez de select('*') plano: los módulos con requires_presence_code
  // que este estudiante aún no desbloqueó llegan con content/challenge_data
  // vacíos — el servidor nunca los envía hasta canjear el código (0040).
  const [{ data: modulesData }, { data: cp }] = await Promise.all([
    supabase.rpc('get_course_modules_for_student', { p_course_id: effectiveCourseId }),
    supabase.from('course_progress').select('xp,completed,badges')
      .eq('user_id', userId).eq('course_id', enrolledCourseId).maybeSingle(),
  ])

  const courseModules = dbRowsToCourseModules(modulesData, area)

  // course_progress wins; fallback to legacy XP when student has no course_progress yet
  const xp        = cp?.xp        ?? legacyProgress?.xp        ?? 0
  const completed = cp?.completed ?? legacyProgress?.completed ?? []
  const badges    = cp?.badges    ?? legacyProgress?.badges    ?? []

  return { enrolledCourseId, effectiveCourseId, courseModules, allEnrollments, unlockedPresenceModules, quizAttempts, xp, completed, badges }
}
