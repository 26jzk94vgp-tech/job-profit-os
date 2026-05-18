python3 << 'PYEOF'
c = open('app/jobs/[id]/page.tsx').read()

old = '''                  <span className={entry.type === 'invoice' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {entry.type === 'invoice' ? '+' : '-'}${entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}
                  </span>'''

new = '''                  <span className={entry.type === 'invoice' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {entry.type === 'invoice' ? '+' : ''}\${entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}
                  </span>'''

c = c.replace(old, new)
open('app/jobs/[id]/page.tsx', 'w').write(c)
print('done:', 'invoice' in c)
PYEOF
