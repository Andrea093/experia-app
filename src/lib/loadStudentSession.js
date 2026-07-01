import { supabase } from './supabaseClient.js'
import { dbModToAppMod } from '../store/store.jsx'

/**
 * Loads all course-related state for a student in a single optimised call.
 * - If enrolled: fetches course_modules + course_progress in parallel.
 * - If not enrolled: falls back to legacy `progress` table.
 * - Resolves a tutor's fork of the course for the student's institution
 *   (if one exists) so the student sees the customised version.
 * Returns { enrolledCourseId, courseModules, allEnrollments, xp, completed, badges }
 */
export async function loadStudentSession(userId, area, institutionId) {
  const [{ data: enrollmentsData }, { data: legacyProgress }] = await Promise.all([
    supabase.from('course_enrollments').select('course_id').eq('student_id', userId),
    supabase.from('progress').select('xp,completed,badges').eq('user_id', userId).maybeSingle(),
  ])

  const allEnrollments   = (enrollmentsData || []).map(e => e.course_id)
  const enrolledCourseId = allEnrollments[0] || null

  if (!enrolledCourseId) {
    return {
      enrolledCourseId: null,
      courseModules: [],
      allEnrollments: [],
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

  const [{ data: modulesData }, { data: cp }] = await Promise.all([
    supabase.from('course_modules').select('*')
      .eq('course_id', effectiveCourseId).eq('is_enabled', true).order('"order"'),
    supabase.from('course_progress').select('xp,completed,badges')
      .eq('user_id', userId).eq('course_id', enrolledCourseId).maybeSingle(),
  ])

  const filtered = area
    ? (modulesData || []).filter(row => !row.area_id || row.area_id === area)
    : (modulesData || [])

  const courseModules = filtered.map((row, i) => {
    const mod = dbModToAppMod(row)
    mod.pos  = { x: i % 2 === 0 ? 38 : 62, y: row.order || i }
    mod.side = i % 2 === 0 ? 'right' : 'left'
    return mod
  })

  // course_progress wins; fallback to legacy XP when student has no course_progress yet
  const xp        = cp?.xp        ?? legacyProgress?.xp        ?? 0
  const completed = cp?.completed ?? legacyProgress?.completed ?? []
  const badges    = cp?.badges    ?? legacyProgress?.badges    ?? []

  return { enrolledCourseId, courseModules, allEnrollments, xp, completed, badges }
}
