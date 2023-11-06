<script lang="ts">
import Vue from 'vue';
import ChangeIndicator, { ChangeIndicatorTestResult } from '@shell/utils/change-indicator';

interface Data {
  state: ChangeIndicatorTestResult,
  enabled: boolean
}
export default Vue.extend<Data, any, any, any>({
  components: { },

  props: {
    value: {
      type:    [String, Array, Object, Number], // TODO: RC
      default: null
    },

    displayValue: {
      type:    [String, Number], // TODO: RC
      default: null
    },

    indicatorKey: {
      type:    String,
      default: null
    }
  },

  data() {
    return {
      state:   null,
      enabled: this.indicatorKey ? ChangeIndicator.hasIndicator(this.indicatorKey) : false,
    };
  },

  watch: {
    value(neu, old) {
      Vue.set(this, 'state', ChangeIndicator.changed(this.indicatorKey, old, neu));
    }
  }
});
</script>

<template>
  <div class="base">
    <!-- {{ displayValue }} -->
    <slot />
    <i
      v-if="enabled && state && state.increased"
      class="icon icon-chevron-up"
      :class="{'trigger': state.increased, 'positive': state.positive}"
    />
    <i
      v-if="enabled && state && !state.increased"
      class="icon icon-chevron-down"
      :class="{'trigger': state.increased === false, 'positive': state.positive}"
    />
  </div>
</template>

<style lang="scss" scoped>
  .base {
    display: flex;
    align-items: center;
  }
  @keyframes fadeOut{
    from {opacity :1;}
    to {opacity :0;}
  }

  .icon.trigger {
    opacity: 1;
    animation: fadeOut 2s forwards;
    animation-delay: 5s;
  }

  .icon {
    opacity: 0;
    font-size: $font-size-h2;

    &.positive {
      color: var(--success);
    }

    color: var(--error);
  }
</style>
