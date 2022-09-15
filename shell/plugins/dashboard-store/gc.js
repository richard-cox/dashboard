import { SETTING } from '~/shell/config/settings';
import { MANAGEMENT, SCHEMA } from '@shell/config/types';

export function gcEnabledAll(pseudoCtx, type) {
  return gcEnabledForState(pseudoCtx.state) && gcEnabledSetting(pseudoCtx) && gcEnabledForType(pseudoCtx, type);
}

export function gcEnabledSetting(pseudoCtx) {
  // TODO: RC fully test exclusions
  const { state, rootState } = pseudoCtx;

  // Don't use a getter... as we'll end up here getting it
  const hmm = rootState.management.types[MANAGEMENT.SETTING].list.find(s => s.id === SETTING.UI_PERFORMANCE);
  // const hmm = rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORMANCE);

  if (!hmm) {
    // Could be in the process of logging out
    console.warn('DANGER DANGER DANGER DANGER');

    return false;
  }
  const uiPerfSetting = JSON.parse(hmm.value); // TODO: RC JSON.parse often called!

  return uiPerfSetting.garbageCollection?.enabled;
}

export function gcEnabledForState(state) {
  // TODO: RC fully test exclusions

  return state?.config?.supportsGC;
}

export function gcEnabledForType(pseudoCtx, type) {
  // TODO: RC fully test exclusions
  const { getters } = pseudoCtx;

  if (!type || getters.gcIgnoreTypes[type]) {
    return false;
  }

  return true;
}

export function updateResourceAccessed(pseudoCtx, type) {
  const { state } = pseudoCtx;

  if (!gcEnabledAll(pseudoCtx, type)) {
    return;
  }

  // TODO: RC run after to ensure registerType ran
  const cache = state.types[type];

  cache.accessed = new Date().getTime();
}
