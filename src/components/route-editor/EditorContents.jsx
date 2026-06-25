import React from 'react'
import { PlusIc, XIc, GripIc } from '../ui.jsx'
import { PAIR_COLORS } from './constants.js'

// ── DragDrop inline editor ───────────────────────────────────
export const DragDropEditorContent = ({ mod, onChange }) => {
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

// ── True / False inline editor ───────────────────────────────
export const TrueFalseEditorContent = ({ mod, onChange }) => {
  const DEFAULT = [
    { id: 1, text: 'El Diseño Centrado en la Experiencia parte de las necesidades del estudiante.', answer: true },
    { id: 2, text: 'En el DCE el error del estudiante debe evitarse a toda costa.', answer: false },
    { id: 3, text: 'Una buena experiencia de aprendizaje conecta el contenido con la vida real.', answer: true },
  ]
  const [items, setItems] = React.useState([])
  React.useEffect(() => {
    const init = mod?.statements || mod?.override?.statements || DEFAULT
    setItems(init); onChange({ statements: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const update = (next) => { setItems(next); onChange({ statements: next }) }
  const setText   = (i, v) => { const n = [...items]; n[i] = { ...n[i], text: v }; update(n) }
  const setAnswer = (i, v) => { const n = [...items]; n[i] = { ...n[i], answer: v }; update(n) }
  const add = () => update([...items, { id: Date.now(), text: 'Nueva afirmación', answer: true }])
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', flex: 1 }
  const pill = (active, ok) => ({
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
    border: `1.5px solid ${active ? (ok ? 'var(--success)' : 'var(--error)') : 'var(--border)'}`,
    background: active ? (ok ? 'var(--success-bg)' : 'var(--error-bg)') : 'var(--white)',
    color: active ? (ok ? 'var(--success)' : 'var(--error)') : 'var(--muted)',
  })
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Escribe cada afirmación y marca si es <strong>verdadera</strong> o <strong>falsa</strong>.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((it, i) => (
          <div key={it.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10,
            background: 'var(--white)', border: '1px solid var(--border)' }}>
            <input value={it.text} onChange={e => setText(i, e.target.value)} placeholder="Afirmación" style={inp} />
            <button onClick={() => setAnswer(i, true)}  style={pill(it.answer === true,  true)}>V</button>
            <button onClick={() => setAnswer(i, false)} style={pill(it.answer === false, false)}>F</button>
            <button onClick={() => { if (items.length > 2) update(items.filter((_, j) => j !== i)) }}
              disabled={items.length <= 2}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: items.length <= 2 ? .3 : 1 }}>
              <XIc s={12} c="var(--error)" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, marginTop: 8,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
        <PlusIc s={12} c="var(--orange)" /> Agregar afirmación
      </button>
    </div>
  )
}

// ── Fill in the blanks inline editor ─────────────────────────
export const FillBlankEditorContent = ({ mod, onChange }) => {
  const DEFAULT = [
    { id: 1, before: 'El DCE pone al', answer: 'estudiante', after: 'en el centro del aprendizaje.' },
    { id: 2, before: 'La primera fase del proceso de diseño es', answer: 'empatizar', after: 'con el usuario.' },
    { id: 3, before: 'Un prototipo permite', answer: 'probar', after: 'la idea antes de implementarla.' },
  ]
  const [items, setItems] = React.useState([])
  React.useEffect(() => {
    const init = mod?.blanks || mod?.override?.blanks || DEFAULT
    setItems(init); onChange({ blanks: init })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])
  const update = (next) => { setItems(next); onChange({ blanks: next }) }
  const setField = (i, k, v) => { const n = [...items]; n[i] = { ...n[i], [k]: v }; update(n) }
  const add = () => update([...items, { id: Date.now(), before: '', answer: '', after: '' }])
  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Para cada hueco: texto <strong>antes</strong>, la <strong>palabra correcta</strong> (irá al banco) y el texto <strong>después</strong>.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={it.id ?? i} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--white)', border: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '1fr 130px 1fr 26px', gap: 6, alignItems: 'center' }}>
            <input value={it.before} onChange={e => setField(i, 'before', e.target.value)} placeholder="Texto antes…" style={inp} />
            <input value={it.answer} onChange={e => setField(i, 'answer', e.target.value)} placeholder="Respuesta"
              style={{ ...inp, fontWeight: 700, color: 'var(--purple)', textAlign: 'center', borderColor: 'var(--purple)' }} />
            <input value={it.after} onChange={e => setField(i, 'after', e.target.value)} placeholder="Texto después…" style={inp} />
            <button onClick={() => { if (items.length > 2) update(items.filter((_, j) => j !== i)) }}
              disabled={items.length <= 2}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: items.length <= 2 ? .3 : 1 }}>
              <XIc s={12} c="var(--error)" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, marginTop: 8,
          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
        <PlusIc s={12} c="var(--orange)" /> Agregar espacio
      </button>
    </div>
  )
}

// ── Empathy inline editor ────────────────────────────────────
export const EmpathyEditorContent = ({ mod, onChange }) => {
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

// ── Matching inline editor ───────────────────────────────────
export const MatchingEditorContent = ({ mod, onChange }) => {
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

// ── Simulation inline editor ─────────────────────────────────
export const SimulationEditorContent = ({ mod, onChange }) => {
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
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px dashed var(--success)', background: '#F0FDFA', color: 'var(--success)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
          <PlusIc s={10} c="var(--success)" /> Resultado
        </button>
      </div>
    </div>
  )
}
