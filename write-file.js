const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', 'utf8')
content = content
  .replace("from '../../../../../utils/supabase/client'", "from '../../../../utils/supabase/client'")
  .replace("from '../../../../../lib/i18n/LanguageContext'", "from '../../../../lib/i18n/LanguageContext'")
  .replace("supabase.from('job_entries').select('*').eq('id', entryId).single().then(({ data }) => {", "supabase.from('job_entries').select('*').eq('id', entryId).single().then(({ data }: { data: any }) => {")
fs.writeFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', content)
console.log('done')
