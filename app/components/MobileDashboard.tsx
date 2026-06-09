'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

/* ============== 主题 token（暗色为 Apple 风纯黑，亮色沿用品牌浅色） ============== */
const DARK = {
  bg:'#000000', surface:'#16181D', surface2:'#1E2127', line:'#2A2E36', lineSoft:'#1E2127',
  primary:'#2F81F7', primarySoft:'rgba(47,129,247,0.16)',
  success:'#3FB950', successSoft:'rgba(63,185,80,0.16)',
  warning:'#E3B341', warningSoft:'rgba(227,179,65,0.16)',
  danger:'#F85149', dangerSoft:'rgba(248,81,73,0.16)',
  text:'#F5F6F8', sub:'#A8B1BD', dim:'#6B7480',
  topbar:'rgba(0,0,0,0.72)', dock:'rgba(22,24,29,0.9)',
}
const LIGHT = {
  bg:'#F6F8FA', surface:'#FFFFFF', surface2:'#F0F2F5', line:'#D8DEE4', lineSoft:'#EAEEF2',
  primary:'#0969DA', primarySoft:'rgba(9,105,218,0.10)',
  success:'#1A7F37', successSoft:'rgba(26,127,55,0.10)',
  warning:'#9A6700', warningSoft:'rgba(154,103,0,0.10)',
  danger:'#CF222E', dangerSoft:'rgba(207,34,46,0.10)',
  text:'#1F2328', sub:'#57606A', dim:'#8C959F',
  topbar:'rgba(255,255,255,0.78)', dock:'rgba(255,255,255,0.92)',
}
type Theme = typeof DARK
const MONO = '"SF Mono",ui-monospace,"Fira Code",monospace'
const SANS = '-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif'

const ENTRY_TYPES = [
  {key:'material',    zh:'材料', en:'Material',     emoji:'🧱', income:false},
  {key:'labor',       zh:'人工', en:'Labor',        emoji:'👷', income:false},
  {key:'fuel',        zh:'油费', en:'Fuel',         emoji:'⛽', income:false},
  {key:'subcontract', zh:'分包', en:'Subcontract',  emoji:'🔧', income:false},
  {key:'invoice',     zh:'收款', en:'Payment',      emoji:'💵', income:true},
]

function daysLeft(dateStr?:string|null){
  if(!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime()-Date.now())/86400000)
}
const money = (n:any)=>'$'+Number(n||0).toLocaleString()

const NEWS=[{i:'📈',col:'#E3B341',t:'Perth 建材涨价 3%',d:'本周砂浆 / 瓷砖上涨，建议提前采购'}]
type WX={t:number,c:number,city:string}|null
function useWeather(){
  const[w,setW]=useState<WX>(null)
  useEffect(()=>{const g=(la:number,lo:number,city:string)=>fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code`).then(r=>r.json()).then(d=>setW({t:Math.round(d.current.temperature_2m),c:d.current.weather_code,city})).catch(()=>{});navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`).then(r=>r.json()).then(d=>g(p.coords.latitude,p.coords.longitude,d.address?.city||d.address?.suburb||'Perth')).catch(()=>g(p.coords.latitude,p.coords.longitude,'Perth')),()=>g(-31.95,115.86,'Perth')):g(-31.95,115.86,'Perth')},[])
  return w
}
function wx(c:number){return c===0?'☀️':c<=3?'⛅':c<=67?'🌧️':'⛈️'}

export default function MobileDashboard(){
  const supabase = createClient()
  const { lang } = useLanguage()
  const zh = true
  const weather = useWeather()

  const [isDark,setIsDark] = useState(true)
  const T:Theme = DARK

  const [jobs,setJobs] = useState<any[]>([])
  const [quotes,setQuotes] = useState<any[]>([])
  const [entries,setEntries] = useState<any[]>([])
  const [userId,setUserId] = useState<string|null>(null)
  const [menuOpen,setMenuOpen] = useState(false)

  // 记一笔 sheet
  const [sheetOpen,setSheetOpen] = useState(false)
  const [eType,setEType] = useState('material')
  const [eAmount,setEAmount] = useState('')
  const [eJob,setEJob] = useState('')
  const [eNote,setENote] = useState('')
  const [saving,setSaving] = useState(false)
  const [mounted,setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [userName,setUserName] = useState('')
  const [userEmail,setUserEmail] = useState('')
  const [eQty,setEQty] = useState('')
  const [eUnit,setEUnit] = useState('')
  const [eUnitPrice,setEUnitPrice] = useState('')
  const [ePicked,setEPicked] = useState('')
  const [mats,setMats] = useState<any[]>([])

  // 跟随 <html class="dark">
  useEffect(()=>{
    const read=()=>setIsDark(document.documentElement.classList.contains('dark'))
    read()
    const obs=new MutationObserver(read)
    obs.observe(document.documentElement,{attributes:true,attributeFilter:['class']})
    return ()=>obs.disconnect()
  },[])

  async function load(){
    const [{data:jobData},{data:quoteData},{data:entryData},{data:userData}] = await Promise.all([
      supabase.from('job_summary').select('*'),
      supabase.from('quotes').select('*').order('created_at',{ascending:false}),
      supabase.from('job_entries').select('*,jobs(name)').in('type',['invoice','material','subcontract','labor','fuel']),
      supabase.auth.getUser(),
    ])
    setJobs(jobData||[])
    setQuotes(quoteData||[])
    setEntries(entryData||[])
    setUserId(userData?.user?.id||null)
    const _u=userData?.user
    if(_u){
      setUserEmail(_u.email||'')
      supabase.from('profiles').select('company_name').eq('id',_u.id).single().then(({data:_pf})=>{ setUserName(_pf?.company_name || (_u.email? _u.email.split('@')[0] : '')) })
    }
  }
  useEffect(()=>{ load() },[])

  const activeJobs = jobs.filter(j=>j.status==='active'||j.status==='new')
  useEffect(()=>{ if(!eJob && activeJobs[0]) setEJob(activeJobs[0].id) },[jobs]) // eslint-disable-line

  const overdue = entries.filter(e=>e.type==='invoice'&&e.payment_status!=='paid'&&e.payment_due_date&&new Date(e.payment_due_date)<new Date())
  const totalProfit = jobs.reduce((s,j)=>s+Number(j.profit||0),0)
  const dueSoon = activeJobs
    .map(j=>({job:j,d:daysLeft(j.end_date||j.earliest_due_date)}))
    .filter(x=>x.d!==null&&(x.d as number)<=7)
    .sort((a,b)=>(a.d as number)-(b.d as number))

  // 今日需要关注
  type Focus = {kind:'danger'|'warning'|'info',tag:string,accent:string,title:string,sub:string}
  const focus:Focus[] = []
  overdue.slice(0,2).forEach(e=>focus.push({
    kind:'danger', tag:zh?'💰 逾期收款':'💰 Overdue', accent:money(e.amount),
    title:`${e.jobs?.name||(zh?'工单':'Job')} · ${zh?'跟进付款':'Follow up'}`,
    sub:`${zh?'逾期':'Overdue'} ${Math.abs(daysLeft(e.payment_due_date) as number)} ${zh?'天':'days'}`,
  }))
  dueSoon.slice(0,2).forEach(({job,d})=>focus.push({
    kind:'warning', tag:zh?'⏱ 工期临近':'⏱ Due soon', accent:`${zh?'还剩':''} ${d} ${zh?'天':'d'}`,
    title:job.name, sub:`${zh?'临近截止 · 注意安排人手':'Deadline near · plan crew'}`,
  }))
  if(totalProfit>45001) focus.push({
    kind:'info', tag:zh?'📊 税务提醒':'📊 Tax', accent:zh?'查看 ›':'View ›',
    title:zh?'Super 供款窗口':'Super contribution', sub:zh?'利润已超门槛 · 上限 $30,000':'Profit over threshold',
  })

  const MON_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const bNow = new Date()
  const bCands = [new Date(bNow.getFullYear(),1,28), new Date(bNow.getFullYear(),3,28), new Date(bNow.getFullYear(),6,28), new Date(bNow.getFullYear(),9,28), new Date(bNow.getFullYear()+1,1,28)]
  const bDue = bCands.find(d=>d>=bNow) || bCands[bCands.length-1]
  const bDays = Math.ceil((bDue.getTime()-bNow.getTime())/86400000)
  if(mounted) focus.push({
    kind: bDays<=7?'danger':bDays<=21?'warning':'info', tag: zh?'🧾 BAS 截止':'🧾 BAS due', accent: (zh?'还剩 ':'')+bDays+(zh?' 天':'d'),
    title: zh?'本季 GST 申报':'Lodge quarterly BAS', sub: (zh?'截止 ':'Due ')+bDue.getDate()+' '+MON_S[bDue.getMonth()]+' '+bDue.getFullYear(),
  })
  const kindColor = (k:string)=>k==='danger'?T.danger:k==='warning'?T.warning:T.primary
  const kindSoft  = (k:string)=>k==='danger'?T.dangerSoft:k==='warning'?T.warningSoft:T.primarySoft

  const greeting = (()=>{ const h=new Date().getHours(); return h<12?(zh?'早上好':'Good morning'):h<18?(zh?'下午好':'Good afternoon'):(zh?'晚上好':'Good evening') })()
  const dateStr = new Date().toLocaleDateString(zh?'zh-CN':'en-AU',{month:'long',day:'numeric',weekday:'long'})

  const navItems = [
    {href:'/',label:zh?'首页':'Home',icon:'🏠'},
    {href:'/jobs',label:zh?'工单':'Jobs',icon:'🔨'},
    {href:'/quotes',label:zh?'报价':'Quotes',icon:'📋'},
    {href:'/clients',label:zh?'客户':'Clients',icon:'👥'},
    {href:'/finance',label:zh?'财务':'Finance',icon:'💰'},
    {href:'/settings',label:zh?'设置':'Settings',icon:'⚙️'},
  ]

  async function saveEntry(){
    if(!eAmount||Number(eAmount)<=0||!eJob){ alert(zh?'请填写金额并选择工单':'Enter amount and pick a job'); return }
    setSaving(true)
    try{
      const row:any = { job_id: eJob, owner_id: userId, type: eType, amount: Number(eAmount), note: eNote||null }
      if(eType==='material'){ row.description=eNote||null; if(eQty)row.quantity=Number(eQty); if(eUnit)row.unit=eUnit; if(eUnitPrice)row.unit_price=Number(eUnitPrice); row.gst_status='inclusive'; row.tax_category='cogs_material' }
      const { error } = await supabase.from('job_entries').insert(row)
      if(error) throw error
      setSheetOpen(false); setEAmount(''); setENote(''); setEQty(''); setEUnit(''); setEUnitPrice(''); setEPicked('')
      await load()
    }catch(err:any){
      console.error('记一笔失败',err)
      alert((zh?'保存失败：':'Save failed: ')+(err?.message||''))
    }finally{ setSaving(false) }
  }

  useEffect(()=>{
    if(!sheetOpen) return
    const j = eJob || (activeJobs[0]?.id || '')
    if(!eJob && j) setEJob(j)
    if(!j){ setMats([]); return }
    supabase.from('job_entries').select('description, unit, unit_price').eq('job_id', j).eq('type','material').eq('notes','QUOTE_ESTIMATE').then(({data}:any)=>setMats(data||[]))
  },[sheetOpen,eJob,eType])
  useEffect(()=>{
    if(eType==='material'){ const q=Number(eQty),p=Number(eUnitPrice); if(q>0&&p>0) setEAmount(String(+(q*p).toFixed(2))) }
  },[eQty,eUnitPrice,eType])
  function pickMat(m:any){ setEPicked(m.description); setENote(m.description); setEUnit(m.unit||''); setEUnitPrice(m.unit_price!=null?String(m.unit_price):'') }
  const card = {background:T.surface,border:`1px solid ${T.line}`,borderRadius:'18px'} as const

  return (
    <div className="md:hidden" style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:SANS,paddingBottom:'110px'}}>

      {/* 顶栏 */}
      <div style={{position:'sticky',top:0,zIndex:30,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:T.topbar,backdropFilter:'saturate(180%) blur(20px)',WebkitBackdropFilter:'saturate(180%) blur(20px)',borderBottom:`1px solid ${T.lineSoft}`}}>
        <div style={{display:'flex',alignItems:'center',gap:'9px',fontWeight:700,fontSize:'17px'}}>
          <span style={{width:'26px',height:'26px',borderRadius:'7px',background:`linear-gradient(135deg,${T.primary},#7CB3FF)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:'13px'}}>C</span>
          <span>CIMO</span>
        </div>
        <button onClick={()=>setMenuOpen(o=>!o)} aria-label="menu" style={{width:'36px',height:'36px',borderRadius:'9px',border:`1px solid ${T.line}`,background:T.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',cursor:'pointer'}}>
          {[0,1,2].map(i=><span key={i} style={{width:'16px',height:'1.6px',background:T.sub,borderRadius:'2px',transition:'.22s',transform:menuOpen?(i===0?'translateY(5.6px) rotate(45deg)':i===2?'translateY(-5.6px) rotate(-45deg)':'none'):'none',opacity:menuOpen&&i===1?0:1}}/>)}
        </button>
      </div>

      {/* 菜单 */}
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,zIndex:55,background:'rgba(0,0,0,.4)'}}/>}
      <div style={{position:'fixed',top:'64px',right:'14px',zIndex:60,width:'236px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:'16px',boxShadow:'0 16px 50px rgba(0,0,0,.5)',overflow:'hidden',transformOrigin:'top right',transition:'.18s',opacity:menuOpen?1:0,transform:menuOpen?'none':'translateY(-8px) scale(.98)',pointerEvents:menuOpen?'auto':'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'13px 14px',background:T.surface2,borderBottom:`1px solid ${T.line}`}}>
          <span style={{width:'34px',height:'34px',borderRadius:'50%',background:`linear-gradient(135deg,#2F81F7,#9D5CFF)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{(userName||userEmail||'?').charAt(0).toUpperCase()}</span>
          <div><div style={{fontSize:'13px',fontWeight:700}}>{userName||'—'}</div><div style={{fontSize:'11px',color:T.dim}}>{userEmail}</div></div>
        </div>
        {navItems.map(it=>(
          <Link key={it.href} href={it.href} onClick={()=>setMenuOpen(false)} style={{display:'flex',alignItems:'center',gap:'11px',padding:'11px 15px',fontSize:'14px',fontWeight:500,color:it.href==='/'?T.primary:T.text,background:it.href==='/'?T.primarySoft:'transparent',textDecoration:'none'}}>
            <span>{it.icon}</span><span>{it.label}</span>
          </Link>
        ))}
        <div style={{height:'1px',background:T.lineSoft,margin:'4px 0'}}/>
        <Link href="/auth/signout" onClick={()=>setMenuOpen(false)} style={{display:'flex',alignItems:'center',gap:'11px',padding:'11px 15px',fontSize:'14px',fontWeight:500,color:T.danger,textDecoration:'none'}}>🚪 {zh?'退出':'Sign out'}</Link>
      </div>

      {/* 大标题 */}
      <div style={{padding:'8px 20px 4px'}}>
        <div suppressHydrationWarning style={{fontSize:'34px',fontWeight:800,letterSpacing:'-.6px'}}>{greeting}</div>
        <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
          <span suppressHydrationWarning style={{fontSize:'14px',color:T.sub,fontWeight:600}}>{dateStr}</span>
          {weather&&<span style={{display:'inline-flex',alignItems:'center',gap:'6px',background:T.surface,border:`1px solid ${T.line}`,padding:'4px 10px',borderRadius:'999px',fontSize:'12px',color:T.sub}}>📍 {weather.city} · {wx(weather.c)} <span style={{fontFamily:MONO,fontWeight:700,color:T.text}}>{weather.t}°</span></span>}
        </div>
      </div>

      {/* 今日需要关注 */}
      {focus.length>0&&(
        <div style={{marginTop:'24px'}}>
          <div style={{padding:'0 20px 12px',fontSize:'21px',fontWeight:800}}>{zh?'今日需要关注':'Needs attention'} <span style={{color:T.dim,fontSize:'17px'}}>›</span></div>
          <div style={{display:'flex',gap:'13px',overflowX:'auto',padding:'0 20px 4px',scrollSnapType:'x mandatory'}} className="no-sb">
            {focus.map((f,i)=>(
              <div key={i} style={{...card,scrollSnapAlign:'start',flex:'0 0 74%',minWidth:'74%',padding:'13px 14px 13px 17px',position:'relative',overflow:'hidden',borderRadius:'16px'}}>
                <span style={{position:'absolute',left:0,top:0,bottom:0,width:'4px',background:kindColor(f.kind)}}/>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',marginBottom:'7px'}}>
                  <span style={{fontSize:'10.5px',fontWeight:700,padding:'3px 8px',borderRadius:'999px',background:kindSoft(f.kind),color:kindColor(f.kind)}}>{f.tag}</span>
                  <span style={{fontFamily:f.kind==='info'?SANS:MONO,fontSize:'14px',fontWeight:800,color:kindColor(f.kind),whiteSpace:'nowrap'}}>{f.accent}</span>
                </div>
                <div style={{fontSize:'14.5px',fontWeight:700,marginBottom:'2px'}}>{f.title}</div>
                <div style={{fontSize:'12px',color:T.sub}}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 进行中工单 */}
      <div style={{marginTop:'24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px 12px'}}>
          <div style={{fontSize:'21px',fontWeight:800}}>{zh?'进行中工单':'Active jobs'} <span style={{fontFamily:MONO,fontSize:'11px',fontWeight:700,color:T.dim,background:T.surface,border:`1px solid ${T.line}`,borderRadius:'6px',padding:'1px 7px'}}>{activeJobs.length}</span></div>
          <Link href="/jobs" style={{fontSize:'13px',fontWeight:600,color:T.primary,textDecoration:'none'}}>{zh?'全部 ›':'All ›'}</Link>
        </div>
        <div style={{padding:'0 20px',display:'flex',flexDirection:'column',gap:'12px'}}>
          {activeJobs.length===0&&<div style={{...card,padding:'20px',textAlign:'center',color:T.dim,fontSize:'13px'}}>{zh?'暂无进行中工单':'No active jobs'}</div>}
          {activeJobs.map(job=>{
            const d = daysLeft(job.end_date||job.earliest_due_date)
            const urgent = d!==null && d<=5
            const unpaid = Number(job.unpaid_amount||0)
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} style={{...card,padding:'16px 16px 16px 19px',position:'relative',overflow:'hidden',textDecoration:'none',color:T.text,display:'block'}}>
                <span style={{position:'absolute',left:0,top:0,bottom:0,width:'4px',background:urgent?T.danger:(d!==null&&d<=14?T.warning:T.success)}}/>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'10px'}}>
                  <div>
                    <div style={{fontSize:'16px',fontWeight:700}}>{job.name.replace(/\s*的工单\s*$/,'')}</div>
                    {job.site_address&&<div style={{fontSize:'12.5px',color:T.sub,marginTop:'4px'}}>📍 {job.site_address}</div>}
                  </div>
                  {Number(job.revenue)>0&&<div style={{fontFamily:MONO,fontSize:'17px',fontWeight:800,color:T.success,whiteSpace:'nowrap'}}>+{money(job.revenue)}</div>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'13px',flexWrap:'wrap'}}>
                  {d!==null&&<span style={{fontFamily:MONO,fontSize:'11.5px',fontWeight:600,padding:'4px 9px',borderRadius:'8px',background:urgent?T.dangerSoft:T.surface2,color:urgent?T.danger:T.sub,border:`1px solid ${urgent?'transparent':T.line}`}}>{urgent?'▲ ':''}{zh?'还剩':''} {d} {zh?'天':'d'}</span>}
                  {unpaid>0
                    ? <span style={{fontSize:'11.5px',fontWeight:600,padding:'4px 9px',borderRadius:'8px',background:T.warningSoft,color:T.warning}}>💰 {zh?'未收':'Unpaid'} {money(unpaid)}</span>
                    : Number(job.revenue)>0 && <span style={{fontSize:'11.5px',fontWeight:600,padding:'4px 9px',borderRadius:'8px',background:T.successSoft,color:T.success}}>✅ {zh?'已收清':'Paid'}</span>}
                </div>
              </Link>
            )
          })}
          <Link href="/jobs/new" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',width:'100%',padding:'13px',borderRadius:'16px',background:T.primarySoft,color:T.primary,border:`1px dashed ${T.primary}66`,fontSize:'14px',fontWeight:700,textDecoration:'none'}}>＋ {zh?'新工单':'New job'}</Link>
        </div>
      </div>

      {/* 报价单 */}
      <div style={{marginTop:'24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px 12px'}}>
          <div style={{fontSize:'21px',fontWeight:800}}>{zh?'报价单':'Quotes'} <span style={{fontFamily:MONO,fontSize:'11px',fontWeight:700,color:T.dim,background:T.surface,border:`1px solid ${T.line}`,borderRadius:'6px',padding:'1px 7px'}}>{quotes.length}</span></div>
          <Link href="/quotes" style={{fontSize:'13px',fontWeight:600,color:T.primary,textDecoration:'none'}}>{zh?'进入模块 ›':'View all ›'}</Link>
        </div>
        <div style={{margin:'0 20px',...card,overflow:'hidden'}}>
          {quotes.length===0&&<div style={{padding:'18px',textAlign:'center',color:T.dim,fontSize:'13px'}}>{zh?'还没有报价单':'No quotes yet'}</div>}
          {quotes.slice(0,5).map((q,i)=>(
            <Link key={q.id} href={'/quotes/'+q.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderTop:i>0?`1px solid ${T.lineSoft}`:'none',textDecoration:'none',color:T.text}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <span style={{fontFamily:MONO,fontSize:'12px',color:T.dim,width:'46px'}}>{q.quote_number||`Q-${i+1}`}</span>
                <div>
                  <div style={{fontSize:'15px',fontWeight:600}}>{q.client_name||'—'}</div>
                  <div style={{fontSize:'11.5px',color:T.dim}}>{new Date(q.created_at).toLocaleDateString(zh?'zh-CN':'en-AU')}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                {q.total&&<span style={{fontFamily:MONO,fontSize:'15px',fontWeight:700,color:T.success}}>{money(q.total)}</span>}
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 9px',borderRadius:'7px',background:q.status==='accepted'?T.successSoft:q.status==='sent'?T.warningSoft:T.surface2,color:q.status==='accepted'?T.success:q.status==='sent'?T.warning:T.sub}}>{q.status==='accepted'?(zh?'已接受':'Accepted'):q.status==='sent'?(zh?'已发送':'Sent'):q.status==='rejected'?(zh?'已拒绝':'Rejected'):(zh?'草稿':'Draft')}</span>
              </div>
            </Link>
          ))}
          <div style={{padding:'12px 16px',borderTop:`1px solid ${T.lineSoft}`}}>
            <Link href="/quotes/new" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',width:'100%',padding:'12px',borderRadius:'14px',background:T.primarySoft,color:T.primary,border:`1px dashed ${T.primary}66`,fontSize:'14px',fontWeight:700,textDecoration:'none'}}>＋ {zh?'新报价单':'New quote'}</Link>
          </div>
        </div>
      </div>

      {/* 悬浮：记一笔 */}
      <div style={{marginTop:'24px'}}>
        <div style={{padding:'0 20px 12px',fontSize:'21px',fontWeight:800}}>资讯 <span style={{color:T.dim,fontSize:'17px'}}>›</span></div>
        <div style={{padding:'0 20px',display:'flex',flexDirection:'column',gap:'12px'}}>
          {NEWS.map((n,k)=>(
            <div key={k} style={{...card,padding:'14px 16px 14px 19px',position:'relative',overflow:'hidden'}}>
              <span style={{position:'absolute',left:0,top:0,bottom:0,width:'4px',background:n.col}}/>
              <div style={{display:'flex',gap:'10px'}}>
                <span style={{fontSize:'18px'}}>{n.i}</span>
                <div><div style={{fontSize:'14px',fontWeight:700}}>{n.t}</div><div style={{fontSize:'12.5px',color:T.sub,marginTop:'3px'}}>{n.d}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>setSheetOpen(true)} style={{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'22px',width:'min(404px,calc(100% - 24px))',zIndex:40,background:T.dock,backdropFilter:'blur(22px) saturate(180%)',WebkitBackdropFilter:'blur(22px) saturate(180%)',border:`1px solid ${T.line}`,borderRadius:'18px',padding:'11px 14px',display:'flex',alignItems:'center',gap:'13px',boxShadow:'0 12px 40px rgba(0,0,0,.45)',color:T.text,fontFamily:SANS,textAlign:'left',cursor:'pointer'}}>
        <span style={{width:'38px',height:'38px',borderRadius:'12px',background:T.primary,color:'#fff',fontSize:'22px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 14px ${T.primary}73`}}>＋</span>
        <div>
          <div style={{fontSize:'15px',fontWeight:700}}>{zh?'记一笔':'Log entry'}</div>
          <div style={{fontSize:'11.5px',color:T.dim,marginTop:'1px'}}>{zh?'材料 · 工时 · 油费 · 收款':'Material · Labor · Fuel · Payment'}</div>
        </div>
        <span style={{marginLeft:'auto',color:T.dim,fontSize:'24px',fontWeight:700}}>›</span>
      </button>

      {/* 记一笔 面板 */}
      {sheetOpen&&<div onClick={()=>setSheetOpen(false)} style={{position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,.5)'}}/>}
      <div style={{position:'fixed',left:'50%',bottom:0,zIndex:75,width:'100%',maxWidth:'440px',background:T.bg==='#000000'?'#0B0D10':T.surface,borderTopLeftRadius:'22px',borderTopRightRadius:'22px',borderTop:`1px solid ${T.line}`,padding:'10px 20px 26px',transition:'transform .3s cubic-bezier(.32,.72,0,1)',transform:sheetOpen?'translate(-50%,0)':'translate(-50%,100%)'}}>
        <div style={{width:'40px',height:'5px',borderRadius:'3px',background:T.line,margin:'0 auto 14px'}}/>
        <div style={{fontSize:'19px',fontWeight:800,marginBottom:'16px'}}>{zh?'记一笔':'Log entry'}</div>
        <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'18px'}} className="no-sb">
          {ENTRY_TYPES.map(t=>{
            const on = eType===t.key
            return <button key={t.key} onClick={()=>setEType(t.key)} style={{flex:'0 0 auto',width:'64px',display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',padding:'10px 0',borderRadius:'14px',background:on?T.primarySoft:T.surface,border:`1px solid ${on?T.primary:T.line}`,color:on?T.primary:T.sub,fontSize:'12.5px',fontWeight:600,cursor:'pointer'}}><span style={{fontSize:'20px'}}>{t.emoji}</span>{zh?t.zh:t.en}</button>
          })}
        </div>
        {eType==='material'&&mats.length>0&&<div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'12px',color:T.sub,marginBottom:'8px'}}>{zh?'从报价带入（点一下自动填）':'From quote (tap to fill)'}</div>
          <div style={{display:'flex',gap:'8px',overflowX:'auto'}} className="no-sb">
            {mats.map((m,i)=>{const on=ePicked===m.description;return <button key={i} onClick={()=>pickMat(m)} style={{flex:'0 0 auto',padding:'8px 12px',borderRadius:'12px',background:on?T.primarySoft:T.surface,border:`1px solid ${on?T.primary:T.line}`,color:on?T.primary:T.text,fontSize:'12.5px',fontWeight:600,whiteSpace:'nowrap',cursor:'pointer'}}>{m.description}{m.unit_price!=null?' · $'+m.unit_price:''}</button>})}
          </div>
        </div>}
        {eType==='material'&&<div style={{display:'flex',gap:'10px',marginBottom:'18px'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'6px'}}>{zh?'数量':'Qty'}</div>
            <input value={eQty} onChange={e=>setEQty(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" placeholder="0" style={{width:'100%',padding:'11px 13px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:'12px',fontSize:'15px',color:T.text,outline:'none',fontFamily:SANS}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'6px'}}>{zh?'单价':'Unit price'}</div>
            <input value={eUnitPrice} onChange={e=>setEUnitPrice(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" placeholder="0" style={{width:'100%',padding:'11px 13px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:'12px',fontSize:'15px',color:T.text,outline:'none',fontFamily:SANS}}/>
          </div>
        </div>}
        <div style={{textAlign:'center',marginBottom:'20px'}}>
          <span style={{fontSize:'22px',fontWeight:700,color:T.dim,verticalAlign:'super'}}>$</span>
          <input value={eAmount} onChange={e=>setEAmount(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" placeholder="0" style={{fontFamily:MONO,fontSize:'46px',fontWeight:800,letterSpacing:'-1px',background:'none',border:'none',outline:'none',width:'60%',textAlign:'center',color:ENTRY_TYPES.find(t=>t.key===eType)?.income?T.success:T.text}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:'14px',marginBottom:'10px'}}>
          <span style={{fontSize:'14px',color:T.sub}}>{zh?'归属工单':'Job'}</span>
          <select value={eJob} onChange={e=>setEJob(e.target.value)} style={{background:'none',border:'none',outline:'none',fontSize:'14px',fontWeight:600,color:T.text,textAlign:'right',maxWidth:'60%'}}>
            {activeJobs.map(j=><option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <input value={eNote} onChange={e=>setENote(e.target.value)} placeholder={zh?'备注（可选）':'Note (optional)'} style={{width:'100%',padding:'13px 16px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:'14px',marginBottom:'20px',fontSize:'14px',color:T.text,outline:'none',fontFamily:SANS}}/>
        <button onClick={saveEntry} disabled={saving} style={{width:'100%',padding:'15px',borderRadius:'15px',background:T.primary,color:'#fff',border:'none',fontSize:'16px',fontWeight:700,fontFamily:SANS,cursor:'pointer',opacity:saving?0.6:1}}>{saving?(zh?'保存中…':'Saving…'):(zh?'保存这一笔':'Save')}</button>
      </div>

      <style>{`.no-sb::-webkit-scrollbar{display:none}.no-sb{scrollbar-width:none}`}</style>
    </div>
  )
}
