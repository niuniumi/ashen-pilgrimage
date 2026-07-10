import { cards } from '../src/data/cards.js';
import { enemies } from '../src/data/enemies.js';
import { events } from '../src/data/events.js';
import { relics } from '../src/data/relics.js';
import { ACTS } from '../src/data/acts.js';
import { ENCOUNTER_POOLS } from '../src/data/encounters.js';
import { validateAllContent } from '../src/content/validateContent.js';

const report = validateAllContent({ cards, relics, enemies, events, acts: ACTS, encounters: ENCOUNTER_POOLS });

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
