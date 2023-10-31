<script>
import Vue from 'vue';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { mapGetters, mapState } from 'vuex';
import {
  mapPref,
  FAVORITE_TYPES
} from '@shell/store/prefs';
import { getVersionInfo } from '@shell/utils/version';
import {
  addObjects, replaceWith, clear, addObject, sameContents
} from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';

import {
  HCI, CATALOG, UI, SCHEMA, COUNT
} from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { TYPE_MODES } from '@shell/store/type-map';
import { NAME as NAVLINKS } from '@shell/config/product/navlinks';
import Group from '@shell/components/nav/Group';
import { diff } from '@shell/utils/object';

export default {
  name:       'SideNav',
  components: { Group },
  data() {
    return {
      groups:        [],
      gettingGroups: false,
      visibleCounts: null,
    };
  },

  created() {
    this.queueUpdate = debounce(this.getGroups, 1000);

    this.getGroups();
  },

  mounted() {
    // Sync the navigation tree on fresh load
    this.$nextTick(() => this.syncNav());
  },

  watch: {
    counts(a, b) {
      if ( a !== b ) {
        console.info('queueUpdate: getGroups: counts', a, b);
        // this.queueUpdate();
      }
    },

    allSchemasIds(a, b) {
      if ( !sameContents(a, b)) {
        console.info('queueUpdate: getGroups: allSchemasIds');
        this.queueUpdate();
      }
    },

    allNavLinks(a, b) {
      if ( a !== b ) {
        console.info('queueUpdate: getGroups: allNavLinks');
        this.queueUpdate();
      }
    },

    favoriteTypes(a, b) {
      if ( !isEqual(a, b) ) {
        console.info('queueUpdate: getGroups: favoriteTypes');
        this.queueUpdate();
      }
    },

    locale(a, b) {
      if ( !isEqual(a, b) ) {
        console.info('queueUpdate: getGroups: locale');
        this.getGroups();
      }
    },

    productId(a, b) {
      if ( a !== b) {
        // Immediately update because you'll see it come in later
        console.info('getGroups: productId');
        this.getGroups();
      }
    },

    namespaceMode(a, b) {
      if ( a !== b ) {
        // Immediately update because you'll see it come in later
        console.info('getGroups: namespaceMode');

        this.getGroups();
      }
    },

    namespaces(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        console.info('getGroups: namespaces');

        this.getGroups();
      }
    },

    clusterReady(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        console.info('getGroups: clusterReady');

        this.getGroups();
      }
    },

    $route(a, b) {
      this.$nextTick(() => this.syncNav());
    },

  },

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'clusterId', 'currentProduct', 'isSingleProduct', 'namespaceMode', 'isExplorer', 'isVirtualCluster']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel', availableLocales: 'i18n/availableLocales' }),
    ...mapGetters('type-map', ['activeProducts']),

    favoriteTypes: mapPref(FAVORITE_TYPES),

    showClusterTools() {
      return this.isExplorer &&
             this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
             this.$store.getters['cluster/canList'](CATALOG.APP);
    },

    supportLink() {
      const product = this.currentProduct;

      if (product?.supportRoute) {
        return { ...product.supportRoute, params: { ...product.supportRoute.params, cluster: this.clusterId } };
      }

      return { name: `c-cluster-${ product?.name }-support` };
    },

    displayVersion() {
      if (this.isSingleProduct?.getVersionInfo) {
        return this.isSingleProduct?.getVersionInfo(this.$store);
      }
      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },

    singleProductAbout() {
      return this.isSingleProduct?.aboutPage;
    },

    harvesterVersion() {
      return this.$store.getters['cluster/byId'](HCI.SETTING, 'server-version')?.value || 'unknown';
    },

    showProductFooter() {
      if (this.isVirtualProduct) {
        return true;
      } else {
        return false;
      }
    },

    isVirtualProduct() {
      return this.currentProduct.name === HARVESTER;
    },

    allNavLinks() {
      if ( !this.clusterId || !this.$store.getters['cluster/schemaFor'](UI.NAV_LINK) ) {
        return [];
      }

      return this.$store.getters['cluster/all'](UI.NAV_LINK);
    },

    allSchemasIds() {
      const managementReady = this.managementReady;
      const product = this.currentProduct;

      if ( !managementReady || !product ) {
        return [];
      }

      // This does take some up-front time, however avoids an even more costly getGroups call
      return this.$store.getters[`${ product.inStore }/all`](SCHEMA).map((s) => s.id).sort();
    },

    counts() {
      const managementReady = this.managementReady;
      const product = this.currentProduct;

      if ( !managementReady || !product ) {
        return {};
      }

      const inStore = product.inStore;

      console.info('watch', 'counts', this.visibleCounts, this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts);

      // So that there's something to watch for updates
      const counts = this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};

      return this.visibleCounts?.reduce((res, vc) => {
        res[vc] = counts[vc];

        return res;
      }, {});
    },

    namespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },
  },

  methods: {
    calcVisibleCounts(refs = this.$refs.groups) {
      const a = refs?.reduce((types, grp) => {
        if (grp._name === '<Group>') {
          if (!grp.isExpanded) {
            return types;
          }

          types.push(...this.calcVisibleCounts(grp.$children));
        } else if (grp._name === '<Type>') {
          types.push(grp.type.name);
        }

        return types;
      }, []);

      return a;
    },

    /**
     * Fetch navigation by creating groups from product schemas
     */
    getGroups() {
      const getGroups = `TIMING: getGroups fn TOTAL (id: ${ Date.now() })`;
      const getProductsGroupsS = 'TIMING: getProductsGroups';
      // const getExplorerGroups = 'getExplorerGroups';

      console.time(getGroups);
      if ( this.gettingGroups ) {
        return;
      }
      this.gettingGroups = true;

      if ( !this.clusterReady ) {
        clear(this.groups);
        this.gettingGroups = false;

        return;
      }

      const currentProduct = this.$store.getters['productId'];
      let namespaces = null;

      if ( !this.$store.getters['isAllNamespaces'] ) {
        const namespacesObject = this.$store.getters['namespaces']();

        namespaces = Object.keys(namespacesObject);
      }

      // Always show cluster-level types, regardless of the namespace filter
      const namespaceMode = 'both';
      const out = [];
      const loadProducts = this.isExplorer ? [EXPLORER] : [];

      const productMap = this.activeProducts.reduce((acc, p) => {
        return { ...acc, [p.name]: p };
      }, {});

      if ( this.isExplorer ) {
        for ( const product of this.activeProducts ) {
          if ( product.inStore === 'cluster' ) {
            addObject(loadProducts, product.name);
          }
        }
      }

      // This should already have come into the list from above, but in case it hasn't...
      addObject(loadProducts, currentProduct);

      console.time(getProductsGroupsS);

      this.getProductsGroups(out, loadProducts, namespaceMode, namespaces, productMap);

      console.timeEnd(getProductsGroupsS);

      // console.time(getExplorerGroups);

      this.getExplorerGroups(out);

      // console.timeEnd(getExplorerGroups);

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label'], undefined));

      this.gettingGroups = false;
      console.timeEnd(getGroups);
    },

    getProductsGroups(out, loadProducts, namespaceMode, namespaces, productMap) {
      const timeStamp = `getProductsGroups fn (id: ${ Date.now() })`;

      // console.group(timeStamp);
      const getProductsGroups = 'getProductsGroups fn TOTAL';
      const allTypes = 'sub allTypes';
      const getTree = 'sub getTree';
      const addObjectss = 'sub addObjects';

      // console.time(getProductsGroups);

      const clusterId = this.$store.getters['clusterId'];
      const currentType = this.$route.params.resource || '';

      for ( const productId of loadProducts ) {
        const modes = [TYPE_MODES.BASIC];

        if ( productId === NAVLINKS ) {
          // Navlinks produce their own top-level nav items so don't need to show it as a product.
          continue;
        }

        if ( productId === EXPLORER ) {
          modes.push(TYPE_MODES.FAVORITE);
          modes.push(TYPE_MODES.USED);
        }

        // TODO: RC remaining TODOs
        // TODO: RC testing locally. testing at scale? compare with confluence?
        // TODO: RC before / after comparison (ensure store functiuns are named)
        // TODO: RC Comment on PR.
        // - Tested `diff` between previous allTYpes mode with mode returned via new amalgamented allTypes
        // - Tested cis benchmark, kubewarden. legacy
        // - Tested locally, visually
        // - Wrote unit tests for before case... updated for after case
        // - Vast majority of getGroups is getProductsGroups --> allTypes
        // - Before - after comparison

        const modeTypes = this.$store.getters['type-map/allTypes'](productId, modes);
        // const TESTmodeTypes = {};

        for ( const mode of modes ) {
          // console.time(`${ productId }/${ mode }/${ allTypes }`);

          // TESTmodeTypes[mode] = this.$store.getters['type-map/allTypes3'](productId, mode);
          // const derp = diff(TESTmodeTypes[mode], modeTypes[mode]);

          // if (Object.keys(derp).length) {
          //   console.warn('ERROR!!!!!!!!!!!!!', mode, derp, TESTmodeTypes[mode]?.drivers.weight, modeTypes[mode]?.drivers.weight);
          // } else {
          //   console.warn(mode, derp);
          // }
          // console.warn(mode, TESTmodeTypes[mode], modeTypes[mode]);

          const types = modeTypes[mode] || {};
          // const types = this.$store.getters['type-map/allTypes3'](productId, mode);

          // console.timeEnd(`${ productId }/${ mode }/${ allTypes }`);

          // console.time(`TIMING: ${ productId }/${ mode }/${ getTree }`);

          const more = this.$store.getters['type-map/getTree'](productId, mode, types, clusterId, namespaceMode, namespaces, currentType);

          // console.timeEnd(`TIMING: ${ productId }/${ mode }/${ getTree }`);

          // console.time(`${ productId }/${ mode }/${ addObjectss }`);
          if ( productId === EXPLORER || !this.isExplorer ) {
            addObjects(out, more);
          } else {
            const root = more.find((x) => x.name === 'root');
            const other = more.filter((x) => x.name !== 'root');

            const group = {
              name:     productId,
              label:    this.$store.getters['i18n/withFallback'](`product.${ productId }`, null, ucFirst(productId)),
              children: [...(root?.children || []), ...other],
              weight:   productMap[productId]?.weight || 0,
            };

            addObject(out, group);
          }
          // console.timeEnd(`${ productId }/${ mode }/${ addObjectss }`);
        }
      }

      // console.timeEnd(getProductsGroups);
      // console.groupEnd(timeStamp);
    },

    getExplorerGroups(out) {
      if ( this.isExplorer ) {
        const allNavLinks = this.allNavLinks;
        const toAdd = [];
        const haveGroup = {};

        for ( const obj of allNavLinks ) {
          if ( !obj.link ) {
            continue;
          }

          const groupLabel = obj.spec.group;
          const groupSlug = obj.normalizedGroup;

          const entry = {
            name:        `link-${ obj._key }`,
            link:        obj.link,
            target:      obj.actualTarget,
            label:       obj.labelDisplay,
            sideLabel:   obj.spec.sideLabel,
            iconSrc:     obj.spec.iconSrc,
            description: obj.spec.description,
          };

          // If there's a spec.group (groupLabel), all entries with that name go under one nav group
          if ( groupSlug ) {
            if ( haveGroup[groupSlug] ) {
              continue;
            }

            haveGroup[groupSlug] = true;

            toAdd.push({
              name:     `navlink-group-${ groupSlug }`,
              label:    groupLabel,
              isRoot:   true,
              // This is the item that actually shows up in the nav, since this outer group will be invisible
              children: [
                {
                  name:  `navlink-child-${ groupSlug }`,
                  label: groupLabel,
                  route: {
                    name:   'c-cluster-navlinks-group',
                    params: {
                      cluster: this.clusterId,
                      group:   groupSlug,
                    }
                  },
                }
              ],
              weight: -100,
            });
          } else {
            toAdd.push({
              name:     `navlink-${ entry.name }`,
              label:    entry.label,
              isRoot:   true,
              // This is the item that actually shows up in the nav, since this outer group will be invisible
              children: [entry],
              weight:   -100,
            });
          }
        }

        addObjects(out, toAdd);
      }
    },

    groupSelected(selected) {
      console.info('methods', 'groupSelected');
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          Vue.set(grp, 'isExpanded', grp.group.name === selected.name);
        }
      });

      this.$nextTick(() => Vue.set(this, 'visibleCounts', this.calcVisibleCounts()));
    },

    groupPeeked({ group, peeked }) {
      console.info('methods', 'groupPeeked', group.id, peeked);

      // this.$refs.groups.forEach((grp) => {
      //   if ( grp.group.name === group.name) {
      //     Vue.set(group, 'isPeeked', peeked);
      //   }
      // });

      this.$nextTick(() => Vue.set(this, 'visibleCounts', this.calcVisibleCounts()));
    },

    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    },

    syncNav() {
      const refs = this.$refs.groups;

      if (refs) {
        // Only expand one group - so after the first has been expanded, no more will
        // This prevents the 'More Resources' group being expanded in addition to the normal group
        let canExpand = true;
        const expanded = refs.filter((grp) => grp.isExpanded)[0];

        if (expanded && expanded.hasActiveRoute()) {
          this.$nextTick(() => expanded.syncNav());

          return;
        }
        refs.forEach((grp) => {
          if (!grp.group.isRoot) {
            grp.isExpanded = false;
            if (canExpand) {
              const isActive = grp.hasActiveRoute();

              if (isActive) {
                grp.isExpanded = true;
                canExpand = false;
                this.$nextTick(() => grp.syncNav());
              }
            }
          }
        });
      }
    },
  },
};
</script>

<template>
  <nav class="side-nav">
    <!-- Actual nav -->
    <div class="nav">
      <template v-for="(g) in groups">
        <Group
          ref="groups"
          :key="g.name"
          id-prefix=""
          class="package"
          :group="g"
          :can-collapse="!g.isRoot"
          :show-header="!g.isRoot"
          @selected="groupSelected($event)"
          @expand="groupSelected($event)"
          @peeked="groupPeeked($event)"
        />
      </template>
    </div>
    <!-- Cluster tools -->
    <n-link
      v-if="showClusterTools"
      tag="div"
      class="tools"
      :to="{name: 'c-cluster-explorer-tools', params: {cluster: clusterId}}"
    >
      <a
        class="tools-button"
        @click="collapseAll()"
      >
        <i class="icon icon-gear" />
        <span>{{ t('nav.clusterTools') }}</span>
      </a>
    </n-link>
    <!-- SideNav footer area (seems to be tied to harvester) -->
    <div
      v-if="showProductFooter"
      class="footer"
    >
      <!-- support link -->
      <nuxt-link
        :to="supportLink"
        class="pull-right"
      >
        {{ t('nav.support', {hasSupport: true}) }}
      </nuxt-link>
      <!-- version number -->
      <span
        v-clean-tooltip="{content: displayVersion, placement: 'top'}"
        class="clip version text-muted"
      >
        {{ displayVersion }}
      </span>

      <!-- locale selector -->
      <span v-if="isSingleProduct">
        <v-popover
          popover-class="localeSelector"
          placement="top"
          trigger="click"
        >
          <a
            data-testid="locale-selector"
            class="locale-chooser"
          >
            {{ locale }}
          </a>

          <template slot="popover">
            <ul
              class="list-unstyled dropdown"
              style="margin: -1px;"
            >
              <li
                v-for="(label, name) in availableLocales"
                :key="name"
                class="hand"
                @click="switchLocale(name)"
              >
                {{ label }}
              </li>
            </ul>
          </template>
        </v-popover>
      </span>
    </div>
    <!-- SideNav footer alternative -->
    <div
      v-else
      class="version text-muted flex"
    >
      <nuxt-link
        v-if="singleProductAbout"
        :to="singleProductAbout"
      >
        {{ displayVersion }}
      </nuxt-link>
      <template v-else>
        <span>{{ displayVersion }}</span>
        <span
          v-if="isVirtualCluster && isExplorer"
          v-tooltip="{content: harvesterVersion, placement: 'top'}"
          class="clip text-muted ml-5"
        >
          (Harvester-{{ harvesterVersion }})
        </span>
      </template>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
  .side-nav {
    display: flex;
    flex-direction: column;
    .nav {
      flex: 1;
      overflow-y: auto;
    }

    position: relative;
    background-color: var(--nav-bg);
    border-right: var(--nav-border-size) solid var(--nav-border);
    overflow-y: auto;

    // h6 is used in Group element
    ::v-deep h6 {
      margin: 0;
      letter-spacing: normal;
      line-height: 15px;

      A { padding-left: 0; }
    }

    .tools {
      display: flex;
      margin: 10px;
      text-align: center;

      A {
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 5px;
        color: var(--body-text);
        display: flex;
        justify-content: center;
        outline: 0;
        flex: 1;
        padding: 10px;

        &:hover {
          background: var(--nav-hover);
          text-decoration: none;
        }

        > I {
          margin-right: 4px;
        }
      }

      &.nuxt-link-active:not(:hover) {
        A {
          background-color: var(--nav-active);
        }
      }
    }

    .version {
      cursor: default;
      margin: 0 10px 10px 10px;
    }

    .footer {
      margin: 20px;

      display: flex;
      flex: 0;
      flex-direction: row;
      > * {
        flex: 1;
        color: var(--link);

        &:last-child {
          text-align: right;
        }

        &:first-child {
          text-align: left;
        }

        text-align: center;
      }

      .version {
        cursor: default;
        margin: 0px;
      }

      .locale-chooser {
        cursor: pointer;
      }
    }
  }

  .flex {
    display: flex;
  }

</style>
