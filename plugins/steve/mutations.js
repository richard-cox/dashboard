import { forgetType } from '@/plugins/core-store/mutations';
import { keyForSubscribe } from '@/plugins/steve/subscribe';

export default {
  forgetType(state, type) {
    if ( forgetType(state, type) ) {
      delete state.inError[keyForSubscribe({ type })];
    }
  },
};
