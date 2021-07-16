
import Vue from 'vue';

import { addObject, addObjects, clear } from '@/utils/array';
import { KEY_FIELD_FOR, normalizeType } from '@/plugins/steve/normalize';
import { proxyFor, remapSpecialKeys } from '@/plugins/steve/resource-proxy';
import { SCHEMA } from '~/config/types';

// TODO: RC STEVE COPY
function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:         [],
      haveAll:      false,
      haveSelector: {}
    };

    // Not enumerable so they don't get sent back to the client for SSR
    Object.defineProperty(cache, 'map', { value: new Map() });

    if ( process.server && !cache.list.__rehydrateAll ) {
      // ${ state.config.namespace }
      Object.defineProperty(cache.list, '__rehydrateAll', { value: `${ type }`, enumerable: true });
    }

    Vue.set(state.types, type, cache);
  }

  return cache;
}

// TODO: RC STEVE COPY
function load(state, { data, ctx, existing }) {
  let type = normalizeType(data.type);
  const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

  // Inject special fields for indexing schemas
  if ( type === SCHEMA ) {
    data._id = normalizeType(data.id);
    data._group = normalizeType(data.attributes?.group);
  }

  const id = data[keyField];

  let cache = registerType(state, type);

  let entry;

  function replace(existing, data) {
    for ( const k of Object.keys(existing) ) {
      delete existing[k];
    }

    remapSpecialKeys(data);

    for ( const k of Object.keys(data) ) {
      Vue.set(existing, k, data[k]);
    }

    return existing;
  }

  if ( existing && !existing.id ) {
    // A specific proxy instance to used was passed in (for create -> save),
    // use it instead of making a new proxy
    entry = replace(existing, data);
    addObject(cache.list, entry);
    cache.map.set(id, entry);
    // console.log('### Mutation added from existing proxy', type, id);
  } else {
    entry = cache.map.get(id);

    if ( entry ) {
      // There's already an entry in the store, update it
      replace(entry, data);
      // console.log('### Mutation Updated', type, id);
    } else {
      // There's no entry, make a new proxy
      entry = proxyFor(ctx, data);
      addObject(cache.list, entry);
      cache.map.set(id, entry);
      // console.log('### Mutation', type, id);
    }
  }

  if ( data.baseType ) {
    type = normalizeType(data.baseType);
    cache = state.types[type];
    if ( cache ) {
      addObject(cache.list, entry);
      cache.map.set(id, entry);
    }
  }
}

export default {
  registerType,
  load,

  // TODO: RC STEVE COPY
  loadMulti(state, { data, ctx }) {
    console.log('### Mutation loadMulti', data.length);
    for ( const entry of data ) {
      load(state, { data: entry, ctx });
    }
    debugger;
  },

  // TODO: RC STEVE COPY?
  loadAll(state, { type, data, ctx }) {
    if (!data) {
      return;
    }

    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
    const proxies = data.map(x => proxyFor(ctx, x));
    const cache = registerType(state, type);

    clear(cache.list);
    cache.map.clear();

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < data.length ; i++ ) {
      cache.map.set(data[i][keyField], proxies[i]);
    }

    cache.haveAll = true;
  },
};
