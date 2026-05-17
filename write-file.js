const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')

// 桌面版加删除按钮
c = c.replace(
  `<Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">✏️ {lang === 'zh' ? '编辑' : 'Edit'}</Link>`,
  `<Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">✏️ {lang === 'zh' ? '编辑' : 'Edit'}</Link>
            <button onClick={async () => {
              if (confirm(lang === 'zh' ? '确定删除这个工单？此操作不可撤销。' : 'Delete this job? This cannot be undone.')) {
                await supabase.from('job_entries').delete().eq('job_id', id)
                await supabase.from('jobs').delete().eq('id', id)
                window.location.href = '/'
              }
            }} className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium">🗑️ {lang === 'zh' ? '删除' : 'Delete'}</button>`
)

// 手机版加删除按钮
c = c.replace(
  `<Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs">✏️</Link>`,
  `<Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs">✏️</Link>
            <button onClick={async () => {
              if (confirm(lang === 'zh' ? '确定删除这个工单？' : 'Delete this job?')) {
                await supabase.from('job_entries').delete().eq('job_id', id)
                await supabase.from('jobs').delete().eq('id', id)
                window.location.href = '/'
              }
            }} className="bg-red-100 text-red-600 px-2 py-1.5 rounded-lg text-xs">🗑️</button>`
)

fs.writeFileSync('app/jobs/[id]/page.tsx', c)
console.log('done')
