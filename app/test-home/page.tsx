'use client'
import { useState } from 'react'

const LIGHT = {
  bg: '#FFFFFF', bgSub: '#F6F8FA',
  border: '#D0D7DE', borderFocus: '#0969DA',
  text: '#1F2328', textSub: '#656D76', textDim: '#AFB8C1',
  primary: '#0969DA', primaryHover: '#0860CA',
  success: '#1A7F37', danger: '#CF222E',
  surface: '#FFFFFF', overlay: '#F6F8FA',
}
const DARK = {
  bg: '#0D1117', bgSub: '#161B22',
  border: '#30363D', borderFocus: '#2F81F7',
  text: '#F0F6FC', textSub: '#CDD9E5', textDim: '#8B949E',
  primary: '#2F81F7', primaryHover: '#388BFD',
  success: '#3FB950', danger: '#F85149',
  surface: '#161B22', overlay: '#1C2128',
}
type Theme = typeof LIGHT

// ─── Industries ───────────────────────────────────────────────────
const INDUSTRIES = [
  { key:'tiling',      en:'Tiling',           zh:'瓷砖/铺贴' },
  { key:'waterproof',  en:'Waterproofing',     zh:'防水工程'   },
  { key:'renovation',  en:'Renovation',        zh:'装修翻新'   },
  { key:'plumbing',    en:'Plumbing',          zh:'水管工程'   },
  { key:'electrical',  en:'Electrical',        zh:'电气工程'   },
  { key:'painting',    en:'Painting',          zh:'油漆工程'   },
  { key:'roofing',     en:'Roofing',           zh:'屋顶工程'   },
  { key:'landscaping', en:'Landscaping',       zh:'园艺绿化'   },
  { key:'carpentry',   en:'Carpentry',         zh:'木工工程'   },
  { key:'other',       en:'Other',             zh:'其他'       },
]

const SIZES = [
  { key:'1',     en:'Just me',    zh:'只有我'     },
  { key:'2-5',   en:'2–5 people', zh:'2–5 人'     },
  { key:'6-10',  en:'6–10 people',zh:'6–10 人'    },
  { key:'11-20', en:'11–20 people',zh:'11–20 人'  },
  { key:'20+',   en:'20+ people', zh:'20 人以上'  },
]

// ─── Step Indicator ───────────────────────────────────────────────
function StepBar({ step, total, T }: { step: number, total: number, T: Theme }) {
  return (
    <div style={{display:'flex', gap:'6px', marginBottom:'32px'}}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{flex:1, height:'3px', borderRadius:'2px',
          backgroundColor: i < step ? T.primary : T.border,
          transition:'background-color 0.3s'}}/>
      ))}
    </div>
  )
}

// ─── Option Button ────────────────────────────────────────────────
function OptionBtn({ label, selected, onClick, T }: {
  label:string, selected:boolean, onClick:()=>void, T:Theme
}) {
  return (
    <button onClick={onClick}
      style={{width:'100%', padding:'14px 18px', borderRadius:'8px', cursor:'pointer',
        border:`2px solid ${selected ? T.primary : T.border}`,
        backgroundColor: selected ? (T===LIGHT?'#EBF5FF':'rgba(47,129,247,0.1)') : T.surface,
        textAlign:'left' as const, transition:'all 0.15s',
        display:'flex', alignItems:'center', justifyContent:'space-between'}}>
      <p style={{fontSize:'15px', fontWeight: selected?600:400, color: selected?T.primary:T.text, margin:0}}>{label}</p>
      {selected && <span style={{color:T.primary, fontSize:'18px'}}>✓</span>}
    </button>
  )
}

// ─── Grid Option ──────────────────────────────────────────────────
function GridBtn({ en, zh, selected, onClick, T, lang }: {
  en:string, zh:string, selected:boolean, onClick:()=>void, T:Theme, lang:'en'|'zh'
}) {
  const label = lang === 'en' ? en : zh
  return (
    <button onClick={onClick}
      style={{padding:'16px 12px', borderRadius:'8px', cursor:'pointer',
        border:`2px solid ${selected ? T.primary : T.border}`,
        backgroundColor: selected ? (T===LIGHT?'#EBF5FF':'rgba(47,129,247,0.1)') : T.surface,
        textAlign:'center' as const, transition:'all 0.15s'}}>
      <p style={{fontSize:'14px', fontWeight: selected?600:400, color: selected?T.primary:T.text, margin:0}}>{label}</p>
    </button>
  )
}

// ─── Input Field ──────────────────────────────────────────────────
function Field({ label, sublabel, placeholder, value, onChange, T, type='text' }: {
  label:string, sublabel?:string, placeholder:string, value:string,
  onChange:(v:string)=>void, T:Theme, type?:string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{marginBottom:'16px'}}>
      <label style={{display:'block', fontSize:'13px', fontWeight:600, color:T.text, marginBottom:'6px'}}>
        {label}
        {sublabel && <span style={{fontSize:'11px', fontWeight:400, color:T.textSub, marginLeft:'6px'}}>{sublabel}</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{width:'100%', padding:'11px 14px', borderRadius:'8px', fontSize:'14px',
          border:`1.5px solid ${focused ? T.borderFocus : T.border}`,
          backgroundColor: T.surface, color: T.text, outline:'none',
          boxShadow: focused ? `0 0 0 3px ${T===LIGHT?'rgba(9,105,218,0.1)':'rgba(47,129,247,0.15)'}` : 'none',
          transition:'all 0.15s', boxSizing:'border-box' as const}}/>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
export default function Onboarding() {
  const [isDark, setIsDark] = useState(false)
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState<'en'|'zh'>('en')
  const T = isDark ? DARK : LIGHT

  // Form state
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [abn, setAbn] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')
  const [phone, setPhone] = useState('')

  const TOTAL_STEPS = 4

  const t = (en: string, zh: string) => lang === 'en' ? en : zh

  function canNext() {
    if (step === 1) return !!industry
    if (step === 2) return !!size
    if (step === 3) return companyName.trim().length > 0
    return true
  }

  return (
    <div style={{minHeight:'100vh', backgroundColor:T.bg,
      fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      color:T.text, transition:'background 0.2s'}}>

      {/* 顶部 */}
      <div style={{padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:`1px solid ${T.border}`, backgroundColor:T.surface, position:'sticky', top:0, zIndex:50}}>
        {/* Logo */}
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <div style={{width:'28px', height:'28px', background:'linear-gradient(135deg,#0969DA,#58A6FF)',
            borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:700, fontSize:'13px'}}>C</div>
          <span style={{fontWeight:700, fontSize:'15px', color:T.text}}>CIMO</span>
        </div>

        {/* 语言切换 — 居中显眼 */}
        <div style={{display:'flex', alignItems:'center', gap:'4px', padding:'4px',
          borderRadius:'8px', backgroundColor:T.bgSub, border:`1px solid ${T.border}`}}>
          {([{key:'en',label:'English'},{key:'zh',label:'中文'}] as const).map(l => (
            <button key={l.key} onClick={()=>setLang(l.key)}
              style={{padding:'5px 14px', borderRadius:'5px', border:'none', cursor:'pointer',
                fontSize:'13px', fontWeight:500, transition:'all 0.15s',
                backgroundColor: lang===l.key ? T.surface : 'transparent',
                color: lang===l.key ? T.text : T.textSub,
                boxShadow: lang===l.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}>
              {l.label}
            </button>
          ))}
        </div>

        {/* 暗色切换 */}
        <button onClick={()=>setIsDark(!isDark)}
          style={{padding:'6px 10px', borderRadius:'6px', border:`1px solid ${T.border}`,
            backgroundColor:T.overlay, cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', gap:'4px'}}>
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span style={{fontSize:'11px', color:T.textSub}}>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* 主内容 */}
      <div style={{maxWidth:'480px', margin:'0 auto', padding:'40px 24px 60px'}}>

        <StepBar step={step} total={TOTAL_STEPS} T={T}/>

        {/* ── Step 1: 行业 ── */}
        {step === 1 && (
          <div>
            <p style={{fontSize:'11px', fontWeight:600, color:T.textDim, textTransform:'uppercase',
              letterSpacing:'0.8px', margin:'0 0 10px'}}>
              {t('Step 1 of 4', '第 1 步，共 4 步')}
            </p>
            <h1 style={{fontSize:'26px', fontWeight:700, color:T.text, margin:'0 0 8px', letterSpacing:'-0.3px'}}>
              {t("What's your main trade?", '你的主要工种是什么？')}
            </h1>
            <p style={{fontSize:'15px', color:T.textSub, margin:'0 0 28px', lineHeight:1.5}}>
              {t("We'll tailor CIMO to fit your workflow.", '我们会根据你的工种定制 CIMO。')}
            </p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'32px'}}>
              {INDUSTRIES.map(ind => (
                <GridBtn key={ind.key} en={ind.en} zh={ind.zh}
                  selected={industry===ind.key}
                  onClick={()=>setIndustry(ind.key)} T={T} lang={lang}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: 规模 ── */}
        {step === 2 && (
          <div>
            <p style={{fontSize:'11px', fontWeight:600, color:T.textDim, textTransform:'uppercase',
              letterSpacing:'0.8px', margin:'0 0 10px'}}>
              {t('Step 2 of 4', '第 2 步，共 4 步')}
            </p>
            <h1 style={{fontSize:'26px', fontWeight:700, color:T.text, margin:'0 0 8px', letterSpacing:'-0.3px'}}>
              {t('How big is your team?', '你的团队有多少人？')}
            </h1>
            <p style={{fontSize:'15px', color:T.textSub, margin:'0 0 28px', lineHeight:1.5}}>
              {t("This helps us set up the right features for you.", '这有助于我们为你开启合适的功能。')}
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'32px'}}>
              {SIZES.map(s => (
                <OptionBtn key={s.key}
                  label={lang==='en' ? s.en : s.zh}
                  selected={size===s.key}
                  onClick={()=>setSize(s.key)} T={T}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: 公司信息 ── */}
        {step === 3 && (
          <div>
            <p style={{fontSize:'11px', fontWeight:600, color:T.textDim, textTransform:'uppercase',
              letterSpacing:'0.8px', margin:'0 0 10px'}}>
              {t('Step 3 of 4', '第 3 步，共 4 步')}
            </p>
            <h1 style={{fontSize:'26px', fontWeight:700, color:T.text, margin:'0 0 8px', letterSpacing:'-0.3px'}}>
              {t('Set up your company', '设置公司信息')}
            </h1>
            <p style={{fontSize:'15px', color:T.textSub, margin:'0 0 28px', lineHeight:1.5}}>
              {t('This info appears on your invoices and quotes.', '这些信息会显示在你的发票和报价单上。')}
            </p>
            <Field label={t('Company Name','公司名称')} placeholder={t('e.g. Shu Tiling Pty Ltd','例如：Shu Tiling Pty Ltd')}
              value={companyName} onChange={setCompanyName} T={T}/>
            <Field label={t('Phone','电话')} placeholder={t('e.g. 04xx xxx xxx','例如：04xx xxx xxx')}
              value={phone} onChange={setPhone} T={T} type="tel"/>
            <Field label="ABN" sublabel={t('(optional)','（可选）')}
              placeholder={t('e.g. 12 345 678 901','例如：12 345 678 901')}
              value={abn} onChange={setAbn} T={T}/>

            <div style={{marginTop:'8px', marginBottom:'16px', padding:'12px 16px',
              backgroundColor:T.bgSub, borderRadius:'8px', border:`1px solid ${T.border}`}}>
              <p style={{fontSize:'13px', fontWeight:600, color:T.text, margin:'0 0 12px'}}>
                🏦 {t('Banking Details','银行信息')}
                <span style={{fontSize:'11px', fontWeight:400, color:T.textSub, marginLeft:'6px'}}>
                  {t('for invoices','用于发票收款')}
                </span>
              </p>
              <Field label={t('Account Name','账户名')} placeholder={t('e.g. Shu Tiling','例如：Shu Tiling')}
                value={accountName} onChange={setAccountName} T={T}/>
              <Field label="BSB" placeholder="e.g. 062-000" value={bsb} onChange={setBsb} T={T}/>
              <Field label={t('Account Number','账号')} placeholder="e.g. 1234 5678"
                value={accountNo} onChange={setAccountNo} T={T}/>
            </div>
          </div>
        )}

        {/* ── Step 4: 完成 ── */}
        {step === 4 && (
          <div style={{textAlign:'center' as const, paddingTop:'20px'}}>
            <div style={{width:'72px', height:'72px', borderRadius:'50%',
              background:'linear-gradient(135deg,#1A7F37,#3FB950)',
              margin:'0 auto 24px', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'36px', boxShadow:'0 4px 20px rgba(63,185,80,0.3)'}}>🎉</div>
            <h1 style={{fontSize:'28px', fontWeight:700, color:T.text, margin:'0 0 12px', letterSpacing:'-0.3px'}}>
              {t("You're all set!", '设置完成！')}
            </h1>
            <p style={{fontSize:'16px', color:T.textSub, margin:'0 0 8px', lineHeight:1.6}}>
              {t('CIMO is ready for your business.', 'CIMO 已为你的业务准备好了。')}
            </p>
            <p style={{fontSize:'14px', color:T.textDim, margin:'0 0 36px'}}>
              {t('Start by creating your first quote.', '从创建第一个报价单开始吧。')}
            </p>

            {/* 摘要 */}
            <div style={{backgroundColor:T.bgSub, borderRadius:'12px', border:`1px solid ${T.border}`,
              padding:'20px', textAlign:'left' as const, marginBottom:'32px'}}>
              <p style={{fontSize:'12px', fontWeight:600, color:T.textDim, textTransform:'uppercase',
                letterSpacing:'0.6px', margin:'0 0 14px'}}>{t('Your Setup','你的设置')}</p>
              {[
                { label:t('Trade','工种'), value: INDUSTRIES.find(i=>i.key===industry)?.[lang==='en'?'en':'zh'] || '—' },
                { label:t('Team Size','团队规模'), value: SIZES.find(s=>s.key===size)?.[lang==='en'?'en':'zh'] || '—' },
                { label:t('Company','公司'), value: companyName || '—' },
                { label:'ABN', value: abn || t('Not set','未设置') },
              ].map(row => (
                <div key={row.label} style={{display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'13px', color:T.textSub}}>{row.label}</span>
                  <span style={{fontSize:'13px', fontWeight:500, color:T.text}}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={()=>alert(t('Redirecting to dashboard...','跳转到仪表盘...'))}
              style={{width:'100%', padding:'14px', borderRadius:'8px', border:'none',
                background:'linear-gradient(135deg,#0969DA,#2F81F7)',
                color:'white', fontSize:'15px', fontWeight:600, cursor:'pointer',
                boxShadow:'0 4px 12px rgba(9,105,218,0.3)'}}>
              {t('Go to Dashboard →', '进入仪表盘 →')}
            </button>
            <button onClick={()=>setStep(1)}
              style={{width:'100%', padding:'12px', marginTop:'10px', borderRadius:'8px',
                border:`1px solid ${T.border}`, backgroundColor:'transparent',
                color:T.textSub, fontSize:'13px', cursor:'pointer'}}>
              {t('← Edit setup', '← 重新设置')}
            </button>
          </div>
        )}

        {/* 导航按钮 */}
        {step < 4 && (
          <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
            {step > 1 && (
              <button onClick={()=>setStep(step-1)}
                style={{flex:1, padding:'13px', borderRadius:'8px',
                  border:`1px solid ${T.border}`, backgroundColor:'transparent',
                  color:T.textSub, fontSize:'14px', fontWeight:500, cursor:'pointer'}}>
                ← {t('Back','返回')}
              </button>
            )}
            <button onClick={()=>{ if(canNext()) setStep(step+1) }}
              disabled={!canNext()}
              style={{flex: step>1 ? 2 : 1, padding:'13px', borderRadius:'8px', border:'none',
                background: canNext() ? 'linear-gradient(135deg,#0969DA,#2F81F7)' : T.border,
                color: canNext() ? 'white' : T.textDim,
                fontSize:'14px', fontWeight:600, cursor: canNext() ? 'pointer' : 'not-allowed',
                transition:'all 0.2s'}}>
              {step === 3 ? t('Finish Setup →','完成设置 →') : t('Continue →','继续 →')}
            </button>
          </div>
        )}

        {/* 跳过 */}
        {step < 4 && (
          <p style={{textAlign:'center' as const, marginTop:'16px'}}>
            <button onClick={()=>setStep(4)}
              style={{background:'none', border:'none', cursor:'pointer',
                fontSize:'13px', color:T.textDim, textDecoration:'underline'}}>
              {t('Skip for now','暂时跳过')}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
