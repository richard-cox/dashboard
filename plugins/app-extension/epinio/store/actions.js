import https from 'https';
import cloneDeep from 'lodash/cloneDeep';

import { SCHEMA } from '@/config/types';
import { normalizeType } from '@/plugins/steve/normalize';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/config/product/epinio';
import { _ALL, _ALL_IF_AUTHED, _MULTI, _NONE } from '@/plugins/steve/actions';
import { SPOOFED_API_PREFIX, SPOOFED_PREFIX } from '@/store/type-map';
import { createYaml } from '@/utils/create-yaml';
import { proxyFor, SELF } from '~/plugins/steve/resource-proxy';

export default {
  async request({ dispatch, rootGetters }, opt) {
    // Handle spoofed types instead of making an actual request
    // Spoofing is handled here to ensure it's done for both yaml and form editing.
    // It became apparent that this was the only place that both intersected
    if (opt.url.includes(SPOOFED_PREFIX) || opt.url.includes(SPOOFED_API_PREFIX)) {
      // TODO: RC this won't work for random urls
      const [empty, scheme, type, ...rest] = opt.url.split('/'); // eslint-disable-line no-unused-vars
      const id = rest.join('/'); // Cover case where id contains '/'
      const isApi = scheme === SPOOFED_API_PREFIX;
      const typemapGetter = id ? 'getSpoofedInstance' : 'getSpoofedInstances';

      const schemas = rootGetters['cluster/all'](SCHEMA);
      // getters return async getSpoofedInstance/getSpoofedInstances fn
      const instance = await rootGetters[`type-map/${ typemapGetter }`](type, id);
      const data = isApi ? createYaml(schemas, type, instance) : instance;

      return id && !isApi ? data : { data };
    }

    debugger;
    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    // opt.headers = { 'x-api-host': 'https://epinio.10.86.1.49.omg.howdoi.website' }; // TODO: RC fetch from cluster
    opt.headers = {
      'x-api-host':    'https://epinio.172.27.0.2.omg.howdoi.website',
      Authorization: 'Basic <snip>'
    }; // TODO: RC fetch from cluster

    return this.$axios(opt).then((res) => {
      if ( opt.depaginate ) {
        // @TODO but API never sends it
        /*
        return new Promise((resolve, reject) => {
          const next = res.pagination.next;
          if (!next ) [
            return resolve();
          }

          dispatch('request')
        });
        */
      }

      if ( opt.responseType ) {
        return res;
      } else {
        return responseObject(res);
      }
    }).catch((err) => {
      if ( !err || !err.response ) {
        return Promise.reject(err);
      }

      const res = err.response;

      // TODO: RC evaluate
      // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
      if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
        dispatch('auth/logout', opt.logoutOnError, { root: true });
      }

      if ( typeof res.data !== 'undefined' ) {
        return Promise.reject(responseObject(res));
      }

      return Promise.reject(err);
    });

    function responseObject(res) {
      let out = res.data;

      debugger;

      // TODO: RC evaluate

      const fromHeader = res.headers['x-api-cattle-auth'];

      if ( fromHeader && fromHeader !== rootGetters['auth/fromHeader'] ) {
        dispatch('auth/gotHeader', fromHeader, { root: true });
      }

      if ( res.status === 204 || out === null ) {
        out = {};
      }

      // if ( typeof out !== 'object' ) {

      // TODO: Epinio - orgs call returns array of strings!
      if (Array.isArray(out)) {
        out = out.map((o) => {
          if (typeof o === 'string') {
            return { id: o, type: EPINIO_TYPES.ORG }; // TODO: RC Type
          }

          throw new Error('HMMM');
        });
      }

      // TODO: RC Epinio

      if (!out.data) {
        out = { data: out };
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
        _url:        { value: opt.url },
      });

      return out;
    }
  },

  // TODO: RC STEVE COPY?
  loadSchemas: (ctx) => {
    const {
      getters, dispatch, commit, rootGetters
    } = ctx;
    const res = { data: [] };
    const res2 = rootGetters['type-map/allSpoofedSchemas'];
    const spoofedTypes = res2.filter(st => st.product === EPINIO_PRODUCT_NAME); // <------- except for this

    res.data = res.data.concat(spoofedTypes);

    res.data.forEach((schema) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });
  },

  // TODO: RC STEVE COPY?
  async findAll(ctx, { type, opt }) {
    const {
      getters, commit, dispatch, rootGetters
    } = ctx;

    opt = opt || {};
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( opt.force !== true && getters['haveAll'](type) ) {
      return getters.all(type);
    }

    console.log(`Find All: [${ ctx.state.config.namespace }] ${ type }`); // eslint-disable-line no-console
    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);

    // TODO: RC
    const token = Buffer.from(`a315b1227e803013:6f6ff702343361c9`, 'utf8').toString('base64');

    opt.headers = { Authorization: `Basic ${ token }` };

    const res = await dispatch('request', opt);

    let load = _ALL;

    if ( opt.load === false || opt.load === _NONE ) {
      load = _NONE;
    } else if ( opt.load === _ALL_IF_AUTHED ) {
      const header = rootGetters['auth/fromHeader'];

      if ( `${ header }` === 'true' || `${ header }` === 'none' ) {
        load = _ALL;
      }

      load = _MULTI;
    }

    debugger;
    if ( load === _NONE ) {
      return res;
    } else if ( load === _MULTI ) {
      // This has the effect of adding the response to the store,
      // without replacing all the existing content for that type,
      // and without marking that type as having 'all 'loaded.
      //
      // This is used e.g. to load a partial list of settings before login
      // while still knowing we need to load the full list later.
      commit('loadMulti', {
        ctx,
        data: res.data
      });
    } else {
      commit('loadAll', {
        ctx,
        type,
        data: res.data
      });
    }

    // if ( opt.watch !== false ) {
    //   dispatch('watch', {
    //     type,
    //     revision:  res.revision,
    //     namespace: opt.watchNamespace
    //   });
    // }

    const all = getters.all(type);

    return all;
  },

  // opt:
  //  filter: Filter by fields, e.g. {field: value, anotherField: anotherValue} (default: none)
  //  limit: Number of reqords to return per page (default: 1000)
  //  sortBy: Sort by field
  //  sortOrder: asc or desc
  //  url: Use this specific URL instead of looking up the URL for the type/id.  This should only be used for bootstraping schemas on startup.
  //  @TODO depaginate: If the response is paginated, retrieve all the pages. (default: true)
  async find(ctx, { type, id, opt }) {
    const { getters, dispatch } = ctx;

    opt = opt || {};

    type = normalizeType(type);

    console.log(`Find: [${ ctx.state.config.namespace }] ${ type } ${ id }`); // eslint-disable-line no-console
    let out;

    if ( opt.force !== true ) {
      out = getters.byId(type, id);

      if ( out ) {
        return out;
      }
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, id, opt);

    const res = await dispatch('request', opt);

    await dispatch('load', { data: res });

    if ( opt.watch !== false ) {
      const watchMsg = {
        type,
        id,
        revision: res?.metadata?.resourceVersion,
        force:    opt.forceWatch === true,
      };

      const idx = id.indexOf('/');

      if ( idx > 0 ) {
        watchMsg.namespace = id.substr(0, idx);
        watchMsg.id = id.substr(idx + 1);
      }

      // dispatch('watch', watchMsg); // TODO: RC
    }

    out = getters.byId(type, id);

    return out;
  },

  load(ctx, { data, existing }) {
    const { getters, commit } = ctx;

    let type = normalizeType(data.type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( data.baseType && data.baseType !== data.type ) {
      type = normalizeType(data.baseType);

      if ( !getters.typeRegistered(type) ) {
        commit('registerType', type);
      }
    }

    const id = data?.id || existing?.id;

    if ( !id ) {
      console.warn('Attempting to load a resource with no id', data, existing); // eslint-disable-line no-console

      return;
    }

    commit('load', {
      ctx,
      data,
      existing
    });

    if ( type === SCHEMA ) {
      commit('type-map/schemaChanged', null, { root: true });
    }

    return getters['byId'](type, id);
  },

  loadMulti(ctx, data) {
    const { commit } = ctx;

    commit('loadMulti', {
      data,
      ctx,
    });
  },

  loadAll(ctx, { type, data }) {
    const { commit } = ctx;

    commit('loadAll', {
      ctx,
      type,
      data
    });
  },

  create(ctx, data) {
    return proxyFor(ctx, data);
  },

  clone(ctx, { resource } = {}) {
    const copy = cloneDeep(resource[SELF]);

    return proxyFor(ctx, copy, true);
  },
};
