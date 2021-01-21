<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import { CHARSET, randomStr } from '@/utils/string';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      default: '',
      type:    String,
    },
    isRandom: {
      default: false,
      type:    Boolean,
    },
    label: {
      default: '',
      type:    String,
    }
  },
  data() {
    return {
      reveal:         false,
      randomPassword: randomStr(16, CHARSET.ALPHA_NUM)
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  created() {
    if (this.isRandom) {
      this.value = this.randomPassword;
    }
  },
  // watch:    {
  //   isRandom(newIsRandom) {
  //     console.log(newIsRandom);
  //     if (newIsRandom) {
  //       this.generatePassword();
  //     }
  //   }
  // },
  // methods: {
  //   generatePassword() {
  //     this.value = ;
  //   },
  // }
};
// TODO: RC last pass compatible
// TODO: RC model/value changed error
// TODO: RC actual submit
</script>

<template>
  <!--autocomplete="new-password"  -->
  <LabeledInput
    v-model.trim="value"
    :type="isRandom || reveal ? 'text' : 'password'"
    :readonly="isRandom"
    :disabled="isRandom"
    :label="label"
    :required="true"
  >
    <template #suffix>
      <div v-if="isRandom" class="addon">
        <a href="#" @click.prevent.stop="$copyText(value)">{{ t('action.copy') }}</a>
      </div>
      <div v-else class="addon">
        <a v-if="reveal" href="#" @click.prevent.stop="reveal = false">{{ t('action.hide') }}</a>
        <a v-else href="#" @click.prevent.stop="reveal=true">{{ t('action.show') }}</a>
      </div>
    </template>
  </LabeledInput>
</template>

<style lang="scss" scoped>
  .labeled-input {
     .addon {
        padding-left: 12px;
        min-width: 65px;
    }
  }

</style>
