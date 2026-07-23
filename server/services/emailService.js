import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import Subscriber from '../models/Subscriber.js'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    return new Resend(apiKey)
  }
  return null
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    })
  }
  return null
}

function buildHtmlTemplate({ title, excerpt, link, recipientName }) {
  const siteTitle = process.env.SITE_TITLE || 'The Curator'
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121214; color: #e1e1e6; margin: 0; padding: 40px 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #1a1a1e; border: 1px solid #2e2e34; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { border-bottom: 1px solid #2e2e34; padding-bottom: 16px; margin-bottom: 24px; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        .excerpt { font-size: 15px; line-height: 1.6; color: #a9a9b3; margin-bottom: 28px; white-space: pre-wrap; }
        .btn { display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { margin-top: 40px; border-top: 1px solid #2e2e34; padding-top: 20px; font-size: 12px; color: #6c6c7a; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">${siteTitle}</div>
        <p style="color: #a9a9b3; font-size: 14px;">${greeting}</p>
        <h1 class="title">${title}</h1>
        <div class="excerpt">${excerpt}</div>
        ${link ? `<a href="${link}" class="btn" target="_blank">View Update &rarr;</a>` : ''}
        <div class="footer">
          You are receiving this email because you subscribed to ${siteTitle}.
        </div>
      </div>
    </body>
    </html>
  `
}

export async function notifyAllSubscribers({ subject, title, excerpt, link }) {
  try {
    const activeSubscribers = await Subscriber.find({ active: true })
    if (!activeSubscribers || activeSubscribers.length === 0) {
      return { total: 0, sent: 0, failed: 0, message: 'No active subscribers found' }
    }

    const from = process.env.EMAIL_FROM || 'The Curator <onboarding@resend.dev>'
    let sentCount = 0
    let failCount = 0
    let lastError = ''

    // Method 1: Official Resend SDK
    const resend = getResendClient()
    if (resend) {
      console.log(`\n📧 Sending via Resend SDK to ${activeSubscribers.length} subscriber(s)...`)
      for (const sub of activeSubscribers) {
        try {
          const { data, error } = await resend.emails.send({
            from,
            to: sub.email,
            subject: subject || title,
            html: buildHtmlTemplate({ title, excerpt, link, recipientName: sub.name }),
          })

          if (error) {
            console.error(`   ✕ Resend SDK error for ${sub.email}:`, error.message || JSON.stringify(error))
            lastError = error.message || error.name || 'Resend SDK error'
            failCount++
          } else {
            console.log(`   ✓ Email sent via Resend to: ${sub.email} (id: ${data?.id})`)
            sentCount++
          }
        } catch (err) {
          console.error(`   ✕ Failed to send email to ${sub.email}:`, err.message)
          lastError = err.message
          failCount++
        }
      }
      return { total: activeSubscribers.length, sent: sentCount, failed: failCount, simulated: false, errorDetails: lastError }
    }

    // Method 2: Nodemailer SMTP (if SMTP_HOST is provided)
    const transporter = getTransporter()
    if (transporter) {
      console.log(`\n📧 Sending via Nodemailer SMTP to ${activeSubscribers.length} subscriber(s)...`)
      for (const sub of activeSubscribers) {
        try {
          await transporter.sendMail({
            from,
            to: sub.email,
            subject: subject || title,
            html: buildHtmlTemplate({ title, excerpt, link, recipientName: sub.name }),
          })
          sentCount++
        } catch (err) {
          console.error(`Failed to send email to ${sub.email}:`, err.message)
          lastError = err.message
          failCount++
        }
      }
      return { total: activeSubscribers.length, sent: sentCount, failed: failCount, simulated: false, errorDetails: lastError }
    }

    // Method 3: Simulation / Development mode logging
    console.log(`\n📧 [EMAIL SIMULATION MODE] Broadcasting to ${activeSubscribers.length} subscriber(s):`)
    console.log(`   Subject: "${subject || title}"`)
    console.log(`   Title:   "${title}"`)
    console.log(`   Recipients:`, activeSubscribers.map(s => s.email).join(', '))
    
    return {
      total: activeSubscribers.length,
      sent: activeSubscribers.length,
      failed: 0,
      simulated: true,
      message: 'Sent in simulation mode (check server console)'
    }
  } catch (err) {
    console.error('Error in notifyAllSubscribers:', err)
    throw err
  }
}
