import https from 'https';

import { SCHEMA } from '@/config/types';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/config/product/epinio';
import { normalizeType } from '@/plugins/core-store/normalize';
import { handleSpoofedRequest } from '~/plugins/core-store/actions';

// TODO: RC EPINIO Review all epinio mutations/actions/gettters

export default {
  async request({ dispatch, rootGetters }, { opt, type }) {
    // TODO: RC FIX now that the requests work these are an odd type of spoof ()
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_PRODUCT_NAME, opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    // opt.headers = { 'x-api-host': 'https://epinio.10.86.1.49.omg.howdoi.website' }; // TODO: RC fetch from cluster
    opt.headers = {
      'x-api-host':    'https://epinio.172.27.0.2.omg.howdoi.website',
      Authorization: 'Basic <snip>'
    }; // TODO: RC EPINIO AUTH fetch from cluster

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

      // TODO: RC evaluate

      const fromHeader = res.headers['x-api-cattle-auth'];

      if ( fromHeader && fromHeader !== rootGetters['auth/fromHeader'] ) {
        dispatch('auth/gotHeader', fromHeader, { root: true });
      }

      if ( res.status === 204 || out === null ) {
        out = {};
      }

      // TODO: EPINIO - BE - orgs call returns array of strings!
      if (Array.isArray(out)) {
        out = {
          data: out.map((o) => {
            if (typeof o === 'string') {
              return { id: o, type };
            }

            return {
              ...o,
              id: o.name,
              type
            };
          })
        };
      } else {
        // `find` turns this into `{data: out}`
        out = {
          ...out,
          id: out.name,
          type
        };
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

  loadSchemas: (ctx) => {
    const { commit, rootGetters } = ctx;
    const res = {
      data: [{
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.INSTANCE,
        type:              'schema',
        collectionMethods: ['post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP,
        type:              'schema',
        // TODO: RC BE v1/apps available?
        links:             { collection: '/proxy/api/v1/orgs/workspace/applications' },
        collectionMethods: ['post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.ORG,
        type:              'schema',
        links:             { collection: '/proxy/api/v1/orgs' },
        collectionMethods: ['POST'],
      }]
    };

    const spoofedTypes = rootGetters['type-map/allSpoofedSchemas'].filter(st => st.product === EPINIO_PRODUCT_NAME);

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
  }

};
