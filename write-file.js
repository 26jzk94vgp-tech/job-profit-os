const fs = require('fs')
let content = fs.readFileSync('app/layout.tsx', 'utf8')
content = content.replace(
  '<body className="min-h-full flex flex-col pb-24 md:pb-0 pt-10 md:pt-0">',
  `<head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Job Profit OS" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="min-h-full flex flex-col pb-24 md:pb-0 pt-10 md:pt-0">`
)
fs.writeFileSync('app/layout.tsx', content)
console.log('done')
