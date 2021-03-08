import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import store from '@/typed-store';
import DemoVuexModuleDecorator from '~/typed-store/DemoVuexModuleDecorator';

import i18n from '~/typed-store/i18n';

interface StoreAccessor {
  init: (store: Store<any>) => void;
  demo: DemoVuexModuleDecorator;
  i18n: i18n;
}

function initialiseStores(store: Store<any>): void {
  // const files = (require as any).context('.', false, '/\.ts$');

  // const modules = {};
  // console.error('registerStore');

  // files.keys().forEach((key) => {
  //   if (key === './index.ts') {
  //     return;
  //   }
  //   // modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default;

  //   const namespace = key.replace(/(\.\/|\.ts)/g, '');

  //   console.error(key, namespace);

  //   store.registerModule(namespace, files(key).default);
  // });

  storeAccessor.demo = getModule(DemoVuexModuleDecorator, store);
  console.error('initialiseStores: ', !!store);
  storeAccessor.i18n = getModule(i18n, store);
  store.registerModule('i18n', storeAccessor.i18n, { preserveState: true });
}

const storeAccessor: StoreAccessor = {
  init: initialiseStores,
  demo:  null,
  i18n: null
};

console.error('[!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
// storeAccessor.init(store);

export default storeAccessor;
