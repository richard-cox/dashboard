<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { COUNT } from '~/config/types';

export interface Value {
    label: String;
}

@Component
class TSComponent extends Vue {
    @Prop(Object) value: Value;

    value2: string;

    /**
     *
     */
    constructor() {
      super();
      this.value2 = 'Hello';

      console.log('this.$store.getters[`cluster/all`](COUNT)[0].counts: ', this.$store.getters[`cluster/all`](COUNT)[0].counts);
    }
}

export default TSComponent;

</script>

<template>
  <div>{{ value2 }}{{ value.label }}</div>
</template>
