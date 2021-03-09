import { Store } from 'vuex';
import DemoVuexModuleDecorator from '~/typed-store/DemoVuexModuleDecorator';

// TODO: RC Shouldn't need this interface at all?
interface StoreAccessor {
  init: (store: Store<any>) => void;
  demo: DemoVuexModuleDecorator;
  i18n: any;
}

function initialiseStores(store: Store<any>): void {
  // storeAccessor.demo = getModule(DemoVuexModuleDecorator, store);
  // store.registerModule('i18n', storeAccessor.i18n);

  // const i18n = require('~/typed-store/i18n');

  // storeAccessor.i18n = getModule(i18n, store);
  // store.registerModule('i18n', storeAccessor.i18n);
}

const storeAccessor: StoreAccessor = {
  init: initialiseStores,
  demo:  null,
  i18n: null
};

export default storeAccessor;
