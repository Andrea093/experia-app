// Transforma filas de Supabase al formato que usa el store

export const mapSubmission = (row, profiles = [], instById = {}) => {
  const profile = profiles.find(p => p.id === row.student_id) || {}
  return {
    id:                 row.id,
    studentName:        profile.name  || 'Desconocido',
    studentEmail:       profile.email || '',
    studentInstitution: instById[profile.institution_id] || '',
    area:               row.area,
    rejillaName:        row.rejilla_name,
    rejillaData:        row.rejilla_data,
    preguntaName:       row.pregunta_name,
    preguntaData:       row.pregunta_data,
    grade:              row.grade   ?? null,
    feedback:           row.feedback ?? '',
    status:             row.status   || 'pending',
    returnCount:        row.return_count || 0,
    returnNotes:        row.return_notes || '',
    instrRejillaName:   row.instr_rejilla_name,
    instrRejillaData:   row.instr_rejilla_data,
    instrPreguntaName:  row.instr_pregunta_name,
    instrPreguntaData:  row.instr_pregunta_data,
    history:            row.history || [],
    date:               row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }
}

export const mapAttempt = (row, profiles = []) => {
  const profile = profiles.find(p => p.id === row.student_id) || {}
  return {
    id:           row.id,
    studentEmail: profile.email || '',
    studentName:  profile.name  || 'Desconocido',
    challengeId:  row.challenge_id,
    courseId:     row.course_id || null,
    moduleId:     row.module_id || null,
    attemptNo:    row.attempt_no || 1,
    area:         row.area,
    questions:    row.questions || [],
    score:        row.score,
    maxScore:     row.max_score,
    date:         row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }
}
