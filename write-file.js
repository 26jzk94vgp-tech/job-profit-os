const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')
content = content.replace(
  "import { createClient } from '../../utils/supabase/server'",
  "import { createClient } from '../../../utils/supabase/server'"
)
content = content.replace(
  '{entries?.map((entry) => (',
  '{entries?.map((entry: any) => ('
)
fs.writeFileSync('app/jobs/[id]/page.tsx', content)
console.log('done')
