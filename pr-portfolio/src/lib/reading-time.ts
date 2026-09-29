const WORDS_PER_MINUTE = 200;
// Case studies are image-led: each figure costs a short look on top of the text.
const SECONDS_PER_IMAGE = 10;
// Component props that render as readable copy (CaseSection, CaseCallout, CaseTestimonial…).
const READABLE_PROPS = /\b(?:heading|title|body|quote)="([^"]*)"/g;

/** Estimated reading minutes (min 1) for a raw Markdown/MDX body. */
export function readingMinutes(body = ''): number {
  const withoutEsm = body.replace(/^(?:import|export)\s.*$/gm, '');
  const images = (withoutEsm.match(/<Image\b|!\[/g) ?? []).length;
  const propText = [...withoutEsm.matchAll(READABLE_PROPS)].map(match => match[1]).join(' ');
  const prose = withoutEsm
    .replace(/<[^>]*>/g, ' ')          // JSX / HTML tags, props included
    .replace(/\]\([^)]*\)/g, ' ')      // link and image targets
    .replace(/[#*_>`[\]|-]/g, ' ');    // Markdown punctuation
  const words = `${prose} ${propText}`.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE + images * SECONDS_PER_IMAGE / 60));
}
