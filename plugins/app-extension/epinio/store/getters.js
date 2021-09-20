import { EPINIO_TYPES } from '~/plugins/app-extension/epinio/config/product/epinio';

export default {

  // TODO: RC tie in namespace selector with org

  urlOptions: () => (url, opt) => {
    // TODO: RC EPINIO handle filter, limit, sort
    return url;
  },

  keyFieldForType: () => (type) => {
    switch (type) {
    case EPINIO_TYPES.APP:
      return 'name';
    case EPINIO_TYPES.ORG:
    default:
      return 'id';
    }
  },
};
