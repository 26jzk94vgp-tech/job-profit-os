'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { createClient } from '../../utils/supabase/client'
const TYPES=[{key:'material',zh:'材料',en:'Material',emoji:'🧱',income:false},{key:'labor',zh:'人工',en:'Labor',emoji:'👷',income:false},{key:'fuel',zh:'油费',en:'Fuel',emoji:'⛽',income:false},{key:'subcontract',zh:'分包',en:'Subcontract',emoji:'🔧',income:false},{key:'invoice',zh:'收款',en:'Payment',emoji:'💵',income:true}]
export default function QuickEntry(){
  const {lang}=useLanguage(); const zh=lang==='zh'; const supabase=createClient()
  const [open,setOpen]=useState(false)
  const [jobs,setJobs]=useState<any[]>([])
  const [userId,setUserId]=useState('')
  const [type,setType]=useState('material')
  const [amount,setAmount]=useState('')
  const [job,setJob]=useState('')
  const [note,setNote]=useState('')
  const [saving,setSaving]=useState(false)
  useEffect(()=>{ if(!open)return; (async()=>{
    const {data:{user}}=await supabase.auth.getUser(); setUserId(user?.id||'')
    const {data}=await supabase.from('jobs').select('id, name').eq('owner_id',user?.id).order('created_at',{ascending:false})
    setJobs(data||[]); if(data&&data.length)setJob(p=>p||data[0].id)
  })() },[open])
  const save=async()=>{
    if(!amount||Number(amount)<=0||!job){alert(zh?'请填写金额并选择工单':'Enter amount and pick a job');return}
    if(!userId){window.location.href='/login';return}
    setSaving(true)
    try{
      const {error}=await supabase.from('job_entries').insert({job_id:job,owner_id:userId,type,amount:Number(amount),note:note||null})
      if(error)throw error
      setOpen(false); setAmount(''); setNote(''); window.location.reload()
    }catch(e:any){ alert((zh?'保存失败：':'Save failed: ')+(e?.message||'')) }
    finally{ setSaving(false) }
  }
  const inc=TYPES.find(t=>t.key===type)?.income
  return (<>
    <button onClick={()=>setOpen(true)} className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-sm text-sm font-semibold transition-colors"><span className="text-lg leading-none">+</span>{zh?'记一笔':'Log entry'}</button>
    {open&&(<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)}/>
      <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#3A3A3C] shadow-xl p-6">
        <div className="text-lg font-bold text-gray-900 dark:text-white mb-4">{zh?'记一笔':'Log entry'}</div>
        <div className="flex gap-2 overflow-x-auto mb-5 pb-1">{TYPES.map(t=>{const on=type===t.key;return(
          <button key={t.key} onClick={()=>setType(t.key)} className={'flex-none w-16 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-colors '+(on?'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400':'border-gray-200 dark:border-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]')}><span className="text-xl">{t.emoji}</span>{zh?t.zh:t.en}</button>
        )})}</div>
        <div className="text-center mb-5"><span className="text-2xl font-bold text-gray-400 align-super">$</span>
          <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" placeholder="0" className={'font-mono text-5xl font-extrabold bg-transparent outline-none w-3/5 text-center '+(inc?'text-green-600':'text-gray-900 dark:text-white')}/>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl mb-2.5">
          <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{zh?'归属工单':'Job'}</span>
          <select value={job} onChange={e=>setJob(e.target.value)} className="bg-transparent outline-none text-sm font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">{jobs.length===0&&<option value="">{zh?'暂无工单':'No jobs'}</option>}{jobs.map(j=><option key={j.id} value={j.id}>{j.name}</option>)}</select>
        </div>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder={zh?'备注（可选）':'Note (optional)'} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl mb-5 text-sm text-gray-900 dark:text-white outline-none"/>
        <div className="flex gap-2">
          <button onClick={()=>setOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#3A3A3C] text-sm font-semibold text-gray-600 dark:text-[#8E8E93]">{zh?'取消':'Cancel'}</button>
          <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-60 transition-colors">{saving?(zh?'保存中…':'Saving…'):(zh?'保存这一笔':'Save')}</button>
        </div>
      </div>
    </div>)}
  </>)
}
