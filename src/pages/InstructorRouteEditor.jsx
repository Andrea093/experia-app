import React from 'react'
import { useStore, AREAS, getStudentModules, saveRouteConfig } from '../store/store.jsx'
import {
  useMobile,
  ChevRIc, XIc, PlusIc, TrashIc, EditIc, GripIc, CheckIc,
  Btn, Modal,
} from '../components/ui.jsx'

const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN' }
const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#10B981' }
const TYPE_BG    = { lesson: 'var(--orange-bg)', challenge: 'var(--purple-bg)', evaluation: '#D1FAE5' }

const PAIR_COLORS = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B','#EC4899']

// ---- Inline content components (no Modal wrapper, call onChange on data change) ----

const DragDropEditorContent = ({ mod, onChange }) => {
  const [items, setItems] = React.useState([])
  const [dIdx, setDIdx] = React.useState(null)
  const [oIdx, setOIdx] = React.useState(null)
  React.useEffect(() => {
    const init = mod?.dragItems || mod?.override?.dragItems || ['Empatizar','Definir','Idear','Prototipar','Evaluar']
    setItems(init); onChange({ dragItems: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const update = (next) => { setItems(next); onChange({ dragItems: next }) }
  const drop = (i) => {
    if (dIdx === null || dIdx === i) { setDIdx(null); setOIdx(null); return }
    const next = [...items]; const [m] = next.splice(dIdx, 1); next.splice(i, 0, m)
    update(next); setDIdx(null); setOIdx(null)
  }
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', flex: 1 }
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Escribe los elementos en el <strong>orden correcto</strong>. Arrastra para reordenar.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <div key={i} draggable onDragStart={() => setDIdx(i)} onDragOver={e => { e.preventDefault(); setOIdx(i) }}
            onDrop={() => drop(i)} onDragEnd={() => { setDIdx(null); setOIdx(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10,
              background: 'var(--white)', border: oIdx === i ? '2px dashed var(--orange)' : '1px solid var(--border)',
              opacity: dIdx === i ? .4 : 1, transition: 'all .15s' }}>
            <GripIc s={15} c="var(--subtle)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', minWidth: 18 }}>{i + 1}.</span>
            <input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; update(n) }} style={inp} />
            <button onClick={() => { if (items.length > 2) update(items.filter((_, j) => j !== i)) }}
              disabled={items.length <= 2}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: items.length <= 2 ? .3 : 1 }}>
              <XIc s={12} c="var(--error)" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => update([...items, 'Nuevo elemento'])}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, marginTop: 8,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
        <PlusIc s={12} c="var(--orange)" /> Agregar elemento
      </button>
    </div>
  )
}

const EmpathyEditorContent = ({ mod, onChange }) => {
  const DEFAULT = [
    {id:1,text:'"No entiendo para qué sirve esto"',correct:'dice'},
    {id:2,text:'Se siente frustrado en las evaluaciones',correct:'siente'},
    {id:3,text:'Cree que las matemáticas son difíciles',correct:'piensa'},
    {id:4,text:'Copia las respuestas de su compañero',correct:'hace'},
    {id:5,text:'Ansiedad antes de los exámenes',correct:'siente'},
    {id:6,text:'"Me gustan las clases con experimentos"',correct:'dice'},
    {id:7,text:'Piensa que el profesor va muy rápido',correct:'piensa'},
    {id:8,text:'Participa cuando trabaja en grupo',correct:'hace'},
  ]
  const [cards, setCards] = React.useState([])
  React.useEffect(() => {
    const init = mod?.empathyCards || mod?.override?.empathyCards || DEFAULT.map(c => ({ ...c }))
    setCards(init); onChange({ empathyCards: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const upd = (next) => { setCards(next); onChange({ empathyCards: next }) }
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }
  const sel = { ...inp, background: 'var(--white)', cursor: 'pointer' }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 28px', gap: 8, marginBottom: 6 }}>
        {['Texto de la tarjeta','Cuadrante',''].map((h, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{h}</span>
        ))}
      </div>
      {cards.map(c => (
        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 28px', gap: 8, marginBottom: 7, alignItems: 'center' }}>
          <input value={c.text} onChange={e => upd(cards.map(x => x.id === c.id ? { ...x, text: e.target.value } : x))} style={inp} />
          <select value={c.correct} onChange={e => upd(cards.map(x => x.id === c.id ? { ...x, correct: e.target.value } : x))} style={sel}>
            {['piensa','siente','dice','hace'].map(q => <option key={q} value={q}>{q.charAt(0).toUpperCase()+q.slice(1)}</option>)}
          </select>
          <button onClick={() => { if (cards.length > 4) upd(cards.filter(x => x.id !== c.id)) }} disabled={cards.length <= 4}
            style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cards.length <= 4 ? .3 : 1 }}>
            <XIc s={13} c="var(--error)" />
          </button>
        </div>
      ))}
      <button onClick={() => upd([...cards, { id: Date.now(), text: '', correct: 'piensa' }])}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, marginTop: 4,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
        <PlusIc s={12} c="var(--orange)" /> Agregar tarjeta
      </button>
    </div>
  )
}

const MatchingEditorContent = ({ mod, onChange }) => {
  const [pairs, setPairs] = React.useState([])
  React.useEffect(() => {
    const init = (mod?.matchPairs || mod?.override?.matchPairs || [
      {id:1,concept:'',def:'',color:'#E8732C'},{id:2,concept:'',def:'',color:'#7B3FA0'},
      {id:3,concept:'',def:'',color:'#3B82F6'},{id:4,concept:'',def:'',color:'#10B981'},
    ]).map(p => ({ ...p }))
    setPairs(init); onChange({ matchPairs: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const upd = (next) => { setPairs(next); onChange({ matchPairs: next }) }
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 6 }}>
        {['','Concepto','Definición',''].map((h, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{h}</span>
        ))}
      </div>
      {pairs.map((p, i) => (
        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div onClick={() => { const idx = PAIR_COLORS.indexOf(p.color); upd(pairs.map(x => x.id === p.id ? { ...x, color: PAIR_COLORS[(idx+1)%PAIR_COLORS.length] } : x)) }}
            title="Clic para cambiar color"
            style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, cursor: 'pointer' }} />
          <input value={p.concept} onChange={e => upd(pairs.map(x => x.id === p.id ? { ...x, concept: e.target.value } : x))}
            placeholder={`Concepto ${i+1}`} style={inp} />
          <input value={p.def} onChange={e => upd(pairs.map(x => x.id === p.id ? { ...x, def: e.target.value } : x))}
            placeholder={`Definición ${i+1}`} style={inp} />
          <button onClick={() => { if (pairs.length > 2) upd(pairs.filter(x => x.id !== p.id)) }} disabled={pairs.length <= 2}
            style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pairs.length <= 2 ? .3 : 1 }}>
            <XIc s={13} c="var(--error)" />
          </button>
        </div>
      ))}
      <button onClick={() => upd([...pairs, { id: Date.now(), concept: '', def: '', color: PAIR_COLORS[pairs.length % PAIR_COLORS.length] }])}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, marginTop: 4,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
        <PlusIc s={12} c="var(--orange)" /> Agregar par
      </button>
    </div>
  )
}

const SimulationEditorContent = ({ mod, onChange }) => {
  const DEFAULT_TREE = {
    start:{ text:'Describe la situación inicial...', options:[
      {text:'Opción A (mejor enfoque DCE)',next:'end_high',points:3},
      {text:'Opción B (enfoque parcial)',next:'end_mid',points:2},
      {text:'Opción C (enfoque tradicional)',next:'end_low',points:1},
    ]},
    end_high:{ text:'🌟 ¡Excelente decisión pedagógica!', end:true },
    end_mid: { text:'👍 Buena decisión. Aplica más principios DCE.', end:true },
    end_low: { text:'💪 Enfoque tradicional. El DCE sugiere escuchar primero.', end:true },
  }
  const [nodes, setNodes] = React.useState({})
  React.useEffect(() => {
    const init = mod?.simTree || mod?.override?.simTree || DEFAULT_TREE
    setNodes(init); onChange({ simTree: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const upd = (next) => { setNodes(next); onChange({ simTree: next }) }
  const nodeIds = Object.keys(nodes)
  const nonEnd = nodeIds.filter(k => !nodes[k]?.end)
  const ends   = nodeIds.filter(k =>  nodes[k]?.end)
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {nonEnd.map(nid => (
        <div key={nid} style={{ padding: 12, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>
              {nid === 'start' ? '🟢 Inicio' : `📍 ${nid}`}
            </span>
            {nid !== 'start' && (
              <button onClick={() => { const n = { ...nodes }; delete n[nid]; upd(n) }}
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XIc s={11} c="var(--error)" />
              </button>
            )}
          </div>
          <textarea value={nodes[nid]?.text||''} onChange={e => upd({ ...nodes, [nid]: { ...nodes[nid], text: e.target.value } })}
            placeholder="Describe la situación..." rows={2} style={{ ...inp, resize: 'vertical', marginBottom: 8 }} />
          {(nodes[nid]?.options||[]).map((opt, oi) => (
            <div key={oi} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 46px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <input value={opt.text} onChange={e => upd({ ...nodes, [nid]: { ...nodes[nid], options: nodes[nid].options.map((o,i)=>i===oi?{...o,text:e.target.value}:o) } })}
                placeholder={`Opción ${oi+1}`} style={inp} />
              <select value={opt.next} onChange={e => upd({ ...nodes, [nid]: { ...nodes[nid], options: nodes[nid].options.map((o,i)=>i===oi?{...o,next:e.target.value}:o) } })}
                style={{ ...inp, cursor: 'pointer', fontSize: 11 }}>
                {nodeIds.filter(k=>k!==nid).map(k=><option key={k} value={k}>{nodes[k]?.end?`✅ ${k}`:k}</option>)}
              </select>
              <select value={opt.points} onChange={e => upd({ ...nodes, [nid]: { ...nodes[nid], options: nodes[nid].options.map((o,i)=>i===oi?{...o,points:Number(e.target.value)}:o) } })}
                style={{ ...inp, cursor: 'pointer' }}>
                {[1,2,3].map(p=><option key={p} value={p}>{p}pts</option>)}
              </select>
              <button onClick={() => { if ((nodes[nid]?.options||[]).length>1) upd({ ...nodes, [nid]: { ...nodes[nid], options: nodes[nid].options.filter((_,i)=>i!==oi) } }) }}
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XIc s={11} c="var(--error)" />
              </button>
            </div>
          ))}
          <button onClick={() => upd({ ...nodes, [nid]: { ...nodes[nid], options: [...(nodes[nid].options||[]), { text:'', next: ends[0]||'end_high', points:2 }] } })}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
            <PlusIc s={10} c="var(--orange)" /> Opción
          </button>
        </div>
      ))}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>Resultados finales</p>
        {ends.map(nid => (
          <div key={nid} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', minWidth: 70, flexShrink: 0 }}>{nid}</span>
            <input value={nodes[nid]?.text||''} onChange={e => upd({ ...nodes, [nid]: { ...nodes[nid], text: e.target.value } })}
              placeholder="Texto del resultado..." style={{ ...inp, flex: 1 }} />
            <button onClick={() => { if (ends.length > 1) { const n = { ...nodes }; delete n[nid]; upd(n) } }} disabled={ends.length <= 1}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: ends.length<=1?.3:1 }}>
              <XIc s={12} c="var(--error)" />
            </button>
          </div>
        ))}
        <button onClick={() => { const id='end_'+Date.now(); upd({ ...nodes, [id]: { text:'📝 Resultado...', end:true } }) }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px dashed var(--success)', background: '#F0FDF4', color: 'var(--success)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
          <PlusIc s={10} c="var(--success)" /> Resultado
        </button>
      </div>
    </div>
  )
}

// ---- Full Challenge Editor Modal (common fields + type-specific content) ----
const TYPE_CONTENT_MAP = {
  dragdrop:   DragDropEditorContent,
  empathy:    EmpathyEditorContent,
  matching:   MatchingEditorContent,
  simulation: SimulationEditorContent,
}
const TYPE_TITLE = {
  dragdrop:   'Arrastrar y ordenar',
  empathy:    'Mapa de empatía',
  matching:   'Conectar conceptos',
  simulation: 'Simulación',
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

        {/* Common fields */}
        <div style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Información general</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del reto *" style={inp} />
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} placeholder="XP" min={0} style={inp} />
          </div>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción breve (aparece en el mapa)" style={inp} />
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Instrucción al estudiante: ¿qué debe hacer?" style={inp} />
        </div>

        {/* Type-specific content */}
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

// ---- DragDrop Editor ----
const DragDropEditorModal = ({ open, mod, onClose, onSave }) => {
  const [items, setItems] = React.useState([])
  const [dragIdx, setDragIdx] = React.useState(null)
  const [overIdx, setOverIdx] = React.useState(null)

  React.useEffect(() => {
    if (open && mod) setItems(mod.dragItems || ['Empatizar','Definir','Idear','Prototipar','Evaluar'])
  }, [open, mod])

  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...items]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setItems(next); setDragIdx(null); setOverIdx(null)
  }
  const update = (i, val) => setItems(it => it.map((x, idx) => idx === i ? val : x))
  const remove = (i) => setItems(it => it.filter((_, idx) => idx !== i))
  const add    = () => setItems(it => [...it, 'Nuevo elemento'])

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', flex: 1, boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title="Editar orden de arrastre" width={480}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        El orden en que escribas los elementos es el orden <strong>correcto</strong> que el estudiante debe reproducir. Arrastra para reordenar.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {items.map((item, i) => (
          <div key={i} draggable
            onDragStart={() => setDragIdx(i)} onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
            onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: dragIdx === i ? .4 : 1,
              border: overIdx === i ? '2px dashed var(--orange)' : '1px solid var(--border)',
              borderRadius: 10, padding: '8px 10px', background: 'var(--white)', transition: 'all .15s' }}>
            <GripIc s={16} c="var(--subtle)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', minWidth: 20 }}>{i + 1}.</span>
            <input value={item} onChange={e => update(i, e.target.value)} style={inp} />
            <button onClick={() => remove(i)} disabled={items.length <= 2}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: items.length <= 2 ? .3 : 1 }}>
              <XIc s={13} c="var(--error)" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
        border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
        cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
        <PlusIc s={13} c="var(--orange)" /> Agregar elemento
      </button>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ dragItems: items })}>Guardar</Btn>
      </div>
    </Modal>
  )
}

// ---- Empathy Editor ----
const QUADRANTS = ['piensa','siente','dice','hace']
const QUADRANT_LABELS = { piensa:'🧠 Piensa', siente:'❤️ Siente', dice:'💬 Dice', hace:'🤲 Hace' }

const EmpathyEditorModal = ({ open, mod, onClose, onSave }) => {
  const DEFAULT_CARDS = [
    {id:1,text:'"No entiendo para qué sirve esto"',correct:'dice'},
    {id:2,text:'Se siente frustrado en las evaluaciones',correct:'siente'},
    {id:3,text:'Cree que las matemáticas son difíciles',correct:'piensa'},
    {id:4,text:'Copia las respuestas de su compañero',correct:'hace'},
    {id:5,text:'Ansiedad antes de los exámenes',correct:'siente'},
    {id:6,text:'"Me gustan las clases con experimentos"',correct:'dice'},
    {id:7,text:'Piensa que el profesor va muy rápido',correct:'piensa'},
    {id:8,text:'Participa cuando trabaja en grupo',correct:'hace'},
  ]
  const [cards, setCards] = React.useState([])

  React.useEffect(() => {
    if (open && mod) setCards(mod.empathyCards || DEFAULT_CARDS.map(c => ({ ...c })))
  }, [open, mod])

  const update  = (id, key, val) => setCards(c => c.map(x => x.id === id ? { ...x, [key]: val } : x))
  const remove  = (id) => setCards(c => c.filter(x => x.id !== id))
  const addCard = () => setCards(c => [...c, { id: Date.now(), text: '', correct: 'piensa' }])

  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', flex: 1, boxSizing: 'border-box' }
  const sel = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)', cursor: 'pointer' }

  return (
    <Modal open={open} onClose={onClose} title="Editar tarjetas del mapa de empatía" width={560}>
      <div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 28px', gap: 8, marginBottom: 8 }}>
          {['Texto de la tarjeta','Cuadrante correcto',''].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{h}</span>
          ))}
        </div>
        {cards.map(card => (
          <div key={card.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={card.text} onChange={e => update(card.id, 'text', e.target.value)}
              placeholder='Ej: "No entiendo para qué sirve esto"' style={inp} />
            <select value={card.correct} onChange={e => update(card.id, 'correct', e.target.value)} style={sel}>
              {QUADRANTS.map(q => <option key={q} value={q}>{QUADRANT_LABELS[q]}</option>)}
            </select>
            <button onClick={() => remove(card.id)} disabled={cards.length <= 4}
              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cards.length <= 4 ? .3 : 1 }}>
              <XIc s={13} c="var(--error)" />
            </button>
          </div>
        ))}
        <button onClick={addCard} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, marginTop: 8,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
          <PlusIc s={13} c="var(--orange)" /> Agregar tarjeta
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ empathyCards: cards })}>Guardar</Btn>
      </div>
    </Modal>
  )
}

// ---- Simulation Editor (tree) ----
const SimulationEditorModal = ({ open, mod, onClose, onSave }) => {
  const DEFAULT_TREE = {
    start:{ text:'Describe la situación inicial...', options:[
      {text:'Opción A (mejor enfoque DCE)',next:'end_high',points:3},
      {text:'Opción B (enfoque parcial)',next:'end_mid',points:2},
      {text:'Opción C (enfoque tradicional)',next:'end_low',points:1},
    ]},
    end_high:{ text:'🌟 ¡Excelente decisión pedagógica!', end:true },
    end_mid: { text:'👍 Buena decisión. Considera aplicar más principios DCE.', end:true },
    end_low: { text:'💪 Esta decisión refleja un enfoque tradicional. El DCE sugiere escuchar primero.', end:true },
  }
  const [nodes, setNodes] = React.useState({})
  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  React.useEffect(() => {
    if (open && mod) setNodes(mod.simTree || DEFAULT_TREE)
  }, [open, mod])

  const nodeIds = Object.keys(nodes)
  const nonEndNodes = nodeIds.filter(k => !nodes[k]?.end)
  const endNodes    = nodeIds.filter(k =>  nodes[k]?.end)

  const updateNodeText = (id, text) => setNodes(n => ({ ...n, [id]: { ...n[id], text } }))
  const updateOpt  = (nodeId, oi, key, val) => setNodes(n => ({
    ...n, [nodeId]: { ...n[nodeId], options: n[nodeId].options.map((o, i) => i === oi ? { ...o, [key]: val } : o) }
  }))
  const addOpt     = (nodeId) => setNodes(n => ({
    ...n, [nodeId]: { ...n[nodeId], options: [...(n[nodeId].options || []), { text: '', next: endNodes[0] || 'end_high', points: 2 }] }
  }))
  const removeOpt  = (nodeId, oi) => setNodes(n => ({
    ...n, [nodeId]: { ...n[nodeId], options: n[nodeId].options.filter((_, i) => i !== oi) }
  }))
  const addEndNode = () => {
    const id = 'end_' + Date.now()
    setNodes(n => ({ ...n, [id]: { text: '📝 Resultado...', end: true } }))
  }
  const removeNode = (id) => {
    if (id === 'start') return
    const next = { ...nodes }; delete next[id]; setNodes(next)
  }
  const updateEndText = (id, text) => setNodes(n => ({ ...n, [id]: { ...n[id], text } }))

  return (
    <Modal open={open} onClose={onClose} title="Editar árbol de simulación" width={600}>
      <div style={{ maxHeight: '65vh', overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Decision nodes */}
        {nonEndNodes.map(nodeId => (
          <div key={nodeId} style={{ padding: 16, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>
                {nodeId === 'start' ? '🟢 Inicio' : `📍 Nodo: ${nodeId}`}
              </span>
              {nodeId !== 'start' && (
                <button onClick={() => removeNode(nodeId)}
                  style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XIc s={13} c="var(--error)" />
                </button>
              )}
            </div>
            <textarea value={nodes[nodeId]?.text || ''} onChange={e => updateNodeText(nodeId, e.target.value)}
              placeholder="Describe la situación o pregunta..." rows={2}
              style={{ ...inp, resize: 'vertical', marginBottom: 10 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(nodes[nodeId]?.options || []).map((opt, oi) => (
                <div key={oi} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 50px 26px', gap: 6, alignItems: 'center' }}>
                  <input value={opt.text} onChange={e => updateOpt(nodeId, oi, 'text', e.target.value)}
                    placeholder={`Opción ${oi + 1}`} style={inp} />
                  <select value={opt.next} onChange={e => updateOpt(nodeId, oi, 'next', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {nodeIds.filter(k => k !== nodeId).map(k => (
                      <option key={k} value={k}>{nodes[k]?.end ? `✅ ${k}` : k}</option>
                    ))}
                  </select>
                  <select value={opt.points} onChange={e => updateOpt(nodeId, oi, 'points', Number(e.target.value))}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {[1,2,3].map(p => <option key={p} value={p}>{p} pts</option>)}
                  </select>
                  <button onClick={() => removeOpt(nodeId, oi)} disabled={(nodes[nodeId]?.options||[]).length <= 1}
                    style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (nodes[nodeId]?.options||[]).length <= 1 ? .3 : 1 }}>
                    <XIc s={12} c="var(--error)" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => addOpt(nodeId)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, marginTop: 8,
                border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
              <PlusIc s={11} c="var(--orange)" /> Opción
            </button>
          </div>
        ))}

        {/* End nodes */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Resultados finales</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {endNodes.map(nodeId => (
              <div key={nodeId} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', minWidth: 80 }}>{nodeId}</span>
                <input value={nodes[nodeId]?.text || ''} onChange={e => updateEndText(nodeId, e.target.value)}
                  placeholder="Texto del resultado..." style={{ ...inp }} />
                <button onClick={() => removeNode(nodeId)} disabled={endNodes.length <= 1}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: endNodes.length <= 1 ? .3 : 1 }}>
                  <XIc s={13} c="var(--error)" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addEndNode} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, marginTop: 8,
            border: '1.5px dashed var(--success)', background: '#F0FDF4', color: 'var(--success)',
            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
            <PlusIc s={11} c="var(--success)" /> Agregar resultado
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ simTree: nodes })}>Guardar</Btn>
      </div>
    </Modal>
  )
}

// ---- DesignLab Editor ----
const STEP_EMOJIS = ['❤️','🎯','💡','🔧','📊','🧪','🌍','🎭','📋','🤔']

// ---- Matching Editor Modal ----
const MatchingEditorModal = ({ open, mod, onClose, onSave }) => {
  const [pairs, setPairs] = React.useState([])

  React.useEffect(() => {
    if (open && mod) {
      setPairs(mod.matchPairs?.length
        ? mod.matchPairs.map(p => ({ ...p }))
        : Array.from({ length: 4 }, (_, i) => ({ id: i + 1, concept: '', def: '', color: PAIR_COLORS[i] }))
      )
    }
  }, [open, mod])

  const update = (id, key, val) => setPairs(p => p.map(x => x.id === id ? { ...x, [key]: val } : x))
  const addPair = () => setPairs(p => [...p, { id: Date.now(), concept: '', def: '', color: PAIR_COLORS[p.length % PAIR_COLORS.length] }])
  const remove  = (id) => setPairs(p => p.filter(x => x.id !== id))
  const cycleColor = (id) => {
    setPairs(p => p.map(x => {
      if (x.id !== id) return x
      const idx = PAIR_COLORS.indexOf(x.color)
      return { ...x, color: PAIR_COLORS[(idx + 1) % PAIR_COLORS.length] }
    }))
  }

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title={`Editar pares: ${mod?.title || ''}`} width={600}>
      <div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 8, padding: '0 2px' }}>
          {['', 'Concepto', 'Definición', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{h}</span>
          ))}
        </div>
        {pairs.map((pair, i) => (
          <div key={pair.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div onClick={() => cycleColor(pair.id)} title="Clic para cambiar color"
              style={{ width: 14, height: 14, borderRadius: '50%', background: pair.color, cursor: 'pointer', flexShrink: 0 }} />
            <input value={pair.concept} onChange={e => update(pair.id, 'concept', e.target.value)}
              placeholder={`Concepto ${i + 1}`} style={inp} />
            <input value={pair.def} onChange={e => update(pair.id, 'def', e.target.value)}
              placeholder={`Definición ${i + 1}`} style={inp} />
            <button onClick={() => remove(pair.id)} disabled={pairs.length <= 2}
              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: pairs.length <= 2 ? .3 : 1 }}>
              <XIc s={13} c="var(--error)" />
            </button>
          </div>
        ))}
        <button onClick={addPair}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, marginTop: 8,
            border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
          <PlusIc s={13} c="var(--orange)" /> Agregar par
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ matchPairs: pairs })}>Guardar cambios</Btn>
      </div>
    </Modal>
  )
}

// ---- Quiz Creator Modal ----
const QuizCreatorModal = ({ open, initial, onClose, onSave }) => {
  const [title, setTitle]   = React.useState('')
  const [desc, setDesc]     = React.useState('')
  const [task, setTask]     = React.useState('')
  const [xp, setXp]         = React.useState(100)
  const [questions, setQs]  = React.useState([])
  const [err, setErr]       = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 100)
      setQs(initial?.questions || [{ id: 1, question: '', options: ['', '', '', ''], correct: 0 }])
      setErr('')
    }
  }, [open, initial])

  const addQ = () => setQs(q => [...q, { id: Date.now(), question: '', options: ['', '', '', ''], correct: 0 }])
  const removeQ = (id) => setQs(q => q.filter(x => x.id !== id))
  const updateQ = (id, key, val) => setQs(q => q.map(x => x.id === id ? { ...x, [key]: val } : x))
  const updateOpt = (qId, optIdx, val) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const opts = [...x.options]; opts[optIdx] = val
    return { ...x, options: opts }
  }))

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if (!questions.length) { setErr('Agrega al menos una pregunta'); return }
    const incomplete = questions.find(q => !q.question.trim() || q.options.some(o => !o.trim()))
    if (incomplete) { setErr('Completa todas las preguntas y opciones'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100, questions, type: 'challenge', ctype: 'quiz' })
  }

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar reto Quiz' : 'Crear reto Quiz'} width={600}>
      <div style={{ maxHeight: '72vh', overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="Ej: Evaluación de conceptos clave" style={inp} autoFocus />
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
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Responde todas las preguntas y confirma cada respuesta" style={inp} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 12 }}>
            Preguntas ({questions.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, qi) => (
              <div key={q.id} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Pregunta {qi + 1}</span>
                  <button onClick={() => removeQ(q.id)} disabled={questions.length <= 1}
                    style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: questions.length <= 1 ? .3 : 1 }}>
                    <XIc s={13} c="var(--error)" />
                  </button>
                </div>
                <input value={q.question} onChange={e => updateQ(q.id, 'question', e.target.value)}
                  placeholder="Escribe la pregunta aquí..." style={{ ...inp, marginBottom: 10 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQ(q.id, 'correct', oi)}
                        title="Marcar como correcta"
                        style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                          background: q.correct === oi ? 'var(--success)' : 'var(--bg-alt)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {q.correct === oi
                          ? <CheckIc s={13} c="#fff" />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{String.fromCharCode(65 + oi)}</span>}
                      </button>
                      <input value={opt} onChange={e => updateOpt(q.id, oi, e.target.value)}
                        placeholder={`Opción ${String.fromCharCode(65 + oi)}${q.correct === oi ? ' (correcta)' : ''}`}
                        style={{ ...inp, border: q.correct === oi ? '1.5px solid var(--success)' : '1.5px solid var(--border)' }} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>Haz clic en el círculo para marcar la opción correcta</p>
              </div>
            ))}
          </div>
          <button onClick={addQ}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, marginTop: 12,
              border: '1.5px dashed var(--purple)', background: 'var(--purple-bg)', color: 'var(--purple)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600 }}>
            <PlusIc s={14} c="var(--purple)" /> Agregar pregunta
          </button>
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleSave}>{initial ? 'Guardar cambios' : 'Crear reto'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---- Add Extra Modal ----
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
    if (type === 'video' && !url.trim()) { setErr('La URL del video es obligatoria'); return }
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
            {[{ id: 'video', label: '🎬 Video YouTube' }, { id: 'text', label: '📝 Texto / Nota' }].map(opt => (
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

        {type === 'text' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Contenido</label>
            <textarea value={text} onChange={e => { setText(e.target.value); setErr('') }}
              placeholder="Escribe aquí el texto adicional para los estudiantes..."
              rows={4}
              style={{ ...inp(err && !text), resize: 'vertical', lineHeight: 1.6 }} />
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

// ---- Custom Module Modal ----
const SECTION_TYPES = [
  { id: 'intro',   label: '📖 Introducción',  icon: '📖' },
  { id: 'text',    label: '📄 Texto',          icon: '📄' },
  { id: 'callout', label: '💡 Destacado',      icon: '💡' },
  { id: 'video',   label: '🎬 Video YouTube',  icon: '🎬' },
]

const CustomModuleModal = ({ open, initial, onClose, onSave, extraActions }) => {
  const [title, setTitle]     = React.useState('')
  const [desc, setDesc]       = React.useState('')
  const [task, setTask]       = React.useState('')
  const [xp, setXp]           = React.useState(50)
  const [sections, setSections] = React.useState([])
  const [err, setErr]         = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 50)
      setSections(initial?.content || [])
      setErr('')
    }
  }, [open, initial])

  const addSection = (type) => {
    const defaults = {
      intro:   { type: 'intro',   title: '', text: '' },
      text:    { type: 'text',    title: '', text: '' },
      callout: { type: 'callout', title: '', text: '', icon: '💡' },
      video:   { type: 'video',   title: '', url: '', desc: '' },
    }
    setSections(s => [...s, { ...defaults[type], _id: Date.now() }])
  }

  const updateSection = (idx, key, val) => setSections(s => s.map((sec, i) => i === idx ? { ...sec, [key]: val } : sec))
  const removeSection = (idx) => setSections(s => s.filter((_, i) => i !== idx))
  const moveSection   = (idx, dir) => {
    const next = [...sections]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSections(next)
  }

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 50, content: sections })
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar módulo' : 'Crear módulo personalizado'} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflow: 'auto', paddingRight: 4 }}>

        {/* Basic info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }}
              placeholder="Ej: Innovación en el Aula" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} max={500} style={inp} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Resumen del módulo para el mapa de aprendizaje" style={inp} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción para el estudiante (¿Qué debe hacer?)</label>
          <input value={task} onChange={e => setTask(e.target.value)}
            placeholder="Ej: Lee todo el contenido y completa la lección" style={inp} />
        </div>

        {/* Sections */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 10 }}>Contenido del módulo</label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((sec, idx) => (
              <div key={sec._id || idx} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    {SECTION_TYPES.find(t => t.id === sec.type)?.label || sec.type}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === 0 ? .3 : 1 }}>↑</button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === sections.length - 1 ? .3 : 1 }}>↓</button>
                    <button onClick={() => removeSection(idx)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2' }}>
                      <XIc s={12} c="var(--error)" />
                    </button>
                  </div>
                </div>

                {sec.type !== 'video' && (
                  <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                    placeholder="Título de esta sección" style={{ ...inp, marginBottom: 8 }} />
                )}

                {(sec.type === 'intro' || sec.type === 'text') && (
                  <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                    placeholder="Escribe el contenido..." rows={3}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                )}

                {sec.type === 'callout' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
                    <input value={sec.icon} onChange={e => updateSection(idx, 'icon', e.target.value)}
                      placeholder="💡" style={inp} />
                    <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                      placeholder="Texto destacado..." rows={2}
                      style={{ ...inp, resize: 'vertical' }} />
                  </div>
                )}

                {sec.type === 'video' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del video" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.url} onChange={e => updateSection(idx, 'url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..." style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción opcional del video" style={inp} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add section buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {SECTION_TYPES.map(t => (
              <button key={t.id} onClick={() => addSection(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                  border: '1.5px dashed var(--border)', background: 'var(--white)', color: 'var(--text-sec)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}>
                <PlusIc s={12} c="currentColor" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
          {extraActions}
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Crear módulo'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---- Main Editor ----
// ---- New Challenge Modal (type selector + basic info) ----
const CHALLENGE_TYPES = [
  { id:'dragdrop',   label:'Arrastrar y ordenar', emoji:'🧩', desc:'Ordena elementos en secuencia correcta' },
  { id:'empathy',    label:'Mapa de empatía',     emoji:'🗺️', desc:'Clasifica tarjetas en cuadrantes' },
  { id:'simulation', label:'Simulación',           emoji:'🎭', desc:'Árbol de decisiones pedagógicas' },
  { id:'matching',   label:'Conectar conceptos',  emoji:'🔗', desc:'Empareja conceptos con definiciones' },
  { id:'quiz',       label:'Quiz',                 emoji:'📝', desc:'Preguntas de opción múltiple' },
]

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
              style={{ padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'center', transition: 'all .15s', border: 'none',
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

const InstructorRouteEditor = () => {
  const routeConfigs = useStore(s => s.routeConfigs)
  const isMobile = useMobile()
  const [activeArea, setActiveArea] = React.useState(AREAS[0].id)
  const [moduleList, setModuleList] = React.useState([])
  const [customModules, setCustomModules] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [dragIdx, setDragIdx] = React.useState(null)
  const [overIdx, setOverIdx] = React.useState(null)
  const [showAddModule, setShowAddModule] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState(null)
  const [editingBaseModule, setEditingBaseModule] = React.useState(null)
  const [editingChallenge, setEditingChallenge] = React.useState(null)
  const [editingQuiz, setEditingQuiz] = React.useState(null)
  const [showNewChallenge, setShowNewChallenge] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)

  React.useEffect(() => {
    const defaults = getStudentModules(activeArea)
    const config = routeConfigs?.[activeArea]
    if (config?.modules?.length) {
      const cm = {}
      config.modules.forEach(mc => { cm[mc.id] = mc })
      const sorted = [...defaults]
        .sort((a, b) => (cm[a.id]?.order ?? 999) - (cm[b.id]?.order ?? 999))
        .map(m => ({
          ...m, enabled: cm[m.id]?.enabled !== false,
          ...(cm[m.id]?.override || {}), override: cm[m.id]?.override || null,
        }))
      setModuleList(sorted)
    } else {
      setModuleList(defaults.map(m => ({ ...m, enabled: true })))
    }
    setCustomModules(config?.customModules || [])
  }, [activeArea, routeConfigs])

  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setModuleList(next); setDragIdx(null); setOverIdx(null)
  }

  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))

  const addCustomModule  = (mod) => setCustomModules(l => [...l, { id: 'custom_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
  const saveEditedModule = (mod) => setCustomModules(l => l.map(m => m.id === editingModule.id ? { ...m, ...mod } : m))
  const deleteCustom     = (id) => setCustomModules(l => l.filter(m => m.id !== id))

  const duplicateModule = (mod) => {
    setCustomModules(l => [...l, {
      id: 'custom_' + Date.now(),
      title: 'Copia — ' + mod.title,
      desc: mod.desc || '', task: mod.task || '', xp: mod.xp || 0,
      type: mod.type || 'lesson', ctype: mod.ctype || null,
      content: mod.content ? [...mod.content] : [],
      questions: mod.questions ? [...mod.questions] : [],
      dragItems: mod.dragItems || mod.override?.dragItems,
      empathyCards: mod.empathyCards || mod.override?.empathyCards,
      simTree: mod.simTree || mod.override?.simTree,
      designSteps: mod.designSteps || mod.override?.designSteps,
      matchPairs: mod.matchPairs || mod.override?.matchPairs,
      enabled: true, order: moduleList.length + l.length,
    }])
  }

  const saveChallengeOverride = (override) => {
    if (override.__clearOverride) {
      const original = getStudentModules(activeArea).find(m => m.id === editingChallenge?.id)
      if (original) setModuleList(l => l.map(m => m.id === editingChallenge.id ? { ...original, enabled: m.enabled, override: null } : m))
    } else if (editingChallenge?.isNew) {
      setCustomModules(l => [...l, {
        id: 'challenge_' + Date.now(), type: 'challenge',
        ctype: editingChallenge.ctype,
        ...override, enabled: true, order: moduleList.length + l.length,
      }])
    } else {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, ...override, override: { ...(m.override || {}), ...override } } : m
      ))
    }
    setEditingChallenge(null)
  }

  const saveQuizCustom = (mod) => {
    if (editingQuiz?.isNew || !editingQuiz?.id) {
      setCustomModules(l => [...l, { id: 'quiz_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
    } else {
      setCustomModules(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
    }
    setEditingQuiz(null)
  }

  const handleNewChallenge = ({ ctype, title, desc, task, xp }) => {
    setShowNewChallenge(false)
    const template = { isNew: true, type: 'challenge', ctype, title, desc, task, xp }
    if (ctype === 'quiz') setEditingQuiz({ ...template, questions: [] })
    else setEditingChallenge(template)
  }

  const saveBaseModuleOverride = (mod) => {
    const { title, desc, task, xp, content } = mod
    setModuleList(l => l.map(m => m.id === editingBaseModule.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } } : m
    ))
    setEditingBaseModule(null)
  }

  const clearOverride = (modId) => {
    const original = getStudentModules(activeArea).find(m => m.id === modId)
    if (!original) return
    setModuleList(l => l.map(m => m.id === modId
      ? { ...m, title: original.title, desc: original.desc, task: original.task, xp: original.xp, content: original.content, override: null } : m
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    const modulesConfig = moduleList.map((m, i) => ({
      id: m.id, enabled: m.enabled, order: i,
      ...(m.override ? { override: m.override } : {}),
    }))
    await saveRouteConfig(activeArea, modulesConfig, customModules)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeCount = moduleList.filter(m => m.enabled).length

  const btnRow = (onClick, color, bg, hoverBg, icon, label) => ({
    onClick, onMouseEnter: e => e.currentTarget.style.background = hoverBg,
    onMouseLeave: e => e.currentTarget.style.background = bg,
    style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
      border: `2px dashed ${color}`, background: bg, color, cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' }
  })

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Editor de Ruta de Formación</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Personaliza el orden, contenido y módulos de cada área</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => setShowPreview(true)}>👁 Vista previa</Btn>
          <Btn variant={saved ? 'secondary' : 'gradient'} disabled={saving} onClick={handleSave}>
            {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar cambios'}
          </Btn>
        </div>
      </div>

      {/* Area tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {AREAS.map(area => (
          <button key={area.id} onClick={() => setActiveArea(area.id)}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all .2s',
              background: activeArea === area.id ? area.color : 'var(--bg-alt)',
              color: activeArea === area.id ? '#fff' : 'var(--muted)' }}>
            {area.icon} {!isMobile && area.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
              Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>

          {/* Base modules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => {
              const isOver = overIdx === i
              return (
                <div key={mod.id} draggable
                  onDragStart={() => setDragIdx(i)} onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                  onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{ borderRadius: 14, background: mod.enabled ? 'var(--white)' : 'var(--bg)',
                    border: isOver ? '2px dashed var(--orange)' : mod.enabled ? '1px solid var(--border)' : '1px dashed var(--border)',
                    opacity: dragIdx === i ? .4 : mod.enabled ? 1 : .55, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                    <GripIc s={16} c="var(--subtle)" />
                    <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: TYPE_BG[mod.type] || 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type] || 'var(--muted)' }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                        background: TYPE_BG[mod.type] || 'var(--bg-alt)', color: TYPE_COLORS[mod.type] || 'var(--muted)',
                        textTransform: 'uppercase', letterSpacing: .8 }}>{TYPE_LABELS[mod.type] || 'MÓDULO'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: mod.enabled ? 'var(--dark)' : 'var(--subtle)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
                      {mod.override && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                          background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>EDITADO</span>
                      )}
                    </div>
                    {/* Edit */}
                    <button onClick={() => mod.type === 'lesson' ? setEditingBaseModule(mod) : setEditingChallenge(mod)}
                      title="Editar contenido" style={{ background: mod.override ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                        width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EditIc s={13} c={mod.override ? 'var(--orange)' : 'var(--muted)'} />
                    </button>
                    {/* Duplicate */}
                    <button onClick={() => duplicateModule(mod)} title="Duplicar"
                      style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                        width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontSize: 13 }}>
                      ⧉
                    </button>
                    {/* Toggle */}
                    <div onClick={() => toggleEnabled(mod.id)}
                      style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
                        background: mod.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        left: mod.enabled ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom modules */}
          {customModules.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
                Personalizados ({customModules.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customModules.map(mod => (
                  <div key={mod.id} style={{ borderRadius: 14, background: 'var(--white)',
                    border: mod.type === 'challenge' ? '2px solid var(--purple-bg)' : '2px solid #D1FAE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{mod.type === 'challenge' ? '⚡' : '✨'}</span>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                          background: mod.type === 'challenge' ? 'var(--purple-bg)' : '#D1FAE5',
                          color: mod.type === 'challenge' ? 'var(--purple)' : 'var(--success)',
                          textTransform: 'uppercase', letterSpacing: .8 }}>
                          {mod.type === 'challenge' ? (CHALLENGE_TYPES.find(t => t.id === mod.ctype)?.label || 'Reto') : 'Módulo'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
                      </div>
                      {/* Edit */}
                      <button
                        onClick={() => mod.ctype === 'quiz' ? setEditingQuiz(mod) : mod.type === 'challenge' ? setEditingChallenge(mod) : setEditingModule(mod)}
                        style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EditIc s={14} c="var(--muted)" />
                      </button>
                      {/* Duplicate */}
                      <button onClick={() => duplicateModule(mod)} title="Duplicar"
                        style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⧉</button>
                      {/* Delete */}
                      <button onClick={() => deleteCustom(mod.id)}
                        style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrashIc s={13} c="var(--error)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <button {...btnRow(() => setShowNewChallenge(true), 'var(--purple)', 'var(--purple-bg)', '#EDE9FE')}>
            <PlusIc s={18} c="var(--purple)" /> Crear nuevo reto
          </button>
          <button {...btnRow(() => setShowAddModule(true), 'var(--success)', '#F0FDF4', '#D1FAE5')}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
        </div>

        {/* Right: tips */}
        <div style={{ padding: '18px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo usar el editor</h4>
          {[
            { icon: '⋮⋮', text: 'Arrastra para cambiar el orden de los módulos.' },
            { icon: '✏️', text: 'Edita el contenido de cualquier módulo o reto.' },
            { icon: '⧉',  text: 'Duplica un módulo o reto para reutilizarlo.' },
            { icon: '🟢', text: 'Activa o desactiva módulos con el toggle.' },
            { icon: '⚡', text: 'Crea retos nuevos de cualquier tipo desde cero.' },
            { icon: '✨', text: 'Crea módulos personalizados con tu contenido.' },
            { icon: '💾', text: 'Guarda para que los estudiantes vean los cambios.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px', borderRadius: 10, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <p style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              Los cambios afectan a todos los estudiantes del área seleccionada.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewChallengeModal open={showNewChallenge} onClose={() => setShowNewChallenge(false)} onCreate={handleNewChallenge} />
      <ChallengeEditorModal open={!!editingChallenge} mod={editingChallenge} onClose={() => setEditingChallenge(null)} onSave={saveChallengeOverride} />
      <QuizCreatorModal open={!!editingQuiz} initial={editingQuiz?.isNew ? null : editingQuiz} onClose={() => setEditingQuiz(null)} onSave={saveQuizCustom} />
      <CustomModuleModal open={!!editingBaseModule} initial={editingBaseModule}
        extraActions={editingBaseModule?.override ? (
          <Btn variant="secondary" onClick={() => { clearOverride(editingBaseModule.id); setEditingBaseModule(null) }}>Restablecer original</Btn>
        ) : null}
        onClose={() => setEditingBaseModule(null)} onSave={saveBaseModuleOverride} />
      <CustomModuleModal open={showAddModule || !!editingModule} initial={editingModule}
        onClose={() => { setShowAddModule(false); setEditingModule(null) }}
        onSave={mod => { if (editingModule) saveEditedModule(mod); else addCustomModule(mod); setShowAddModule(false); setEditingModule(null) }} />
      <RoutePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        area={AREAS.find(a => a.id === activeArea)}
        moduleList={moduleList}
        customModules={customModules}
      />
    </div>
  )
}

// ---- Route Preview ----
const CTYPE_EMOJI = { dragdrop:'🧩', empathy:'🗺️', simulation:'🎭', matching:'🔗', quiz:'📝' }

// ---- Lesson content renderer (pure display, no interactivity) ----
const LessonPreviewContent = ({ mod }) => {
  const renderSection = (sec, i) => {
    if (sec.type === 'intro') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{sec.title}</h3>
        <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.8 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'text') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>{sec.title}</h4>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.8 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'callout') return (
      <div key={i} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '4px solid var(--purple)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{sec.icon || '💡'}</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple-deep)' }}>{sec.title}</h4>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'concepts') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{sec.title}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
          {(sec.items || []).map((item, j) => (
            <div key={j} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--white)' }}>
              <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>{item.t}</h5>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    )
    if (sec.type === 'compare') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{sec.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 10 }}>{sec.label}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Enfoque Tradicional</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{sec.trad}</p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Enfoque DCE</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{sec.dce}</p>
          </div>
        </div>
      </div>
    )
    if (sec.type === 'video') {
      const vid = sec.url?.includes('v=') ? sec.url.split('v=')[1]?.split('&')[0] : sec.url?.split('youtu.be/')[1]?.split('?')[0] || sec.url
      return (
        <div key={i} style={{ marginBottom: 24 }}>
          {sec.title && <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>{sec.title}</h4>}
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--sh-md)' }}>
            <iframe src={`https://www.youtube.com/embed/${vid}?rel=0`} title={sec.title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {mod.task && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12,
          background: '#FFF7ED', border: '1.5px solid #FDBA74', marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>¿Qué debe hacer el estudiante?</div>
            <p style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.6, margin: 0 }}>{mod.task}</p>
          </div>
        </div>
      )}
      {(mod.content || []).map((sec, i) => renderSection(sec, i))}
      {!(mod.content?.length) && (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Este módulo no tiene contenido configurado aún.</p>
      )}
    </div>
  )
}

// ---- Challenge answer-key previews ----
const ChallengePreviewContent = ({ mod }) => {
  if (mod.ctype === 'dragdrop') {
    const items = mod.dragItems || mod.override?.dragItems || ['Empatizar','Definir','Idear','Prototipar','Evaluar']
    const colors = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B']
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante arrastrará estos elementos y deberá colocarlos en este orden:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
              background: 'var(--white)', border: `2px solid ${colors[i % colors.length]}30` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: colors[i % colors.length] + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14,
                color: colors[i % colors.length], flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{item}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Posición correcta</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'empathy') {
    const cards = mod.empathyCards || mod.override?.empathyCards || []
    const quadrants = ['piensa','siente','dice','hace']
    const qIcons = { piensa:'🧠', siente:'❤️', dice:'💬', hace:'🤲' }
    const qColors = { piensa:'#3B82F6', siente:'#EF4444', dice:'#10B981', hace:'#F59E0B' }
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante clasificará estas tarjetas en los cuadrantes del Mapa de Empatía:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {quadrants.map(q => {
            const qCards = cards.filter(c => c.correct === q)
            return (
              <div key={q} style={{ padding: '12px 14px', borderRadius: 12, background: qColors[q] + '10', border: `1.5px solid ${qColors[q]}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{qIcons[q]}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: qColors[q] }}>{q.charAt(0).toUpperCase() + q.slice(1)}</span>
                </div>
                {qCards.length === 0 ? <p style={{ fontSize: 11, color: 'var(--subtle)', fontStyle: 'italic', margin: 0 }}>Sin tarjetas</p>
                  : qCards.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--dark)', padding: '6px 8px', borderRadius: 8,
                      background: 'var(--white)', marginBottom: 4, border: '1px solid ' + qColors[q] + '30' }}>{c.text}</div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'matching') {
    const pairs = mod.matchPairs || mod.override?.matchPairs || []
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante conectará cada concepto con su definición correcta:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--white)', border: `2px solid ${p.color}`, fontWeight: 700, fontSize: 13, color: p.color }}>{p.concept}</div>
              <span style={{ fontSize: 18, color: 'var(--success)' }}>↔</span>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: p.color + '10', border: `1.5px solid ${p.color}50`, fontSize: 13, color: 'var(--dark)' }}>{p.def}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'simulation') {
    const tree = mod.simTree || mod.override?.simTree || {}
    const nodeIds = Object.keys(tree)
    if (!nodeIds.length) return <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin árbol de decisiones configurado.</p>
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante navegará por este árbol de decisiones pedagógicas:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nodeIds.map(nid => {
            const node = tree[nid]
            return (
              <div key={nid} style={{ padding: '12px 14px', borderRadius: 12,
                background: node.end ? '#F0FDF4' : 'var(--white)',
                border: node.end ? '1px solid #BBF7D0' : '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: node.end ? 'var(--success)' : 'var(--orange)',
                  textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>
                  {nid === 'start' ? '🟢 INICIO' : node.end ? '✅ RESULTADO' : `📍 ${nid}`}
                </div>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.6, margin: 0, marginBottom: node.options?.length ? 8 : 0 }}>{node.text}</p>
                {node.options?.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                    background: 'var(--bg)', marginBottom: 4, border: '1px solid var(--border)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: opt.points===3?'var(--success)':opt.points===2?'var(--warn)':'var(--error)',
                      color:'#fff', fontWeight: 800, fontSize: 11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {opt.points}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--dark)', flex: 1 }}>{opt.text}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>→ {opt.next}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>El color del badge indica los puntos: 🟢 3pts · 🟡 2pts · 🔴 1pt</p>
      </div>
    )
  }

  if (mod.ctype === 'quiz') {
    const qs = mod.questions || []
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante responderá {qs.length} pregunta{qs.length !== 1 ? 's' : ''} de opción múltiple:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {qs.map((q, qi) => (
            <div key={qi} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--white)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 10 }}>{qi + 1}. {q.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                    background: oi === q.correct ? '#F0FDF4' : 'var(--bg)',
                    border: oi === q.correct ? '1.5px solid var(--success)' : '1px solid var(--border)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: oi === q.correct ? 'var(--success)' : 'var(--bg-alt)',
                      color: oi === q.correct ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: oi === q.correct ? 600 : 400 }}>{opt}</span>
                    {oi === q.correct && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ Correcta</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Vista previa no disponible para este tipo de reto.</p>
}

// ---- Route Preview Modal (list + drill-down) ----
const RoutePreviewModal = ({ open, onClose, area, moduleList, customModules }) => {
  const [viewing, setViewing] = React.useState(null)

  React.useEffect(() => { if (!open) setViewing(null) }, [open])

  const merged = React.useMemo(() => {
    if (!moduleList) return []
    const base = moduleList.map((m, i) => ({ ...m, _order: i }))
    const customs = (customModules || []).map(m => ({ ...m, isCustom: true, _order: (m.order ?? 999) + 0.5 }))
    return [...base, ...customs].sort((a, b) => a._order - b._order)
  }, [moduleList, customModules])

  const enabled  = merged.filter(m => m.enabled !== false)

  // ---- Detail view ----
  if (viewing) {
    const isLesson = viewing.type === 'lesson'
    return (
      <Modal open={open} onClose={onClose} title={viewing.title} width={680}>
        <div style={{ maxHeight: '78vh', overflow: 'auto', paddingRight: 4 }}>
          {/* Back + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setViewing(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              ← Volver a la ruta
            </button>
            {viewing.xp > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-bg)', padding: '4px 10px', borderRadius: 8 }}>
                +{viewing.xp} XP
              </span>
            )}
            {viewing.isCustom && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: '#D1FAE5', color: 'var(--success)' }}>PERSONALIZADO</span>
            )}
          </div>

          {/* Hero */}
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--gradient)', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              {viewing.subtitle || (isLesson ? 'Módulo' : 'Reto')}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{viewing.title}</h2>
            {viewing.desc && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{viewing.desc}</p>}
            <div style={{ marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,.2)', display: 'inline-block' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>
                👁 MODO VISTA PREVIA — Solo visible para el instructor
              </span>
            </div>
          </div>

          {/* Content */}
          {isLesson
            ? <LessonPreviewContent mod={viewing} />
            : <ChallengePreviewContent mod={viewing} />
          }
        </div>
      </Modal>
    )
  }

  // ---- List view ----
  return (
    <Modal open={open} onClose={onClose} title="Vista previa de la ruta" width={600}>
      <div style={{ maxHeight: '75vh', overflow: 'auto', paddingRight: 4 }}>
        {area && (
          <div style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 18,
            background: `linear-gradient(135deg, ${area.color}18, ${area.color}06)`,
            border: `2px solid ${area.color}25`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{area.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>{area.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {enabled.length} activo{enabled.length !== 1 ? 's' : ''}
                {' · '}{enabled.reduce((s, m) => s + (m.xp || 0), 0)} XP total
                {' · '}<span style={{ color: 'var(--orange)' }}>Haz clic en cualquier tarjeta para ver su contenido</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {merged.map((mod, i) => {
            const isChallenge = mod.type === 'challenge' || mod.type === 'evaluation'
            const isDisabled = mod.enabled === false
            const color = isChallenge ? 'var(--purple)' : 'var(--orange)'
            const bg    = isChallenge ? 'var(--purple-bg)' : 'var(--orange-bg)'
            const emoji = isChallenge ? (CTYPE_EMOJI[mod.ctype] || '⚡') : '📖'
            return (
              <React.Fragment key={mod.id || i}>
                <div onClick={() => !isDisabled && setViewing(mod)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, background: isDisabled ? 'var(--bg)' : 'var(--white)',
                    border: isDisabled ? '1px dashed var(--border)' : mod.isCustom ? '2px solid #D1FAE5' : '1px solid var(--border)',
                    opacity: isDisabled ? .45 : 1, cursor: isDisabled ? 'default' : 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => !isDisabled && (e.currentTarget.style.boxShadow = 'var(--sh-md)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: isDisabled ? 'var(--bg-alt)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {isDisabled ? '🔒' : emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: bg, color, textTransform: 'uppercase', letterSpacing: .8 }}>
                        {isChallenge ? (CHALLENGE_TYPES.find(t => t.id === mod.ctype)?.label || 'RETO') : 'MÓDULO'}
                      </span>
                      {mod.isCustom && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#D1FAE5', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: .8 }}>PERSONALIZADO</span>}
                      {mod.override && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>EDITADO</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDisabled ? 'var(--subtle)' : 'var(--dark)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                  </div>
                  {mod.xp > 0 && !isDisabled && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-bg)', padding: '3px 7px', borderRadius: 7, flexShrink: 0 }}>+{mod.xp}</span>}
                  {!isDisabled && <span style={{ fontSize: 16, color: 'var(--muted)', flexShrink: 0 }}>›</span>}
                </div>
                {i < merged.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 2, height: 10, background: isDisabled ? 'var(--border)' : 'var(--orange)', borderRadius: 2, opacity: .4 }} />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {!merged.length && <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>No hay módulos configurados.</p>}

        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)',
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {[
            { label: 'Módulos', value: enabled.filter(m => m.type === 'lesson').length, color: 'var(--orange)' },
            { label: 'Retos',   value: enabled.filter(m => m.type !== 'lesson').length, color: 'var(--purple)' },
            { label: 'Custom',  value: merged.filter(m => m.isCustom).length,           color: 'var(--success)' },
            { label: 'XP',      value: enabled.reduce((s, m) => s + (m.xp || 0), 0),  color: 'var(--warn)' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default InstructorRouteEditor
