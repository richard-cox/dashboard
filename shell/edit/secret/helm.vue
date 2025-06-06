<script>
import CodeMirror from '@shell/components/CodeMirror';
import Loading from '@shell/components/Loading.vue';
import myLogger from '@shell/utils/my-logger';
import { debounce } from 'lodash';
import Banner from '@components/Banner/Banner.vue';

export default {
  components: {
    CodeMirror,
    Loading,
    Banner,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    }
  },
  data() {
    return {
      debounceValidation: debounce(this.validate, 1000),
      error:              null,
    };
  },

  async fetch() {
    const helmData = await this.value.fetchHelmData();

    this.helmData = JSON.stringify(helmData, null, ' ');
  },

  watch: {},

  methods: {
    onInput(neu) {
      myLogger.warn('onInput', typeof neu);
    },

    validate(testString) {
      try {
        JSON.parse(testString);
        this.value.data = testString;
        this.error = undefined;
      } catch (e) {
        this.error = e; // TODO: RC wire this in to tab validation, and block submit
        // TODO: RC UX components bobbles on invalid --> valid --> invalid
      }
      // this.value.setData('.dockerconfigjson', this.dockerconfigjson);
    },

    onValidationChanged(neu) {
      myLogger.warn('onValidationChanged', neu);
    },
  },

  computed: {
    codeMirrorOptions() {
      const readOnly = this.mode === 'view';
      const gutters = [];

      if ( !readOnly ) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'application/json',
        lineNumbers:     !readOnly,
        styleActiveLine: false,
        tabSize:         2,
        indentWithTabs:  false,
        cursorBlinkRate: ( readOnly ? -1 : 530 ),
      };
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <!-- class="mt-0" -->

    <Banner
      v-if="error"
      color="error"
      data-testid="aks-pool-upgrade-banner"
    >
      <!-- TODO: RC -->
      <!-- label-key="aks.nodePools.orchestratorVersion.warning" -->
      {{ error }}
    </Banner>
    <div class="row mb-20">
      <CodeMirror
        class="mt-20 promql-input"
        :value="helmData"
        :options="codeMirrorOptions"
        :showKeyMapBox="true"
        :mode="mode"
        @onInput="debounceValidation"
        @validationChanged="onValidationChanged"
      />
    </div>
  </div>
</template>
