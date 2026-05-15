const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/invoice/page.tsx', 'utf8')

// 加 note state
content = content.replace(
  "  const [toEmail, setToEmail] = useState('')",
  `  const [toEmail, setToEmail] = useState('')
  const [note, setNote] = useState('Payment due within 14 days. Thank you for your business!')`
)

// 加 note 输入框在 send email 后面
content = content.replace(
  `          <div className="flex gap-3">
            <button onClick={handleSendEmail} disabled={sending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{sending ? 'Sending...' : '📧 Send Invoice'}</button>
            <button onClick={() => window.print()} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">🖨️ Print / PDF</button>
          </div>`,
  `          <div><label className="text-gray-500 text-xs">Note / Payment Terms</label><textarea className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="flex gap-3">
            <button onClick={handleSendEmail} disabled={sending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{sending ? 'Sending...' : '📧 Send Invoice'}</button>
            <button onClick={() => window.print()} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">🖨️ Print / PDF</button>
          </div>`
)

// 在发票底部加 note
content = content.replace(
  `      </div>
    </div>
  )
}`,
  `        {note && (
          <div className="mt-6 pt-4 border-t border-gray-300">
            <p className="text-xs font-medium text-gray-600 mb-1">Note:</p>
            <p className="text-sm text-gray-700">{note}</p>
          </div>
        )}
      </div>
    </div>
  )
}`
)

fs.writeFileSync('app/jobs/[id]/invoice/page.tsx', content)
console.log('done')
