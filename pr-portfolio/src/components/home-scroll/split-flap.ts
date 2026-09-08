// Pure split-flap maths — no DOM, no time. Given a column's start and target
// glyphs and a 0..1 transition progress, it says which glyph the column shows,
// the incoming glyph behind the leaf, the leaf's X-rotation and the hinge
// shadow. Deterministic and reversible: the same progress always yields the
// same state, so scrolling back replays the flip exactly in reverse.
//
// Inspired by UI Beats' Split Flap (interval 55 ms, stagger 70 ms). Bound to
// scroll, those become proportions: every column gets an equal flip window and
// each starts STAGGER_RATIO window-widths after the previous one.

export const FLAP_CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'";
const STAGGER_RATIO = 70 / 55;

export type FlapState = {
  current: string;
  next: string;
  angle: number;
  shadow: number;
};

function normalize(char: string, charset: string): string {
  const upper = (char ?? " ").toUpperCase();
  return charset.indexOf(upper) >= 0 ? upper : " ";
}

// Forward walk through the charset from `from` to `to`, wrapping, plus one full
// extra loop so even neighbouring letters visibly spin. seq[0] is `from`,
// seq[last] is `to`.
export function buildCharacterSequence(
  from: string,
  to: string,
  charset: string = FLAP_CHARSET,
): string[] {
  const size = charset.length;
  const start = charset.indexOf(normalize(from, charset));
  const target = charset.indexOf(normalize(to, charset));
  const forward = (target - start + size) % size;
  const steps = forward + size;
  const sequence: string[] = [];
  for (let k = 0; k <= steps; k += 1) sequence.push(charset[(start + k) % size]);
  return sequence;
}

// The progress sub-range a column flips within. Column 0 flips first; the last
// column finishes exactly at progress 1.
export function columnWindow(
  columnIndex: number,
  columnCount: number,
): { start: number; end: number } {
  const columns = Math.max(1, columnCount);
  const total = 1 + STAGGER_RATIO * (columns - 1);
  return {
    start: (STAGGER_RATIO * columnIndex) / total,
    end: (STAGGER_RATIO * columnIndex + 1) / total,
  };
}

export function splitFlapStateAt(
  from: string,
  to: string,
  progress: number,
  columnIndex: number,
  columnCount: number,
  charset: string = FLAP_CHARSET,
): FlapState {
  const sequence = buildCharacterSequence(from, to, charset);
  const lastStep = sequence.length - 1;
  const { start, end } = columnWindow(columnIndex, columnCount);
  const span = end - start;
  const local = span > 0 ? (progress - start) / span : progress >= end ? 1 : 0;
  const clamped = local <= 0 ? 0 : local >= 1 ? 1 : local;

  const exact = clamped * lastStep;
  let index = Math.floor(exact + 1e-9);
  let frac = exact - index;
  if (index >= lastStep) {
    index = lastStep;
    frac = 0;
  }
  if (frac < 1e-9) frac = 0;

  const angle = frac * 180;
  const current = sequence[index];
  return {
    current,
    // Only mid-fold is an incoming glyph shown; at rest the plate reads `current`.
    next: frac === 0 ? current : sequence[Math.min(index + 1, lastStep)],
    angle,
    shadow: Math.sin((angle * Math.PI) / 180),
  };
}

// Centre a message inside `width` plates; extra space splits left/right (left
// takes the floor). Long messages are clipped, never wrapped here.
export function padMessage(message: string, width: number): string {
  const text = message.slice(0, width);
  const pad = width - text.length;
  const left = Math.floor(pad / 2);
  return " ".repeat(left) + text + " ".repeat(pad - left);
}
