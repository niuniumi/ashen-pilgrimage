const RESOURCE_CONFIG = {
  'exiled-knight': { id: 'momentum', label: '战势', max: 3 },
  'candle-nun': { id: 'prayerFire', label: '祷火', max: 6 },
  'ashblood-alchemist': { id: 'ashblood', label: '灰血', max: 10 }
};

function hasTag(card, tag) {
  return card?.tags?.includes(tag) ?? false;
}

function resourceEvent(resource, action, amount = 0) {
  return {
    type: 'heroResource',
    resource: resource.id,
    label: resource.label,
    action,
    amount,
    value: resource.value,
    max: resource.max
  };
}

function setReady(resource, readyAt) {
  resource.ready = resource.value >= readyAt;
}

export class HeroResourceSystem {
  static create(characterId) {
    const config = RESOURCE_CONFIG[characterId];
    if (!config) return null;
    return { ...config, value: 0, ready: false };
  }

  static normalize(characterId, resource) {
    const fresh = this.create(characterId);
    if (!fresh) return null;
    const value = Number.isFinite(resource?.value) ? resource.value : 0;
    fresh.value = Math.max(0, Math.min(fresh.max, Math.floor(value)));
    fresh.ready = fresh.id === 'ashblood' ? fresh.value >= 6 : fresh.value >= fresh.max;
    return fresh;
  }

  static beforeCard(battle, card, context) {
    const resource = battle?.player?.resource;
    if (!resource) return [];

    if (resource.id === 'momentum' && hasTag(card, 'finisher') && resource.ready) {
      resource.value = 0;
      resource.ready = false;
      context.resourceDamageMultiplier = 1.5;
      battle.log?.unshift('战势贯入剑锋：终结技伤害提升 50%。');
      return [resourceEvent(resource, 'spend', resource.max)];
    }

    if (resource.id === 'prayerFire' && hasTag(card, 'ignite') && resource.value > 0) {
      const spent = Math.min(3, resource.value);
      resource.value -= spent;
      setReady(resource, resource.max);
      context.resourceFlatDamage = spent * 2;
      battle.log?.unshift(`献出 ${spent} 点祷火，点燃伤害 +${spent * 2}。`);
      return [resourceEvent(resource, 'spend', spent)];
    }

    if (resource.id === 'prayerFire' && hasTag(card, 'miracle') && resource.value > 0) {
      const spent = resource.value;
      resource.value = 0;
      resource.ready = false;
      context.resourceDamageMultiplier = 1 + spent * 0.1;
      context.resourceBonusBlock = spent * 2;
      battle.player.block += context.resourceBonusBlock;
      battle.log?.unshift(`祷火化为神迹：获得 ${context.resourceBonusBlock} 护甲。`);
      return [
        resourceEvent(resource, 'miracle', spent),
        { type: 'block', amount: context.resourceBonusBlock }
      ];
    }

    if (resource.id === 'ashblood' && card?.type === '攻击' && resource.value >= 6) {
      resource.value -= 3;
      setReady(resource, 6);
      context.resourceFlatDamage = 3;
      battle.log?.unshift('蒸馏灰血淬入武器：本次攻击伤害 +3。');
      return [resourceEvent(resource, 'spend', 3)];
    }

    return [];
  }

  static afterCard(battle, card, context) {
    const resource = battle?.player?.resource;
    if (!resource) return [];

    if (resource.id === 'momentum' && card?.type === '攻击' && (context?.damageDealt ?? 0) > 0) {
      const before = resource.value;
      resource.value = Math.min(resource.max, resource.value + 1);
      setReady(resource, resource.max);
      const gained = resource.value - before;
      if (gained > 0) battle.log?.unshift(`战势 +${gained}。`);
      return gained > 0 ? [resourceEvent(resource, resource.ready ? 'ready' : 'gain', gained)] : [];
    }

    if (resource.id === 'prayerFire' && hasTag(card, 'prayer')) {
      const before = resource.value;
      resource.value = Math.min(resource.max, resource.value + 1);
      setReady(resource, resource.max);
      const gained = resource.value - before;
      if (gained > 0) battle.log?.unshift(`祷火 +${gained}。`);
      return gained > 0 ? [resourceEvent(resource, resource.ready ? 'ready' : 'gain', gained)] : [];
    }

    return [];
  }

  static onSelfLoseHp(battle, amount) {
    const resource = battle?.player?.resource;
    if (!resource || resource.id !== 'ashblood' || amount <= 0) return [];

    const wasReady = resource.ready;
    resource.value = Math.min(resource.max, resource.value + amount);
    setReady(resource, 6);
    const events = [resourceEvent(resource, !wasReady && resource.ready ? 'ready' : 'gain', amount)];

    if (resource.value >= resource.max) {
      resource.value = 5;
      resource.ready = false;
      battle.player.energy += 2;
      battle.log?.unshift('灰血过载：获得 2 点能量，灰血回落至 5。');
      events.push(resourceEvent(resource, 'overload', 2));
    } else {
      battle.log?.unshift(`灰血 +${amount}。`);
    }
    return events;
  }
}
