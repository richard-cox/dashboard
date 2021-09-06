import { EPINIO_PRODUCT_NAME } from '@/plugins/app-extension/epinio/config/product/epinio';
import { EXTENSION_PREFIX } from '@/utils/extensions';

// TODO: RC DISCUSS Comment routing is ext-<extension>-c-<epinio instance>-<epinio resource>

export const rootEpinioRoute = () => ({
  name:    `${ EXTENSION_PREFIX }-epinio`,
  params:  { e: EPINIO_PRODUCT_NAME },
});

export const createEpinioRoute = (name, params) => ({
  name:   `${ rootEpinioRoute().name }-${ name }`,
  params: {
    ...rootEpinioRoute().params,
    ...params
  }
});

// TODO: RC handle on log out
