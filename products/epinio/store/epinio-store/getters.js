
export default {

  urlFor: (state, getters) => (type, id, opt) => {
    opt = opt || {};
    type = getters.normalizeType(type);
    let url = opt.url;

    if ( !url ) {
      const schema = getters.schemaFor(type);

      if ( !schema ) {
        throw new Error(`Unknown schema for type: ${ type }`);
      }

      url = schema.links.collection;

      if ( id ) {
        const slash = id.indexOf('/');

        if (schema.attributes?.namespaced && slash > 0) {
          const ns = id.slice(0, slash);
          const realId = id.slice(slash + 1, id.length);
          const type = url.indexOf(schema.id);

          url = `${ url.slice(0, type) }namespaces/${ ns }/${ url.slice(type, url.length) }/${ realId }`;
        } else {
          url += `/${ id }`;
        }
      }
    }

    debugger;

    if ( !url.startsWith('/') && !url.startsWith('http') ) {
      const baseUrl = state.config.baseUrl.replace(/\/$/, '');

      // `/k8s/clusters/<id>`     | Proxy straight to the native k8s API for the given downstream cluster
      // http://localhost:8001/api/v1/namespaces/wwwnginx/services/http:my-nginx-clusterip:80/proxy/
      // /k8s/clusters/<id>/api/v1/namespaces/epinio/services/http:epinio-service:80/proxy/

      // url = `${ baseUrl }/${ url }`;
      // url = `/k8s/clusters/c-m-qrg6z8zz/api/v1/namespaces/epinio/services/http:epinio-server:80/proxy/${ url }`;
      // url = `/k8s/clusters/c-m-qrg6z8zz/v1/namespaces/`;
    }

    url = getters.urlOptions(url, opt);

    return url;
  },

  urlOptions: () => (url, opt) => {
    // This is where Epinio API filter, limit, sort will be applied
    return url;
  },

};
