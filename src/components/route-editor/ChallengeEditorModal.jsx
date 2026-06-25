import React from 'react'
import { Btn, Modal } from '../ui.jsx'
import { DragDropEditorContent, EmpathyEditorContent, MatchingEditorContent, SimulationEditorContent, TrueFalseEditorContent, FillBlankEditorContent } from './EditorContents.jsx'

const TYPE_CONTENT_MAP = {
  dragdrop:   DragDropEditorContent,
  empathy:    EmpathyEditorContent,
  matching:   MatchingEditorContent,
  simulation: SimulationEditorContent,
  truefalse:  TrueFalseEditorContent,
  fillblank:  FillBlankEditorContent,
}
const TYPE_TITLE = {
  dragdrop:   'Arrastrar y ordenar',
  empathy:    'Mapa de empatía',
  matching:   'Conectar conceptos',
  simulation: 'Simulación',
  truefalse:  'Verdadero / Falso',
  fillblank:  'Completar espacios',
}

const ChallengeEditorModal = ({ open, mod, onClose, onSave }) => {
  const [title, setTitle] = React.useState('')
  const [desc, setDesc]   = React.useState('')
  const [task, setTask]   = React.useState('')
  const [xp, setXp]       = React.useState(0)
  const typeDataRef = React.useRef({})

  React.useEffect(() => {
    if (open && mod) {
      setTitle(mod.title || '')
      setDesc(mod.desc || '')
      setTask(mod.task || '')
      setXp(mod.xp || 0)
      typeDataRef.current = {}
    }
  }, [open, mod?.id])

  if (!mod) return null

  const TypeContent = TYPE_CONTENT_MAP[mod.ctype]
  const inp = { padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose}
      title={`Editar ${TYPE_TITLE[mod.ctype] || 'reto'}: ${mod.isNew ? '' : mod.title}`}
      width={620}>
      <div style={{ maxHeight: '72vh', overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Información general</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del reto *" style={inp} />
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} placeholder="XP" min={0} style={inp} />
          </div>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción breve (aparece en el mapa)" style={inp} />
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Instrucción al estudiante: ¿qué debe hacer?" style={inp} />
        </div>

        {TypeContent && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Contenido del reto — {TYPE_TITLE[mod.ctype]}
            </p>
            <TypeContent mod={mod} onChange={data => { typeDataRef.current = data }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          {!mod.isNew && mod.override && (
            <Btn variant="secondary" onClick={() => onSave({ __clearOverride: true })}>Restablecer original</Btn>
          )}
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={() => onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 0, ...typeDataRef.current })}>
            Guardar cambios
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

export default ChallengeEditorModal
