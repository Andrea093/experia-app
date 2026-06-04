import React from 'react'
import {
  useStore, nav, completeNode, recordAttempt, findModule, AREAS, BADGES, LEVELS,
  getStudentModules, nodeStatus, calcLevel,
} from '../store/store.jsx'
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
  const correctOrder = ['Empatizar','Definir','Idear','Prototipar','Evaluar'];
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

  const handleDrop = (i) => {
    if(dragIdx===null) return;
    const next=[...items]; const [moved]=next.splice(dragIdx,1); next.splice(i,0,moved);
    setItems(next); setDragIdx(null); setOverIdx(null);
  };
  const handleCheck = () => {
    const isOk = items.every((it,i)=>it===correctOrder[i]);
    setChecked(true); setCorrect(isOk); setAttempts(a=>a+1);
    // Record attempt
    const qs = items.map((it,i)=>({q:`${it} en posición ${i+1}`,correct:it===correctOrder[i]}));
    const score = qs.filter(q=>q.correct).length;
    recordAttempt(mod.id, qs, score, correctOrder.length);
    if(!isOk) setTimeout(()=>setChecked(false),1800);
  };
  const phaseColors={Empatizar:'#E8732C',Definir:'#7B3FA0',Idear:'#3B82F6',Prototipar:'#10B981',Evaluar:'#F59E0B'};

  return (
    <div style={{maxWidth:540,margin:'0 auto'}}>
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
              background:isRight?'#F0FDF4':isWrong?'#FEF2F2':'var(--white)',
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
    {key:'dice',label:'Dice',icon:'💬',color:'#10B981',bg:'#F0FDF4'},
    {key:'hace',label:'Hace',icon:'🤲',color:'#F59E0B',bg:'#FFFBEB'},
  ];
  const allCards=[
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
    setPlaced(p=>({...p,[qKey]:[...p[qKey],dragCard]}));
    setUnplaced(u=>u.filter(c=>c.id!==dragCard.id));
    setDragCard(null);
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
    <div style={{maxWidth:720,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <span style={{fontSize:40}}>🗺️</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Mapa de Empatía del Estudiante</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Arrastra cada tarjeta al cuadrante correcto.</p>
      </div>
      {unplaced.length>0&&(
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20,justifyContent:'center'}}>
          {unplaced.map(c=>(
            <div key={c.id} draggable onDragStart={()=>setDragCard(c)}
              style={{padding:'8px 14px',borderRadius:10,background:'var(--white)',border:'1.5px solid var(--border)',
                cursor:'grab',fontSize:13,fontWeight:500,color:'var(--dark)',maxWidth:220,boxShadow:'var(--sh-sm)',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--sh-md)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--sh-sm)'}>{c.text}</div>
          ))}
        </div>
      )}
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
                return <div key={c.id} style={{padding:'7px 12px',borderRadius:8,fontSize:12,fontWeight:500,
                  background:isRight?'#D1FAE5':isWrong?'#FEE2E2':'var(--white)',
                  border:isRight?'1px solid var(--success)':isWrong?'1px solid var(--error)':'1px solid '+q.color+'30',
                  color:'var(--dark)'}}>{c.text} {isRight&&'✓'}{isWrong&&'✗'}</div>;
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
              {score>=6?'🎉 ¡Excelente!':'👍 ¡Buen intento!'} {score}/{allCards.length} correctas
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
  const [node,setNode]=React.useState('start');
  const [totalPts,setTotalPts]=React.useState(0);
  const [history,setHistory]=React.useState([]);
  const current=SIM_TREE[node];
  const choose=(opt)=>{setTotalPts(p=>p+opt.points);setHistory(h=>[...h,{text:current.text,chosen:opt.text}]);setNode(opt.next);};
  const maxPts=6, pct=Math.round((totalPts/maxPts)*100);

  // Record when done
  React.useEffect(()=>{
    if(current.end){
      recordAttempt(mod.id,[
        {q:'Primer paso pedagógico',correct:totalPts>=3},
        {q:'Decisión de diseño',correct:totalPts>=5},
        {q:'Resultado general',correct:pct>=80},
      ],totalPts,maxPts);
    }
  },[node, totalPts]);

  return (
    <div style={{maxWidth:600,margin:'0 auto'}}>
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
        background:current.end?(pct>=80?'#F0FDF4':pct>=50?'#FFFBEB':'#FEF2F2'):'var(--white)',
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
    <div style={{maxWidth:700,margin:'0 auto'}}>
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
  const [step,setStep]=React.useState(0);
  const [choices,setChoices]=React.useState([]);
  const [hovOpt,setHovOpt]=React.useState(null);
  const [done,setDone]=React.useState(false);
  const totalScore=choices.reduce((s,c)=>s+c.score,0);
  const maxScore=DESIGN_STEPS.length*3;
  const pct=Math.round((totalScore/maxScore)*100);

  const handleChoose=(option)=>{
    const nc=[...choices,{...option,phase:DESIGN_STEPS[step].phase}];
    setChoices(nc);
    if(step<DESIGN_STEPS.length-1){setTimeout(()=>setStep(s=>s+1),400);}
    else{
      setTimeout(()=>{
        setDone(true);
        const qs=nc.map(c=>({q:`${c.phase}: ${c.tag}`,correct:c.score===3}));
        recordAttempt(mod.id,qs,nc.reduce((a,c)=>a+c.score,0),DESIGN_STEPS.length*3);
      },500);
    }
  };
  const scoreColor=(s)=>s===3?'var(--success)':s===2?'var(--warn)':'var(--error)';

  if(done){
    const rating=pct>=80?{emoji:'🌟',text:'Excelente Diseñador DCE',desc:'Tu diseño está completamente alineado con el DCE.'}
      :pct>=53?{emoji:'👍',text:'Buen Diseñador en Formación',desc:'Tu diseño incorpora varios principios del DCE.'}
      :{emoji:'💪',text:'Iniciando el Camino DCE',desc:'Tu diseño todavía refleja un enfoque tradicional.'};
    return (
      <div style={{maxWidth:620,margin:'0 auto'}}>
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

  const current=DESIGN_STEPS[step];
  return (
    <div style={{maxWidth:660,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <span style={{fontSize:40}}>🏗️</span>
        <h3 style={{fontSize:20,fontWeight:700,marginTop:8,color:'var(--dark)'}}>Laboratorio de Diseño DCE</h3>
        <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Diseña una experiencia paso a paso.</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:28}}>
        {DESIGN_STEPS.map((s,i)=>(
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
            <div style={{fontSize:13,color:'var(--muted)'}}>Paso {step+1} de {DESIGN_STEPS.length}</div>
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

// ---- Challenge Router ----
const ChallengeView = () => {
  const nodeId=useStore(s=>s.nodeId);
  const completed=useStore(s=>s.completed);
  const selectedArea=useStore(s=>s.selectedArea);
  const isMobile=useMobile();
  const mod=findModule(nodeId);
  const [showConfetti,setShowConfetti]=React.useState(false);
  const isCompleted=completed.includes(nodeId);

  const handleComplete=()=>{
    let routeNowComplete=false;
    if(!isCompleted){
      completeNode(nodeId);setShowConfetti(true);
      const newCompleted=[...completed,nodeId];
      routeNowComplete=isRouteComplete(newCompleted,selectedArea);
    }
    setTimeout(()=>nav(routeNowComplete?'grid':'map'),1800);
  };

  if(!mod)return <div style={{padding:40,textAlign:'center'}}><Btn variant="secondary" onClick={()=>nav('map')}><ArrowLIc s={16}/>Volver</Btn></div>;

  const ChallengeComp={dragdrop:DragDropChallenge,empathy:EmpathyMapChallenge,simulation:SimulationChallenge,
    matching:ConceptMatchingChallenge,designlab:DesignLabChallenge}[mod.ctype]||DesignLabChallenge;

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      {showConfetti&&<Confetti onDone={()=>setShowConfetti(false)}/>}
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
          <div style={{maxWidth:560,margin:'0 auto 20px',display:'flex',alignItems:'center',gap:12,
            padding:'12px 18px',borderRadius:12,background:'#F0FDF4',border:'1.5px solid #6EE7B7'}}>
            <CheckIc s={18} c="var(--success)" />
            <span style={{fontSize:13,fontWeight:600,color:'var(--success)'}}>Ya completaste este reto · Puedes volver a practicarlo</span>
            <button onClick={()=>nav('map')} style={{marginLeft:'auto',fontSize:12,color:'var(--success)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,flexShrink:0}}>
              Volver al mapa →
            </button>
          </div>
        )}
        {mod.task && (
          <div style={{maxWidth:560,margin:'0 auto 24px',display:'flex',alignItems:'flex-start',gap:12,
            padding:'14px 18px',borderRadius:12,background:'#FFF7ED',border:'1.5px solid #FDBA74'}}>
            <span style={{fontSize:20,flexShrink:0}}>📋</span>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:'#C2410C',textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>¿Qué debes hacer?</div>
              <p style={{fontSize:13,color:'#7C2D12',lineHeight:1.6,margin:0}}>{mod.task}</p>
            </div>
          </div>
        )}
        <ChallengeComp mod={mod} onComplete={handleComplete}/>
      </div>
    </div>
  );
};

export default ChallengeView;
