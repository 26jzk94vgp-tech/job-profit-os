'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────
const DARK = {
  bg:'#0D1117', surface:'#161B22', elevated:'#1C2128', overlay:'#21262D',
  border:'#30363D', borderSub:'#21262D',
  primary:'#2F81F7', primaryGlow:'rgba(47,129,247,0.15)',
  success:'#3FB950', successGlow:'rgba(63,185,80,0.12)',
  warning:'#D29922', warningGlow:'rgba(210,153,34,0.12)',
  danger:'#F85149', dangerGlow:'rgba(248,81,73,0.12)',
  text:'#F0F6FC', textSub:'#CDD9E5', textDim:'#8B949E',
  mono:'"SF Mono","Fira Code",monospace',
}
const LIGHT = {
  bg:'#F6F8FA', surface:'#FFFFFF', elevated:'#F0F2F5', overlay:'#EAEEF2',
  border:'#D0D7DE', borderSub:'#EAEEF2',
  primary:'#0969DA', primaryGlow:'rgba(9,105,218,0.1)',
  success:'#1A7F37', successGlow:'rgba(26,127,55,0.08)',
  warning:'#9A6700', warningGlow:'rgba(154,103,0,0.08)',
  danger:'#CF222E', dangerGlow:'rgba(207,34,46,0.08)',
  text:'#1F2328', textSub:'#656D76', textDim:'#AFB8C1',
  mono:'"SF Mono","Fira Code",monospace',
}
type Theme = typeof DARK

// ─── Shared Utils ─────────────────────────────────────────────────
function fmt(n:number){if(n>=1000)return'$'+(n/1000).toFixed(1)+'k';return'$'+n.toLocaleString()}
function weatherEmoji(c:number){if(c===0)return'☀️';if(c<=2)return'⛅';if(c<=3)return'☁️';if(c<=48)return'🌫️';if(c<=67)return'🌧️';return'⛈️'}
function weatherDesc(c:number,zh:boolean){if(c===0)return zh?'晴天':'Sunny';if(c<=2)return zh?'少云':'Partly cloudy';if(c<=3)return zh?'多云':'Cloudy';if(c<=67)return zh?'有雨':'Rainy';return zh?'雷暴':'Thunderstorm'}

type WeatherData={temp:number,code:number,city:string}|null
function useWeather(){
  const [w,setW]=useState<WeatherData>(null)
  useEffect(()=>{
    function fetch_(lat:number,lon:number,city:string){
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`)
        .then(r=>r.json()).then(d=>setW({temp:Math.round(d.current.temperature_2m),code:d.current.weather_code,city})).catch(()=>{})
    }
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        p=>{fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`).then(r=>r.json()).then(d=>fetch_(p.coords.latitude,p.coords.longitude,d.address?.city||d.address?.town||'My Location')).catch(()=>fetch_(p.coords.latitude,p.coords.longitude,'My Location'))},
        ()=>fetch_(-31.9505,115.8605,'Perth')
      )
    }else fetch_(-31.9505,115.8605,'Perth')
  },[])
  return w
}

// ─── Shared Components ────────────────────────────────────────────
function PulseDot({color,size=7}:{color:string,size?:number}){
  const [p,setP]=useState(false)
  useEffect(()=>{const t=setInterval(()=>setP(x=>!x),1800);return()=>clearInterval(t)},[])
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <div style={{position:'absolute',inset:0,borderRadius:'50%',backgroundColor:color,transform:p?'scale(2.4)':'scale(1)',opacity:p?0:0.3,transition:'all 1.8s ease'}}/>
      <div style={{position:'absolute',inset:0,borderRadius:'50%',backgroundColor:color}}/>
    </div>
  )
}

function Badge({label,type,T}:{label:string,type:'success'|'warning'|'danger'|'info'|'muted',T:Theme}){
  const cfg={success:{bg:T.successGlow,color:T.success,border:T.successGlow},warning:{bg:T.warningGlow,color:T.warning,border:T.warningGlow},danger:{bg:T.dangerGlow,color:T.danger,border:T.dangerGlow},info:{bg:T.primaryGlow,color:T.primary,border:T.primaryGlow},muted:{bg:T.overlay,color:T.textSub,border:T.border}}[type]
  return<span style={{fontSize:'10px',fontWeight:600,padding:'2px 6px',borderRadius:'3px',backgroundColor:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const}}>{label}</span>
}

function Bar({pct,color,bg}:{pct:number,color:string,bg:string}){
  return<div style={{height:'2px',backgroundColor:bg,borderRadius:'1px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',backgroundColor:color}}/></div>
}

function Section({title,dot,count,action,T,children}:{title:string,dot?:string,count?:number,action?:React.ReactNode,T:Theme,children:React.ReactNode}){
  return(
    <div style={{backgroundColor:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',overflow:'hidden',marginBottom:'16px'}}>
      <div style={{padding:'11px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'8px',backgroundColor:T.elevated}}>
        {dot&&<PulseDot color={dot} size={7}/>}
        <span style={{fontSize:'13px',fontWeight:600,color:T.text}}>{title}</span>
        {count!==undefined&&<span style={{fontSize:'10px',fontWeight:600,padding:'0 5px',borderRadius:'3px',backgroundColor:T.bg,color:T.textDim,border:`1px solid ${T.border}`,fontFamily:T.mono}}>{count}</span>}
        {action&&<div style={{marginLeft:'auto'}}>{action}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Onboarding Data ──────────────────────────────────────────────
const INDUSTRIES=[
  {key:'tiling',en:'Tiling',zh:'瓷砖/铺贴'},
  {key:'waterproof',en:'Waterproofing',zh:'防水工程'},
  {key:'renovation',en:'Renovation',zh:'装修翻新'},
  {key:'plumbing',en:'Plumbing',zh:'水管工程'},
  {key:'electrical',en:'Electrical',zh:'电气工程'},
  {key:'painting',en:'Painting',zh:'油漆工程'},
  {key:'roofing',en:'Roofing',zh:'屋顶工程'},
  {key:'landscaping',en:'Landscaping',zh:'园艺绿化'},
  {key:'carpentry',en:'Carpentry',zh:'木工工程'},
  {key:'other',en:'Other',zh:'其他'},
]
const SIZES=[
  {key:'1',en:'Just me',zh:'只有我'},
  {key:'2-5',en:'2–5 people',zh:'2–5 人'},
  {key:'6-10',en:'6–10 people',zh:'6–10 人'},
  {key:'11-20',en:'11–20 people',zh:'11–20 人'},
  {key:'20+',en:'20+ people',zh:'20 人以上'},
]

// ─── Dashboard Mock Data ───────────────────────────────────────────
const MOCK_JOBS=[
  {id:1,name:'pp 的工单',client:'pp',revenue:100,status:'active',daysLeft:12},
  {id:2,name:'jn 的工单',client:'jn',revenue:4660,status:'active',daysLeft:5},
  {id:3,name:'kk',client:'oo',revenue:59610,status:'active',daysLeft:2},
  {id:4,name:'kkkkk 的工单',client:'kkkkk',revenue:0,status:'new',daysLeft:30},
]
const MOCK_QUOTES=[
  {id:1,num:'Q-007',client:'新客户 Mike',amount:3200,status:'draft',date:'今天'},
  {id:2,num:'Q-006',client:'jn 的工单',amount:10,status:'sent',date:'昨天'},
  {id:3,num:'Q-001',client:'pp 的工单',amount:80,status:'accepted',date:'3天前'},
]
const FEED=[
  {id:1,cat:'天气',catEn:'Weather',icon:'☀️',title:'本周四五有雨',titleEn:'Rain Thu–Fri',desc:'户外工程注意安排',descEn:'Plan outdoor work',color:'#58A6FF'},
  {id:2,cat:'税务',catEn:'Tax',icon:'🧾',title:'ATO BAS 截止还有 14 天',titleEn:'ATO BAS due in 14 days',desc:'记得申报本季度 GST',descEn:'Lodge quarterly GST',color:'#F85149'},
  {id:3,cat:'餐厅',catEn:'Food',icon:'🍜',title:'附近餐厅午市优惠',titleEn:'Nearby lunch deals',desc:'Northbridge 3 家 $12起',descEn:'3 restaurants from $12',color:'#FF6B6B'},
  {id:4,cat:'工期',catEn:'Jobs',icon:'⚡',title:'2 个工地本周截止',titleEn:'2 sites due this week',desc:'kk (2d) · jn (5d)',descEn:'kk (2d) · jn (5d)',color:'#D29922'},
]

// ─── SCREEN: Welcome ──────────────────────────────────────────────
function WelcomeScreen({T,lang,onStart}:{T:Theme,lang:'en'|'zh',onStart:()=>void}){
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center' as const,minHeight:'70vh'}}>
      <div style={{width:'72px',height:'72px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px',boxShadow:`0 8px 32px ${T.primaryGlow}`}}>
        <span style={{fontSize:'36px'}}>🔨</span>
      </div>
      <h1 style={{fontSize:'32px',fontWeight:700,color:T.text,margin:'0 0 12px',letterSpacing:'-0.5px'}}>
        {lang==='en'?'Welcome to CIMO':'欢迎使用 CIMO'}
      </h1>
      <p style={{fontSize:'17px',color:T.textSub,margin:'0 0 8px',lineHeight:1.6,maxWidth:'360px'}}>
        {lang==='en'?'Job profit tracking for tradespeople in Australia.':'澳洲工程人的工单利润追踪工具。'}
      </p>
      <p style={{fontSize:'14px',color:T.textDim,margin:'0 0 40px'}}>
        {lang==='en'?"Let's set up your account in 2 minutes.":'2 分钟完成账号设置。'}
      </p>
      <button onClick={onStart}
        style={{padding:'14px 40px',borderRadius:'10px',border:'none',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,color:'white',fontSize:'16px',fontWeight:600,cursor:'pointer',boxShadow:`0 4px 16px ${T.primaryGlow}`,marginBottom:'16px'}}>
        {lang==='en'?'Get Started →':'开始设置 →'}
      </button>
      <p style={{fontSize:'13px',color:T.textDim}}>
        {lang==='en'?'Already have an account? ':'已有账号？'}
        <span style={{color:T.primary,cursor:'pointer',fontWeight:500}}>
          {lang==='en'?'Sign in':'登录'}
        </span>
      </p>
      {/* Feature highlights */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginTop:'48px',maxWidth:'440px',width:'100%'}}>
        {[
          {icon:'📋',en:'Quote-first workflow',zh:'报价单优先流程'},
          {icon:'💰',en:'Track receivables',zh:'追踪应收账款'},
          {icon:'📊',en:'ATO tax ready',zh:'ATO 税务合规'},
        ].map(f=>(
          <div key={f.en} style={{backgroundColor:T.elevated,borderRadius:'10px',padding:'14px 10px',border:`1px solid ${T.border}`}}>
            <p style={{fontSize:'22px',margin:'0 0 6px'}}>{f.icon}</p>
            <p style={{fontSize:'11px',color:T.textSub,margin:0,lineHeight:1.4}}>{lang==='en'?f.en:f.zh}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN: Onboarding Steps ─────────────────────────────────────
function OnboardingScreen({T,lang,onDone}:{T:Theme,lang:'en'|'zh',onDone:(data:any)=>void}){
  const [step,setStep]=useState(1)
  const [industry,setIndustry]=useState('')
  const [size,setSize]=useState('')
  const [company,setCompany]=useState('')
  const [abn,setAbn]=useState('')
  const [bsb,setBsb]=useState('')
  const [accountNo,setAccountNo]=useState('')
  const [accountName,setAccountName]=useState('')
  const TOTAL=4
  const t=(en:string,zh:string)=>lang==='en'?en:zh
  function canNext(){
    if(step===1)return!!industry
    if(step===2)return!!size
    if(step===3)return company.trim().length>0
    return true
  }

  function GridBtn({item}:{item:{key:string,en:string,zh:string}}){
    const selected=industry===item.key
    return(
      <button onClick={()=>setIndustry(item.key)}
        style={{padding:'14px 10px',borderRadius:'8px',cursor:'pointer',border:`2px solid ${selected?T.primary:T.border}`,backgroundColor:selected?(T===LIGHT?'#EBF5FF':'rgba(47,129,247,0.1)'):T.surface,textAlign:'center' as const,transition:'all 0.15s'}}>
        <p style={{fontSize:'14px',fontWeight:selected?600:400,color:selected?T.primary:T.text,margin:0}}>{lang==='en'?item.en:item.zh}</p>
      </button>
    )
  }

  return(
    <div style={{flex:1,maxWidth:'480px',margin:'0 auto',padding:'32px 24px 60px',width:'100%'}}>
      {/* Progress */}
      <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
        {Array.from({length:TOTAL}).map((_,i)=>(
          <div key={i} style={{flex:1,height:'3px',borderRadius:'2px',backgroundColor:i<step?T.primary:T.border,transition:'background 0.3s'}}/>
        ))}
      </div>

      {/* Step 1: Industry */}
      {step===1&&(
        <div>
          <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 1 of 4','第 1 步，共 4 步')}</p>
          <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t("What's your main trade?",'你的主要工种？')}</h1>
          <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t("We'll tailor CIMO to fit your workflow.",'我们会根据你的工种定制 CIMO。')}</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'28px'}}>
            {INDUSTRIES.map(ind=><GridBtn key={ind.key} item={ind}/>)}
          </div>
        </div>
      )}

      {/* Step 2: Size */}
      {step===2&&(
        <div>
          <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 2 of 4','第 2 步，共 4 步')}</p>
          <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t('How big is your team?','团队有多少人？')}</h1>
          <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t('Helps us set up the right features.','帮助我们开启合适的功能。')}</p>
          <div style={{display:'flex',flexDirection:'column' as const,gap:'10px',marginBottom:'28px'}}>
            {SIZES.map(s=>{
              const sel=size===s.key
              return(
                <button key={s.key} onClick={()=>setSize(s.key)}
                  style={{padding:'14px 18px',borderRadius:'8px',cursor:'pointer',border:`2px solid ${sel?T.primary:T.border}`,backgroundColor:sel?(T===LIGHT?'#EBF5FF':'rgba(47,129,247,0.1)'):T.surface,textAlign:'left' as const,display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.15s'}}>
                  <span style={{fontSize:'15px',fontWeight:sel?600:400,color:sel?T.primary:T.text}}>{lang==='en'?s.en:s.zh}</span>
                  {sel&&<span style={{color:T.primary,fontSize:'18px'}}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 3: Company */}
      {step===3&&(
        <div>
          <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 3 of 4','第 3 步，共 4 步')}</p>
          <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t('Set up your company','设置公司信息')}</h1>
          <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t('Appears on your invoices and quotes.','显示在你的发票和报价单上。')}</p>
          {[
            {label:t('Company Name','公司名称'),val:company,set:setCompany,ph:t('e.g. Shu Tiling Pty Ltd','例如：Shu Tiling Pty Ltd')},
            {label:'ABN',val:abn,set:setAbn,ph:'e.g. 12 345 678 901'},
          ].map(f=>(
            <div key={f.label} style={{marginBottom:'14px'}}>
              <label style={{display:'block',fontSize:'13px',fontWeight:600,color:T.text,marginBottom:'6px'}}>{f.label}</label>
              <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{width:'100%',padding:'11px 14px',borderRadius:'8px',fontSize:'14px',border:`1.5px solid ${T.border}`,backgroundColor:T.surface,color:T.text,outline:'none',boxSizing:'border-box' as const}}/>
            </div>
          ))}
          <div style={{marginTop:'16px',padding:'14px 16px',backgroundColor:T.elevated,borderRadius:'8px',border:`1px solid ${T.border}`}}>
            <p style={{fontSize:'13px',fontWeight:600,color:T.text,margin:'0 0 12px'}}>🏦 {t('Banking Details','银行信息')}</p>
            {[
              {label:t('Account Name','账户名'),val:accountName,set:setAccountName,ph:t('e.g. Shu Tiling','例如：Shu Tiling')},
              {label:'BSB',val:bsb,set:setBsb,ph:'e.g. 062-000'},
              {label:t('Account Number','账号'),val:accountNo,set:setAccountNo,ph:'e.g. 1234 5678'},
            ].map(f=>(
              <div key={f.label} style={{marginBottom:'10px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:600,color:T.textSub,marginBottom:'5px'}}>{f.label}</label>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{width:'100%',padding:'9px 12px',borderRadius:'7px',fontSize:'13px',border:`1px solid ${T.border}`,backgroundColor:T.surface,color:T.text,outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step===4&&(
        <div style={{textAlign:'center' as const,paddingTop:'20px'}}>
          <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#1A7F37,#3FB950)',margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',boxShadow:'0 4px 20px rgba(63,185,80,0.3)'}}>🎉</div>
          <h1 style={{fontSize:'28px',fontWeight:700,color:T.text,margin:'0 0 10px'}}>{t("You're all set!",'设置完成！')}</h1>
          <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 6px'}}>{t('CIMO is ready for your business.','CIMO 已为你的业务准备好了。')}</p>
          <p style={{fontSize:'13px',color:T.textDim,margin:'0 0 32px'}}>{t('Start by creating your first quote.','从创建第一个报价单开始吧。')}</p>
          <div style={{backgroundColor:T.elevated,borderRadius:'10px',border:`1px solid ${T.border}`,padding:'18px',textAlign:'left' as const,marginBottom:'28px'}}>
            <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.6px',margin:'0 0 12px'}}>{t('Your Setup','设置摘要')}</p>
            {[
              {label:t('Trade','工种'),value:INDUSTRIES.find(i=>i.key===industry)?.[lang==='en'?'en':'zh']||'—'},
              {label:t('Team','团队'),value:SIZES.find(s=>s.key===size)?.[lang==='en'?'en':'zh']||'—'},
              {label:t('Company','公司'),value:company||'—'},
              {label:'ABN',value:abn||t('Not set','未设置')},
            ].map(row=>(
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:'13px',color:T.textSub}}>{row.label}</span>
                <span style={{fontSize:'13px',fontWeight:500,color:T.text}}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>onDone({industry,size,company,abn})}
            style={{width:'100%',padding:'14px',borderRadius:'8px',border:'none',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,color:'white',fontSize:'15px',fontWeight:600,cursor:'pointer',marginBottom:'10px'}}>
            {t('Go to Dashboard →','进入仪表盘 →')}
          </button>
        </div>
      )}

      {/* Nav */}
      {step<4&&(
        <>
          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            {step>1&&<button onClick={()=>setStep(step-1)} style={{flex:1,padding:'13px',borderRadius:'8px',border:`1px solid ${T.border}`,backgroundColor:'transparent',color:T.textSub,fontSize:'14px',fontWeight:500,cursor:'pointer'}}>← {t('Back','返回')}</button>}
            <button onClick={()=>{if(canNext())setStep(step+1)}} disabled={!canNext()}
              style={{flex:step>1?2:1,padding:'13px',borderRadius:'8px',border:'none',background:canNext()?`linear-gradient(135deg,${T.primary},#58A6FF)`:T.border,color:canNext()?'white':T.textDim,fontSize:'14px',fontWeight:600,cursor:canNext()?'pointer':'not-allowed'}}>
              {step===3?t('Finish →','完成 →'):t('Continue →','继续 →')}
            </button>
          </div>
          <p style={{textAlign:'center' as const,marginTop:'14px'}}>
            <button onClick={()=>onDone({})} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:T.textDim,textDecoration:'underline'}}>{t('Skip for now','暂时跳过')}</button>
          </p>
        </>
      )}
    </div>
  )
}

// ─── SCREEN: Dashboard ────────────────────────────────────────────
function DashboardScreen({T,lang,isDark,onToggleDark,weather,userName}:{T:Theme,lang:'en'|'zh',isDark:boolean,onToggleDark:()=>void,weather:WeatherData,userName:string}){
  const zh=lang==='zh'
  const [greeting,setGreeting]=useState('')
  const [date,setDate]=useState('')
  const [dismissed,setDismissed]=useState<number[]>([])
  const [done,setDone]=useState<Set<number>>(new Set())
  const [menuOpen,setMenuOpen]=useState(false)
  const menuRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const h=new Date().getHours()
    setGreeting(h<12?(zh?'早上好':'Good morning'):h<18?(zh?'下午好':'Good afternoon'):(zh?'晚上好':'Good evening'))
    setDate(new Date().toLocaleDateString(zh?'zh-CN':'en-AU',{month:'long',day:'numeric',weekday:'long'}))
  },[zh])

  useEffect(()=>{
    function h(e:MouseEvent){if(menuRef.current&&!menuRef.current.contains(e.target as Node))setMenuOpen(false)}
    if(menuOpen)document.addEventListener('mousedown',h)
    return()=>document.removeEventListener('mousedown',h)
  },[menuOpen])

  const quoteCounts={draft:1,sent:1,accepted:1,rejected:0}
  const todos=[
    {id:1,tag:'💰',text:zh?'跟进 kk — bb 逾期付款':'Follow up kk — bb overdue',amount:'$59,610',type:'danger' as const},
    {id:2,tag:'📋',text:zh?'确认 jn Q-006 报价单':'Confirm jn Q-006 quote',amount:'$10',type:'warning' as const},
    {id:3,tag:'📤',text:zh?'发送 Mike Q-007 报价单':'Send Mike Q-007 quote',amount:'$3,200',type:'info' as const},
    {id:4,tag:'🔨',text:zh?'kkkkk 工单现场勘查':'kkkkk site inspection',amount:'',type:'muted' as const},
  ]
  const visibleFeed=FEED.filter(f=>!dismissed.includes(f.id))
  const todoPct=todos.length>0?Math.round((done.size/todos.length)*100):100
  const typeColor:{[k:string]:string}={danger:T.danger,warning:T.warning,info:T.primary,muted:T.textSub,success:T.success}

  const navItems=[
    {label:zh?'概览':'Overview',icon:'🏠'},
    {label:zh?'报价单':'Quotes',icon:'📋'},
    {label:zh?'工单':'Jobs',icon:'🔨'},
    {label:zh?'财务':'Finance',icon:'💰'},
    {label:zh?'税务':'Tax',icon:'📊'},
    {label:zh?'客户':'Clients',icon:'👥'},
    {label:zh?'设置':'Settings',icon:'⚙️'},
  ]

  return(
    <div style={{minHeight:'100vh',backgroundColor:T.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif',color:T.text}}>

      {/* 顶部导航 */}
      <div style={{position:'sticky',top:0,zIndex:50,backgroundColor:T.surface,borderBottom:`1px solid ${T.border}`,padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'13px'}}>C</div>
            <span style={{fontWeight:700,color:T.text,fontSize:'15px'}}>CIMO</span>
          </div>
          <div style={{width:'1px',height:'18px',backgroundColor:T.border}}/>
          <div>
            <p style={{fontSize:'16px',fontWeight:700,color:T.text,margin:'0 0 2px'}}>{greeting}, {userName||'Shu'}</p>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'11px',color:T.textDim}}>{date}</span>
              {weather&&(
                <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'1px 7px',backgroundColor:T.overlay,border:`1px solid ${T.border}`,borderRadius:'20px'}}>
                  <span style={{fontSize:'11px'}}>📍</span>
                  <span style={{fontSize:'10px',color:T.textSub}}>{weather.city}</span>
                  <span style={{width:'1px',height:'8px',backgroundColor:T.border}}/>
                  <span style={{fontSize:'12px'}}>{weatherEmoji(weather.code)}</span>
                  <span style={{fontSize:'11px',fontWeight:600,color:T.text,fontFamily:T.mono}}>{weather.temp}°C</span>
                  <span style={{fontSize:'10px',color:T.textDim}}>{weatherDesc(weather.code,zh)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {/* 搜索 */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 11px',width:'180px',backgroundColor:T.overlay,border:`1px solid ${T.border}`,borderRadius:'6px'}}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10.68 10.68a6 6 0 1 1 .94-.94l3.31 3.31a.67.67 0 0 1-.94.94l-3.31-3.31z" stroke={T.textDim} strokeWidth="1.5"/></svg>
            <input placeholder={zh?'搜索...':'Search...'} style={{background:'none',border:'none',outline:'none',fontSize:'12px',color:T.text,width:'100%',fontFamily:'inherit'}}/>
          </div>
          {/* 汉堡菜单 */}
          <div ref={menuRef} style={{position:'relative'}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{width:'36px',height:'36px',borderRadius:'6px',border:`1px solid ${T.border}`,backgroundColor:menuOpen?T.elevated:T.overlay,cursor:'pointer',display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',gap:'4px'}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:'14px',height:'1.5px',backgroundColor:T.textSub,borderRadius:'1px',transform:menuOpen?(i===0?'rotate(45deg) translate(4px,4px)':i===2?'rotate(-45deg) translate(4px,-4px)':'scaleX(0)'):'none',transition:'all 0.2s',opacity:menuOpen&&i===1?0:1}}/>
              ))}
            </button>
            {menuOpen&&(
              <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:'220px',backgroundColor:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',boxShadow:`0 8px 24px rgba(0,0,0,${isDark?0.4:0.15})`,zIndex:100,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,backgroundColor:T.elevated,display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'12px'}}>S</div>
                  <div><p style={{fontSize:'12px',fontWeight:600,color:T.text,margin:0}}>{userName||'Shu'}</p><p style={{fontSize:'10px',color:T.textDim,margin:0}}>kkkk@qq.com</p></div>
                </div>
                <div style={{padding:'6px'}}>
                  {navItems.map(item=>(
                    <div key={item.label} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'5px',cursor:'pointer'}}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                      <span style={{fontSize:'14px'}}>{item.icon}</span>
                      <span style={{fontSize:'13px',color:T.text}}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:'8px 10px 10px',borderTop:`1px solid ${T.border}`,display:'flex',gap:'8px'}}>
                  <button onClick={onToggleDark} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'7px',borderRadius:'5px',border:`1px solid ${T.border}`,backgroundColor:T.elevated,cursor:'pointer',fontSize:'12px',color:T.textSub}}>
                    <span>{isDark?'☀️':'🌙'}</span><span>{isDark?(zh?'亮色':'Light'):(zh?'暗色':'Dark')}</span>
                  </button>
                  <button style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'7px',borderRadius:'5px',border:`1px solid ${T.border}`,backgroundColor:T.elevated,cursor:'pointer',fontSize:'12px',color:T.danger}}>{zh?'退出':'Sign out'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容 + 右侧 */}
      <div style={{display:'flex',maxWidth:'1400px',margin:'0 auto'}}>

        {/* 中间内容 */}
        <div style={{flex:1,minWidth:0,padding:'20px 20px 60px'}}>

          {/* 进行中工单 */}
          <Section title={zh?'进行中工单':'Active Jobs'} dot={T.primary} count={MOCK_JOBS.length} T={T}
            action={<span style={{fontSize:'11px',color:T.primary,cursor:'pointer',fontWeight:500}}>{zh?'全部 →':'All →'}</span>}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:T.bg}}>
                    {[zh?'工单':'Job',zh?'客户':'Client',zh?'收入':'Revenue',zh?'截止':'Deadline',zh?'状态':'Status'].map(h=>(
                      <th key={h} style={{padding:'8px 16px',fontSize:'10px',fontWeight:600,color:T.textDim,textAlign:'left' as const,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'0.6px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_JOBS.map((job,i)=>(
                    <tr key={job.id} style={{borderTop:i>0?`1px solid ${T.borderSub}`:'none',cursor:'pointer'}}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                      <td style={{padding:'11px 16px',fontSize:'13px',fontWeight:500,color:T.primary}}>{job.name}</td>
                      <td style={{padding:'11px 16px',fontSize:'12px',color:T.textSub}}>{job.client}</td>
                      <td style={{padding:'11px 16px',fontSize:'13px',fontWeight:600,color:job.revenue>0?T.success:T.textDim,fontFamily:T.mono}}>{job.revenue>0?'+$'+job.revenue.toLocaleString():'—'}</td>
                      <td style={{padding:'11px 16px',fontSize:'12px',color:job.daysLeft<=5?T.danger:T.textDim,fontFamily:T.mono}}>{job.daysLeft<=5?`⚠ ${job.daysLeft}d`:`${job.daysLeft}d`}</td>
                      <td style={{padding:'11px 16px'}}><Badge label={job.status==='active'?(zh?'进行中':'Active'):(zh?'新建':'New')} type={job.status==='active'?'muted':'warning'} T={T}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 报价单 */}
          <Section title={zh?'报价单':'Quotes'} dot={T.primary} count={MOCK_QUOTES.length} T={T}
            action={<span style={{fontSize:'11px',color:T.primary,cursor:'pointer',fontWeight:500}}>{zh?'进入模块 →':'View all →'}</span>}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
              {[
                {label:zh?'待发送':'Draft',count:quoteCounts.draft,color:T.textSub,bg:T.overlay},
                {label:zh?'已发送':'Sent',count:quoteCounts.sent,color:T.warning,bg:T.warningGlow},
                {label:zh?'已接受':'Accepted',count:quoteCounts.accepted,color:T.success,bg:T.successGlow},
                {label:zh?'已拒绝':'Rejected',count:quoteCounts.rejected,color:T.textDim,bg:'transparent'},
              ].map((s,i)=>(
                <div key={s.label} style={{padding:'10px 14px',textAlign:'center' as const,borderRight:i<3?`1px solid ${T.borderSub}`:'none',backgroundColor:s.bg,cursor:'pointer'}}>
                  <p style={{fontSize:'18px',fontWeight:700,color:s.color,margin:'0 0 2px',fontFamily:T.mono}}>{s.count}</p>
                  <p style={{fontSize:'10px',color:T.textDim,margin:0}}>{s.label}</p>
                </div>
              ))}
            </div>
            {MOCK_QUOTES.map(q=>(
              <div key={q.id} style={{padding:'10px 16px',borderTop:`1px solid ${T.borderSub}`,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'11px',color:T.textDim,fontFamily:T.mono,width:'44px'}}>{q.num}</span>
                  <div>
                    <p style={{fontSize:'13px',fontWeight:500,color:T.text,margin:'0 0 1px'}}>{q.client}</p>
                    <p style={{fontSize:'11px',color:T.textDim,margin:0}}>{q.date}</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'13px',fontWeight:600,color:T.success,fontFamily:T.mono}}>${q.amount.toLocaleString()}</span>
                  <Badge label={q.status==='accepted'?(zh?'已接受':'Accepted'):q.status==='sent'?(zh?'已发送':'Sent'):(zh?'草稿':'Draft')} type={q.status==='accepted'?'success':q.status==='sent'?'warning':'muted'} T={T}/>
                </div>
              </div>
            ))}
          </Section>

          {/* 待收款 */}
          <div style={{backgroundColor:T.surface,border:`1px solid ${T.border}`,borderLeft:`2px solid ${T.danger}`,borderRadius:'8px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',background:`linear-gradient(90deg,${T.dangerGlow} 0%,${T.surface} 50%)`}}>
            <PulseDot color={T.danger}/>
            <div style={{flex:1}}>
              <p style={{fontSize:'13px',fontWeight:600,color:T.text,margin:'0 0 2px'}}>💰 {zh?'待收款项':'Accounts Receivable'}</p>
              <p style={{fontSize:'11px',color:T.textDim,margin:0}}>{zh?'6 张未付 · 1 张逾期':'6 unpaid · 1 overdue'}</p>
            </div>
            <span style={{fontSize:'16px',fontWeight:700,color:T.danger,fontFamily:T.mono}}>$60.1k</span>
            <button style={{backgroundColor:T.dangerGlow,color:T.danger,border:`1px solid ${T.dangerGlow}`,borderRadius:'4px',padding:'6px 12px',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>{zh?'查看':'View'}</button>
          </div>
        </div>

        {/* 右侧固定 */}
        <div className="hidden md:block" style={{width:'260px',flexShrink:0,borderLeft:`1px solid ${T.border}`,backgroundColor:T.surface,position:'sticky',top:'57px',height:'calc(100vh - 57px)',overflowY:'auto'}}>

          {/* 地图 */}
          <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,backgroundColor:T.elevated,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}><PulseDot color={T.success} size={6}/><span style={{fontSize:'12px',fontWeight:600,color:T.textSub,textTransform:'uppercase' as const,letterSpacing:'0.8px'}}>{zh?'项目地图':'Project Map'}</span></div>
            <span style={{fontSize:'11px',color:T.textDim}}>{weather?.city||'Perth'}</span>
          </div>
          <div style={{margin:'10px',backgroundColor:T.bg,borderRadius:'4px',border:`1px solid ${T.border}`,height:'120px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,backgroundImage:`radial-gradient(circle at 30% 40%,${T.primaryGlow} 0%,transparent 40%),radial-gradient(circle at 70% 65%,${T.successGlow} 0%,transparent 35%)`}}/>
            <svg width="100%" height="100%" style={{position:'absolute',opacity:isDark?0.07:0.04}}>{[0,20,40,60,80,100].map(x=><line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke={T.border} strokeWidth="0.5"/>)}{[0,25,50,75,100].map(y=><line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke={T.border} strokeWidth="0.5"/>)}</svg>
            {[{x:'28%',y:'38%',c:T.primary},{x:'63%',y:'52%',c:T.warning},{x:'43%',y:'67%',c:T.success},{x:'17%',y:'58%',c:T.textSub}].map((p,i)=>(
              <div key={i} style={{position:'absolute',left:p.x,top:p.y,transform:'translate(-50%,-50%)'}}>
                <PulseDot color={p.c} size={8}/>
              </div>
            ))}
            <div style={{position:'absolute',bottom:'6px',right:'8px'}}><span style={{fontSize:'9px',color:T.textDim,backgroundColor:T.overlay,padding:'2px 6px',borderRadius:'3px',border:`1px solid ${T.border}`}}>{zh?'地图待接入':'Map coming soon'}</span></div>
          </div>
          <div style={{padding:'0 10px 6px',display:'flex',gap:'10px',flexWrap:'wrap' as const}}>
            {[{c:T.primary,l:zh?'进行中':'Active'},{c:T.warning,l:zh?'紧急':'Urgent'},{c:T.success,l:zh?'收尾':'Closing'},{c:T.textSub,l:zh?'新建':'New'}].map(l=>(
              <div key={l.l} style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:l.c}}/><span style={{fontSize:'10px',color:T.textDim}}>{l.l}</span></div>
            ))}
          </div>

          <div style={{height:'1px',backgroundColor:T.border,margin:'4px 10px 10px'}}/>

          {/* 今日待办 */}
          <div style={{padding:'0 14px 4px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}><PulseDot color={T.danger} size={6}/><span style={{fontSize:'11px',fontWeight:600,color:T.textSub,textTransform:'uppercase' as const,letterSpacing:'0.8px'}}>{zh?'今日待办':'Today'}</span></div>
            <Bar pct={todoPct} color={todoPct===100?T.success:T.primary} bg={T.borderSub}/>
          </div>
          <div style={{padding:'6px 14px 4px'}}>
            {todos.map(todo=>(
              <div key={todo.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 4px',borderRadius:'4px',marginBottom:'2px',cursor:'pointer',opacity:done.has(todo.id)?0.4:1,transition:'opacity 0.2s'}}
                onClick={()=>setDone(d=>{const n=new Set(d);n.has(todo.id)?n.delete(todo.id):n.add(todo.id);return n})}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                <div style={{width:'14px',height:'14px',borderRadius:'3px',flexShrink:0,border:`1.5px solid ${done.has(todo.id)?T.success:T.border}`,backgroundColor:done.has(todo.id)?T.successGlow:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {done.has(todo.id)&&<span style={{fontSize:'9px',color:T.success}}>✓</span>}
                </div>
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'4px'}}>
                  <p style={{fontSize:'11px',fontWeight:done.has(todo.id)?400:500,color:done.has(todo.id)?T.textDim:T.text,margin:0,textDecoration:done.has(todo.id)?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{todo.tag} {todo.text}</p>
                  {todo.amount&&<span style={{fontSize:'10px',fontWeight:600,flexShrink:0,color:done.has(todo.id)?T.textDim:typeColor[todo.type],fontFamily:T.mono}}>{todo.amount}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{height:'1px',backgroundColor:T.border,margin:'8px 10px'}}/>

          {/* 资讯 */}
          <div style={{padding:'0 14px 14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontSize:'11px',fontWeight:600,color:T.textSub,textTransform:'uppercase' as const,letterSpacing:'0.8px'}}>{zh?'资讯':'Updates'}</span>
              <span style={{fontSize:'10px',color:T.textDim}}>{visibleFeed.length}</span>
            </div>
            {visibleFeed.map(item=>(
              <div key={item.id} style={{marginBottom:'6px',padding:'7px 9px',backgroundColor:T.bg,borderRadius:'5px',border:`1px solid ${T.border}`,borderLeft:`2px solid ${item.color}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:'7px'}}>
                  <span style={{fontSize:'14px',flexShrink:0}}>{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'2px'}}>
                      <p style={{fontSize:'12px',fontWeight:600,color:T.text,margin:0}}>{zh?item.title:item.titleEn}</p>
                      <span style={{fontSize:'9px',padding:'1px 4px',borderRadius:'3px',backgroundColor:`${item.color}15`,color:item.color,flexShrink:0}}>{zh?item.cat:item.catEn}</span>
                    </div>
                    <p style={{fontSize:'11px',color:T.textSub,margin:0}}>{zh?item.desc:item.descEn}</p>
                  </div>
                  <button onClick={()=>setDismissed([...dismissed,item.id])} style={{fontSize:'11px',color:T.textDim,background:'none',border:'none',cursor:'pointer',flexShrink:0}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 手机底部导航 */}
      <div className="flex md:hidden" style={{position:'fixed',bottom:0,left:0,right:0,backgroundColor:T.surface,borderTop:`1px solid ${T.border}`,justifyContent:'space-around',padding:'8px 0 20px'}}>
        {[{icon:'🏠',label:zh?'概览':'Home'},{icon:'📋',label:zh?'报价':'Quotes'},{icon:'🔨',label:zh?'工单':'Jobs'},{icon:'💰',label:zh?'财务':'Finance'},{icon:'👤',label:zh?'我的':'Me'}].map(item=>(
          <div key={item.label} style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:'2px',padding:'4px 10px',cursor:'pointer'}}>
            <span style={{fontSize:'18px'}}>{item.icon}</span>
            <span style={{fontSize:'10px',fontWeight:500,color:T.textDim}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Controller ──────────────────────────────────────────────
type Screen = 'welcome' | 'onboarding' | 'dashboard'

export default function TestComplete() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<'en'|'zh'>('en')
  const [userName, setUserName] = useState('')
  const weather = useWeather()
  const T = isDark ? DARK : LIGHT

  // Top bar (persistent across all screens)
  return (
    <div style={{minHeight:'100vh',backgroundColor:T.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif',color:T.text,transition:'background 0.2s'}}>

      {/* Persistent top bar for welcome + onboarding */}
      {screen !== 'dashboard' && (
        <div style={{padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${T.border}`,backgroundColor:T.surface,position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'13px'}}>C</div>
            <span style={{fontWeight:700,fontSize:'15px',color:T.text}}>CIMO</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px',borderRadius:'8px',backgroundColor:T.elevated,border:`1px solid ${T.border}`}}>
              {(['en','zh'] as const).map(l=>(
                <button key={l} onClick={()=>setLang(l)}
                  style={{padding:'5px 14px',borderRadius:'5px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,transition:'all 0.15s',backgroundColor:lang===l?T.surface:'transparent',color:lang===l?T.text:T.textSub,boxShadow:lang===l?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
                  {l==='en'?'English':'中文'}
                </button>
              ))}
            </div>
            <button onClick={()=>setIsDark(!isDark)} style={{padding:'6px 10px',borderRadius:'6px',border:`1px solid ${T.border}`,backgroundColor:T.overlay,cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'4px'}}>
              <span>{isDark?'☀️':'🌙'}</span>
              <span style={{fontSize:'11px',color:T.textSub}}>{isDark?(lang==='en'?'Light':'亮色'):(lang==='en'?'Dark':'暗色')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'welcome' && (
        <WelcomeScreen T={T} lang={lang} onStart={()=>setScreen('onboarding')}/>
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen T={T} lang={lang} onDone={(data)=>{setUserName(data.company||'Shu');setScreen('dashboard')}}/>
      )}
      {screen === 'dashboard' && (
        <DashboardScreen T={T} lang={lang} isDark={isDark} onToggleDark={()=>setIsDark(!isDark)} weather={weather} userName={userName||'Shu'}/>
      )}
    </div>
  )
}
