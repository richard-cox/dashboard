import { isArray } from '@/utils/array';

import SteveModel from './steve-class';
import HybridModel from './hybrid-class';
import NormanModel from './norman-class';

export const NORMAN = 'norman';// TODO: RC rename
export const STEVE = 'steve';
export const BY_TYPE = 'byType';

export default {
  urlOptions: () => (url, opt) => {
    opt = opt || {};

    // Filter
    if ( opt.filter ) {
      const keys = Object.keys(opt.filter);

      keys.forEach((key) => {
        let vals = opt.filter[key];

        if ( !isArray(vals) ) {
          vals = [vals];
        }

        vals.forEach((val) => {
          url += `${ (url.includes('?') ? '&' : '?') + encodeURIComponent(key) }=${ encodeURIComponent(val) }`;
        });
      });
    }
    // End: Filter

    // Limit
    const limit = opt.limit;

    if ( limit ) {
      url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
    }
    // End: Limit

    // Sort
    const sortBy = opt.sortBy;

    if ( sortBy ) {
      url += `${ url.includes('?') ? '&' : '?' }sort=${ encodeURIComponent(sortBy) }`;
    }

    const orderBy = opt.sortOrder;

    if ( orderBy ) {
      url += `${ url.includes('?') ? '&' : '?' }order=${ encodeURIComponent(orderBy) }`;
    }
    // End: Sort

    return url;
  },

  defaultModel: state => (obj) => {
    const which = state.config.modelBaseClass || STEVE;

    if ( which === BY_TYPE ) {
      if ( obj?.type?.startsWith('management.cattle.io.') || obj?.type?.startsWith('project.cattle.io.')) {
        return HybridModel;
      } else {
        return SteveModel;
      }
    } else if ( which === NORMAN ) {
      return NormanModel;
    } else {
      return SteveModel;
    }
  },
};
