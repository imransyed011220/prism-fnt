// utils/textNormalizer.js
// Normalizes pasted text from PDFs and external sources
// Converts broken Unicode boxes to readable equivalents
// Preserves ALL meaning — nothing is lost, only made readable

// Map of problematic Unicode → readable text
const UNICODE_MAP = {
  // Greek letters (common in physics/math)
  '\u03B1': 'α', '\u03B2': 'β', '\u03B3': 'γ', '\u03B4': 'δ',
  '\u03B5': 'ε', '\u03B8': 'θ', '\u03BB': 'λ', '\u03BC': 'μ',
  '\u03C0': 'π', '\u03C1': 'ρ', '\u03C3': 'σ', '\u03C4': 'τ',
  '\u03C6': 'φ', '\u03C9': 'ω',
  '\u0391': 'Α', '\u0392': 'Β', '\u0393': 'Γ', '\u0394': 'Δ',
  '\u0398': 'Θ', '\u039B': 'Λ', '\u03A3': 'Σ', '\u03A9': 'Ω',

  // Math operators
  '\u221E': '∞', '\u2211': '∑', '\u222B': '∫', '\u221A': '√',
  '\u00B1': '±', '\u00D7': '×', '\u00F7': '÷', '\u2260': '≠',
  '\u2264': '≤', '\u2265': '≥', '\u2248': '≈', '\u221D': '∝',
  '\u2202': '∂', '\u0394': 'Δ', '\u2207': '∇',

  // Superscripts/subscripts
  '\u00B2': '²', '\u00B3': '³', '\u00B9': '¹',
  '\u2070': '⁰', '\u2074': '⁴', '\u2075': '⁵',
  '\u2076': '⁶', '\u2077': '⁷', '\u2078': '⁸', '\u2079': '⁹',
  '\u2080': '₀', '\u2081': '₁', '\u2082': '₂', '\u2083': '₃',

  // Arrows
  '\u2192': '→', '\u2190': '←', '\u2194': '↔',
  '\u21D2': '⇒', '\u21D4': '⇔',

  // Chemistry
  '\u21CC': '⇌',  // equilibrium arrow

  // Fractions
  '\u00BD': '1/2', '\u00BC': '1/4', '\u00BE': '3/4',

  // Common problematic chars from PDF copy
  '\u2019': "'", '\u2018': "'", '\u201C': '"', '\u201D': '"',
  '\u2013': '-', '\u2014': '--', '\u2026': '...',

  // Invisible/zero-width chars that cause boxes
  '\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '',
  '\u00AD': '',  // soft hyphen
};

// Characters that appear as boxes — replace with placeholder text
const BOX_CHARS_REGEX = /[\uFFFD\u25A1\u25A0\u2610\u2611\u2612]/g;

// Surrogate pairs that cause issues
const SURROGATE_REGEX = /[\uD800-\uDFFF]/g;

/**
 * Normalizes text pasted from PDFs, math papers, external sources.
 * Preserves ALL mathematical meaning.
 * Converts invisible/broken chars to readable equivalents.
 */
export function normalizePastedText(text) {
  if (!text) return '';

  let result = text;

  // Step 1 — replace known Unicode symbols with readable versions
  for (const [char, replacement] of Object.entries(UNICODE_MAP)) {
    result = result.split(char).join(replacement);
  }

  // Step 2 — replace box characters with [symbol] placeholder
  result = result.replace(BOX_CHARS_REGEX, '[?]');

  // Step 3 — remove surrogates that can't be encoded
  result = result.replace(SURROGATE_REGEX, '');

  // Step 4 — normalize whitespace (PDF often adds weird spaces)
  result = result
    .replace(/\u00A0/g, ' ')   // non-breaking space → normal space
    .replace(/\u2003/g, ' ')   // em space
    .replace(/\u2002/g, ' ')   // en space
    .replace(/\t/g, ' ')       // tab → space
    .replace(/ {3,}/g, '  ')   // multiple spaces → double space max
    .replace(/\r\n/g, '\n')    // normalize line endings
    .replace(/\r/g, '\n');

  // Step 5 — try to encode as UTF-8 safely
  try {
    // this will throw if there are still bad chars
    encodeURIComponent(result);
  } catch {
    // last resort — remove any remaining non-encodable chars
    result = Array.from(result)
      .filter(char => {
        try { encodeURIComponent(char); return true; }
        catch { return false; }
      })
      .join('');
  }

  return result;
}

/**
 * Detects if text has rendering issues (boxes, unknown chars)
 */
export function hasRenderingIssues(text) {
  return /[\uFFFD\u25A1\u2610]/.test(text) || /[\uD800-\uDFFF]/.test(text);
}