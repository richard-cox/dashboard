<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretSelector from '@shell/components/form/SecretSelector';
import { Checkbox } from '@components/Form/Checkbox';
import { _CREATE } from '@shell/config/query-params';
import { updatePort, protocol, sslVersions } from './utils';

export default {
  components: {
    LabeledInput, LabeledSelect, SecretSelector, Checkbox
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  },
  data() {
    if (this.mode === _CREATE) {
      // Set default values only if no values are already
      // present. This allows changes to default values to persist
      // after navigating to YAML and back.

      // Require SSL verification by default
      if (typeof this.value.ssl_verify === 'undefined') {
        this.value['ssl_verify'] = true;
      }

      // Use the SSL version TLSv1_2 by default to match Ember
      if (typeof this.value.ssl_version === 'undefined') {
        this.value['ssl_version'] = sslVersions[0];
      }

      // Suppress type name by default
      if (typeof this.value.suppress_type_name === 'undefined') {
        this.value['suppress_type_name'] = true;
      }
    }

    return { protocolOptions: protocol, sslVersions };
  },
  computed: {
    port: {
      get() {
        return this.value.port;
      },
      set(port) {
        updatePort((value) => (this.value['port'] = value), port);
      }
    }
  }
};
</script>

<template>
  <div class="opensearch">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-2">
        <LabeledSelect
          v-model:value="value.scheme"
          :mode="mode"
          :disabled="disabled"
          class="scheme"
          :options="protocolOptions"
          :label="t('logging.elasticsearch.scheme')"
        />
      </div>
      <div class="col span-8">
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          :disabled="disabled"
          class="host"
          :label="t('logging.elasticsearch.host')"
        />
      </div>
      <div class="col span-2">
        <LabeledInput
          v-model.number="port"
          :mode="mode"
          :disabled="disabled"
          class="port"
          type="number"
          min="1"
          max="65535"
          :label="t('logging.elasticsearch.port')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.index_name"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.indexName')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.user"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.user')"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.password"
          :secret-name-label="t('logging.elasticsearch.password')"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.ca_file"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.elasticsearch.caFile.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.client_cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.elasticsearch.clientCert.label')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.client_key"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.elasticsearch.clientKey.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.client_key_pass"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.elasticsearch.clientKeyPass')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6 vertically-center">
        <Checkbox
          v-model:value="value.ssl_verify"
          :label="t('logging.elasticsearch.verifySsl')"
          :disabled="disabled"
          :mode="mode"
        />
        <Checkbox
          v-model:value="value.suppress_type_name"
          :label="t('logging.elasticsearch.suppressTypeName.label')"
          :tooltip="t('logging.elasticsearch.suppressTypeName.openSearchTips')"
          :disabled="disabled"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
<style>
.row {
  margin-bottom: 5px;
}
.vertically-center {
  padding: 20px 0;
}
</style>
