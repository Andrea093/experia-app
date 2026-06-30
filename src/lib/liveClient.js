import { supabase } from './supabaseClient.js'
// =============================================
// EXPERIA — Modo Aula en Vivo (cliente)
// Envoltorios de las RPC + suscripciones realtime de Supabase.
// =============================================

// --- Profesor ---
export const createLiveSession = async ({ courseId, moduleId, title, questions, defaultTime = 20 }) => {
  const { data, error } = await supabase.rpc('create_live_session', {
    p_course_id: courseId || null, p_module_id: moduleId || null,
    p_title: title || null, p_questions: questions || [], p_default_time: defaultTime,
  })
  if (error) throw error
  return data
}
export const liveSetPhase = (session, phase) => supabase.rpc('live_set_phase', { p_session: session, p_phase: phase })
export const liveGoto     = (session, index) => supabase.rpc('live_goto',     { p_session: session, p_index: index })
export const liveEnd      = (session)        => supabase.rpc('live_end',      { p_session: session })

// --- Estudiante ---
export const joinLiveSession = async ({ code, nombre, apellido, correo, salon }) => {
  const { data, error } = await supabase.rpc('join_live_session', {
    p_code: code, p_nombre: nombre, p_apellido: apellido || null, p_correo: correo || null, p_salon: salon || null,
  })
  if (error) throw error
  return data
}
export const submitLiveAnswer = async ({ session, participant, index, answer }) => {
  const { data, error } = await supabase.rpc('submit_live_answer', {
    p_session: session, p_participant: participant, p_index: index, p_answer: answer,
  })
  if (error) throw error
  return data
}

// --- Lectura ---
export const fetchSession = async (id) => {
  const { data } = await supabase.from('live_sessions').select('*').eq('id', id).single()
  return data
}
export const fetchSessionByCode = async (code) => {
  const { data } = await supabase.from('live_sessions').select('id,code,status,title')
    .eq('code', code).neq('status', 'ended').order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data
}
export const fetchParticipants = async (sessionId) => {
  const { data } = await supabase.from('live_participants').select('*')
    .eq('session_id', sessionId).order('score', { ascending: false }).order('joined_at', { ascending: true })
  return data || []
}
export const fetchAnswerCounts = async (sessionId, index, numOptions) => {
  const { data } = await supabase.from('live_answers').select('answer_index')
    .eq('session_id', sessionId).eq('question_index', index)
  const counts = Array(numOptions).fill(0)
  ;(data || []).forEach(r => { if (r.answer_index >= 0 && r.answer_index < numOptions) counts[r.answer_index]++ })
  return counts
}

// --- Realtime ---
export const subscribeSession = (id, cb) =>
  supabase.channel('live-session-' + id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `id=eq.${id}` },
        payload => cb(payload.new))
    .subscribe()
export const subscribeParticipants = (sessionId, cb) =>
  supabase.channel('live-parts-' + sessionId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_participants', filter: `session_id=eq.${sessionId}` },
        () => cb())
    .subscribe()
export const unsubscribe = (ch) => { if (ch) supabase.removeChannel(ch) }
