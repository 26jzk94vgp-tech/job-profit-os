const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content.replace(
  `<Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.taxReport}</Link>
            <Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.cashFlow}</Link>
            <LangToggle />
            <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 text-sm">{t.signOut}</button>
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{t.newJob}</Link>`,
  `<Link href="/tax" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
            <Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.cashFlow}</Link>
            <LangToggle />
            <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 text-sm">{t.signOut}</button>
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{t.newJob}</Link>`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
