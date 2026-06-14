const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','10minutemail.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'temp-mail.org','tempmail.com','throwawaymail.com','yopmail.com','getnada.com','nada.email',
  'maildrop.cc','dispostable.com','trashmail.com','sharklasers.com','grr.la','spam4.me',
  'fakeinbox.com','tempinbox.com','emailondeck.com','mohmal.com','mintemail.com','mytemp.email',
  'tmpmail.org','tmpeml.com','33mail.com','spamgourmet.com','mailnesia.com','tempr.email',
  'discard.email','discardmail.com','mailcatch.com','inboxkitten.com','tempmailo.com',
  '1secmail.com','1secmail.org','1secmail.net','emltmp.com','etempmail.com','luxusmail.org',
  'minuteinbox.com','rootfest.net','vomoto.com','byom.de','mailtemp.info','burnermail.io',
])
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  return DISPOSABLE_DOMAINS.has(domain)
}
