<script>
import { get } from '@/utils/object';

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    reference: {
      type:    String,
      default: null,
    }
  },

  computed: {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },

    label() {
      return this.value || this.row?.nameDisplay;
    }
  }
};
</script>

<template>
  <span>
    <n-link v-if="to" :to="to">
      {{ label }}
    </n-link>
  </span>
</template>
