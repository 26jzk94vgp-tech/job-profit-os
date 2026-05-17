const fs = require('fs')
let c = fs.readFileSync('app/api/ocr/route.ts', 'utf8')
c = c.replace(
  `  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ success: false, error: 'Failed to analyze receipt' }, { status: 500 })
  }`,
  `  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 })
  }`
)
fs.writeFileSync('app/api/ocr/route.ts', c)
console.log('done')
