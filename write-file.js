const fs = require('fs')

// 1. 更新 JobStatusToggle
let toggle = fs.readFileSync('app/jobs/[id]/JobStatusToggle.tsx', 'utf8')
toggle = toggle.replace(
  `    { value: 'cancelled', label: lang === 'zh' ? '取消' : 'Cancelled', color: 'bg-red-100 text-red-600' },
    { value: 'archived', label: lang === 'zh' ? '归档' : 'Archived', color: 'bg-yellow-100 text-yellow-700' },`,
  `    { value: 'archived', label: lang === 'zh' ? '归档' : 'Archived', color: 'bg-yellow-100 text-yellow-700' },`
)
fs.writeFileSync('app/jobs/[id]/JobStatusToggle.tsx', toggle)
console.log('done toggle')

// 2. 更新归档中心 - 移除已取消部分
let archive = fs.readFileSync('app/archive/page.tsx', 'utf8')

// 只查询 archived
archive = archive.replace(
  ".in('status', ['archived', 'cancelled'])",
  ".eq('status', 'archived')"
)

// 移除 cancelled 变量
archive = archive.replace(
  `  const archived = jobs.filter((j: any) => j.status === 'archived')
  const cancelled = jobs.filter((j: any) => j.status === 'cancelled')`,
  `  const archived = jobs`
)

// 移除已取消区块
archive = archive.replace(
  `        {cancelled.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-red-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">❌ {lang === 'zh' ? \`已取消 (\${cancelled.length})\` : \`Cancelled (\${cancelled.length})\`}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {cancelled.map((job: any) => (
                <div key={job.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <Link href={'/jobs/' + job.id} className="font-medium text-gray-500 hover:text-blue-600 line-through">{job.name}</Link>
                    <p className="text-gray-400 text-xs mt-0.5">{job.client_name}</p>
                    <p className="text-gray-400 text-xs">{lang === 'zh' ? '收入' : 'Revenue'}: \${Number(job.revenue).toLocaleString()}</p>
                  </div>
                  <button onClick={() => restoreJob(job.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium">{lang === 'zh' ? '恢复' : 'Restore'}</button>
                </div>
              ))}
            </div>
          </div>
        )}`,
  ''
)

fs.writeFileSync('app/archive/page.tsx', archive)
console.log('done archive')
