<script>
import Markdown from '@shell/components/Markdown';

export default {
  name: 'ExplainPanel',

  components: { Markdown },

  props: {
    definition: {
      type:     Object,
      required: true
    },
    expandAll: {
      type:     Boolean,
      required: true,
    },
    $t: {
      type:     Function,
      required: true,
    }
  },

  data() {
    return {
      isOpen:   false,
      expanded: {},
    };
  },

  mounted() {
    if (this.expandAll) {
      this.fields.forEach((field) => {
        if (field.$$ref) {
          this.expanded[field.name] = this.expandAll;
        }
      });
    }
  },

  watch: {
    expandAll(neu, old) {
      if (neu !== old) {
        this.fields.forEach((field) => {
          if (field.$$ref) {
            this.expanded[field.name] = neu;
          }
        });
      }
    }
  },

  computed: {
    fields() {
      const definition = this.definition?.properties || {};
      const res = [];

      Object.keys(definition).forEach((k) => {
        res.push({
          name: k,
          ...definition[k]
        });
      });

      return res;
    }
  },

  methods: {
    /**
     * Expand a field
     */
    expand(field) {
      this.expanded[field] = !this.expanded[field];
    },
    /**
     * Navigate to a field type - this loads it in place of the current definition,
     * but keeps a breadcrumb trail
     */
    navigate(breadcrumbs) {
      this.$emit('navigate', breadcrumbs);
    }
  }
};
</script>

<template>
  <div
    v-if="definition"
    class="main"
  >
    <div class="title-spacer" />
    <div v-if="definition.description">
      {{ definition.description }}
    </div>
    <div
      v-if="fields.length"
      class="title"
    >
      {{ $t('kubectl-explain.fields') }}
    </div>
    <div
      v-for="(field, i) in fields"
      :key="i"
    >
      <div class="field-section">
        <div class="field">
          {{ field.name }}
          <a
            v-if="field.$moreInfo"
            :href="field.$moreInfo"
            target="_blank"
            class="field-link"
          >
            <i class="icon icon-external-link" />
          </a>
        </div>
        <div
          v-if="field.type && field.type !== 'array'"
          class="field-type"
        >
          <div>
            {{ field.type }}
          </div>
        </div>
        <div
          v-else
          class="field-type-panel"
        >
          <span
            v-if="field.type === 'array'"
            class="mr-5"
          >
            []
          </span>
          <div
            v-if="field.$refName"
            class="field-type field-expander"
            @click="expand(field.name)"
          >
            {{ field.$refNameShort }}
            <i
              v-if="!expanded[field.name]"
              class="icon icon-chevron-down"
            />
            <i
              v-else
              class="icon icon-chevron-up"
            />
          </div>
          <div
            v-else
            class="field-type"
          >
            {{ $t('kubectl-explain.object') }}
          </div>
        </div>
      </div>
      <div class="ml-20">
        <Markdown
          v-if="field.description"
          v-model:value="field.description"
        />
        <div
          v-if="expanded[field.name]"
          class="sub-name"
        >
          <a
            href="#"
            class="sub-type-link"
            @click="navigate(field.$breadcrumbs)"
          >
            {{ field.$refName }}
          </a>
          <a
            href="#"
            class="sub-type-link"
            @click="navigate(field.$breadcrumbs)"
          >
            <i class="sub-name-goto icon icon-upload" />
          </a>
        </div>
        <ExplainPanel
          v-if="expanded[field.name]"
          :expand-all="expandAll"
          :definition="field.$$ref"
          :$t="$t"
          class="embedded"
          @navigate="navigate"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .main {
    overflow: auto;
  }

  .embedded {
    border-bottom: 2px solid var(--primary);
    border: 2px solid var(--primary);
    padding-left: 10px;
    display: flex;
    flex-direction: column;

    .title-spacer {
      margin-top: 10px;
    }
  }

  .sub-name {
    background-color: var(--primary);
    color: var(--primary-text);
    padding: 4px;
    margin-top: 10px;
    display: flex;

    :first-child {
      flex: 1;
    }

    .sub-type-link {
      color: var(--primary-text);
      display: flex;
    }

    .sub-name-goto {
      flex: 0;
      font-size: 16px;
      padding-right: 2px;
    }
  }

  .title {
    text-transform: uppercase;
    margin: 10px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 6px 0;
  }

  .field-section {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 10px;

    .field {
      margin-right: 20px;
    }
  }

  .field-description {
    line-height: 1.25;
    white-space: pre-wrap;
  }

  .field {
    margin: 5px 0;
    font-weight: bold;
    min-width: 100px; // Attempt type name alignment in general case
  }

  .field-type-panel {
    align-items: center;
    display: flex;
  }

  .field-type {
    border: 1px solid var(--border);
    padding: 1px 5px;
    border-radius: 5px;
    opacity: 0.85;
  }

  .field-link {
    margin-left: 10px;

    I {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }
  }

  .field-expander {
    align-items: center;
    display: flex;
    user-select: none;

    > i {
      font-size: 14px;
      padding-left: 8px;
    }

    &:hover {
      border-color: var(--link);
      background-color: var(--link);
      color: var(--link-text);
      cursor: pointer;
    }
  }
</style>
<style lang="scss" scoped>
  .markdown {
    :deep() {
      P {
        line-height: 1.25;
        margin-bottom: 10px;
      }

      LI:not(:last-child) {
        margin-bottom: 10px;
      }

      code {
        font-size: 12.5px;
        line-height: normal;
        padding: 0;
      }
    }
  }
</style>
