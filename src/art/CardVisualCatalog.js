import { CARD_TYPES } from '../game/constants.js';

export function resolveCardArtKind(card) {
  const id = String(card?.id ?? card?.cardId ?? '');
  if (/double-slash|flying-candles|candle-array|candle-net/.test(id)) return 'volley';
  if (/execution|heavy-pressure|skullbreaker|vowbreaker/.test(id)) return 'heavy-blade';
  if (/block|shield|guard|hardened-skin|leadskin|counter-stance|red-cape-stand/.test(id)) return 'shield';
  if (/score|rend|bloodline|armor-break|confession-mark|wax-seal/.test(id)) return 'marked-blade';
  if (/flame|ignite|glimmer|pilgrim-candle|last-candle|holy-fire|thousand-candles/.test(id)) return 'candle';
  if (/prayer|mass|absolution|litany|scapegoat/.test(id)) return 'prayer';
  if (/acid|flask|draught|tonic|reagent|salve|forbidden-test/.test(id)) return 'vial';
  if (/injection|catalyst|ashblood-boil|bloodrage/.test(id)) return 'injection';
  if (/smoke-step/.test(id)) return 'smoke';
  if (/lotus|rebirth|phoenix/.test(id)) return 'lotus';
  if (/mercury-knife|cleave|quickstep|pursuit|duel/.test(id)) return 'blade';
  if (/sharpen|blood-oath/.test(id)) return 'anvil';
  if (card?.type === CARD_TYPES.ATTACK) return 'blade';
  if (card?.type === CARD_TYPES.DEFENSE) return 'shield';
  if (card?.type === CARD_TYPES.SPELL) return 'candle';
  if (card?.type === CARD_TYPES.CURSE) return 'curse';
  if (card?.type === CARD_TYPES.STATUS) return 'wound';
  return 'scroll';
}
