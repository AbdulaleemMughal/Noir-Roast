/**
 * Minimal text splitter.
 *
 * Splits an element's text into line / word / character wrappers so GSAP can
 * stagger them, and can put every line inside an `overflow: hidden` mask for
 * clip reveals. Written by hand rather than pulled from a plugin so the reveal
 * behaviour is identical everywhere and there is no extra runtime dependency.
 *
 * Handles plain text nodes only — which is all the headlines here contain.
 */

export interface SplitResult {
  lines: HTMLElement[];
  /** The `overflow: hidden` element wrapping each line. */
  lineMasks: HTMLElement[];
  words: HTMLElement[];
  chars: HTMLElement[];
  /** Restores the original markup. Call before re-splitting on resize. */
  revert: () => void;
}

export interface SplitOptions {
  /** Any combination of 'lines', 'words', 'chars'. */
  type?: string;
  /** Wrap each line in an overflow-hidden element for clip reveals. */
  mask?: boolean;
}

const makeSpan = (className: string, display = 'inline-block') => {
  const el = document.createElement('span');
  el.className = className;
  el.style.display = display;
  return el;
};

export function splitText(
  element: HTMLElement,
  { type = 'words,chars', mask = false }: SplitOptions = {},
): SplitResult {
  const original = element.innerHTML;
  const source = element.textContent ?? '';

  const wantsChars = type.includes('chars');
  const wantsLines = type.includes('lines') || mask;

  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];

  element.innerHTML = '';

  // --- pass 1: words (always needed — lines are grouped from them) ---------
  const tokens = source.split(/(\s+)/).filter((t) => t.length > 0);

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      element.appendChild(document.createTextNode(' '));
      continue;
    }

    const word = makeSpan('split-word');
    word.style.whiteSpace = 'pre';

    if (wantsChars) {
      for (const character of Array.from(token)) {
        const char = makeSpan('split-char');
        char.textContent = character;
        word.appendChild(char);
        chars.push(char);
      }
    } else {
      word.textContent = token;
    }

    element.appendChild(word);
    words.push(word);
  }

  const lines: HTMLElement[] = [];
  const lineMasks: HTMLElement[] = [];

  // --- pass 2: group words into visual lines by their measured offset ------
  if (wantsLines && words.length) {
    const groups: HTMLElement[][] = [];
    let currentTop: number | null = null;

    // Tolerance scales with the type size: at display sizes, inline-block boxes
    // on the same visual line can differ by several pixels, and a fixed
    // threshold would split one line into two.
    const fontSize = parseFloat(getComputedStyle(element).fontSize) || 16;
    const tolerance = Math.max(4, fontSize * 0.4);

    for (const word of words) {
      const top = word.getBoundingClientRect().top;
      if (currentTop === null || Math.abs(top - currentTop) > tolerance) {
        currentTop = top;
        groups.push([word]);
      } else {
        groups[groups.length - 1].push(word);
      }
    }

    element.innerHTML = '';

    for (const group of groups) {
      const line = makeSpan('split-line', 'block');

      group.forEach((word, index) => {
        if (index > 0) line.appendChild(document.createTextNode(' '));
        line.appendChild(word);
      });

      if (mask) {
        const maskEl = makeSpan('split-mask', 'block');
        maskEl.style.overflow = 'hidden';
        // Descenders would otherwise be clipped by the mask.
        maskEl.style.paddingBottom = '0.12em';
        maskEl.style.marginBottom = '-0.12em';
        maskEl.appendChild(line);
        element.appendChild(maskEl);
        lineMasks.push(maskEl);
      } else {
        element.appendChild(line);
      }

      lines.push(line);
    }
  }

  return {
    lines,
    lineMasks,
    words,
    chars,
    revert: () => {
      element.innerHTML = original;
    },
  };
}
