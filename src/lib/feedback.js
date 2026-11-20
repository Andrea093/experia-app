import { supabase } from './supabaseClient.js'
// =============================================
// EXPERIA — "Ayúdanos a mejorar": comentarios de los profesores sobre la
// plataforma (0088, tabla platform_feedback). Solo instructores/admin
// escriben; el autor lo completa un trigger desde el perfil. Solo el admin lee
// (Admin → Comentarios).
// =============================================

export const FEEDBACK_CATEGORIES = [
  { id: 'aula-en-vivo', label: 'Aula en Vivo' },
  { id: 'ruta', label: 'Editor de ruta / preguntas' },
  { id: 'estudiantes', label: 'Experiencia de los estudiantes' },
  { id: 'resultados', label: 'Resultados y analítica' },
  { id: 'error', label: 'Algo no funciona' },
  { id: 'idea', label: 'Idea o sugerencia' },
  { id: 'otro', label: 'Otro' },
]

export const sendFeedback = async ({ message, category, rating, page }) => {
  const { error } = await supabase.from('platform_feedback')
    .insert({ message: message.trim(), category: category || null, rating: rating || null, page: page || null })
  if (error) throw error
}

export const fetchFeedback = async () => {
  const { data, error } = await supabase.from('platform_feedback')
    .select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) throw error
  return data || []
}

export const setFeedbackStatus = async (id, status) => {
  const { error } = await supabase.from('platform_feedback').update({ status }).eq('id', id)
  if (error) throw error
}
