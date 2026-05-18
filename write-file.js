const fs = require('fs')
const content = `import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { toEmail, toName, companyName, companyEmail, invoiceNumber, dueDate, jobId } = await request.json()

    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    })

    const invoiceUrl = \`\${process.env.NEXT_PUBLIC_APP_URL}/jobs/\${jobId}/invoice\`

    await transporter.sendMail({
      from: \`"\${companyName || 'Job Profit OS'}" <\${process.env.OUTLOOK_EMAIL}>\`,
      to: toEmail,
      subject: \`Invoice \${invoiceNumber} from \${companyName || 'Job Profit OS'}\`,
      html: \`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Invoice \${invoiceNumber}</h2>
          <p>Dear \${toName || 'Client'},</p>
          <p>Please find your invoice from <strong>\${companyName || 'Job Profit OS'}</strong>.</p>
          \${dueDate ? \`<p>Payment due by: <strong>\${dueDate}</strong></p>\` : ''}
          <p style="margin-top: 24px;">
            <a href="\${invoiceUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View Invoice
            </a>
          </p>
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">
            \${companyName || ''} \${companyEmail ? '· ' + companyEmail : ''}
          </p>
        </div>
      \`
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}`

fs.writeFileSync('app/api/send-invoice/route.ts', content)
console.log('done')
