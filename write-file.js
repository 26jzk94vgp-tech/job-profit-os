const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/JobStatusToggle.tsx', 'utf8')
content = content.replace(
  "from '../../../../utils/supabase/client'",
  "from '../../../utils/supabase/client'"
)
fs.writeFileSync('app/jobs/[id]/JobStatusToggle.tsx', content)
console.log('done')
