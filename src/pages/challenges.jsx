import React from 'react'
import {
  useStore, nav, completeNode, recordAttempt, findModule, findModuleInConfig, AREAS, BADGES, LEVELS,
  getStudentModules, nodeStatus, calcLevel, getActiveCourseTheme,
} from '../store/store.jsx'
import ThemeCelebration from '../components/ThemeCelebration.jsx'
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger,
} from '../components/ui.jsx'
// =============================================
// EXPERIA — Interactive Challenges (v2 — area-aware + attempt tracking)
// =============================================

// ---- DRAG & DROP: Order DCE phases ----
const DragDropChallenge = ({ mod, onComplete }) => {
  const correctOrder = mod.dragItems || ['Empatizar','Definir','Idear','Prototipar','Evaluar'];
  const [items, setItems] = React.useState(() => {
    const arr = [...correctOrder];
    for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
    return arr;
  });
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);
  const [checked, setChecked] = React.useState(false);
  const [correct, setCorrect] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const lastCheckedRef = React.useRef(null);

  const handleDrop = (i) => {
    if(dragIdx===null) return;
    const next=[...items]; const [moved]=next.splice(dragIdx,1); next.splice(i,0,moved);
    setItems(next); setDragIdx(null); setOverIdx(null);
  };
  const handleCheck = () => {
    const key = items.join('|');
    if(lastCheckedRef.current === key) return; // prevent duplicate attempt for same order
    lastCheckedRef.current = key;
    const isOk = items.every((it,i)=>it===correctOrder[i]);
    setChecked(true); setCorrect(isOk); setAttempts(a=>a+1);
    const qs = items.map((it,i)=>({q:`${it} en posición ${i+1}`,correct:it===correctOrder[i]}));
    const score = qs.filter(q=>q.correct).length;
    recordAttempt(mod.id, qs, score, correctOrder.length);
    if(!isOk) setTimeout(()=>{ setChecked(false); lastCheckedRef.current = null; },1800);
  };
  const phaseColors={Empatizar:'#EC671A',Definir:'#5E4F9C',Idear:'#3A5BA7',Prototipar:'#2D9070',Evaluar:'#F59E33'};

  return (
    <div style={{maxWidth:540,margin:'0 auto',paddingBottom:48}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:40}}>🧩</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Ordena las fases del DCE</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Arrastra y suelta las fases en el orden correcto.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {items.map((item,i)=>{
          const isOver=overIdx===i, isRight=checked&&correct, isWrong=checked&&!correct&&item!==correctOrder[i];
          return <div key={item} draggable onDragStart={()=>setDragIdx(i)} onDragOver={e=>{e.preventDefault();setOverIdx(i)}}
            onDrop={()=>handleDrop(i)} onDragEnd={()=>{setDragIdx(null);setOverIdx(null)}}
            style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,
              background:isRight?'#F0FDFA':isWrong?'#FEF2F2':'var(--white)',
              border:isOver?'2px dashed var(--orange)':isRight?'2px solid var(--success)':isWrong?'2px solid var(--error)':'1.5px solid var(--border)',
              cursor:'grab',transition:'all .2s',transform:dragIdx===i?'scale(1.02)':'scale(1)',
              opacity:dragIdx===i?.6:1,boxShadow:dragIdx===i?'var(--sh-lg)':'var(--sh-sm)'}}>
            <GripIc s={18} c="var(--subtle)"/>
            <div style={{width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:800,fontSize:14,background:phaseColors[item]+'18',color:phaseColors[item]}}>{i+1}</div>
            <span style={{fontWeight:600,fontSize:15,color:'var(--dark)'}}>{item}</span>
            {checked&&correct&&<CheckIc s={18} c="var(--success)"/>}
            {isWrong&&<XIc s={18} c="var(--error)"/>}
          </div>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24}}>
        {checked&&correct
          ? <Btn variant="gradient" size="lg" onClick={onComplete}>Continuar <ArrowRIc s={18} c="#fff"/></Btn>
          : <Btn variant="primary" size="lg" onClick={handleCheck}>Verificar orden</Btn>}
      </div>
      {checked&&!correct&&<p style={{textAlign:'center',marginTop:12,fontSize:13,color:'var(--error)',fontWeight:500,animation:'shake .4s ease'}}>Orden incorrecto. Intenta de nuevo.</p>}
      {checked&&correct&&<p style={{textAlign:'center',marginTop:12,fontSize:14,color:'var(--success)',fontWeight:600}}>🎉 ¡Perfecto!{attempts===1?' Al primer intento.':''}</p>}
    </div>
  );
};

// ---- EMPATHY MAP ----
const EmpathyMapChallenge = ({ mod, onComplete }) => {
  const isMobile = useMobile();
  const quadrants=[
    {key:'piensa',label:'Piensa',icon:'🧠',color:'#3B82F6',bg:'#EFF6FF'},
    {key:'siente',label:'Siente',icon:'❤️',color:'#EF4444',bg:'#FEF2F2'},
    {key:'dice',label:'Dice',icon:'💬',color:'#10B981',bg:'#F0FDFA'},
    {key:'hace',label:'Hace',icon:'🤲',color:'#F59E0B',bg:'#FFFBEB'},
  ];
  const allCards = mod.empathyCards || [
    {id:1,text:'"No entiendo para qué sirve esto"',correct:'dice'},
    {id:2,text:'Se siente frustrado en las evaluaciones',correct:'siente'},
    {id:3,text:'Cree que las matemáticas son difíciles',correct:'piensa'},
    {id:4,text:'Copia las respuestas de su compañero',correct:'hace'},
    {id:5,text:'Ansiedad antes de los exámenes',correct:'siente'},
    {id:6,text:'"Me gustan las clases con experimentos"',correct:'dice'},
    {id:7,text:'Piensa que el profesor va muy rápido',correct:'piensa'},
    {id:8,text:'Participa cuando trabaja en grupo',correct:'hace'},
  ];
  const [placed,setPlaced]=React.useState({piensa:[],siente:[],dice:[],hace:[]});
  const [unplaced,setUnplaced]=React.useState(()=>[...allCards].sort(()=>Math.random()-.5));
  const [dragCard,setDragCard]=React.useState(null);
  const [done,setDone]=React.useState(false);
  const [score,setScore]=React.useState(0);

  const handleDropOnQuad=(qKey)=>{
    if(!dragCard) return;
    // Remove from any quadrant it was already in
    setPlaced(p=>{
      const next={};
      Object.keys(p).forEach(k=>{next[k]=p[k].filter(c=>c.id!==dragCard.id);});
      next[qKey]=[...next[qKey],dragCard];
      return next;
    });
    setUnplaced(u=>u.filter(c=>c.id!==dragCard.id));
    setDragCard(null);
  };

  const handleDropOnUnplaced=()=>{
    if(!dragCard) return;
    setPlaced(p=>{
      const next={};
      Object.keys(p).forEach(k=>{next[k]=p[k].filter(c=>c.id!==dragCard.id);});
      return next;
    });
    setUnplaced(u=>{
      if(u.find(c=>c.id===dragCard.id)) return u;
      return [...u,dragCard];
    });
    setDragCard(null);
  };

  const returnToUnplaced=(card)=>{
    if(done) return;
    setPlaced(p=>{
      const next={};
      Object.keys(p).forEach(k=>{next[k]=p[k].filter(c=>c.id!==card.id);});
      return next;
    });
    setUnplaced(u=>[...u,card]);
  };
  const handleCheck=()=>{
    let s=0;const qs=[];
    Object.entries(placed).forEach(([qKey,cards])=>{
      cards.forEach(c=>{const ok=c.correct===qKey;if(ok)s++;qs.push({q:`${c.text} → ${qKey}`,correct:ok});});
    });
    setScore(s);setDone(true);
    recordAttempt(mod.id, qs, s, allCards.length);
  };

  return (
    <div style={{maxWidth:720,margin:'0 auto',paddingBottom:48}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <span style={{fontSize:40}}>🗺️</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Mapa de Empatía del Estudiante</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Arrastra cada tarjeta al cuadrante correcto.</p>
      </div>
      <div onDragOver={e=>e.preventDefault()} onDrop={handleDropOnUnplaced}
        style={{minHeight:48,display:'flex',flexWrap:'wrap',gap:8,marginBottom:20,justifyContent:'center',
          padding:unplaced.length===0?'10px':0,borderRadius:12,
          border:unplaced.length===0?'2px dashed var(--border)':'none',
          transition:'all .2s'}}>
        {unplaced.length===0&&!done&&<span style={{fontSize:12,color:'var(--subtle)',fontStyle:'italic'}}>Arrastra aquí para devolver una tarjeta</span>}
        {unplaced.map(c=>(
          <div key={c.id} draggable onDragStart={()=>setDragCard(c)}
            style={{padding:'8px 14px',borderRadius:10,background:'var(--white)',border:'1.5px solid var(--border)',
              cursor:'grab',fontSize:13,fontWeight:500,color:'var(--dark)',maxWidth:220,boxShadow:'var(--sh-sm)',transition:'all .2s'}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--sh-md)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--sh-sm)'}>{c.text}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12}}>
        {quadrants.map(q=>(
          <div key={q.key} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDropOnQuad(q.key)}
            style={{padding:16,borderRadius:14,minHeight:140,background:q.bg,border:`2px dashed ${q.color}40`,transition:'all .2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <span style={{fontSize:18}}>{q.icon}</span>
              <span style={{fontWeight:700,fontSize:14,color:q.color}}>{q.label}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {placed[q.key].map(c=>{
                const isRight=done&&c.correct===q.key,isWrong=done&&c.correct!==q.key;
                return <div key={c.id} draggable={!done} onDragStart={()=>setDragCard(c)}
                  onClick={()=>returnToUnplaced(c)}
                  title={done?'':'Clic para devolver · Arrastra para mover'}
                  style={{padding:'7px 12px',borderRadius:8,fontSize:12,fontWeight:500,
                    background:isRight?'#CCFBF1':isWrong?'#FEE2E2':'var(--white)',
                    border:isRight?'1px solid var(--success)':isWrong?'1px solid var(--error)':'1px solid '+q.color+'30',
                    color:'var(--dark)',cursor:done?'default':'pointer',transition:'opacity .15s'}}
                  onMouseEnter={e=>{if(!done)e.currentTarget.style.opacity='.7';}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}
                >{c.text} {isRight&&'✓'}{isWrong&&'✗'}</div>;
              })}
              {placed[q.key].length===0&&!done&&<div style={{fontSize:12,color:q.color+'80',fontStyle:'italic',padding:8}}>Arrastra aquí</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24}}>
        {done ? (
          <div style={{textAlign:'center'}}>
            <p style={{fontSize:16,fontWeight:700,color:score>=6?'var(--success)':'var(--orange)',marginBottom:12}}>
              {score>=Math.ceil(allCards.length*.75)?'🎉 ¡Excelente!':'👍 ¡Buen intento!'} {score}/{allCards.length} correctas
            </p>
            <Btn variant="gradient" size="lg" onClick={onComplete}>Continuar <ArrowRIc s={18} c="#fff"/></Btn>
          </div>
        ) : (
          <Btn variant="primary" size="lg" disabled={unplaced.length>0} onClick={handleCheck}>
            {unplaced.length===0?'Verificar mapa':`Faltan ${unplaced.length} tarjetas`}
          </Btn>
        )}
      </div>
    </div>
  );
};

// ---- SIMULATION ----
const SIM_TREE = {
  start:{text:'Vas a preparar una clase. Los estudiantes históricamente tienen dificultades con este tema. ¿Cuál es tu primer paso?',
    options:[{text:'Investigar las experiencias previas de los estudiantes',next:'empathy_path',points:3},
      {text:'Preparar una explicación clara con muchos ejemplos',next:'trad_path',points:1},
      {text:'Buscar un juego o actividad interactiva',next:'activity_path',points:2}]},
  empathy_path:{text:'¡Excelente! Descubres que muchos estudiantes asocian el tema con experiencias negativas. ¿Qué haces?',
    options:[{text:'Diseñar la clase usando contextos que los estudiantes disfrutan',next:'great_end',points:3},
      {text:'Comenzar reconociendo que el tema puede ser difícil',next:'good_end',points:2}]},
  trad_path:{text:'Tu explicación es clara, pero varios estudiantes se distraen. ¿Qué haces?',
    options:[{text:'Pausar y preguntar qué les resulta confuso',next:'recovery_end',points:2},
      {text:'Continuar con más ejercicios en el cuaderno',next:'poor_end',points:1}]},
  activity_path:{text:'Encuentras un juego sobre el tema. Antes de usarlo, ¿qué haces?',
    options:[{text:'Investigar si conecta con los intereses de tus estudiantes',next:'great_end',points:3},
      {text:'Usarlo directamente — cualquier juego es mejor que clase expositiva',next:'ok_end',points:1}]},
  great_end:{text:'🌟 ¡Resultado excelente! Aplicaste DCE: empatizaste, usaste sus experiencias como punto de partida y diseñaste una experiencia significativa.',end:true},
  good_end:{text:'👍 Buen resultado. Reconocer emociones es importante, pero podrías diseñar toda la experiencia desde esas emociones.',end:true},
  recovery_end:{text:'💪 Aceptable. Recuperaste la atención al escuchar, pero el DCE sugiere escuchar ANTES de diseñar la clase.',end:true},
  ok_end:{text:'⚠️ Parcial. El juego funcionó, pero sin conocer a tus estudiantes podrías haber elegido un contexto más relevante.',end:true},
  poor_end:{text:'❌ Resultado bajo. Más ejercicios sin escuchar refuerza la desconexión. El DCE enseña que la clave son experiencias que conecten.',end:true},
};

const SimulationChallenge = ({ mod, onComplete }) => {
  const SIM_TREE_ACTIVE = mod.simTree || SIM_TREE;
  const [node,setNode]=React.useState('start');
  const [totalPts,setTotalPts]=React.useState(0);
  const [history,setHistory]=React.useState([]);
  const current=SIM_TREE_ACTIVE[node];
  const choose=(opt)=>{setTotalPts(p=>p+opt.points);setHistory(h=>[...h,{text:current.text,chosen:opt.text}]);setNode(opt.next);};
  const maxPts=6, pct=Math.round((totalPts/maxPts)*100);

  // Record when done — ref prevents double-firing if node/totalPts update after end
  const recordedSim = React.useRef(false);
  React.useEffect(()=>{
    if(current.end && !recordedSim.current){
      recordedSim.current = true;
      recordAttempt(mod.id,[
        {q:'Primer paso pedagógico',correct:totalPts>=3},
        {q:'Decisión de diseño',correct:totalPts>=5},
        {q:'Resultado general',correct:pct>=80},
      ],totalPts,maxPts);
    }
  },[node]);

  return (
    <div style={{maxWidth:600,margin:'0 auto',paddingBottom:48}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:40}}>🎭</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Simulación Pedagógica</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Toma decisiones y observa cómo impactan en tu aula.</p>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:24}}>
        {history.map((_,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:'var(--success)'}}/>)}
        <div style={{width:10,height:10,borderRadius:'50%',background:'var(--orange)',animation:'pulse 1.5s infinite'}}/>
        {!current.end&&<div style={{width:10,height:10,borderRadius:'50%',background:'var(--border)'}}/>}
      </div>
      <div key={node} style={{padding:'24px 28px',borderRadius:16,
        background:current.end?(pct>=80?'#F0FDFA':pct>=50?'#FFFBEB':'#FEF2F2'):'var(--white)',
        border:'1.5px solid var(--border)',boxShadow:'var(--sh-md)'}}>
        <p style={{fontSize:15,color:'var(--dark)',lineHeight:1.7,fontWeight:500}}>{current.text}</p>
        {current.options&&(
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
            {current.options.map((opt,i)=>(
              <button key={i} onClick={()=>choose(opt)} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',
                borderRadius:12,border:'1.5px solid var(--border)',background:'var(--bg)',cursor:'pointer',textAlign:'left',
                fontFamily:'var(--font)',transition:'all .2s ease',fontSize:14,color:'var(--text)'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--orange)';e.currentTarget.style.background='var(--orange-bg)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg)'}}>
                <span style={{width:24,height:24,borderRadius:8,background:'var(--orange)',color:'#fff',fontWeight:700,fontSize:12,
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{String.fromCharCode(65+i)}</span>
                {opt.text}
              </button>
            ))}
          </div>
        )}
        {current.end&&(
          <div style={{marginTop:20,textAlign:'center'}}>
            <div style={{fontSize:14,fontWeight:600,color:'var(--muted)',marginBottom:12}}>Puntuación: {totalPts}/{maxPts} ({pct}%)</div>
            <ProgressBar pct={pct} h={8} color={pct>=80?'var(--success)':pct>=50?'var(--warn)':'var(--error)'}/>
            <Btn variant="gradient" size="lg" onClick={onComplete} style={{marginTop:16}}>Continuar <ArrowRIc s={18} c="#fff"/></Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- CONCEPT MATCHING (area-aware) ----
const ConceptMatchingChallenge = ({ mod, onComplete }) => {
  const isMobile = useMobile();
  // Use area-specific pairs from module, fallback to generic
  const pairs = mod.matchPairs || [
    {id:1,concept:'Empatía',def:'Comprender necesidades del estudiante',color:'#E8732C'},
    {id:2,concept:'Co-creación',def:'Diseñar junto con los estudiantes',color:'#7B3FA0'},
    {id:3,concept:'Iteración',def:'Mejorar continuamente el diseño',color:'#3B82F6'},
    {id:4,concept:'Reflexión',def:'Dar sentido a la experiencia vivida',color:'#10B981'},
    {id:5,concept:'Prototipado',def:'Crear versiones iniciales para probar',color:'#F59E0B'},
    {id:6,concept:'Mapa de empatía',def:'Herramienta visual de 4 cuadrantes',color:'#EC4899'},
  ];
  const [shuffledDefs]=React.useState(()=>{
    const d=pairs.map(p=>({id:p.id,def:p.def}));
    for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    return d;
  });
  const [selectedLeft,setSelectedLeft]=React.useState(null);
  const [matches,setMatches]=React.useState([]);
  const [wrongFlash,setWrongFlash]=React.useState(null);
  const [done,setDone]=React.useState(false);
  const [wrongCount,setWrongCount]=React.useState(0);

  const matchedLeftIds=matches.map(m=>m.leftId);
  const matchedRightIds=matches.map(m=>m.rightId);

  const handleLeftClick=(id)=>{if(matchedLeftIds.includes(id))return;setSelectedLeft(id);setWrongFlash(null);};
  const handleRightClick=(id)=>{
    if(matchedRightIds.includes(id)||selectedLeft===null)return;
    const isCorrect=selectedLeft===id;
    if(isCorrect){
      const pair=pairs.find(p=>p.id===selectedLeft);
      const newMatches=[...matches,{leftId:selectedLeft,rightId:id,correct:true,color:pair.color}];
      setMatches(newMatches);setSelectedLeft(null);
      if(newMatches.length===pairs.length){
        setTimeout(()=>{
          setDone(true);
          const qs=pairs.map(p=>({q:`${p.concept} → ${p.def}`,correct:true}));
          recordAttempt(mod.id,qs,pairs.length,pairs.length);
        },500);
      }
    } else {
      setWrongCount(c=>c+1);
      setWrongFlash({leftId:selectedLeft,rightId:id});
      setTimeout(()=>{setSelectedLeft(null);setWrongFlash(null);},800);
    }
  };

  const getLeftStyle=(id)=>{
    const matched=matches.find(m=>m.leftId===id);const isSelected=selectedLeft===id;const isWrong=wrongFlash&&wrongFlash.leftId===id;
    return {padding:'14px 18px',borderRadius:12,cursor:matched?'default':'pointer',
      border:isWrong?'2px solid var(--error)':matched?`2px solid ${matched.color}`:isSelected?'2px solid var(--orange)':'1.5px solid var(--border)',
      background:isWrong?'#FEF2F2':matched?matched.color+'12':isSelected?'var(--orange-bg)':'var(--white)',
      transition:'all .2s',fontWeight:600,fontSize:14,color:matched?matched.color:'var(--dark)',
      animation:isWrong?'shake .4s ease':'none',opacity:matched?.7:1,display:'flex',alignItems:'center',gap:10};
  };
  const getRightStyle=(id)=>{
    const matched=matches.find(m=>m.rightId===id);const isWrong=wrongFlash&&wrongFlash.rightId===id;
    return {padding:'14px 18px',borderRadius:12,cursor:selectedLeft!==null&&!matchedRightIds.includes(id)?'pointer':'default',
      border:isWrong?'2px solid var(--error)':matched?`2px solid ${matched.color}`:'1.5px solid var(--border)',
      background:isWrong?'#FEF2F2':matched?matched.color+'12':'var(--white)',
      transition:'all .2s',fontSize:13,color:matched?matched.color:'var(--text-sec)',
      animation:isWrong?'shake .4s ease':'none',opacity:matched?.7:1,lineHeight:1.5};
  };

  return (
    <div style={{maxWidth:700,margin:'0 auto',paddingBottom:48}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:40}}>🔗</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Conecta los Conceptos</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Haz clic en un concepto, luego en su definición correcta.</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,justifyContent:'center'}}>
        <ProgressBar pct={(matches.length/pairs.length)*100} h={6} color="var(--orange)"/>
        <span style={{fontSize:13,color:'var(--muted)',fontWeight:600,whiteSpace:'nowrap'}}>{matches.length}/{pairs.length}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?12:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--orange)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Concepto</div>
          {pairs.map(p=>(
            <div key={p.id} onClick={()=>handleLeftClick(p.id)} style={getLeftStyle(p.id)}
              onMouseEnter={e=>!matchedLeftIds.includes(p.id)&&selectedLeft!==p.id&&(e.currentTarget.style.borderColor='var(--orange-light)')}
              onMouseLeave={e=>!matchedLeftIds.includes(p.id)&&selectedLeft!==p.id&&(e.currentTarget.style.borderColor='var(--border)')}>
              <div style={{width:10,height:10,borderRadius:'50%',background:p.color,flexShrink:0}}/>{p.concept}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--purple)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Definición</div>
          {shuffledDefs.map(d=>(
            <div key={d.id} onClick={()=>handleRightClick(d.id)} style={getRightStyle(d.id)}
              onMouseEnter={e=>selectedLeft&&!matchedRightIds.includes(d.id)&&(e.currentTarget.style.borderColor='var(--purple-light)')}
              onMouseLeave={e=>!matchedRightIds.includes(d.id)&&(e.currentTarget.style.borderColor='var(--border)')}>
              {d.def}
            </div>
          ))}
        </div>
      </div>
      {selectedLeft&&!wrongFlash&&<p style={{textAlign:'center',marginTop:14,fontSize:13,color:'var(--orange)',fontWeight:500}}>Selecciona la definición correcta →</p>}
      {done&&(
        <div style={{textAlign:'center',marginTop:28}}>
          <p style={{fontSize:16,fontWeight:700,color:'var(--success)',marginBottom:14}}>🎉 ¡Todas las conexiones correctas!</p>
          <Btn variant="gradient" size="lg" onClick={onComplete}>Continuar <ArrowRIc s={18} c="#fff"/></Btn>
        </div>
      )}
    </div>
  );
};

// ---- DESIGN LAB ----
const DESIGN_STEPS=[
  {phase:'Empatizar',icon:'❤️',question:'¿Cómo conocerás a tus estudiantes antes de diseñar?',
    options:[{id:'a',text:'Entrevistas y observación participante',emoji:'🎤',score:3,tag:'Investigación empática profunda'},
      {id:'b',text:'Encuesta breve al inicio del curso',emoji:'📋',score:2,tag:'Diagnóstico parcial'},
      {id:'c',text:'Asumir basándome en mi experiencia previa',emoji:'🤔',score:1,tag:'Sin investigación empática'}]},
  {phase:'Definir',icon:'🎯',question:'¿Cómo defines el objetivo de la experiencia?',
    options:[{id:'a',text:'"Los estudiantes experimentarán resolver problemas reales de su comunidad"',emoji:'🌍',score:3,tag:'Objetivo experiencial transformador'},
      {id:'b',text:'"Los estudiantes comprenderán los conceptos clave"',emoji:'📖',score:2,tag:'Objetivo cognitivo tradicional'},
      {id:'c',text:'"Los estudiantes completarán las actividades del libro"',emoji:'📝',score:1,tag:'Objetivo de cobertura curricular'}]},
  {phase:'Idear',icon:'💡',question:'¿Qué tipo de actividad central diseñas?',
    options:[{id:'a',text:'Proyecto inmersivo con roles, escenarios y colaboración',emoji:'🎭',score:3,tag:'Experiencia inmersiva'},
      {id:'b',text:'Clase interactiva con preguntas y discusión',emoji:'💬',score:2,tag:'Clase participativa'},
      {id:'c',text:'Presentación con ejercicios individuales',emoji:'🖥️',score:1,tag:'Formato expositivo'}]},
  {phase:'Prototipar',icon:'🔧',question:'¿Cómo preparas y pruebas tu diseño?',
    options:[{id:'a',text:'Prototipo y prueba con grupo pequeño para iterar',emoji:'🧪',score:3,tag:'Prototipado iterativo'},
      {id:'b',text:'Diseño completo y revisión con colega',emoji:'👥',score:2,tag:'Revisión por pares'},
      {id:'c',text:'Preparo materiales y uso directamente',emoji:'📦',score:1,tag:'Sin prueba previa'}]},
  {phase:'Evaluar',icon:'📊',question:'¿Cómo evalúas la experiencia?',
    options:[{id:'a',text:'Portfolio reflexivo, autoevaluación y retroalimentación entre pares',emoji:'🪞',score:3,tag:'Evaluación reflexiva integral'},
      {id:'b',text:'Rúbrica del proyecto con criterios claros',emoji:'📐',score:2,tag:'Evaluación por rúbrica'},
      {id:'c',text:'Examen escrito sobre los conceptos',emoji:'📄',score:1,tag:'Evaluación tradicional'}]},
];

const DesignLabChallenge = ({ mod, onComplete }) => {
  const STEPS = mod.designSteps || DESIGN_STEPS;
  const [step,setStep]=React.useState(0);
  const [choices,setChoices]=React.useState([]);
  const [hovOpt,setHovOpt]=React.useState(null);
  const [done,setDone]=React.useState(false);
  const totalScore=choices.reduce((s,c)=>s+c.score,0);
  const maxScore=STEPS.length*3;
  const pct=Math.round((totalScore/maxScore)*100);

  const handleChoose=(option)=>{
    const nc=[...choices,{...option,phase:STEPS[step].phase}];
    setChoices(nc);
    if(step<STEPS.length-1){setTimeout(()=>setStep(s=>s+1),400);}
    else{
      setTimeout(()=>{
        setDone(true);
        const qs=nc.map(c=>({q:`${c.phase}: ${c.tag}`,correct:c.score===3}));
        recordAttempt(mod.id,qs,nc.reduce((a,c)=>a+c.score,0),STEPS.length*3);
      },500);
    }
  };
  const scoreColor=(s)=>s===3?'var(--success)':s===2?'var(--warn)':'var(--error)';

  if(done){
    const rating=pct>=80?{emoji:'🌟',text:'Excelente Diseñador DCE',desc:'Tu diseño está completamente alineado con el DCE.'}
      :pct>=53?{emoji:'👍',text:'Buen Diseñador en Formación',desc:'Tu diseño incorpora varios principios del DCE.'}
      :{emoji:'💪',text:'Iniciando el Camino DCE',desc:'Tu diseño todavía refleja un enfoque tradicional.'};
    return (
      <div style={{maxWidth:620,margin:'0 auto',paddingBottom:48}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <span style={{fontSize:56}}>{rating.emoji}</span>
          <h3 style={{fontSize:22,fontWeight:800,color:'var(--dark)',marginTop:10}}>{rating.text}</h3>
          <p style={{fontSize:14,color:'var(--muted)',marginTop:8,maxWidth:480,margin:'8px auto 0'}}>{rating.desc}</p>
          <div style={{marginTop:16,marginBottom:8}}>
            <span style={{fontSize:28,fontWeight:800,color:pct>=80?'var(--success)':'var(--orange)'}}>{pct}%</span>
            <span style={{fontSize:14,color:'var(--muted)',marginLeft:4}}>alineación DCE</span>
          </div>
          <ProgressBar pct={pct} h={10} color={pct>=80?'var(--success)':pct>=53?'var(--warn)':'var(--error)'}/>
        </div>
        <div style={{padding:'20px 24px',borderRadius:16,background:'var(--white)',border:'1px solid var(--border)',marginBottom:24}}>
          <h4 style={{fontSize:15,fontWeight:700,color:'var(--dark)',marginBottom:14}}>Tu diseño</h4>
          {choices.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
              borderBottom:i<choices.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:16,background:scoreColor(c.score)+'18',flexShrink:0}}>{c.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5}}>{c.phase}</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--dark)'}}>{c.tag}</div>
              </div>
              <div style={{width:8,height:8,borderRadius:'50%',background:scoreColor(c.score),flexShrink:0}}/>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center'}}><Btn variant="gradient" size="lg" onClick={onComplete}>Finalizar <TrophyIc s={18} c="#fff"/></Btn></div>
      </div>
    );
  }

  const current=STEPS[step];
  return (
    <div style={{maxWidth:660,margin:'0 auto',paddingBottom:48}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <span style={{fontSize:40}}>🏗️</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Laboratorio de Diseño DCE</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Diseña una experiencia paso a paso.</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:28}}>
        {STEPS.map((s,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{height:6,width:'100%',borderRadius:3,
              background:i<step?'var(--success)':i===step?'var(--orange)':'var(--border)',transition:'background .4s ease'}}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:.5,color:i<=step?'var(--dark)':'var(--subtle)',textTransform:'uppercase'}}>{s.phase}</span>
          </div>
        ))}
      </div>
      {choices.length>0&&(
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {choices.map((c,i)=>(
            <div key={i} style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,
              background:scoreColor(c.score)+'15',color:scoreColor(c.score),border:'1px solid '+scoreColor(c.score)+'30',
              display:'flex',alignItems:'center',gap:4}}><span>{c.emoji}</span>{c.phase}</div>
          ))}
        </div>
      )}
      <div key={step} style={{padding:'28px',borderRadius:18,background:'var(--white)',border:'1.5px solid var(--border)',boxShadow:'var(--sh-md)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:40,height:40,borderRadius:12,background:'var(--orange-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{current.icon}</div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--orange)',textTransform:'uppercase',letterSpacing:1}}>Fase: {current.phase}</div>
            <div style={{fontSize:13,color:'var(--muted)'}}>Paso {step+1} de {STEPS.length}</div>
          </div>
        </div>
        <h4 style={{fontSize:17,fontWeight:700,color:'var(--dark)',marginBottom:18,lineHeight:1.4}}>{current.question}</h4>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {current.options.map(opt=>{
            const isHov=hovOpt===opt.id+step;
            return <button key={opt.id} onClick={()=>handleChoose(opt)} onMouseEnter={()=>setHovOpt(opt.id+step)} onMouseLeave={()=>setHovOpt(null)}
              style={{display:'flex',alignItems:'center',gap:14,padding:'16px 18px',borderRadius:14,
                border:isHov?'2px solid var(--orange)':'1.5px solid var(--border)',
                background:isHov?'var(--orange-bg)':'var(--bg)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font)',
                transition:'all .2s ease',transform:isHov?'translateX(4px)':'none'}}>
              <span style={{fontSize:28,flexShrink:0}}>{opt.emoji}</span>
              <span style={{fontSize:14,color:'var(--dark)',fontWeight:500,lineHeight:1.5}}>{opt.text}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
};

// ---- QUIZ ----
const QuizChallenge = ({ mod, onComplete }) => {
  const isMobile = useMobile();
  const questions = mod.questions || [];
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!questions.length) return (
    <div style={{textAlign:'center',padding:40}}>
      <p style={{color:'var(--muted)',marginBottom:16}}>Este reto no tiene preguntas configuradas aún.</p>
      <Btn variant="secondary" onClick={onComplete}>Continuar</Btn>
    </div>
  );

  const q = questions[current];
  const correctCount = answers.filter((a,i) => a === questions[i]?.correct).length;
  const pct = Math.round((correctCount / questions.length) * 100);

  const handleConfirm = () => {
    if (selected === null) return;
    setAnswers(a => [...a, selected]);
    setConfirmed(true);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1); setSelected(null); setConfirmed(false);
    } else {
      const allAnswers = [...answers];
      const qs = questions.map((q, i) => ({ q: q.question, correct: allAnswers[i] === q.correct }));
      recordAttempt(mod.id, qs, correctCount, questions.length);
      setDone(true);
    }
  };

  if (done) {
    const rating = pct >= 80 ? { emoji:'🌟', text:'¡Excelente dominio del tema!' }
      : pct >= 60 ? { emoji:'👍', text:'¡Buen trabajo!' }
      : { emoji:'💪', text:'¡Sigue practicando!' };
    return (
      <div style={{maxWidth:520,margin:'0 auto',textAlign:'center',paddingBottom:48}}>
        <span style={{fontSize:56}}>{rating.emoji}</span>
        <h3 style={{fontSize:22,fontWeight:800,color:'var(--dark)',marginTop:10,marginBottom:6}}>{rating.text}</h3>
        <div style={{display:'flex',justifyContent:'center',alignItems:'baseline',gap:6,marginBottom:16}}>
          <span style={{fontSize:36,fontWeight:800,color:pct>=80?'var(--success)':'var(--orange)'}}>{pct}%</span>
          <span style={{fontSize:14,color:'var(--muted)'}}>{correctCount}/{questions.length} correctas</span>
        </div>
        <ProgressBar pct={pct} h={10} color={pct>=80?'var(--success)':pct>=60?'var(--warn)':'var(--error)'}/>
        <div style={{marginTop:24,textAlign:'left',display:'flex',flexDirection:'column',gap:8}}>
          {questions.map((q,i) => {
            const ok = answers[i] === q.correct;
            return (
              <div key={i} style={{padding:'12px 16px',borderRadius:12,background:ok?'#F0FDFA':'#FEF2F2',border:`1px solid ${ok?'#99F6E4':'#FECACA'}`}}>
                <p style={{fontSize:13,fontWeight:600,color:'var(--dark)',marginBottom:4}}>{q.question}</p>
                <p style={{fontSize:12,color:ok?'var(--success)':'var(--error)',fontWeight:500,margin:0}}>
                  {ok?'✓ ':'✗ '}{q.options[answers[i]]}
                  {!ok&&<span style={{color:'var(--success)',marginLeft:8}}>→ Correcta: {q.options[q.correct]}</span>}
                </p>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:20}}><Btn variant="gradient" size="lg" onClick={onComplete}>Continuar <ArrowRIc s={18} c="#fff"/></Btn></div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:560,margin:'0 auto',paddingBottom:48}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <ProgressBar pct={(current/questions.length)*100} h={6} color="var(--orange)"/>
        <span style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',fontWeight:600}}>{current+1}/{questions.length}</span>
      </div>
      <div key={current} style={{padding:'24px 28px',borderRadius:18,background:'var(--white)',border:'1.5px solid var(--border)',boxShadow:'var(--sh-md)',marginBottom:16}}>
        <h4 style={{fontSize:17,fontWeight:700,color:'var(--dark)',lineHeight:1.5,marginBottom:20}}>{q.question}</h4>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {(q.options||[]).map((opt,i) => {
            const isSel=selected===i, isOk=confirmed&&i===q.correct, isWrong=confirmed&&isSel&&i!==q.correct;
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(i)} disabled={confirmed}
                style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:12,
                  border:isOk?'2px solid var(--success)':isWrong?'2px solid var(--error)':isSel?'2px solid var(--orange)':'1.5px solid var(--border)',
                  background:isOk?'#F0FDFA':isWrong?'#FEF2F2':isSel?'var(--orange-bg)':'var(--bg)',
                  cursor:confirmed?'default':'pointer',fontFamily:'var(--font)',transition:'all .2s',textAlign:'left'}}>
                <span style={{width:28,height:28,borderRadius:8,flexShrink:0,fontWeight:700,fontSize:12,
                  background:isOk?'var(--success)':isWrong?'var(--error)':isSel?'var(--orange)':'var(--bg-alt)',
                  color:(isSel||isOk||isWrong)?'#fff':'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {String.fromCharCode(65+i)}
                </span>
                <span style={{fontSize:14,color:'var(--dark)',fontWeight:500,lineHeight:1.5,flex:1}}>{opt}</span>
                {isOk&&<CheckIc s={18} c="var(--success)"/>}
                {isWrong&&<XIc s={18} c="var(--error)"/>}
              </button>
            );
          })}
        </div>
        {confirmed&&(
          <p style={{fontSize:13,fontWeight:600,marginTop:14,color:answers[answers.length-1]===q.correct?'var(--success)':'var(--error)'}}>
            {answers[answers.length-1]===q.correct?'✓ ¡Correcto!':'✗ Respuesta correcta: '+q.options[q.correct]}
          </p>
        )}
      </div>
      {!confirmed
        ?<Btn variant="primary" size="lg" disabled={selected===null} onClick={handleConfirm} full>Confirmar respuesta</Btn>
        :<Btn variant="gradient" size="lg" onClick={handleNext} full>
          {current<questions.length-1?<>Siguiente <ArrowRIc s={18} c="#fff"/></>:<>Ver resultados <TrophyIc s={18} c="#fff"/></>}
        </Btn>
      }
    </div>
  );
};

// ---- TRUE / FALSE ----
// challenge_data: { statements: [{ id, text, answer: true|false }] }
const TrueFalseChallenge = ({ mod, onComplete }) => {
  const statements = mod.statements || [];
  const [answers, setAnswers] = React.useState({});
  const [done, setDone] = React.useState(false);

  if (!statements.length) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <p style={{ color:'var(--muted)', marginBottom:16 }}>Este reto no tiene afirmaciones configuradas aún.</p>
      <Btn variant="secondary" onClick={onComplete}>Continuar</Btn>
    </div>
  );

  const allAnswered = statements.every(s => answers[s.id] !== undefined);
  const correctCount = statements.filter(s => answers[s.id] === s.answer).length;
  const pct = Math.round((correctCount / statements.length) * 100);

  const choose = (id, val) => { if (!done) setAnswers(a => ({ ...a, [id]: val })); };

  const handleCheck = () => {
    setDone(true);
    const qs = statements.map(s => ({ q: s.text, correct: answers[s.id] === s.answer }));
    recordAttempt(mod.id, qs, correctCount, statements.length);
  };

  const optBtn = (active, tone) => ({
    flex:1, padding:'9px 0', borderRadius:10, cursor: done ? 'default' : 'pointer',
    fontFamily:'var(--font)', fontSize:13, fontWeight:700, transition:'all .15s',
    border:`1.5px solid ${active ? (tone==='v'?'var(--success)':'var(--error)') : 'var(--border)'}`,
    background: active ? (tone==='v'?'var(--success-bg)':'var(--error-bg)') : 'var(--white)',
    color: active ? (tone==='v'?'var(--success)':'var(--error)') : 'var(--muted)',
  });

  return (
    <div style={{ maxWidth:620, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <span style={{ fontSize:40 }}>⚖️</span>
        <h3 style={{ fontSize:20, fontWeight:700, marginTop:8, color:'var(--dark)' }}>Verdadero o Falso</h3>
        <p style={{ fontSize:14, color:'var(--muted)', marginTop:6 }}>Marca cada afirmación según corresponda.</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {statements.map((s, i) => {
          const picked = answers[s.id];
          const isWrong = done && picked !== undefined && picked !== s.answer;
          return (
            <div key={s.id ?? i} style={{ padding:'14px 16px', borderRadius:12, background:'var(--white)',
              border:`1.5px solid ${isWrong ? 'var(--error)' : 'var(--border)'}`, boxShadow:'var(--sh-sm)' }}>
              <p style={{ fontSize:14, color:'var(--dark)', lineHeight:1.6, marginBottom:10 }}>{s.text}</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => choose(s.id, true)}  style={optBtn(picked === true,  'v')}>✓ Verdadero</button>
                <button onClick={() => choose(s.id, false)} style={optBtn(picked === false, 'f')}>✗ Falso</button>
              </div>
              {done && (
                <p style={{ fontSize:12, marginTop:8, fontWeight:600,
                  color: picked === s.answer ? 'var(--success)' : 'var(--error)' }}>
                  {picked === s.answer ? '¡Correcto!' : `Respuesta correcta: ${s.answer ? 'Verdadero' : 'Falso'}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!done ? (
        <Btn variant="gradient" size="lg" full disabled={!allAnswered} onClick={handleCheck} style={{ marginTop:20 }}>
          Verificar respuestas
        </Btn>
      ) : (
        <div style={{ marginTop:20, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)', marginBottom:12 }}>
            {correctCount}/{statements.length} correctas ({pct}%)
          </div>
          <ProgressBar pct={pct} h={8} color={pct>=80?'var(--success)':pct>=50?'var(--warn)':'var(--error)'}/>
          <Btn variant="gradient" size="lg" onClick={onComplete} style={{ marginTop:16 }}>
            Continuar <ArrowRIc s={18} c="#fff"/>
          </Btn>
        </div>
      )}
    </div>
  );
};

// ---- FILL IN THE BLANKS ----
// challenge_data: { blanks: [{ id, before, answer, after }] }
// El estudiante completa cada hueco eligiendo del banco de palabras (las
// respuestas barajadas). Se califica por coincidencia exacta con `answer`.
const FillBlankChallenge = ({ mod, onComplete }) => {
  const blanks = mod.blanks || [];
  const wordBank = React.useMemo(() => {
    const words = blanks.map(b => b.answer).filter(Boolean);
    for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
    return words;
  }, [mod.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [answers, setAnswers] = React.useState({});
  const [done, setDone] = React.useState(false);

  if (!blanks.length) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <p style={{ color:'var(--muted)', marginBottom:16 }}>Este reto no tiene espacios configurados aún.</p>
      <Btn variant="secondary" onClick={onComplete}>Continuar</Btn>
    </div>
  );

  const allFilled = blanks.every(b => answers[b.id] !== undefined && answers[b.id] !== '');
  const correctCount = blanks.filter(b => answers[b.id] === b.answer).length;
  const pct = Math.round((correctCount / blanks.length) * 100);

  const handleCheck = () => {
    setDone(true);
    const qs = blanks.map(b => ({ q: `${b.before || ''} ___ ${b.after || ''}`.trim(), correct: answers[b.id] === b.answer }));
    recordAttempt(mod.id, qs, correctCount, blanks.length);
  };

  const selStyle = (b) => {
    const ok = answers[b.id] === b.answer;
    const border = done ? (ok ? 'var(--success)' : 'var(--error)') : (answers[b.id] ? 'var(--orange)' : 'var(--border)');
    const color  = done ? (ok ? 'var(--success)' : 'var(--error)') : 'var(--dark)';
    return { display:'inline-block', margin:'0 4px', padding:'3px 8px', borderRadius:8, fontFamily:'var(--font)',
      fontSize:14, fontWeight:600, color, border:`1.5px solid ${border}`, background:'var(--white)',
      outline:'none', cursor: done ? 'default' : 'pointer' };
  };

  return (
    <div style={{ maxWidth:620, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <span style={{ fontSize:40 }}>✏️</span>
        <h3 style={{ fontSize:20, fontWeight:700, marginTop:8, color:'var(--dark)' }}>Completar espacios</h3>
        <p style={{ fontSize:14, color:'var(--muted)', marginTop:6 }}>Elige la palabra correcta para cada hueco.</p>
      </div>

      {/* Banco de palabras */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:20 }}>
        {wordBank.map((w, i) => (
          <span key={i} style={{ padding:'6px 12px', borderRadius:20, background:'var(--purple-bg)',
            color:'var(--purple)', fontSize:13, fontWeight:600 }}>{w}</span>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {blanks.map((b, i) => (
          <div key={b.id ?? i} style={{ padding:'14px 16px', borderRadius:12, background:'var(--white)',
            border:'1.5px solid var(--border)', boxShadow:'var(--sh-sm)', fontSize:14, lineHeight:2, color:'var(--dark)' }}>
            {b.before}
            <select disabled={done} value={answers[b.id] || ''} style={selStyle(b)}
              onChange={e => setAnswers(a => ({ ...a, [b.id]: e.target.value }))}>
              <option value="">— elige —</option>
              {wordBank.map((w, wi) => <option key={wi} value={w}>{w}</option>)}
            </select>
            {b.after}
            {done && answers[b.id] !== b.answer && (
              <span style={{ display:'block', fontSize:12, color:'var(--error)', fontWeight:600, marginTop:4 }}>
                Respuesta correcta: {b.answer}
              </span>
            )}
          </div>
        ))}
      </div>

      {!done ? (
        <Btn variant="gradient" size="lg" full disabled={!allFilled} onClick={handleCheck} style={{ marginTop:20 }}>
          Verificar respuestas
        </Btn>
      ) : (
        <div style={{ marginTop:20, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)', marginBottom:12 }}>
            {correctCount}/{blanks.length} correctas ({pct}%)
          </div>
          <ProgressBar pct={pct} h={8} color={pct>=80?'var(--success)':pct>=50?'var(--warn)':'var(--error)'}/>
          <Btn variant="gradient" size="lg" onClick={onComplete} style={{ marginTop:16 }}>
            Continuar <ArrowRIc s={18} c="#fff"/>
          </Btn>
        </div>
      )}
    </div>
  );
};

// ---- Challenge Router ----
const ChallengeView = () => {
  const nodeId=useStore(s=>s.nodeId);
  const completed=useStore(s=>s.completed);
  const selectedArea=useStore(s=>s.selectedArea);
  const isMobile=useMobile();
  const mod=findModule(nodeId)||findModuleInConfig(nodeId);
  const [showConfetti,setShowConfetti]=React.useState(false);
  const isCompleted=completed.includes(nodeId);

  const courseTheme=getActiveCourseTheme();

  const handleComplete=()=>{
    let routeNowComplete=false;
    if(!isCompleted){
      completeNode(nodeId);setShowConfetti(true);
      const newCompleted=[...completed,nodeId];
      routeNowComplete=isRouteComplete(newCompleted,selectedArea);
    }
    setTimeout(()=>nav(routeNowComplete?'grid':'map'),courseTheme?2300:1800);
  };

  if(!mod)return <div style={{padding:40,textAlign:'center'}}><Btn variant="secondary" onClick={()=>nav('map')}><ArrowLIc s={16}/>Volver</Btn></div>;

  const ChallengeComp={dragdrop:DragDropChallenge,empathy:EmpathyMapChallenge,simulation:SimulationChallenge,
    matching:ConceptMatchingChallenge,designlab:DesignLabChallenge,quiz:QuizChallenge,
    truefalse:TrueFalseChallenge,fillblank:FillBlankChallenge}[mod.ctype]||DesignLabChallenge;

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      {showConfetti&&(courseTheme
        ? <ThemeCelebration theme={courseTheme} onDone={()=>setShowConfetti(false)}/>
        : <Confetti onDone={()=>setShowConfetti(false)}/>)}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:isMobile?'12px 16px':'14px 28px',
        borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--white)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1}}>
          <button onClick={()=>nav('map')} style={{background:'var(--bg-alt)',border:'none',cursor:'pointer',
            width:36,height:36,flexShrink:0,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ArrowLIc s={18} c="var(--text)"/></button>
          <div style={{minWidth:0}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--purple)',textTransform:'uppercase',letterSpacing:1}}>{mod.subtitle}</span>
            <h3 style={{fontSize:isMobile?14:16,fontWeight:700,color:'var(--dark)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{mod.title}</h3>
          </div>
        </div>
        <span style={{fontSize:12,color:'var(--muted)',flexShrink:0,marginLeft:8}}>+{mod.xp} XP</span>
      </div>
      <div style={{flex:1,overflow:'auto',WebkitOverflowScrolling:'touch',padding:isMobile?'20px 16px':'32px 28px'}}>
        {isCompleted && (
          <div className="ls-done-box" style={{maxWidth:560,margin:'0 auto 20px'}}>
            <CheckIc s={18} c="var(--success)" />
            <span style={{fontSize:13,fontWeight:600,color:'var(--success)'}}>Ya completaste este reto · Puedes volver a practicarlo</span>
            <button onClick={()=>nav('map')} style={{marginLeft:'auto',fontSize:12,color:'var(--success)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,flexShrink:0}}>
              Volver al mapa →
            </button>
          </div>
        )}
        {mod.task && (
          <div className="ls-task-box" style={{maxWidth:560,margin:'0 auto 24px'}}>
            <span style={{fontSize:20,flexShrink:0}}>📋</span>
            <div>
              <div className="ls-task-label" style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>¿Qué debes hacer?</div>
              <p className="ls-task-text" style={{fontSize:13,lineHeight:1.6,margin:0}}>{mod.task}</p>
            </div>
          </div>
        )}
        <ChallengeComp mod={mod} onComplete={handleComplete}/>
      </div>
    </div>
  );
};

export default ChallengeView;
