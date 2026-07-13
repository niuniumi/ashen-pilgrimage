import { TOKENS } from '../src/design/tokens.js';
import { LAYOUTS } from '../src/design/layouts.js';
import { TEXT_STYLES } from '../src/design/textStyles.js';
import { COMPONENT_STATES } from '../src/design/componentStates.js';

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

assert(TOKENS.colors.panel, 'missing panel color');
assert(TOKENS.colors.gold, 'missing gold color');
assert(TOKENS.colors.danger, 'missing danger color');
assert(TOKENS.css.body, 'missing css body color');
assert(TOKENS.spacing[8] === 8, 'spacing token 8 must equal 8');
assert(TOKENS.radius.sm === 0 && TOKENS.radius.md === 0 && TOKENS.radius.lg === 0, 'pixel UI must keep hard-edged panels');
assert(LAYOUTS.canvas.width === 1536, 'canvas width must be 1536');
assert(LAYOUTS.canvas.height === 864, 'canvas height must be 864');
assert(LAYOUTS.battleStage.baseline > LAYOUTS.battleStage.y, 'battle baseline must be inside the stage');
assert(TEXT_STYLES.title.fontFamily, 'title font family missing');
assert(TEXT_STYLES.body.fontSize >= 16, 'body font too small');
assert(COMPONENT_STATES.button.hover.stroke, 'button hover stroke missing');
assert(COMPONENT_STATES.intent.attack, 'attack intent color missing');

console.log(JSON.stringify({ ok: true }, null, 2));
