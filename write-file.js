const fs = require('fs')
let content = fs.readFileSync('app/cashflow/page.tsx', 'utf8')

content = content.replace(
  "import { useLanguage } from '../../lib/i18n/LanguageContext'",
  "import { useLanguage } from '../../lib/i18n/LanguageContext'\nimport { formatDate } from '../../lib/utils'"
)

content = content.replace(
  "'}>{lang === 'zh' ? '到期' : 'Due'}: {e.payment_due_date}</span>}",
  "'}>{lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}</span>}"
)

fs.writeFileSync('app/cashflow/page.tsx', content)
console.log('done cashflow')

// 同时更新首页的日期显示
let page = fs.readFileSync('app/page.tsx', 'utf8')
page = page.replace(
  "import { useLanguage, LangToggle } from '../lib/i18n/LanguageContext'",
  "import { useLanguage, LangToggle } from '../lib/i18n/LanguageContext'\nimport { formatDate } from '../lib/utils'"
)
page = page.replace(
  "{lang === 'zh' ? '到期' : 'Due'}: {e.payment_due_date}",
  "{lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}"
)
fs.writeFileSync('app/page.tsx', page)
console.log('done page')
