/**
 * Replace dynamic data (partnerName, partnerCompany) in saved HTML templates
 * This allows using saved templates while keeping form data dynamic
 */

/**
 * Replace partner name and company in HTML template
 * Looks for common patterns where these values might appear
 */
export function replaceTemplateData(
  html: string,
  partnerName: string,
  partnerCompany: string
): string {
  let result = html;

  // Replace partner name in various contexts
  if (partnerName) {
    // Pattern: Hi, [old name] or Hi [old name]
    result = result.replace(/Hi,?\s*[^<,]+(?=,|<\/p>)/gi, (match) => {
      // Keep "Hi" or "Hi," and replace the name part
      if (match.toLowerCase().startsWith('hi')) {
        return `Hi${match.includes(',') ? ',' : ''} ${partnerName}`;
      }
      return match;
    });

    // Pattern: Hi${partnerName ? `, ${partnerName}` : ''}
    // This is the template pattern, replace with actual name
    result = result.replace(/Hi\$\{partnerName\s*\?[^}]*\}/g, `Hi, ${partnerName}`);

    // Direct replacement in common greeting patterns
    result = result.replace(/(<p[^>]*>Hi,?\s*)([^<,]+)(,?<\/p>)/gi, `$1${partnerName}$3`);
    result = result.replace(/(Hi,?\s*)([A-Z][a-zA-Z\s]+)(,?)/g, (match, prefix, oldName, suffix) => {
      // Only replace if it looks like a name (starts with capital, reasonable length)
      if (oldName.length < 50 && oldName.trim().length > 0) {
        return `${prefix}${partnerName}${suffix}`;
      }
      return match;
    });
  }

  // Replace company name in various contexts
  if (partnerCompany) {
    // Pattern: <strong>Company Name</strong> or Company Name
    result = result.replace(/<strong>([^<]+)<\/strong>/g, (match, content) => {
      // If content looks like a company name (not too long, not common words)
      if (content.length < 100 && !content.match(/^(Why|Audience|Visibility|Logo|Mentions|Option|Sponsorship|Main|Official|Best|Follow|You|PadelO)/i)) {
        // Check if it's likely the company name (contains common company indicators or is capitalized)
        if (content.match(/^(A-Z|LTD|LLC|Inc|Corp|Company|Corporation)/) || content.length > 3) {
          // Don't replace if it's clearly not a company name
          if (!content.match(/^(50\+|2 days|Active|Promotion|Depending|Official|On-court|Printed|Tournament|Social|Opening|Place|Include|Sponsor|Main Partner|Title Partner|Official Sponsor|€650|€350|We're|If this|Best regards|Sergii|Organizer|PadelO|Follow|You received|Unsubscribe)/i)) {
            return `<strong>${partnerCompany}</strong>`;
          }
        }
      }
      return match;
    });

    // Pattern: invite [Company Name] or invite <strong>Company</strong>
    result = result.replace(/invite\s+<strong>([^<]+)<\/strong>/gi, `invite <strong>${partnerCompany}</strong>`);
    result = result.replace(/invite\s+([A-Z][a-zA-Z\s&]+)/g, (match, oldCompany) => {
      if (oldCompany.length < 100 && oldCompany.trim().length > 0) {
        return `invite ${partnerCompany}`;
      }
      return match;
    });
  }

  return result;
}

/**
 * More aggressive replacement - replaces all instances that match patterns
 * Use this when you want to ensure all occurrences are replaced
 */
export function replaceTemplateDataAggressive(
  html: string,
  partnerName: string,
  partnerCompany: string
): string {
  let result = html;

  if (partnerName) {
    // Find and replace name in greeting: "Hi, [name]" pattern
    const namePattern = /(Hi,?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(,?\s*<)/g;
    result = result.replace(namePattern, `$1${partnerName}$3`);

    // Replace in any paragraph that starts with "Hi"
    result = result.replace(/(<p[^>]*class="lead"[^>]*>Hi,?\s*)([^<]+)(<\/p>)/gi, `$1${partnerName}$3`);
  }

  if (partnerCompany) {
    // Replace company name in invitation text
    result = result.replace(/invite\s+<strong>([^<]+)<\/strong>/gi, `invite <strong>${partnerCompany}</strong>`);
    
    // Replace standalone company names in strong tags (but not common words)
    const commonWords = ['Why', 'Audience', 'Visibility', 'Logo', 'Mentions', 'Option', 'Sponsorship', 
                         'Main', 'Official', 'Best', 'Follow', 'You', 'PadelO', '50+', '2 days', 
                         'Active', 'Promotion', 'Depending', 'Official', 'On-court', 'Printed', 
                         'Tournament', 'Social', 'Opening', 'Place', 'Include', 'Sponsor', '€650', 
                         '€350', 'We\'re', 'If this', 'Sergii', 'Organizer', 'Unsubscribe'];
    
    result = result.replace(/<strong>([^<]+)<\/strong>/g, (match, content) => {
      // Only replace if it's not a common word and looks like a company name
      if (!commonWords.some(word => content.includes(word)) && 
          content.length > 2 && 
          content.length < 100 &&
          content.match(/^[A-Z]/)) {
        // Check if this is likely a company name (not in a list item with common patterns)
        const context = match;
        if (!context.match(/(players|categories|families|tourists|Guests|Spain|Ukraine|matches|activities|audience|channels|T-shirts|banners|materials|graphics|posts|stories|ceremonies|stand|tasting|demo|gifts|vouchers|samples|Welcome|activities|Party|Lottery|Hours|zone|Partner|Sponsor|€650|€350|visibility|presence|goals|awareness|trials|clients|sounds|interesting|call|discuss|details|regards|Sergii|Organizer|PadelO|com|received|email|Unsubscribe)/i)) {
          return `<strong>${partnerCompany}</strong>`;
        }
      }
      return match;
    });
  }

  return result;
}

