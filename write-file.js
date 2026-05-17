const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

c = c.replace(
  `    const jobList = jobData || []
    
    // 自动归档超过30天的已完成工单
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 15)
    
    const toArchive = jobList.filter((j: any) => {
      if (j.status !== 'completed') return false
      if (new Date(j.created_at) >= thirtyDaysAgo) return false
      // 只归档已收款的工单（revenue === 0 或 unpaid invoice 为 0）
      const hasUnpaid = Number(j.revenue) > 0 && Number(j.profit) < Number(j.revenue)
      return !hasUnpaid
    })
    
    if (toArchive.length > 0) {
      await supabase.from('jobs')
        .update({ status: 'archived' })
        .in('id', toArchive.map((j: any) => j.id))
      
      toArchive.forEach((j: any) => { j.status = 'archived' })
    }
    
    setJobs(jobList)`,
  `    setJobs(jobData || [])`
)

fs.writeFileSync('app/page.tsx', c)
console.log('done')
