const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

c = c.replace(
  `      } else {
        alert(lang === 'zh' ? '无法读取收据' : 'Could not read receipt')
      }`,
  `      } else {
        alert((lang === 'zh' ? '无法读取收据: ' : 'Could not read receipt: ') + (json.error || 'unknown error'))
      }`
)

// 加 catch 错误提示
c = c.replace(
  `      setScanning(false)
    }
    reader.readAsDataURL(file)`,
  `      setScanning(false)
    }
    reader.onerror = () => {
      alert(lang === 'zh' ? '文件读取失败' : 'File read failed')
      setScanning(false)
    }
    reader.readAsDataURL(file)`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', c)
console.log('done')
