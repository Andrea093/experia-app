import React from 'react'
import { useStore } from '../store/store.jsx'
import { Modal, Btn, useMobile } from './ui.jsx'
import { FEEDBACK_CATEGORIES, sendFeedback } from '../lib/feedback.js'
// =============================================
// EXPERIA — Botón "Ayúdanos a mejorar" del profesor (nov 2026, 0088)
// En la cabecera de los instructores. Abre un formulario corto: de qué se trata,
// una calificación opcional (1–5) y el comentario. Se guarda en
// platform_feedback con la página donde estaba; el admin los lee en
// Admin → Comentarios. Va lazy desde Header: los estudiantes no lo descargan.
// =============================================

const FeedbackButton = () => {
  const page = useStore(s => s.page)
  const isMobile = useMobile()
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState('aula-en-vivo')
  const [rating, setRating] = React.useState(0)
  const [message, setMessage] = React.useState('')
  const [status, setStatus] = React.useState('idle') // idle | sending | sent | error

  const close = () => { setOpen(false); if (status === 'sent') { setMessage(''); setRating(0); setStatus('idle') } }
  const submit = async () => {
    if (message.trim().length < 3) return
    setStatus('sending')
    try {
      await sendFeedback({ message, category, rating, page })
      setStatus('sent')
    } catch (e) {
      console.error('feedback:', e)
      setStatus('error')
    }
  }

  return (
    <>
      <button onClick={() => { setStatus(s => (s === 'sent' ? 'idle' : s)); setOpen(true) }}
        title="Cuéntanos qué mejorarías de la plataforma"
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: isMobile ? '0 10px' : '0 12px', borderRadius: 10,
          border: '1.5px solid var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
        💬{!isMobile && ' Ayúdanos a mejorar'}
      </button>
      <Modal open={open} onClose={close} title="Ayúdanos a mejorar" width={480}>
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <div style={{ fontSize: 42 }}>🙌</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '8px 0 4px' }}>¡Gracias! Recibimos tu comentario.</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>El equipo de CEINFES lo revisará para mejorar Experia.</p>
            <Btn variant="gradient" onClick={close}>Cerrar</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: 0, lineHeight: 1.5 }}>
              ¿Qué te funciona, qué te estorba o qué te gustaría que hiciera la plataforma? Lo lee el equipo de CEINFES.
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Sobre qué es</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FEEDBACK_CATEGORIES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
                    style={{ padding: '6px 11px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
                      border: category === c.id ? 'none' : '1px solid var(--border)',
                      background: category === c.id ? 'var(--orange)' : 'var(--bg)', color: category === c.id ? '#fff' : 'var(--muted)' }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>¿Qué tan útil te parece la plataforma? (opcional)</label>
              <div style={{ display: 'flex', gap: 4 }} role="radiogroup" aria-label="Calificación de 1 a 5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} de 5`}
                    onClick={() => setRating(r => (r === n ? 0 : n))}
                    style={{ width: 38, height: 38, border: 'none', background: 'none', cursor: 'pointer', fontSize: 26, lineHeight: 1,
                      color: n <= rating ? '#F59E0B' : 'var(--border)' }}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tu comentario *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 4000))} rows={5} autoFocus
                placeholder="Ej: en la clase en vivo me gustaría poder ver quién no ha respondido…"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)',
                  fontFamily: 'var(--font)', fontSize: 14, color: 'var(--dark)', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            {status === 'error' && <p style={{ fontSize: 12.5, color: 'var(--error)', margin: 0 }}>No se pudo enviar. Revisa tu conexión e intenta de nuevo.</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" full onClick={close}>Cancelar</Btn>
              <Btn variant="gradient" full disabled={message.trim().length < 3 || status === 'sending'} onClick={submit}>
                {status === 'sending' ? 'Enviando…' : 'Enviar comentario'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default FeedbackButton
