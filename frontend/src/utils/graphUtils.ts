/**
 * Extracts plottable y=f(x) style equations from an AI message string.
 * Returns LaTeX strings that are safe to pass to latexToMath() for rendering.
 */

// Patterns that signal set/logic/annotation notation — not plottable curves
const nonGraphable =
  /\\(text|longrightarrow|Longrightarrow|rightarrow|mapsto|cup|cap|subset|subseteq|supset|supseteq|in|notin|forall|exists|neq|sim|cong|equiv|approx|implies|iff|to|gets|circ|times(?!\s*x))\b|\\text\s*\{|Domain|Range|\\quad|\\qquad/;

// LHS must be a function-of-x  like  y=, f(x)=, g(x)=, h(x)=, P(x)=, r=
const graphableLHS = /^\s*(?:[a-zA-Z](?:_[a-zA-Z0-9])?\s*(?:\([^)]*\))?|[a-zA-Z])\s*=/;

// Words that reveal the string is prose, not a pure formula
const proseWords =
  /\b(for|and|where|when|with|such|that|impose|domain|restriction|range|the|is|are|all|define|let|consider|given|note|since|so|but|or|if|then|assume)\b/i;

function isGraphable(latex: string): boolean {
  const s = latex.trim();
  if (!s.includes('=')) return false;
  // inline-math delimiters spliced from prose
  if (/\\[()\[\]]/.test(s)) return false;
  // $ signs mean prose LaTeX leaked in (e.g. "g(x)=x+1$ evaluated at $x=-5$")
  if (s.includes('$')) return false;
  if (nonGraphable.test(s)) return false;
  if (!graphableLHS.test(s)) return false;
  const rhs = s.slice(s.indexOf('=') + 1).trim();
  // RHS must reference x (or t for motion functions)
  if (!/[xt]/.test(rhs)) return false;
  if (proseWords.test(rhs)) return false;
  // Reject incomplete expressions ending with a dangling operator
  if (/[+\-*/^_\\]$/.test(rhs)) return false;
  // Reject abstract  y=f(x), y=g(x) — just a reference, no definition
  if (/^[a-zA-Z]\s*\(\s*[xt]\s*\)\s*$/.test(rhs)) return false;
  return true;
}

export function extractGraphableExprs(text: string): string[] {
  const seen    = new Set<string>();
  const results: string[] = [];

  const add = (raw: string) => {
    const e = raw
      .trim()
      .replace(/\\(label|tag|nonumber)\{[^}]*\}/g, '')
      .replace(/\\\\\s*$/gm, '')
      .replace(/[.,;:]+$/, '')
      .trim();
    if (e && e.length > 2 && e.length < 300 && !seen.has(e) && isGraphable(e)) {
      seen.add(e);
      results.push(e);
    }
  };

  let m: RegExpExecArray | null;

  // 1. Display math  $$...$$
  const displayDollar = /\$\$([^$]+)\$\$/gs;
  while ((m = displayDollar.exec(text)) !== null) add(m[1]);

  // 2. Display math  \[...\]
  const displayBracket = /\\\[([\s\S]+?)\\\]/g;
  while ((m = displayBracket.exec(text)) !== null) add(m[1]);

  // 3. Inline math  $...$
  const inlineDollar = /\$([^$\n]{3,80})\$/g;
  while ((m = inlineDollar.exec(text)) !== null) add(m[1]);

  // 4. Plain-text  y = ...,  f(x) = ...  (stop at backslash to avoid prose leaks)
  const plainEq = /\b([fghFGH]\s*\([xt]\)|y|r)\s*=\s*([^,\n<>#{\\]{4,80})/g;
  while ((m = plainEq.exec(text)) !== null) {
    const full = `${m[1]}=${m[2].trimEnd()}`;
    if (!seen.has(full)) add(full);
  }

  return results.slice(0, 8);
}

/**
 * Collect unique graphable expressions from every assistant message in the chat.
 */
export function collectAllGraphExprs(
  messages: Array<{ role: string; content: string }>,
): string[] {
  const seen    = new Set<string>();
  const results: string[] = [];
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const expr of extractGraphableExprs(msg.content)) {
      if (!seen.has(expr)) { seen.add(expr); results.push(expr); }
    }
  }
  return results.slice(0, 14);
}
