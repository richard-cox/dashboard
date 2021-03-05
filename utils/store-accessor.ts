import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import DemoVuexModuleDecorator from '~/store/DemoVuexModuleDecorator';

interface StoreAccessor {
  init: (store: Store<any>) => void
  demo: DemoVuexModuleDecorator
}

function initialiseStores(store: Store<any>): void {
  storeAccessor.demo = getModule(DemoVuexModuleDecorator, store);
}

const storeAccessor: StoreAccessor = {
  init: initialiseStores,
  demo:  null
};

export default storeAccessor;
