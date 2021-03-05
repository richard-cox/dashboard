import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import DemoVuexModuleDecorator from '~/store/DemoVuexModuleDecorator';

// let abc: typedVuexModuleDecorator;

// function initialiseStores(store: Store<any>): void {
//   console.error('initialiseStores');
//   abc = getModule(typedVuexModuleDecorator, store);
//   console.error('initialiseStores abc', abc);
// }

// export default {
//   initialiseStores,
//   abc
// };

interface StoreAccessor {
  init: (store: Store<any>) => void
  demo: DemoVuexModuleDecorator
}

function initialiseStores(store: Store<any>): void {
  accessors.demo = getModule(DemoVuexModuleDecorator, store);
}

const accessors: StoreAccessor = {
  init: initialiseStores,
  demo:  null
};

export default accessors;
