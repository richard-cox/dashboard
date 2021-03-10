<script>
import LinkDetail from './LinkDetail';

export default {
  components: { LinkDetail },
  props:      {
    value: {
      type:     Array,
      default: () => []
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
};
</script>

<template>
  <!-- TODO: RC W add comma, test in other use (:row="row" -> :row="el") -->
  <!-- TODO: RC W optional - truncate if too long -->
  <span>
    <LinkDetail v-for="el in value" :key="el.key" :row="el" v-bind="el" />
  </span>
</template>
