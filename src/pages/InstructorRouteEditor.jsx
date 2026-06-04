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

// ---- Generic Challenge Editor Modal ----
// Routes to the right sub-editor based on ctype
const ChallengeEditorModal = ({ open, mod, onClose, onSave }) => {
  if (!mod) return null
  if (mod.ctype === 'matching')  return <MatchingEditorModal  open={open} mod={mod} onClose={onClose} onSave={onSave} />
  if (mod.ctype === 'dragdrop')  return <DragDropEditorModal  open={open} mod={mod} onClose={onClose} onSave={onSave} />
  if (mod.ctype === 'empathy')   return <EmpathyEditorModal   open={open} mod={mod} onClose={onClose} onSave={onSave} />
  if (mod.ctype === 'simulation')return <SimulationEditorModal open={open} mod={mod} onClose={onClose} onSave={onSave} />
  if (mod.ctype === 'designlab') return <DesignLabEditorModal  open={open} mod={mod} onClose={onClose} onSave={onSave} />
  return null
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

const DesignLabEditorModal = ({ open, mod, onClose, onSave }) => {
  const DEFAULT_STEPS = [
    { phase:'Empatizar', icon:'❤️', question:'¿Cómo conocerás a tus estudiantes antes de diseñar?',
      options:[{id:'a',text:'Entrevistas y observación',emoji:'🎤',score:3,tag:'Investigación empática'},
               {id:'b',text:'Encuesta breve',emoji:'📋',score:2,tag:'Diagnóstico parcial'},
               {id:'c',text:'Asumir por experiencia previa',emoji:'🤔',score:1,tag:'Sin investigación'}]},
  ]
  const [steps, setSteps] = React.useState([])
  React.useEffect(() => {
    if (open && mod) setSteps(mod.designSteps ? mod.designSteps.map(s => ({ ...s, options: s.options.map(o => ({ ...o })) })) : DEFAULT_STEPS.map(s => ({ ...s })))
  }, [open, mod])

  const updateStep = (si, key, val) => setSteps(s => s.map((st, i) => i === si ? { ...st, [key]: val } : st))
  const updateOpt  = (si, oi, key, val) => setSteps(s => s.map((st, i) => i !== si ? st : { ...st, options: st.options.map((o, j) => j !== oi ? o : { ...o, [key]: val }) }))
  const addStep    = () => setSteps(s => [...s, { phase: 'Nueva fase', icon: '📝', question: '', options: [
    {id:'a',text:'',emoji:'✅',score:3,tag:''}, {id:'b',text:'',emoji:'⚠️',score:2,tag:''}, {id:'c',text:'',emoji:'❌',score:1,tag:''}
  ]}])
  const removeStep = (si) => setSteps(s => s.filter((_, i) => i !== si))

  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title="Editar fases del Laboratorio DCE" width={620}>
      <div style={{ maxHeight: '65vh', overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, si) => (
          <div key={si} style={{ padding: 16, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <input value={step.icon} onChange={e => updateStep(si, 'icon', e.target.value)}
                style={{ ...inp, width: 50, textAlign: 'center', fontSize: 20 }} />
              <input value={step.phase} onChange={e => updateStep(si, 'phase', e.target.value)}
                placeholder="Nombre de la fase" style={{ ...inp, flex: 1, fontWeight: 700 }} />
              <button onClick={() => removeStep(si)} disabled={steps.length <= 1}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: steps.length <= 1 ? .3 : 1 }}>
                <XIc s={13} c="var(--error)" />
              </button>
            </div>
            <input value={step.question} onChange={e => updateStep(si, 'question', e.target.value)}
              placeholder="Pregunta de diseño para esta fase..." style={{ ...inp, width: '100%', marginBottom: 10 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(step.options || []).map((opt, oi) => (
                <div key={oi} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px', gap: 6, alignItems: 'center' }}>
                  <input value={opt.emoji} onChange={e => updateOpt(si, oi, 'emoji', e.target.value)}
                    style={{ ...inp, textAlign: 'center', fontSize: 16, padding: '6px' }} />
                  <input value={opt.text} onChange={e => updateOpt(si, oi, 'text', e.target.value)}
                    placeholder={`Opción ${String.fromCharCode(65+oi)}`} style={inp} />
                  <input value={opt.tag} onChange={e => updateOpt(si, oi, 'tag', e.target.value)}
                    placeholder="Etiqueta" style={inp} />
                  <select value={opt.score} onChange={e => updateOpt(si, oi, 'score', Number(e.target.value))}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {[1,2,3].map(p => <option key={p} value={p}>{p}pts</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10,
          border: '2px dashed var(--success)', background: '#F0FDF4', color: 'var(--success)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, justifyContent: 'center' }}>
          <PlusIc s={16} c="var(--success)" /> Agregar fase
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ designSteps: steps })}>Guardar</Btn>
      </div>
    </Modal>
  )
}

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
  { id:'designlab',  label:'Lab de diseño',        emoji:'🏗️', desc:'Diseña una experiencia paso a paso' },
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
    if (editingChallenge?.isNew) {
      setCustomModules(l => [...l, {
        id: 'challenge_' + Date.now(), type: 'challenge',
        ctype: editingChallenge.ctype, title: editingChallenge.title,
        desc: editingChallenge.desc, task: editingChallenge.task, xp: editingChallenge.xp,
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
        <Btn variant={saved ? 'secondary' : 'gradient'} disabled={saving} onClick={handleSave}>
          {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar cambios'}
        </Btn>
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
    </div>
  )
}

export default InstructorRouteEditor
