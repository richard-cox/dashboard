import { EXTENSION_PREFIX } from '@/utils/extensions';

export default {
// TODO: RC FIXME <x>Location should use optionsFor.customRoute in a base epinio resource-instance
  detailLocation() {
    return {
      ...this._detailLocation,
      name: `${ EXTENSION_PREFIX }-epinio-c-cluster-resource-id`,
    };
  },
};
