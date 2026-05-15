const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')
// 删掉错误的结尾
content = content.replace(`
            </div>
            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Entry'}</button>
          </div>
        </div>
      </main>
    </div>
  )
}`, '')

// 加上正确的结尾
const ending = `
            </div>
            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Entry'}</button>
          </div>
        </div>
      </main>
    </div>
  )
}`

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content + ending)
console.log('done lines:' + (content + ending).split('\n').length)
