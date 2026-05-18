// lib/comms/markdown.ts
// Minimal markdown-to-HTML renderer for message bodies.
// Deliberately restrictive — only the patterns below are accepted.
// No arbitrary HTML is passed through (body is escaped first).

type MemberLookup = Record<string, string> // userId -> display name

/**
 * Escape characters that are meaningful in HTML.
 * This is our first line of defence — the body is HTML-escaped before
 * any substitution, so injected HTML tags are neutralised.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Render a markdown message body to a safe HTML string.
 *
 * Supported patterns (applied in order):
 *   **bold**   → <strong>
 *   *italic*   → <em>
 *   `code`     → <code>
 *   @userId    → <span class="mention">
 *   line break → <br />
 */
export function renderMarkdown(body: string, members: MemberLookup = {}): string {
  // 1. HTML-escape the raw body first
  let html = escapeHtml(body)

  // 2. **bold** (double asterisk)
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')

  // 3. *italic* (single asterisk, not followed immediately by another *)
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')

  // 4. `inline code`
  html = html.replace(/`([^`\n]+?)`/g, '<code class="font-mono text-[0.85em] bg-ink-100 px-1 py-0.5 rounded">$1</code>')

  // 5. @mention — pattern @word (word chars + hyphens)
  html = html.replace(/@([\w-]+)/g, (_match, id: string) => {
    const name = members[id] ?? id
    return `<span class="text-accent-500 font-medium">@${escapeHtml(name)}</span>`
  })

  // 6. Newlines → <br />
  html = html.replace(/\n/g, '<br />')

  return html
}
