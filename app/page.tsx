'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../lib/i18n/LanguageContext'

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
const PANEL_W = 360

type MatStatus = 'delivered'|'pending'|'partial'|'delayed'
type PayStatus = 'unpaid'|'partial_paid'|'paid'|'overdue'

const MAT_OPTIONS = [
  {key:'delivered' as MatStatus, label:'已到货', labelEn:'Delivered', emoji:'✅', type:'success' as const},
  {key:'pending'   as MatStatus, label:'待到货', labelEn:'Pending',   emoji:'⏳', type:'muted'   as const},
  {key:'partial'   as MatStatus, label:'部分到', labelEn:'Partial',   emoji:'🔄', type:'warning' as const},
  {key:'delayed'   as MatStatus, label:'延误',   labelEn:'Delayed',   emoji:'⚠️', type:'danger'  as const},
]
const PAY_OPTIONS = [
  {key:'unpaid'       as PayStatus, label:'未付款', labelEn:'Unpaid',   emoji:'💰', type:'muted'   as const},
  {key:'partial_paid' as PayStatus, label:'部分收', labelEn:'Partial',  emoji:'🔄', type:'warning' as const},
  {key:'paid'         as PayStatus, label:'已收款', labelEn:'Paid',     emoji:'✅', type:'success' as const},
  {key:'overdue'      as PayStatus, label:'已逾期', labelEn:'Overdue',  emoji:'⚠️', type:'danger'  as const},
]

type WeatherData = {temp:number,code:number,city:string,wind?:number}|null
function useWeather(){
  const [w,setW]=useState<WeatherData>(null)
  useEffect(()=>{
    function fetch_(lat:number,lon:number,city:string){
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`)
        .then(r=>r.json()).then(d=>setW({temp:Math.round(d.current.temperature_2m),code:d.current.weather_code,wind:Math.round(d.current.wind_speed_10m),city})).catch(()=>{})
    }
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        p=>{fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`).then(r=>r.json()).then(d=>fetch_(p.coords.latitude,p.coords.longitude,d.address?.city||d.address?.town||'My Location')).catch(()=>fetch_(p.coords.latitude,p.coords.longitude,'My Location'))},
        ()=>fetch_(-31.9505,115.8605,'Perth')
      )
    } else fetch_(-31.9505,115.8605,'Perth')
  },[])
  return w
}
function weatherEmoji(c:number){if(c===0)return'☀️';if(c<=2)return'⛅';if(c<=3)return'☁️';if(c<=48)return'🌫️';if(c<=67)return'🌧️';return'⛈️'}
function weatherDesc(c:number,zh:boolean){if(c===0)return zh?'晴天':'Sunny';if(c<=2)return zh?'少云':'Partly cloudy';if(c<=3)return zh?'多云':'Cloudy';if(c<=67)return zh?'有雨':'Rainy';return zh?'雷暴':'Thunderstorm'}

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

function Badge({label,type,T}:{label:string,type:'success'|'warning'|'danger'|'info'|'muted',T:Theme,isZh?:boolean}){
  const cfg={success:{bg:T.successGlow,color:T.success,border:T.successGlow},warning:{bg:T.warningGlow,color:T.warning,border:T.warningGlow},danger:{bg:T.dangerGlow,color:T.danger,border:T.dangerGlow},info:{bg:T.primaryGlow,color:T.primary,border:T.primaryGlow},muted:{bg:T.overlay,color:T.textSub,border:T.border}}[type]
  return<span style={{fontSize:'13px',fontWeight:600,padding:'3px 8px',borderRadius:'3px',backgroundColor:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const}}>{label}</span>
}

function Bar({pct,color,bg}:{pct:number,color:string,bg:string}){
  return<div style={{height:'2px',backgroundColor:bg,borderRadius:'1px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',backgroundColor:color}}/></div>
}

function Section({title,dot,count,action,T,children}:{title:string,dot?:string,count?:number,action?:React.ReactNode,T:Theme,children:React.ReactNode}){
  return(
    <div style={{backgroundColor:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',overflow:'hidden',marginBottom:'16px'}}>
      <div style={{padding:'11px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'8px',backgroundColor:T.elevated}}>
        {dot&&<PulseDot color={dot} size={7}/>}
        <span style={{fontSize:'15px',fontWeight:600,color:T.text}}>{title}</span>
        {count!==undefined&&<span style={{fontSize:'10px',fontWeight:600,padding:'0 5px',borderRadius:'3px',backgroundColor:T.bg,color:T.textDim,border:`1px solid ${T.border}`,fontFamily:T.mono}}>{count}</span>}
        {action&&<div style={{marginLeft:'auto'}}>{action}</div>}
      </div>
      {children}
    </div>
  )
}

function StatusDropdown<K extends string>({value,options,onChange,T,isZh=false}:{value:K,options:{key:K,label:string,labelEn:string,emoji:string,type:'success'|'muted'|'warning'|'danger'}[],onChange:(v:K)=>void,T:Theme,isZh?:boolean}){
  const [open,setOpen]=useState(false)
  const opt=options.find(o=>o.key===value)!
  const cfg={success:{bg:T.successGlow,color:T.success,border:T.successGlow},muted:{bg:T.overlay,color:T.textSub,border:T.border},warning:{bg:T.warningGlow,color:T.warning,border:T.warningGlow},danger:{bg:T.dangerGlow,color:T.danger,border:T.dangerGlow}}[opt.type]
  return(
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{fontSize:'11px',fontWeight:600,padding:'3px 7px',borderRadius:'4px',backgroundColor:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap' as const}}>
        <span>{opt.emoji}</span><span>{isZh?opt.label:opt.labelEn}</span><span style={{fontSize:'8px',opacity:0.6}}>▾</span>
      </button>
      {open&&(<>
        <div style={{position:'fixed',inset:0,zIndex:40}} onClick={()=>setOpen(false)}/>
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:50,backgroundColor:T.elevated,border:`1px solid ${T.border}`,borderRadius:'6px',overflow:'hidden',minWidth:'120px',boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
          {options.map(o=>{
            const c={success:{color:T.success},muted:{color:T.textSub},warning:{color:T.warning},danger:{color:T.danger}}[o.type]
            return<button key={o.key} onClick={()=>{onChange(o.key);setOpen(false)}} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',border:'none',backgroundColor:o.key===value?T.overlay:'transparent',cursor:'pointer',textAlign:'left' as const,borderBottom:`1px solid ${T.borderSub}`}}>
              <span style={{fontSize:'13px'}}>{o.emoji}</span>
              <span style={{fontSize:'12px',fontWeight:o.key===value?600:400,color:c.color}}>{isZh?o.label:o.labelEn}</span>
              {o.key===value&&<span style={{marginLeft:'auto',fontSize:'10px',color:T.textDim}}>✓</span>}
            </button>
          })}
        </div>
      </>)}
    </div>
  )
}

const FEED=[
  {id:1,cat:'天气',catEn:'Weather',icon:'☀️',title:'本周四五有雨',titleEn:'Rain Thu–Fri',desc:'户外工程注意安排，建议提前备料',descEn:'Plan outdoor work accordingly',color:'#58A6FF'},
  {id:2,cat:'税务',catEn:'Tax',icon:'🧾',title:'ATO BAS 截止还有 14 天',titleEn:'ATO BAS due in 14 days',desc:'记得申报本季度 GST',descEn:'Lodge quarterly GST',color:'#F85149'},
  {id:3,cat:'餐厅',catEn:'Food',icon:'🍜',title:'附近餐厅午市优惠',titleEn:'Nearby lunch deals',desc:'Northbridge 3 家餐厅今日特惠 $12起',descEn:'3 restaurants from $12 today',color:'#FF6B6B'},
  {id:4,cat:'市场',catEn:'Market',icon:'📈',title:'Perth 建材价格上涨 3%',titleEn:'Building materials up 3%',desc:'砂浆/瓷砖本周涨价，建议提前采购',descEn:'Consider stocking up this week',color:'#D29922'},
  {id:5,cat:'工期',catEn:'Jobs',icon:'⚡',title:'2 个工地本周截止',titleEn:'2 sites due this week',desc:'注意安排人手',descEn:'Plan your crew accordingly',color:'#D29922'},
]

export default function Dashboard(){
  const supabase=createClient()
  const {lang}=useLanguage()
  const zh=lang==='zh'
  const [isDark,setIsDark]=useState(false)
  const T=isDark?DARK:LIGHT

  const [jobs,setJobs]=useState<any[]>([])
  const [quotes,setQuotes]=useState<any[]>([])
  const [entries,setEntries]=useState<any[]>([])
  const [greeting,setGreeting]=useState('')
  const [userName,setUserName]=useState('Shu')
  const [date,setDate]=useState('')
  const [dismissed,setDismissed]=useState<number[]>([])
  const [done,setDone]=useState<Set<string>>(new Set())
  const [menuOpen,setMenuOpen]=useState(false)
  const [jobMeta,setJobMeta]=useState<Record<string,{mat:MatStatus,pay:PayStatus}>>({})
  const [filterMat,setFilterMat]=useState<MatStatus|'all'>('all')
  const [filterPay,setFilterPay]=useState<PayStatus|'all'>('all')
  const [filterStatus,setFilterStatus]=useState<string>('all')
  const menuRef=useRef<HTMLDivElement>(null)
  const weather=useWeather()

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

  useEffect(()=>{
    async function load(){
      const {data:{user}}=await supabase.auth.getUser()
      if(user){
        const {data:profile}=await supabase.from('profiles').select('company_name').eq('id',user.id).single()
        if(profile?.company_name)setUserName(profile.company_name)
        else if(user.email)setUserName(user.email.split('@')[0])
      }
      const [{data:jobData},{data:quoteData},{data:entryData}]=await Promise.all([
        supabase.from('job_summary').select('*'),
        supabase.from('quotes').select('*').order('created_at',{ascending:false}),
        supabase.from('job_entries').select('*,jobs(name)').in('type',['invoice','material','subcontract','labor','fuel']),
      ])
      setJobs(jobData||[])
      setQuotes(quoteData||[])
      setEntries(entryData||[])
      const meta:Record<string,{mat:MatStatus,pay:PayStatus}>={}
      ;(jobData||[]).forEach((j:any)=>{meta[j.id]={mat:'pending',pay:'unpaid'}})
      setJobMeta(meta)
    }
    load()
  },[])

  async function toggleDeposit(id:string, current:boolean){
    await supabase.from('quotes').update({deposit_paid:!current}).eq('id',id)
    setQuotes(prev=>prev.map(q=>q.id===id?{...q,deposit_paid:!current}:q))
  }

  const activeJobs=jobs.filter(j=>j.status==='active'||j.status==='new')
  const unpaidInvoices=entries.filter(e=>e.type==='invoice'&&e.payment_status!=='paid')
  const totalReceivable=unpaidInvoices.reduce((s,e)=>s+Number(e.amount),0)
  const overdueInvoices=unpaidInvoices.filter(e=>e.payment_due_date&&new Date(e.payment_due_date)<new Date())
  const totalProfit=jobs.reduce((s,j)=>s+Number(j.profit||0),0)
  const TAX_THRESHOLD=45001
  const superReminder=totalProfit>TAX_THRESHOLD

  const filteredJobs=activeJobs.filter(j=>{
    const meta=jobMeta[j.id]||{mat:'pending',pay:'unpaid'}
    if(filterMat!=='all'&&meta.mat!==filterMat)return false
    if(filterPay!=='all'&&meta.pay!==filterPay)return false
    if(filterStatus!=='all'&&j.status!==filterStatus)return false
    return true
  })

  const todos=[
    ...overdueInvoices.slice(0,2).map(e=>({id:e.id,tag:'💰',text:`${zh?'跟进':'Follow up'} ${e.jobs?.name||''} ${zh?'逾期':'overdue'}`,amount:`$${Number(e.amount).toLocaleString()}`,type:'danger' as const})),
    ...quotes.filter(q=>q.status==='sent').slice(0,2).map(q=>({id:q.id,tag:'📋',text:`${zh?'确认':'Confirm'} ${q.client_name} ${q.quote_number}`,amount:`$${Number(q.total||0).toLocaleString()}`,type:'warning' as const})),
    ...quotes.filter(q=>q.status==='draft').slice(0,1).map(q=>({id:q.id+'d',tag:'📤',text:`${zh?'发送':'Send'} ${q.client_name} ${q.quote_number}`,amount:`$${Number(q.total||0).toLocaleString()}`,type:'info' as const})),
  ]
  const todoPct=todos.length>0?Math.round((done.size/todos.length)*100):100
  const typeColor:{[k:string]:string}={danger:T.danger,warning:T.warning,info:T.primary,muted:T.textSub,success:T.success}
  const visibleFeed=FEED.filter(f=>!dismissed.includes(f.id))

  const navItems=[
    {href:'/',label:zh?'概览':'Overview',icon:'🏠'},
    {href:'/quotes',label:zh?'报价单':'Quotes',icon:'📋'},
    {href:'/jobs',label:zh?'工单':'Jobs',icon:'🔨'},
    {href:'/finance',label:zh?'财务':'Finance',icon:'💰'},
    {href:'/tax',label:zh?'税务':'Tax',icon:'📊'},
    {href:'/clients',label:zh?'客户':'Clients',icon:'👥'},
    {href:'/settings',label:zh?'设置':'Settings',icon:'⚙️'},
  ]

  return(
    <div style={{minHeight:'100vh',backgroundColor:T.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif',color:T.text}}>

      {/* 顶部导航 */}
      <div style={{position:'sticky',top:0,zIndex:50,backgroundColor:T.surface,borderBottom:`1px solid ${T.border}`,height:'70px',display:'flex',alignItems:'center',paddingLeft:'20px'}}>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:'16px',minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
            <div style={{width:'28px',height:'28px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'13px'}}>C</div>
            <span style={{fontWeight:700,color:T.text,fontSize:'15px'}}>CIMO</span>
          </div>
          <div style={{width:'1px',height:'18px',backgroundColor:T.border,flexShrink:0}}/>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'20px',fontWeight:700,color:T.text,margin:'0 0 4px'}}>{greeting}, {userName}</p>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'13px',color:T.textDim}}>{date}</span>
              {weather&&(
                <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'1px 7px',backgroundColor:T.overlay,border:`1px solid ${T.border}`,borderRadius:'20px'}}>
                  <span style={{fontSize:'11px'}}>📍</span>
                  <span style={{fontSize:'12px',color:T.textSub}}>{weather.city}</span>
                  <span style={{width:'1px',height:'8px',backgroundColor:T.border}}/>
                  <span style={{fontSize:'14px'}}>{weatherEmoji(weather.code)}</span>
                  <span style={{fontSize:'13px',fontWeight:600,color:T.text,fontFamily:T.mono}}>{weather.temp}°C</span>
                  <span style={{fontSize:'12px',color:T.textDim}}>{weatherDesc(weather.code,zh)}</span>
                  {weather.wind&&<span style={{fontSize:'11px',color:T.textDim}}>{weather.wind}km/h</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search + 汉堡 */}
        <div style={{width:`${PANEL_W}px`,flexShrink:0,display:'flex',alignItems:'center',gap:'8px',paddingLeft:'14px',paddingRight:'14px',borderLeft:`1px solid ${T.border}`,marginRight:'48px'}}>
          <div style={{flex:1,display:'flex',alignItems:'center',gap:'8px',padding:'6px 10px',backgroundColor:T.overlay,border:`1px solid ${T.border}`,borderRadius:'6px'}}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10.68 10.68a6 6 0 1 1 .94-.94l3.31 3.31a.67.67 0 0 1-.94.94l-3.31-3.31z" stroke={T.textDim} strokeWidth="1.5"/></svg>
            <input placeholder={zh?'搜索工单、客户...':'Search jobs, clients...'} style={{background:'none',border:'none',outline:'none',fontSize:'12px',color:T.text,width:'100%',fontFamily:'inherit'}}/>
          </div>
          <div ref={menuRef} style={{position:'relative',flexShrink:0}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{width:'34px',height:'34px',borderRadius:'6px',border:`1px solid ${T.border}`,backgroundColor:menuOpen?T.elevated:T.overlay,cursor:'pointer',display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',gap:'4px'}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:'14px',height:'1.5px',backgroundColor:T.textSub,borderRadius:'1px',transform:menuOpen?(i===0?'rotate(45deg) translate(4px,4px)':i===2?'rotate(-45deg) translate(4px,-4px)':'scaleX(0)'):'none',transition:'all 0.2s',opacity:menuOpen&&i===1?0:1}}/>
              ))}
            </button>
            {menuOpen&&(
              <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:'220px',backgroundColor:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',boxShadow:`0 8px 24px rgba(0,0,0,${isDark?0.4:0.15})`,zIndex:100,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,backgroundColor:T.elevated,display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'12px'}}>S</div>
                  <div><p style={{fontSize:'12px',fontWeight:600,color:T.text,margin:0}}>Shu</p><p style={{fontSize:'10px',color:T.textDim,margin:0}}>kkkk@qq.com</p></div>
                </div>
                <div style={{padding:'6px'}}>
                  {navItems.map(item=>(
                    <Link key={item.href} href={item.href} onClick={()=>setMenuOpen(false)}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'5px',textDecoration:'none',color:T.text}}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                      <span style={{fontSize:'14px'}}>{item.icon}</span>
                      <span style={{fontSize:'13px'}}>{item.label}</span>
                    </Link>
                  ))}
                </div>
                <div style={{padding:'8px 10px 10px',borderTop:`1px solid ${T.border}`,display:'flex',gap:'8px'}}>
                  <button onClick={()=>setIsDark(!isDark)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'7px',borderRadius:'5px',border:`1px solid ${T.border}`,backgroundColor:T.elevated,cursor:'pointer',fontSize:'12px',color:T.textSub}}>
                    <span>{isDark?'☀️':'🌙'}</span><span>{isDark?(zh?'亮色':'Light'):(zh?'暗色':'Dark')}</span>
                  </button>
                  <Link href="/auth/signout" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'7px',borderRadius:'5px',border:`1px solid ${T.border}`,backgroundColor:T.elevated,textDecoration:'none',fontSize:'12px',color:T.danger}}>
                    {zh?'退出':'Sign out'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容 + 右侧面板 */}
      <div style={{display:'flex',maxWidth:'1400px',margin:'0 auto'}}>

        {/* 中间内容 */}
        <div style={{flex:1,minWidth:0,padding:'20px 20px 60px'}}>

          {/* Active Jobs */}
          <Section title={zh?'进行中工单':'Active Jobs'} dot={T.primary} count={activeJobs.length} T={T}
            action={<div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Link href="/jobs/new" style={{fontSize:'11px',fontWeight:600,padding:'4px 10px',borderRadius:'5px',border:`1px solid ${T.primary}`,backgroundColor:T.primaryGlow,color:T.primary,textDecoration:'none'}}>{zh?'+ 新工单':'+ New Job'}</Link>
              <Link href="/jobs" style={{fontSize:'11px',color:T.primary,textDecoration:'none',fontWeight:500}}>{zh?'全部 →':'All →'}</Link>
            </div>}>

            {/* 筛选栏 */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',borderBottom:`1px solid ${T.border}`,backgroundColor:T.bg,flexWrap:'wrap' as const}}>
              <span style={{fontSize:'11px',color:T.textDim,fontWeight:500}}>{zh?'筛选：':'Filter:'}</span>
              <select value={filterMat} onChange={e=>setFilterMat(e.target.value as any)}
                style={{fontSize:'11px',color:T.textSub,backgroundColor:T.elevated,border:`1px solid ${T.border}`,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',outline:'none'}}>
                <option value="all">{zh?'材料：全部':'Material: All'}</option>
                {MAT_OPTIONS.map(o=><option key={o.key} value={o.key}>{o.emoji} {zh?o.label:o.labelEn}</option>)}
              </select>
              <select value={filterPay} onChange={e=>setFilterPay(e.target.value as any)}
                style={{fontSize:'11px',color:T.textSub,backgroundColor:T.elevated,border:`1px solid ${T.border}`,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',outline:'none'}}>
                <option value="all">{zh?'收款：全部':'Payment: All'}</option>
                {PAY_OPTIONS.map(o=><option key={o.key} value={o.key}>{o.emoji} {zh?o.label:o.labelEn}</option>)}
              </select>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                style={{fontSize:'11px',color:T.textSub,backgroundColor:T.elevated,border:`1px solid ${T.border}`,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',outline:'none'}}>
                <option value="all">{zh?'状态：全部':'Status: All'}</option>
                <option value="active">{zh?'进行中':'Active'}</option>
                <option value="new">{zh?'新建':'New'}</option>
              </select>
              {(filterMat!=='all'||filterPay!=='all'||filterStatus!=='all')&&(
                <button onClick={()=>{setFilterMat('all');setFilterPay('all');setFilterStatus('all')}}
                  style={{fontSize:'11px',color:T.danger,backgroundColor:T.dangerGlow,border:`1px solid ${T.dangerGlow}`,borderRadius:'4px',padding:'4px 8px',cursor:'pointer'}}>
                  ✕ {zh?'清除':'Clear'}
                </button>
              )}
              <span style={{marginLeft:'auto',fontSize:'11px',color:T.textDim,fontFamily:T.mono}}>{filteredJobs.length}/{activeJobs.length} {zh?'条':'jobs'}</span>
            </div>

            {filteredJobs.length===0?(
              <div style={{padding:'24px',textAlign:'center' as const}}>
                <p style={{color:T.textDim,fontSize:'13px'}}>{zh?'暂无进行中工单':'No active jobs yet'}</p>
                <Link href="/jobs/new" style={{display:'inline-block',marginTop:'8px',padding:'6px 14px',borderRadius:'6px',background:T.primary,color:'white',textDecoration:'none',fontSize:'12px',fontWeight:600}}>{zh?'+ 新建工单':'+ New Job'}</Link>
              </div>
            ):(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor:T.bg}}>
                      {[zh?'工单名称':'Job',zh?'工地 / 截止':'Site / Due',zh?'材料状态':'Material',zh?'收款状态':'Payment',zh?'收入':'Revenue',zh?'状态':'Status'].map(h=>(
                        <th key={h} style={{padding:'8px 16px',fontSize:'10px',fontWeight:600,color:T.textDim,textAlign:'left' as const,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'0.6px',whiteSpace:'nowrap' as const}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job,i)=>{
                      const meta=jobMeta[job.id]||{mat:'pending',pay:'unpaid'}
                      const daysLeft=job.due_date?Math.ceil((new Date(job.due_date).getTime()-Date.now())/(1000*60*60*24)):null
                      const isUrgent=daysLeft!==null&&daysLeft<=5
                      return(
                        <tr key={job.id} style={{borderTop:i>0?`1px solid ${T.borderSub}`:'none',cursor:'pointer'}}
                          onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                          onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                          <td style={{padding:'11px 16px'}}>
                            <Link href={`/jobs/${job.id}`} style={{fontSize:'15px',fontWeight:500,color:T.primary,textDecoration:'none'}}>{zh?job.name:job.name.replace('的工单','Job')}</Link>
                          </td>
                          <td style={{padding:'11px 16px'}}>
                            {job.site_address&&<div style={{display:'flex',alignItems:'center',gap:'4px',marginBottom:'2px'}}>
                              <span style={{fontSize:'11px'}}>📍</span>
                              <span style={{fontSize:'12px',color:T.textSub}}>{job.site_address}</span>
                            </div>}
                            {daysLeft!==null&&(
                              <span style={{fontSize:'12px',fontWeight:600,color:isUrgent?T.danger:T.textDim,fontFamily:T.mono}}>
                                {isUrgent?'▲ ':''}{daysLeft}d left
                              </span>
                            )}
                          </td>
                          <td style={{padding:'11px 16px'}}>
                            <StatusDropdown value={meta.mat} options={MAT_OPTIONS}
                              onChange={s=>setJobMeta(m=>({...m,[job.id]:{...m[job.id],mat:s}}))} T={T} lang={lang} isZh={zh}/>
                          </td>
                          <td style={{padding:'11px 16px'}}>
                            <StatusDropdown value={meta.pay} options={PAY_OPTIONS}
                              onChange={s=>setJobMeta(m=>({...m,[job.id]:{...m[job.id],pay:s}}))} T={T} lang={lang} isZh={zh}/>
                          </td>
                          <td style={{padding:'11px 16px',fontSize:'15px',fontWeight:600,color:Number(job.revenue)>0?T.success:T.textDim,fontFamily:T.mono}}>
                            {Number(job.revenue)>0?'+$'+Number(job.revenue).toLocaleString():'—'}
                          </td>
                          <td style={{padding:'11px 16px'}}>
                            <Badge label={job.status==='active'?(zh?'进行中':'Active'):(zh?'新建':'New')} type={job.status==='active'?'muted':'warning'} T={T} isZh={zh}/>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Quotes */}
          <Section title={zh?'报价单':'Quotes'} dot={T.primary} count={quotes.length} T={T}
            action={<div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Link href="/quotes/new" style={{fontSize:'11px',fontWeight:600,padding:'4px 10px',borderRadius:'5px',border:`1px solid ${T.primary}`,backgroundColor:T.primaryGlow,color:T.primary,textDecoration:'none'}}>{zh?'+ 新报价单':'+ New Quote'}</Link>
              <Link href="/quotes" style={{fontSize:'11px',color:T.primary,textDecoration:'none',fontWeight:500}}>{zh?'进入模块 →':'View all →'}</Link>
            </div>}>
            {quotes.length===0?(
              <div style={{padding:'20px',textAlign:'center' as const}}>
                <p style={{color:T.textDim,fontSize:'13px'}}>{zh?'还没有报价单':'No quotes yet'}</p>
                <Link href="/quotes/new" style={{display:'inline-block',marginTop:'8px',padding:'6px 14px',borderRadius:'6px',background:T.primary,color:'white',textDecoration:'none',fontSize:'12px',fontWeight:600}}>{zh?'+ 新建报价单':'+ New Quote'}</Link>
              </div>
            ):(
              quotes.slice(0,5).map((q,i)=>(
                <div key={q.id} style={{padding:'10px 16px',borderTop:`1px solid ${T.borderSub}`,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'13px',color:T.textDim,fontFamily:T.mono,width:'44px'}}>{q.quote_number||`Q-00${i+1}`}</span>
                    <div>
                      <p style={{fontSize:'15px',fontWeight:500,color:T.text,margin:'0 0 1px'}}>{q.client_name||'—'}</p>
                      <p style={{fontSize:'11px',color:T.textDim,margin:0}}>{new Date(q.created_at).toLocaleDateString(zh?'zh-CN':'en-AU')}</p>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    {q.total&&<span style={{fontSize:'15px',fontWeight:600,color:T.success,fontFamily:T.mono}}>${Number(q.total).toLocaleString()}</span>}
                    <Badge label={q.status==='accepted'?(zh?'已接受':'Accepted'):q.status==='sent'?(zh?'已发送':'Sent'):q.status==='rejected'?(zh?'已拒绝':'Rejected'):(zh?'草稿':'Draft')} type={q.status==='accepted'?'success':q.status==='sent'?'warning':q.status==='rejected'?'danger':'muted'} T={T} isZh={zh}/>
                  <button onClick={()=>toggleDeposit(q.id,q.deposit_paid)} style={{fontSize:'11px',fontWeight:600,padding:'3px 8px',borderRadius:'3px',backgroundColor:q.deposit_paid?'rgba(63,185,80,0.12)':'rgba(210,153,34,0.12)',color:q.deposit_paid?'#3FB950':'#D29922',border:'1px solid '+(q.deposit_paid?'rgba(63,185,80,0.12)':'rgba(210,153,34,0.12)'),cursor:'pointer',whiteSpace:'nowrap'}}>
                    {q.deposit_paid?(zh?'✓ 定金已付':'✓ Deposit Paid'):(zh?'定金未付':'Deposit Unpaid')}
                  </button>
                  </div>
                </div>
              ))
            )}
          </Section>

          {/* Super 提醒 */}
          {superReminder&&(
            <div style={{backgroundColor:T.surface,border:`1px solid ${T.border}`,borderLeft:`2px solid ${T.warning}`,borderRadius:'8px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',background:`linear-gradient(90deg,${T.warningGlow} 0%,${T.surface} 50%)`}}>
              <PulseDot color={T.warning}/>
              <div style={{flex:1}}>
                <p style={{fontSize:'13px',fontWeight:600,color:T.text,margin:'0 0 2px'}}>{zh?'Super 供款提醒':'Super Contribution Reminder'}</p>
                <p style={{fontSize:'11px',color:T.textDim,margin:0}}>{zh?`利润已超税务门槛 · 2024-25 供款上限 $30,000`:`Profit exceeds $${TAX_THRESHOLD.toLocaleString()} · 2024-25 cap $30,000`}</p>
              </div>
              <div style={{width:'60px',flexShrink:0}}><Bar pct={Math.min((totalProfit/30000)*100,100)} color={T.warning} bg={T.borderSub}/></div>
              <Link href="/tax" style={{backgroundColor:T.warningGlow,color:T.warning,border:`1px solid ${T.warningGlow}`,borderRadius:'4px',padding:'6px 12px',fontSize:'11px',fontWeight:600,textDecoration:'none'}}>
                {zh?'了解':'Details'}
              </Link>
            </div>
          )}

          {/* 待收款 */}
          {totalReceivable>0&&(
            <div style={{backgroundColor:T.surface,border:`1px solid ${T.border}`,borderLeft:`2px solid ${T.danger}`,borderRadius:'8px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',background:`linear-gradient(90deg,${T.dangerGlow} 0%,${T.surface} 50%)`}}>
              <PulseDot color={T.danger}/>
              <div style={{flex:1}}>
                <p style={{fontSize:'13px',fontWeight:600,color:T.text,margin:'0 0 2px'}}>💰 {zh?'待收款项':'Accounts Receivable'}</p>
                <p style={{fontSize:'11px',color:T.textDim,margin:0}}>
                  {unpaidInvoices.length} {zh?'张未付':'unpaid'}
                  {overdueInvoices.length>0&&<span style={{color:T.danger,marginLeft:'6px'}}>· {overdueInvoices.length} {zh?'张逾期':'overdue'}</span>}
                </p>
              </div>
              <span style={{fontSize:'16px',fontWeight:700,color:T.danger,fontFamily:T.mono}}>${totalReceivable.toLocaleString()}</span>
              <Link href="/finance" style={{backgroundColor:T.dangerGlow,color:T.danger,border:`1px solid ${T.dangerGlow}`,borderRadius:'4px',padding:'6px 12px',fontSize:'11px',fontWeight:600,textDecoration:'none'}}>
                {zh?'查看':'View'}
              </Link>
            </div>
          )}
        </div>

        {/* 右侧面板 */}
        <div className="hidden md:block" style={{width:`${PANEL_W}px`,flexShrink:0,borderLeft:`1px solid ${T.border}`,backgroundColor:T.surface,position:'sticky',top:'70px',height:'calc(100vh - 70px)',overflowY:'auto'}}>

          {/* Project Map */}
          <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,backgroundColor:T.elevated,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <PulseDot color={T.success} size={6}/>
              <span style={{fontSize:'12px',fontWeight:600,color:T.textSub,textTransform:'uppercase' as const,letterSpacing:'0.8px'}}>{zh?'项目地图':'Project Map'}</span>
            </div>
            <span style={{fontSize:'11px',color:T.textDim}}>{weather?.city||'Perth'}</span>
          </div>
          <div style={{margin:'10px',height:'150px',borderRadius:'4px',overflow:'hidden',border:`1px solid ${T.border}`}}>
            <JobMap jobs={activeJobs} isDark={isDark}/>
          </div>
          <div style={{padding:'0 10px 6px',display:'flex',gap:'10px',flexWrap:'wrap' as const}}>
            {[{c:T.primary,l:zh?'进行中':'Active'},{c:T.warning,l:zh?'紧急':'Urgent'},{c:T.success,l:zh?'收尾':'Closing'},{c:T.textSub,l:zh?'新建':'New'}].map(l=>(
              <div key={l.l} style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:l.c}}/><span style={{fontSize:'10px',color:T.textDim}}>{l.l}</span></div>
            ))}
          </div>

          <div style={{height:'1px',backgroundColor:T.border,margin:'4px 10px 10px'}}/>

          {/* Today */}
          <div style={{padding:'0 14px 4px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
              <PulseDot color={T.danger} size={6}/>
              <span style={{fontSize:'11px',fontWeight:600,color:T.textSub,textTransform:'uppercase' as const,letterSpacing:'0.8px'}}>{zh?'今日待办':'Today'}</span>
            </div>
            <Bar pct={todoPct} color={todoPct===100?T.success:T.primary} bg={T.borderSub}/>
          </div>
          <div style={{padding:'6px 14px 4px'}}>
            {todos.length===0&&<p style={{fontSize:'12px',color:T.textDim,textAlign:'center' as const,padding:'8px 0'}}>✅ {zh?'今日暂无待办':'All clear!'}</p>}
            {todos.map(todo=>(
              <div key={todo.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 4px',borderRadius:'4px',marginBottom:'3px',cursor:'pointer',opacity:done.has(todo.id)?0.4:1,transition:'opacity 0.2s'}}
                onClick={()=>setDone(d=>{const n=new Set(d);n.has(todo.id)?n.delete(todo.id):n.add(todo.id);return n})}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=T.elevated)}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                <div style={{width:'14px',height:'14px',borderRadius:'3px',flexShrink:0,border:`1.5px solid ${done.has(todo.id)?T.success:T.border}`,backgroundColor:done.has(todo.id)?T.successGlow:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {done.has(todo.id)&&<span style={{fontSize:'9px',color:T.success}}>✓</span>}
                </div>
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'4px',minWidth:0}}>
                  <p style={{fontSize:'13px',fontWeight:done.has(todo.id)?400:500,color:done.has(todo.id)?T.textDim:T.text,margin:0,textDecoration:done.has(todo.id)?'line-through':'none',whiteSpace:'nowrap' as const,overflow:'hidden',textOverflow:'ellipsis'}}>{todo.tag} {todo.text}</p>
                  {todo.amount&&<span style={{fontSize:'12px',fontWeight:600,flexShrink:0,color:done.has(todo.id)?T.textDim:typeColor[todo.type],fontFamily:T.mono}}>{todo.amount}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{height:'1px',backgroundColor:T.border,margin:'8px 10px'}}/>

          {/* Updates */}
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
        {[{href:'/',icon:'🏠',label:zh?'概览':'Home'},{href:'/quotes',icon:'📋',label:zh?'报价':'Quotes'},{href:'/jobs',icon:'🔨',label:zh?'工单':'Jobs'},{href:'/finance',icon:'💰',label:zh?'财务':'Finance'},{href:'/settings',icon:'👤',label:zh?'我的':'Me'}].map(item=>(
          <Link key={item.href} href={item.href} style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:'2px',padding:'4px 10px',textDecoration:'none'}}>
            <span style={{fontSize:'18px'}}>{item.icon}</span>
            <span style={{fontSize:'10px',fontWeight:500,color:T.textDim}}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
