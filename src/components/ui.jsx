import React from 'react'
import { BADGES, useStore, dismissNotif } from '../store/store.jsx'

// --- Responsive hook ---
const useMobile = (bp = 768) => {
  const [mob, setMob] = React.useState(() => window.innerWidth < bp);
  React.useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setMob(window.innerWidth < bp), 80); };
    window.addEventListener('resize', h, { passive: true });
    return () => { window.removeEventListener('resize', h); clearTimeout(t); };
  }, [bp]);
  return mob;
};

// --- Icon wrapper ---
const IP = {fill:'none',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'};
const Sv = ({children,s=20,c='currentColor',...r}) =>
  React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',stroke:c,...IP,...r},children);

const HomeIc=({s,c})=><Sv s={s} c={c}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></Sv>;
const BookIc=({s,c})=><Sv s={s} c={c}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></Sv>;
const GameIc=({s,c})=><Sv s={s} c={c}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></Sv>;
const FileIc=({s,c})=><Sv s={s} c={c}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></Sv>;
const UserIc=({s,c})=><Sv s={s} c={c}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Sv>;
const LockIc=({s,c})=><Sv s={s} c={c}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></Sv>;
const CheckIc=({s,c})=><Sv s={s} c={c}><path d="M20 6L9 17l-5-5"/></Sv>;
const PlayIc=({s,c})=><Sv s={s} c={c} fill={c} stroke="none"><polygon points="5,3 19,12 5,21"/></Sv>;
const ArrowRIc=({s,c})=><Sv s={s} c={c}><path d="M5 12h14M12 5l7 7-7 7"/></Sv>;
const ArrowLIc=({s,c})=><Sv s={s} c={c}><path d="M19 12H5M12 19l-7-7 7-7"/></Sv>;
const ChevRIc=({s,c})=><Sv s={s} c={c}><path d="M9 18l6-6-6-6"/></Sv>;
const StarIc=({s,c})=><Sv s={s} c={c} fill={c} stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></Sv>;
const TrophyIc=({s,c})=><Sv s={s} c={c}><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></Sv>;
const ZapIc=({s,c})=><Sv s={s} c={c} fill={c} stroke="none"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></Sv>;
const AwardIc=({s,c})=><Sv s={s} c={c}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></Sv>;
const BellIc=({s,c})=><Sv s={s} c={c}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></Sv>;
const LogOutIc=({s,c})=><Sv s={s} c={c}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Sv>;
const ClockIc=({s,c})=><Sv s={s} c={c}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Sv>;
const XIc=({s,c})=><Sv s={s} c={c}><path d="M18 6L6 18M6 6l12 12"/></Sv>;
const PlusIc=({s,c})=><Sv s={s} c={c}><path d="M12 5v14M5 12h14"/></Sv>;
const TrashIc=({s,c})=><Sv s={s} c={c}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Sv>;
const EditIc=({s,c})=><Sv s={s} c={c}><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></Sv>;
const MenuIc=({s,c})=><Sv s={s} c={c}><path d="M3 12h18M3 6h18M3 18h18"/></Sv>;
const TargetIc=({s,c})=><Sv s={s} c={c}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Sv>;
const SettingsIc=({s,c})=><Sv s={s} c={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Sv>;
const BarIc=({s,c})=><Sv s={s} c={c}><path d="M12 20V10M18 20V4M6 20v-4"/></Sv>;
const UsersIc=({s,c})=><Sv s={s} c={c}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></Sv>;
const GripIc=({s,c})=><Sv s={s} c={c} fill={c}><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></Sv>;
const MapIc=({s,c})=><Sv s={s} c={c}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></Sv>;
const SchoolIc=({s,c})=><Sv s={s} c={c}><rect x="3" y="9" width="18" height="13" rx="2"/><path d="M3 9l9-6 9 6"/><path d="M9 22v-8h6v8"/></Sv>;
const UploadIc=({s,c})=><Sv s={s} c={c}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Sv>;
const SunIc=({s,c})=><Sv s={s} c={c}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Sv>;
const MsgIc=({s,c})=><Sv s={s} c={c}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></Sv>;
const MoonIc=({s,c})=><Sv s={s} c={c}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Sv>;
const PaletteIc=({s,c})=><Sv s={s} c={c}><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.69-.76 1.69-1.69 0-.44-.17-.83-.44-1.13-.27-.3-.43-.7-.43-1.13a1.69 1.69 0 011.69-1.69h2A5.5 5.5 0 0022 11c0-4.97-4.5-9-10-9z"/></Sv>;

// --- Button ---
const Btn = ({children, variant='primary', size='md', onClick, disabled, full, style:sx={}}) => {
  const base = {display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'var(--font)',
    fontWeight:600,border:'none',cursor:'pointer',borderRadius:'var(--r-md)',
    transition:'transform .2s var(--ease-out), box-shadow .2s var(--ease-out), background .2s var(--ease-out), filter .2s var(--ease-out)',
    ...(disabled?{opacity:.5,pointerEvents:'none'}:{}), ...(full?{width:'100%'}:{})};
  const sizes = {sm:{padding:'8px 16px',fontSize:13},md:{padding:'11px 22px',fontSize:14},lg:{padding:'14px 32px',fontSize:16}};
  const vars = {
    primary:{background:'var(--gradient-orange)',color:'#fff',boxShadow:'var(--sh-orange)'},
    secondary:{background:'var(--bg-alt)',color:'var(--text)'},
    outline:{background:'transparent',color:'var(--orange)',boxShadow:'inset 0 0 0 2px var(--orange)'},
    ghost:{background:'transparent',color:'var(--muted)'},
    gradient:{background:'var(--gradient)',color:'#fff',boxShadow:'var(--sh-purple)'},
    white:{background:'#fff',color:'#1A1A2E',boxShadow:'var(--sh-sm)'},
    danger:{background:'var(--error)',color:'#fff'},
  };
  const hovShadow = {
    primary:'0 10px 28px -8px rgba(232,115,44,.55)',
    gradient:'0 10px 28px -8px rgba(123,63,160,.5)',
  };
  const [hov,setH] = React.useState(false);
  return <button onClick={onClick} disabled={disabled} className="btn-press"
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{...base,...sizes[size],...vars[variant],
      transform:hov&&!disabled?'translateY(-1.5px)':'none',
      filter:hov&&!disabled?'brightness(1.05)':'none',
      boxShadow:hov&&!disabled?(hovShadow[variant]||'var(--sh-md)'):(vars[variant].boxShadow||'none'),
      ...sx}}>{children}</button>;
};

// --- Progress Ring ---
const ProgressRing = ({pct=0, size=56, sw=4, color='var(--orange)'}) => {
  const r=(size-sw)/2, c=2*Math.PI*r, off=c-(pct/100)*c;
  return <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
      strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
      style={{transition:'stroke-dashoffset .8s ease'}}/>
  </svg>;
};

// --- Progress Bar ---
const ProgressBar = ({pct=0, h=8, color='var(--orange)', bg='var(--border)'}) =>
  <div style={{width:'100%',height:h,borderRadius:h,background:bg,overflow:'hidden'}}>
    <div style={{height:'100%',borderRadius:h,width:pct+'%',transition:'width .8s var(--ease-out)',
      background:color==='var(--orange)'?'var(--gradient-orange)':color}}/>
  </div>;

// --- Skeleton loader ---
const Skeleton = ({w='100%', h=14, r, circle=false, style:sx={}}) =>
  <div className="skeleton" aria-hidden="true" style={{width:circle?h:w,height:h,
    borderRadius:circle?'50%':(r??'var(--r-sm)'),flexShrink:0,...sx}}/>;

// --- Skeleton de tarjeta (loading state genérico) ---
const SkeletonCard = ({lines=3}) =>
  <div style={{padding:20,borderRadius:'var(--r-lg)',border:'1px solid var(--border)',background:'var(--white)',
    display:'flex',flexDirection:'column',gap:12}}>
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <Skeleton circle h={40}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
        <Skeleton w="55%" h={12}/>
        <Skeleton w="35%" h={10}/>
      </div>
    </div>
    {Array.from({length:lines},(_,i)=><Skeleton key={i} w={`${92-i*14}%`} h={10}/>)}
  </div>;

// --- Animated Number ---
const AnimNum = ({value, duration=600}) => {
  const [disp, setDisp] = React.useState(0);
  const dispRef = React.useRef(0);
  dispRef.current = disp;
  React.useEffect(()=>{
    let start=null, from=dispRef.current, rafId;
    const step=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/duration,1);
      setDisp(Math.round(from+(value-from)*p));if(p<1)rafId=requestAnimationFrame(step);};
    rafId=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(rafId);
  },[value]);
  return <span>{disp}</span>;
};

// --- XP Toast ---
const XPToast = ({amount, onDone}) => {
  React.useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[]);
  return <div style={{position:'fixed',top:80,right:24,zIndex:9999,
    background:'linear-gradient(135deg,var(--orange),var(--orange-light))',
    color:'#fff',padding:'12px 24px',borderRadius:14,fontWeight:700,fontSize:18,
    animation:'xpPop 2.2s ease-out forwards',boxShadow:'0 4px 20px rgba(232,115,44,.4)',
    display:'flex',alignItems:'center',gap:8}}>
    <ZapIc s={20} c="#fff"/> +{amount} XP
  </div>;
};

// --- Badge Toast ---
const BadgeToast = ({bid, onDone}) => {
  const b = BADGES[bid];
  React.useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  if(!b) return null;
  return <div style={{position:'fixed',top:140,right:24,zIndex:9999,
    background:'var(--white)',padding:'16px 24px',borderRadius:16,fontWeight:600,fontSize:15,
    animation:'xpPop 3s ease-out forwards',boxShadow:'var(--sh-xl)',
    display:'flex',alignItems:'center',gap:12,border:'2px solid var(--orange-bg)'}}>
    <span style={{fontSize:32}}>{b.icon}</span>
    <div><div style={{fontSize:11,color:'var(--orange)',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Nueva insignia</div>{b.name}</div>
  </div>;
};

// --- Confetti ---
const Confetti = ({onDone}) => {
  const [pcs] = React.useState(()=>Array.from({length:40},(_,i)=>({
    l:Math.random()*100, dl:Math.random()*.6, dur:1.5+Math.random()*2,
    c:['#E8732C','#7B3FA0','#10B981','#F59E0B','#3B82F6','#EC4899'][Math.floor(Math.random()*6)],
    sz:5+Math.random()*7, round:Math.random()>.5
  })));
  React.useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[]);
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:10000}}>
    {pcs.map((p,i)=><div key={i} style={{position:'absolute',left:p.l+'%',top:-20,
      width:p.sz,height:p.sz*1.2,backgroundColor:p.c,borderRadius:p.round?'50%':'2px',
      animation:`confetti ${p.dur}s ${p.dl}s ease-in forwards`}}/>)}
  </div>;
};

// --- Notification Manager ---
const NotifManager = () => {
  const notifs = useStore(s=>s.notifications);
  return <>
    {notifs.map(n => n.type==='xp'
      ? <XPToast key={n.id} amount={n.amount} onDone={()=>dismissNotif(n.id)}/>
      : n.type==='badge'
      ? <BadgeToast key={n.id} bid={n.bid} onDone={()=>dismissNotif(n.id)}/>
      : null
    )}
  </>;
};

// --- Modal ---
const Modal = ({open,onClose,title,children,width=560}) => {
  const isMobile = useMobile();
  React.useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if(!open) return null;
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:5000,
    background:'rgba(15,15,30,.45)',backdropFilter:'blur(10px) saturate(1.2)',WebkitBackdropFilter:'blur(10px) saturate(1.2)',
    display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',animation:'fadeIn .2s ease'}}>
    <div onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" style={{background:'var(--white)',
      borderRadius:isMobile?'24px 24px 0 0':'var(--r-xl)',
      maxWidth:isMobile?'100%':width,
      width:isMobile?'100%':'92%',
      maxHeight:isMobile?'92vh':'85vh',
      overflow:'auto',animation:isMobile?'sheetIn .35s var(--ease-out)':'modalIn .3s var(--ease-out)',boxShadow:'var(--sh-xl)'}}>
      {title && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        padding:'18px 24px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:1,
        background:'var(--glass-bg)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'}}>
        <h3 style={{fontSize:18,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} aria-label="Cerrar" style={{background:'var(--bg-alt)',border:'none',cursor:'pointer',padding:6,
          borderRadius:8,display:'flex',minWidth:32,minHeight:32,alignItems:'center',justifyContent:'center',
          transition:'background .2s, transform .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--border)';e.currentTarget.style.transform='rotate(90deg)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-alt)';e.currentTarget.style.transform='none'}}>
          <XIc s={20} c="var(--muted)"/></button>
      </div>}
      <div style={{padding:isMobile?'20px 20px 32px':24}}>{children}</div>
    </div>
  </div>;
};

// --- Badge Card ---
const BadgeCard = ({bid, earned=false, size='md'}) => {
  const b=BADGES[bid]; if(!b) return null;
  const sz=size==='sm'?48:size==='lg'?80:64;
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,
    opacity:earned?1:.35,filter:earned?'none':'grayscale(1)',transition:'all .3s'}}>
    <div style={{width:sz,height:sz,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:sz*.42,background:earned?'linear-gradient(135deg,var(--orange-bg),var(--purple-bg))':'var(--bg-alt)',
      border:earned?'2px solid var(--orange-light)':'2px solid var(--border)',
      animation:earned?'badgePop .5s ease':'none'}}>
      {b.icon}
    </div>
    <span style={{fontSize:11,fontWeight:600,color:earned?'var(--dark)':'var(--subtle)',textAlign:'center',maxWidth:80}}>
      {b.name}
    </span>
  </div>;
};

// --- Stat Card (for hero banner) ---
const StatChip = ({icon,label,value,color='var(--orange-light)'}) =>
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,
    background:'rgba(255,255,255,.15)',borderRadius:12,padding:'12px 16px',minWidth:80,backdropFilter:'blur(4px)'}}>
    <span style={{color,fontSize:18}}>{icon}</span>
    <span style={{fontSize:22,fontWeight:800,color:'#fff'}}>{value}</span>
    <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.7)',textTransform:'uppercase',letterSpacing:1}}>{label}</span>
  </div>;

// --- Stagger wrapper ---
const Stagger = ({children, delay=60}) =>
  <>{React.Children.map(children,(child,i)=>
    child ? React.cloneElement(child,{style:{...child.props.style,animation:`fadeUp .45s ${i*delay}ms ease both`}}) : null
  )}</>;

// --- Logo component (CSS — no image file needed) ---
const LogoImg = ({ h=34, w=null, onDark=false }) => (
  <img
    src="/logo-ceinfes.png"
    alt="CEINFES"
    className={onDark ? undefined : 'logo-img'}
    style={{
      width: w || h * 5,
      height: 'auto',
      display: 'inline-block',
      userSelect: 'none',
      imageRendering: 'auto',
      filter: onDark ? 'brightness(0) invert(1)' : 'none',
    }}
  />
);

export {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc, ArrowRIc, ArrowLIc,
  ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc, LogOutIc, ClockIc, XIc, PlusIc,
  TrashIc, EditIc, MenuIc, TargetIc, SettingsIc, BarIc, UsersIc, GripIc, MapIc,
  SchoolIc, UploadIc, SunIc, MoonIc, PaletteIc, MsgIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager, Modal, BadgeCard, StatChip, Stagger,
  XPToast, BadgeToast, Skeleton, SkeletonCard,
};
