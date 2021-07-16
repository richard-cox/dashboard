
import { SCHEMA } from '@/config/types';
import { normalizeType } from '@/plugins/steve/normalize';
import mutations from './mutations';

export default {

  // TODO: RC STEVE COPY?
  all: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      // Yes this is mutating state in a getter... it's not the end of the world..
      // throw new Error(`All of ${ type } is not loaded`);
      console.warn(`All of ${ type } is not loaded yet`); // eslint-disable-line no-console
      mutations.registerType(state, type);
    }

    return state.types[type].list;
  },
  // TODO: RC STEVE COPY
  byId: (state, getters) => (type, id) => {
    debugger;
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.map.get(id);
    }
  },
  // getInstances: (state, getters) => () => {
  //   return state.types.list.epinios;
  // },
  // getOrgs: (state, getters) => () => {
  //   return state.types.list.orgs;
  // },
  // getApps: (state, getters) => () => {
  //   return state.types.list.apps;
  // },
  // TODO: RC STEVE COPY?
  normalizeType: () => (type) => {
    return normalizeType(type);
  },
  // TODO: RC STEVE COPY?
  haveAll: (state, getters) => (type) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.haveAll || false;
    }

    return false;
  },
  // TODO: RC STEVE COPY?
  typeRegistered: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    return !!state.types[type];
  },
  // TODO: RC STEVE COPY?
  schemaFor: (state, getters) => (type, fuzzy = false, allowThrow = true) => {
    const schemas = state.types[SCHEMA];

    type = normalizeType(type);

    if ( !schemas ) {
      if ( allowThrow ) {
        throw new Error("Schemas aren't loaded yet");
      } else {
        return null;
      }
    }

    const out = schemas.map.get(type);

    if ( !out && fuzzy ) {
      const close = getters.schemaName(type);

      if ( close ) {
        return getters.schemaFor(close);
      }
    }

    return out;
  },
  // TODO: RC STEVE COPY?
  urlFor: (state, getters) => (type, id, opt) => {
    // https://epinio.10.86.1.49.omg.howdoi.website
    return `/proxy/api/v1/${ type }`;
  },
};
