import store, { createStore } from '@/typed-store';
import storeAccessor from '@/utils/store-accessor';

console.error('store/index.ts: ', !!store);
// storeAccessor.init(store);

export default createStore;
