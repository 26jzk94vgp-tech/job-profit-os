'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

const DARK = {
  bg:'#0D1117', surface:'#161B22', elevated:'#1C2128', overlay:'#21262D',
  border:'#30363D', borderSub:'#21262D',
  primary:'#2F81F7', primaryGlow:'rgba(47,129,247,0.15)',
  success:'#3FB950', successGlow:'rgba(63,185,80,0.12)',
  text:'#F0F6FC', textSub:'#CDD9E5', textDim:'#8B949E',
}
const LIGHT = {
  bg:'#F6F8FA', surface:'#FFFFFF', elevated:'#F0F2F5', overlay:'#EAEEF2',
  border:'#D0D7DE', borderSub:'#EAEEF2',
  primary:'#0969DA', primaryGlow:'rgba(9,105,218,0.1)',
  success:'#1A7F37', successGlow:'rgba(26,127,55,0.08)',
  text:'#1F2328', textSub:'#656D76', textDim:'#AFB8C1',
}
type Theme = typeof DARK

const INDUSTRIES=[
  {key:'tiling',en:'Tiling',zh:'瓷砖/铺贴'},{key:'waterproof',en:'Waterproofing',zh:'防水工程'},
  {key:'renovation',en:'Renovation',zh:'装修翻新'},{key:'plumbing',en:'Plumbing',zh:'水管工程'},
  {key:'electrical',en:'Electrical',zh:'电气工程'},{key:'painting',en:'Painting',zh:'油漆工程'},
  {key:'roofing',en:'Roofing',zh:'屋顶工程'},{key:'landscaping',en:'Landscaping',zh:'园艺绿化'},
  {key:'carpentry',en:'Carpentry',zh:'木工工程'},{key:'other',en:'Other',zh:'其他'},
]
const SIZES=[
  {key:'1',en:'Just me',zh:'只有我'},{key:'2-5',en:'2–5 people',zh:'2–5 人'},
  {key:'6-10',en:'6–10 people',zh:'6–10 人'},{key:'11-20',en:'11–20 people',zh:'11–20 人'},
  {key:'20+',en:'20+ people',zh:'20 人以上'},
]

type Screen = 'welcome' | 'onboarding'

export default function OnboardingPage() {
  const supabase = createClient()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<'en'|'zh'>('en')
  const T = isDark ? DARK : LIGHT

  // Onboarding state
  const [step, setStep] = useState(1)
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [company, setCompany] = useState('')
  const [abn, setAbn] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(false)
  const TOTAL = 4
  const t = (en:string,zh:string) => lang==='en'?en:zh

  useEffect(()=>{
    async function check(){
      const {data:{user}} = await supabase.auth.getUser()
      if(!user){window.location.href='/login';return}
      const {data} = await supabase.from('profiles').select('company_name').eq('id',user.id).single()
      if(data?.company_name){window.location.href='/'}
    }
    check()
  },[])

  function canNext(){
    if(step===1)return!!industry
    if(step===2)return!!size
    if(step===3)return company.trim().length>0
    return true
  }

  async function handleDone(){
    setLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    if(!user){setLoading(false);return}
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate()+7)
    await supabase.from('profiles').upsert({
      id: user.id,
      company_name: company.trim()||'My Company',
      abn: abn||null,
      account_name: accountName||null,
      bsb: bsb||null,
      account_number: accountNo||null,
      trade: industry||null,
      team_size: size||null,
      trial_ends_at: trialEndsAt.toISOString(),
      plan_type: 'trial',
      updated_at: new Date().toISOString()
    })
    window.location.href='/'
    setLoading(false)
  }

  function GridBtn({item}:{item:{key:string,en:string,zh:string}}){
    const selected=industry===item.key
    return(
      <button onClick={()=>setIndustry(item.key)} style={{padding:'14px 10px',borderRadius:'8px',cursor:'pointer',border:`2px solid ${selected?T.primary:T.border}`,backgroundColor:selected?(isDark?'rgba(47,129,247,0.1)':'#EBF5FF'):T.surface,textAlign:'center' as const,transition:'all 0.15s'}}>
        <p style={{fontSize:'14px',fontWeight:selected?600:400,color:selected?T.primary:T.text,margin:0}}>{lang==='en'?item.en:item.zh}</p>
      </button>
    )
  }

  return(
    <div style={{minHeight:'100vh',backgroundColor:T.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif',color:T.text,transition:'background 0.2s'}}>

      {/* Top bar */}
      <div style={{padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${T.border}`,backgroundColor:T.surface,position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'28px',height:'28px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'13px'}}>C</div>
          <span style={{fontWeight:700,fontSize:'15px',color:T.text}}>CIMO</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px',borderRadius:'8px',backgroundColor:T.elevated,border:`1px solid ${T.border}`}}>
            {(['en','zh'] as const).map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{padding:'5px 14px',borderRadius:'5px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,transition:'all 0.15s',backgroundColor:lang===l?T.surface:'transparent',color:lang===l?T.text:T.textSub,boxShadow:lang===l?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
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

      {/* Welcome Screen */}
      {screen==='welcome'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center' as const,minHeight:'70vh'}}>
          <div style={{width:'72px',height:'72px',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px',boxShadow:`0 8px 32px ${T.primaryGlow}`}}>
            <span style={{fontSize:'36px'}}>🔨</span>
          </div>
          <h1 style={{fontSize:'32px',fontWeight:700,color:T.text,margin:'0 0 12px',letterSpacing:'-0.5px'}}>{lang==='en'?'Welcome to CIMO':'欢迎使用 CIMO'}</h1>
          <p style={{fontSize:'17px',color:T.textSub,margin:'0 0 8px',lineHeight:1.6,maxWidth:'360px'}}>{lang==='en'?'Job profit tracking for tradespeople in Australia.':'澳洲工程人的工单利润追踪工具。'}</p>
          <p style={{fontSize:'14px',color:T.textDim,margin:'0 0 40px'}}>{lang==='en'?"Let's set up your account in 2 minutes.":'2 分钟完成账号设置。'}</p>
          <button onClick={()=>setScreen('onboarding')} style={{padding:'14px 40px',borderRadius:'10px',border:'none',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,color:'white',fontSize:'16px',fontWeight:600,cursor:'pointer',boxShadow:`0 4px 16px ${T.primaryGlow}`,marginBottom:'16px'}}>
            {lang==='en'?'Get Started →':'开始设置 →'}
          </button>
          <p style={{fontSize:'13px',color:T.textDim}}>{lang==='en'?'Already have an account? ':'已有账号？'}<a href="/login" style={{color:T.primary,fontWeight:500,textDecoration:'none'}}>{lang==='en'?'Sign in':'登录'}</a></p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginTop:'48px',maxWidth:'440px',width:'100%'}}>
            {[{icon:'📋',en:'Quote-first workflow',zh:'报价单优先流程'},{icon:'💰',en:'Track receivables',zh:'追踪应收账款'},{icon:'📊',en:'ATO tax ready',zh:'ATO 税务合规'}].map(f=>(
              <div key={f.en} style={{backgroundColor:T.elevated,borderRadius:'10px',padding:'14px 10px',border:`1px solid ${T.border}`}}>
                <p style={{fontSize:'22px',margin:'0 0 6px'}}>{f.icon}</p>
                <p style={{fontSize:'11px',color:T.textSub,margin:0,lineHeight:1.4}}>{lang==='en'?f.en:f.zh}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding Steps */}
      {screen==='onboarding'&&(
        <div style={{flex:1,maxWidth:'480px',margin:'0 auto',padding:'32px 24px 60px',width:'100%'}}>
          <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
            {Array.from({length:TOTAL}).map((_,i)=>(<div key={i} style={{flex:1,height:'3px',borderRadius:'2px',backgroundColor:i<step?T.primary:T.border,transition:'background 0.3s'}}/>))}
          </div>

          {step===1&&(<div>
            <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 1 of 4','第 1 步，共 4 步')}</p>
            <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t("What's your main trade?",'你的主要工种？')}</h1>
            <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t("We'll tailor CIMO to fit your workflow.",'我们会根据你的工种定制 CIMO。')}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'28px'}}>{INDUSTRIES.map(ind=><GridBtn key={ind.key} item={ind}/>)}</div>
          </div>)}

          {step===2&&(<div>
            <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 2 of 4','第 2 步，共 4 步')}</p>
            <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t('How big is your team?','团队有多少人？')}</h1>
            <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t('Helps us set up the right features.','帮助我们开启合适的功能。')}</p>
            <div style={{display:'flex',flexDirection:'column' as const,gap:'10px',marginBottom:'28px'}}>
              {SIZES.map(s=>{const sel=size===s.key;return(
                <button key={s.key} onClick={()=>setSize(s.key)} style={{padding:'14px 18px',borderRadius:'8px',cursor:'pointer',border:`2px solid ${sel?T.primary:T.border}`,backgroundColor:sel?(isDark?'rgba(47,129,247,0.1)':'#EBF5FF'):T.surface,textAlign:'left' as const,display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.15s'}}>
                  <span style={{fontSize:'15px',fontWeight:sel?600:400,color:sel?T.primary:T.text}}>{lang==='en'?s.en:s.zh}</span>
                  {sel&&<span style={{color:T.primary,fontSize:'18px'}}>✓</span>}
                </button>
              )})}
            </div>
          </div>)}

          {step===3&&(<div>
            <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.8px',margin:'0 0 10px'}}>{t('Step 3 of 4','第 3 步，共 4 步')}</p>
            <h1 style={{fontSize:'26px',fontWeight:700,color:T.text,margin:'0 0 8px',letterSpacing:'-0.3px'}}>{t('Set up your company','设置公司信息')}</h1>
            <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 24px'}}>{t('Appears on your invoices and quotes.','显示在你的发票和报价单上。')}</p>
            {[{label:t('Company Name','公司名称'),val:company,set:setCompany,ph:t('e.g. Shu Tiling Pty Ltd','例如：Shu Tiling Pty Ltd')},{label:'ABN',val:abn,set:setAbn,ph:'e.g. 12 345 678 901'}].map(f=>(
              <div key={f.label} style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:600,color:T.text,marginBottom:'6px'}}>{f.label}</label>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:'100%',padding:'11px 14px',borderRadius:'8px',fontSize:'14px',border:`1.5px solid ${T.border}`,backgroundColor:T.surface,color:T.text,outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            ))}
            <div style={{marginTop:'16px',padding:'14px 16px',backgroundColor:T.elevated,borderRadius:'8px',border:`1px solid ${T.border}`}}>
              <p style={{fontSize:'13px',fontWeight:600,color:T.text,margin:'0 0 12px'}}>🏦 {t('Banking Details','银行信息')}</p>
              {[{label:t('Account Name','账户名'),val:accountName,set:setAccountName,ph:t('e.g. Shu Tiling','例如：Shu Tiling')},{label:'BSB',val:bsb,set:setBsb,ph:'e.g. 062-000'},{label:t('Account Number','账号'),val:accountNo,set:setAccountNo,ph:'e.g. 1234 5678'}].map(f=>(
                <div key={f.label} style={{marginBottom:'10px'}}>
                  <label style={{display:'block',fontSize:'12px',fontWeight:600,color:T.textSub,marginBottom:'5px'}}>{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:'100%',padding:'9px 12px',borderRadius:'7px',fontSize:'13px',border:`1px solid ${T.border}`,backgroundColor:T.surface,color:T.text,outline:'none',boxSizing:'border-box' as const}}/>
                </div>
              ))}
            </div>
          </div>)}

          {step===4&&(<div style={{textAlign:'center' as const,paddingTop:'20px'}}>
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#1A7F37,#3FB950)',margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',boxShadow:'0 4px 20px rgba(63,185,80,0.3)'}}>🎉</div>
            <h1 style={{fontSize:'28px',fontWeight:700,color:T.text,margin:'0 0 10px'}}>{t("You're all set!",'设置完成！')}</h1>
            <p style={{fontSize:'15px',color:T.textSub,margin:'0 0 6px'}}>{t('CIMO is ready for your business.','CIMO 已为你的业务准备好了。')}</p>
            <p style={{fontSize:'13px',color:T.textDim,margin:'0 0 32px'}}>{t('Start by creating your first quote.','从创建第一个报价单开始吧。')}</p>
            <div style={{backgroundColor:T.elevated,borderRadius:'10px',border:`1px solid ${T.border}`,padding:'18px',textAlign:'left' as const,marginBottom:'28px'}}>
              <p style={{fontSize:'11px',fontWeight:600,color:T.textDim,textTransform:'uppercase' as const,letterSpacing:'0.6px',margin:'0 0 12px'}}>{t('Your Setup','设置摘要')}</p>
              {[{label:t('Trade','工种'),value:INDUSTRIES.find(i=>i.key===industry)?.[lang==='en'?'en':'zh']||'—'},{label:t('Team','团队'),value:SIZES.find(s=>s.key===size)?.[lang==='en'?'en':'zh']||'—'},{label:t('Company','公司'),value:company||'—'},{label:'ABN',value:abn||t('Not set','未设置')}].map(row=>(
                <div key={row.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'13px',color:T.textSub}}>{row.label}</span>
                  <span style={{fontSize:'13px',fontWeight:500,color:T.text}}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={handleDone} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:'8px',border:'none',background:`linear-gradient(135deg,${T.primary},#58A6FF)`,color:'white',fontSize:'15px',fontWeight:600,cursor:'pointer',marginBottom:'10px',opacity:loading?0.7:1}}>
              {loading?(t('Setting up...','设置中...')):t('Go to Dashboard →','进入仪表盘 →')}
            </button>
          </div>)}

          {step<4&&(<>
            <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
              {step>1&&<button onClick={()=>setStep(step-1)} style={{flex:1,padding:'13px',borderRadius:'8px',border:`1px solid ${T.border}`,backgroundColor:'transparent',color:T.textSub,fontSize:'14px',fontWeight:500,cursor:'pointer'}}>← {t('Back','返回')}</button>}
              <button onClick={()=>{if(canNext())setStep(step+1)}} disabled={!canNext()} style={{flex:step>1?2:1,padding:'13px',borderRadius:'8px',border:'none',background:canNext()?`linear-gradient(135deg,${T.primary},#58A6FF)`:T.border,color:canNext()?'white':T.textDim,fontSize:'14px',fontWeight:600,cursor:canNext()?'pointer':'not-allowed'}}>
                {step===3?t('Finish →','完成 →'):t('Continue →','继续 →')}
              </button>
            </div>
            <p style={{textAlign:'center' as const,marginTop:'14px'}}>
              <button onClick={handleDone} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:T.textDim,textDecoration:'underline'}}>{t('Skip for now','暂时跳过')}</button>
            </p>
          </>)}
        </div>
      )}
    </div>
  )
}
