const CLOSING_PUNCTUATION = new Set([...`，。！？；：、】【）》」』”’〉〕〗〙〛`]);
const OPENING_PUNCTUATION = new Set([...`（【《「『“‘〈〔〖〘〚`]);

function graphemes(value) {
  const source = String(value ?? '');
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(source)].map((part) => part.segment);
  }
  return Array.from(source);
}

function measuredWidth(value, measure) {
  const measured = measure(value);
  return typeof measured === 'number' ? measured : measured?.width ?? 0;
}

function isClosing(value) {
  return CLOSING_PUNCTUATION.has(value);
}

function isOpening(value) {
  return OPENING_PUNCTUATION.has(value);
}

function wrapParagraph(paragraph, maxWidth, measure) {
  if (!paragraph) return '';

  const lines = [];
  let line = [];
  const commit = () => {
    if (line.length) lines.push(line.join(''));
    line = [];
  };

  for (const glyph of graphemes(paragraph)) {
    const candidate = [...line, glyph].join('');
    if (!line.length || measuredWidth(candidate, measure) <= maxWidth) {
      line.push(glyph);
      continue;
    }

    if (isClosing(glyph) && line.length > 1 && !isOpening(line.at(-1))) {
      const trailingGlyph = line.pop();
      commit();
      line = [trailingGlyph, glyph];
      continue;
    }

    if (isOpening(line.at(-1)) && line.length > 1) {
      const openingGlyph = line.pop();
      commit();
      line = [openingGlyph, glyph];
      continue;
    }

    commit();
    line = [glyph];
  }

  commit();
  return lines.join('\n');
}

export function wrapMeasuredText(text, maxWidth, measure) {
  const safeWidth = Math.max(1, Number(maxWidth) || 1);
  const safeMeasure = typeof measure === 'function' ? measure : (value) => value.length;
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((paragraph) => wrapParagraph(paragraph, safeWidth, safeMeasure))
    .join('\n');
}

export function cjkWordWrap(width) {
  return {
    width,
    callback(text, textObject) {
      return wrapMeasuredText(text, width, (value) => textObject.context.measureText(value).width);
    }
  };
}
