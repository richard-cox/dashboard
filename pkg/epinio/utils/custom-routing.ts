import { EPINIO_PRODUCT_NAME } from '../types';

export const EXTENSION_PREFIX = 'ext';// TODO: RC can remove?

export const rootEpinioRoute = () => ({
  name:    `${ EXTENSION_PREFIX }-epinio`,
  params:  { e: EPINIO_PRODUCT_NAME },
});

export const createEpinioRoute = (name: string, params: Object) => ({
  name:   `${ rootEpinioRoute().name }-${ name }`,
  params: {
    ...rootEpinioRoute().params,
    ...params
  }
});
