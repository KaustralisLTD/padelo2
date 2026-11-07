const emailPattern = /^[a-z0-9.!#$%&'*+/=?^`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export const directEmailLimits = { subject: 250, message: 10000 };

export function isSingleEmail(value: string) {
  return value.length <= 254 && emailPattern.test(value);
}

export function getSuggestedReply(email: { from?: string; subject?: string; html?: string }) {
  const from = email.from?.trim() || '';
  const sender = from.match(/<([^<>]+)>\s*$/)?.[1]?.trim() || from;
  const isPadelMailbox = (address: string) => /@(?:[^@.]+\.)*padelo2\.com$/i.test(address);
  let to = isSingleEmail(sender) ? sender : '';
  const incomingSubject = email.subject || '';
  const originalSubject = incomingSubject.replace(/^(?:\s*(?:fw|fwd|re):\s*)+/i, '').trim();

  // Site notifications come from our mailbox. Their mailto link points to the applicant.
  // Multiple distinct addresses are ambiguous, so leave the recipient for the admin to fill in.
  const forwardedInquiry = /^\s*(?:fw|fwd):/i.test(incomingSubject) && /\bPO2-[A-Z0-9]+\b/i.test(originalSubject);
  if (isPadelMailbox(to) || forwardedInquiry) {
    const candidates = new Set<string>();
    for (const [, address] of (email.html || '').matchAll(/\bhref\s*=\s*["']mailto:([^?"'\s]+)[^"']*["']/gi)) {
      try {
        const decoded = decodeURIComponent(address.replace(/&amp;/gi, '&'));
        if (isSingleEmail(decoded) && !isPadelMailbox(decoded)) candidates.add(decoded);
      } catch {
        // Ignore malformed mailto links in received HTML.
      }
    }
    to = candidates.size === 1 ? [...candidates][0] : '';
  }

  return {
    to,
    subject: originalSubject ? `Re: ${originalSubject}`.slice(0, directEmailLimits.subject) : '',
  };
}
