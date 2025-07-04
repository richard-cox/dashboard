<script lang="ts">
import BadgeState from '@pkg/rancher-components/src/components/BadgeState/BadgeState.vue';
import { RouteLocationRaw } from 'vue-router';
import Title from '@shell/components/Resource/Detail/TitleBar/Title.vue';
import Top from '@shell/components/Resource/Detail/TitleBar/Top.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '~/pkg/rancher-components/src/components/RcButton/RcButton.vue';

export interface Badge {
  color: 'bg-success' | 'bg-error' | 'bg-warning' | 'bg-info';
  label: string;
}

export interface TitleBarProps {
  resourceTypeLabel: string;
  resourceName: string;

  resourceTo?: RouteLocationRaw;
  description?: string;
  badge?: Badge;

  // This should be replaced with a list of menu items we want to render.
  // I don't have the time right now to swap this out though.
  actionMenuResource?: any;

  onShowConfiguration?: () => void;
}

const showConfigurationIcon = require(`@shell/assets/images/icons/document.svg`);
</script>

<script setup lang="ts">
const {
  resourceTypeLabel, resourceTo, resourceName, description, badge, onShowConfiguration
} = defineProps<TitleBarProps>();

const store = useStore();
const i18n = useI18n(store);

const emit = defineEmits(['show-configuration']);
</script>

<template>
  <div class="title-bar">
    <Top>
      <Title>
        <router-link
          v-if="resourceTo"
          :to="resourceTo"
          class="resource-link"
        >
          {{ resourceTypeLabel }}:
        </router-link>
        <span
          v-else
          class="resource-text"
        >
          {{ resourceTypeLabel }}:
        </span>
        <span class="resource-name">
          {{ resourceName }}
        </span>
        <BadgeState
          v-if="badge"
          :color="badge.color"
          :label="badge.label"
        />
      </Title>
      <div class="actions">
        <RcButton
          v-if="onShowConfiguration"
          class="show-configuration"
          :primary="true"
          :aria-label="i18n.t('component.resource.detail.titleBar.ariaLabel.showConfiguration', { resource: resourceName })"
          @click="emit('show-configuration')"
        >
          <img
            :src="showConfigurationIcon"
            class="mmr-3"
          >
          {{ i18n.t('component.resource.detail.titleBar.showConfiguration') }}
        </RcButton>
        <ActionMenu
          v-if="actionMenuResource"
          class="title-bar-action-menu"
          button-role="multiAction"
          :resource="actionMenuResource"
          data-testid="masthead-action-menu"
        />
      </div>
    </Top>
    <div
      v-if="description"
      class="bottom description"
    >
      {{ description }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-bar {
  &:deep() .badge-state {
    font-size: 16px;
    margin-left: 4px;
    top: -4px;
    position: relative;
  }

  &:deep() button[data-testid="masthead-action-menu"] {
    border-radius: 4px;
    width: 35px;
    height: 40px;
    margin-left: 16px;

    display: inline-flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
}
</style>
