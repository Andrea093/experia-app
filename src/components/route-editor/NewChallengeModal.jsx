import React from 'react'
import { Btn, Modal } from '../ui.jsx'
import { CHALLENGE_TYPES } from './constants.js'

const NewChallengeModal = ({ open, onClose, onCreate }) => {
  const [ctype, setCtype] = React.useState(null)
  const [title, setTitle] = React.useState('')
  const [desc, setDesc]   = React.useState('')
  const [task, setTask]   = React.useState('')
  const [xp, setXp]       = React.useState(100)
  const [err, setErr]     = React.useState('')

  React.useEffect(() => {
    if (open) { setCtype(null); setTitle(''); setDesc(''); setTask(''); setXp(100); setErr('') }
  }, [open])

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title="Crear nuevo reto" width={560}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 10 }}>Tipo de reto *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {CHALLENGE_TYPES.map(t => (
            <button key={t.id} onClick={() => { setCtype(t.id); setErr('') }}
              style={{ padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'center', transition: 'all .15s',
                border: ctype === t.id ? '2px solid var(--orange)' : '1.5px solid var(--border)',
                background: ctype === t.id ? 'var(--orange-bg)' : 'var(--white)' }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{t.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ctype === t.id ? 'var(--orange)' : 'var(--dark)' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="Ej: Evaluación de comprensión lectora" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} style={inp} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Resumen para el mapa de aprendizaje" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción al estudiante</label>
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Lee cada situación y elige la mejor opción" style={inp} />
        </div>
      </div>
      {err && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 10 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => {
          if (!ctype) { setErr('Selecciona un tipo de reto'); return }
          if (!title.trim()) { setErr('El título es obligatorio'); return }
          onCreate({ ctype, title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100 })
        }}>
          Continuar → editar contenido
        </Btn>
      </div>
    </Modal>
  )
}

export default NewChallengeModal
