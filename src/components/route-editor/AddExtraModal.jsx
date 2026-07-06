import React from 'react'
import { Btn, Modal } from '../ui.jsx'

const AddExtraModal = ({ open, onClose, onAdd }) => {
  const [type, setType]   = React.useState('video')
  const [title, setTitle] = React.useState('')
  const [url, setUrl]     = React.useState('')
  const [text, setText]   = React.useState('')
  const [err, setErr]     = React.useState('')

  const reset = () => { setType('video'); setTitle(''); setUrl(''); setText(''); setErr('') }
  const handleClose = () => { reset(); onClose() }

  const handleAdd = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if ((type === 'video' || type === 'embed') && !url.trim()) { setErr('La URL es obligatoria'); return }
    if (type === 'text' && !text.trim()) { setErr('El contenido es obligatorio'); return }
    onAdd({ type, title: title.trim(), url: url.trim(), text: text.trim() })
    reset()
  }

  const inp = (hasErr) => ({
    width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)',
  })

  return (
    <Modal open={open} onClose={handleClose} title="Agregar recurso extra" width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 8 }}>Tipo de recurso</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'video', label: '🎬 Video YouTube' }, { id: 'embed', label: '🧩 Embed' }, { id: 'text', label: '📝 Texto / Nota' }].map(opt => (
              <button key={opt.id} onClick={() => { setType(opt.id); setErr('') }}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: type === opt.id ? 'var(--orange)' : 'var(--bg-alt)',
                  color: type === opt.id ? '#fff' : 'var(--muted)' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Título del recurso</label>
          <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }}
            placeholder="Ej: Video complementario sobre DCE" style={inp(err && !title)} autoFocus />
        </div>

        {type === 'video' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>URL de YouTube</label>
            <input value={url} onChange={e => { setUrl(e.target.value); setErr('') }}
              placeholder="https://www.youtube.com/watch?v=..." style={inp(err && !url)} />
          </div>
        )}

        {type === 'embed' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>URL del embed (Genially, Canva, H5P…)</label>
            <input value={url} onChange={e => { setUrl(e.target.value); setErr('') }}
              placeholder="https://view.genially.com/..." style={inp(err && !url)} />
          </div>
        )}

        {type === 'text' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Contenido</label>
            <textarea value={text} onChange={e => { setText(e.target.value); setErr('') }}
              placeholder="Escribe aquí el texto adicional para los estudiantes..."
              rows={4} style={{ ...inp(err && !text), resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        )}

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" full onClick={handleClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleAdd}>Agregar recurso</Btn>
        </div>
      </div>
    </Modal>
  )
}

export default AddExtraModal
