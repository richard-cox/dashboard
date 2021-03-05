import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import DemoVuexModuleDecorator from '~/store/DemoVuexModuleDecorator';
import i18n from '~/store/i18n';

interface StoreAccessor {
  init: (store: Store<any>) => void;
  demo: DemoVuexModuleDecorator;
  i18n: i18n;
}

function initialiseStores(store: Store<any>): void {
  storeAccessor.demo = getModule(DemoVuexModuleDecorator, store);
  console.error('initialiseStores: ', store);
  storeAccessor.i18n = getModule(i18n, store);
  store.registerModule('i18n', storeAccessor.i18n);
}

const storeAccessor: StoreAccessor = {
  init: initialiseStores,
  demo:  null,
  i18n: null
};

export default storeAccessor;
