import TopLevelMenu from '@shell/components/nav/TopLevelMenu';
import { SETTING } from '@shell/config/settings';
import { mount, Wrapper } from '@vue/test-utils';

// DISCLAIMER: This should not be added here, although we have several store requests which are irrelevant
const defaultStore = {
  'management/byId':         jest.fn(),
  'management/schemaFor':    jest.fn(),
  'i18n/t':                  jest.fn(),
  'features/get':            jest.fn(),
  'prefs/theme':             jest.fn(),
  defaultClusterId:          jest.fn(),
  clusterId:                 jest.fn(),
  'type-map/activeProducts': [],
};

describe('topLevelMenu', () => {
  it('should display clusters', () => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $store: {
            getters: {
              'management/all': () => [{ name: 'whatever' }],
              ...defaultStore
            },
          },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    const cluster = wrapper.find('[data-testid="top-level-menu-cluster-0"]');

    expect(cluster.exists()).toBe(true);
  });

  it('should show description if it is available on the prov cluster', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },

      global: {
        mocks: {
          $store: {
            getters: {
              // these objs are doubling as a prov clusters
              // from which the "description" field comes from
              // This is triggered by the "hasProvCluster" above
              // (check all "management/all" getters on the component code)
              'management/all': () => [
                // pinned ready cluster
                {
                  name:        'whatever',
                  id:          'an-id1',
                  mgmt:        { id: 'an-id1' },
                  description: 'some-description1',
                  nameDisplay: 'some-label',
                  isReady:     true,
                  pinned:      true
                },
                // pinned NOT ready cluster
                {
                  name:        'whatever',
                  id:          'an-id2',
                  mgmt:        { id: 'an-id2' },
                  description: 'some-description2',
                  nameDisplay: 'some-label',
                  pinned:      true
                },
                // unpinned ready cluster
                {
                  name:        'whatever',
                  id:          'an-id3',
                  mgmt:        { id: 'an-id3' },
                  description: 'some-description3',
                  nameDisplay: 'some-label',
                  isReady:     true
                },
                // unpinned NOT ready cluster
                {
                  name:        'whatever',
                  id:          'an-id4',
                  mgmt:        { id: 'an-id4' },
                  description: 'some-description4',
                  nameDisplay: 'some-label'
                },
              ],
              ...defaultStore
            },
          },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    const description1 = wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description');
    const description2 = wrapper.find('[data-testid="pinned-menu-cluster-disabled-an-id2"] .description');
    const description3 = wrapper.find('[data-testid="menu-cluster-an-id3"] .description');
    const description4 = wrapper.find('[data-testid="menu-cluster-disabled-an-id4"] .description');

    expect(description1.text()).toStrictEqual('some-description1');
    expect(description2.text()).toStrictEqual('some-description2');
    expect(description3.text()).toStrictEqual('some-description3');
    expect(description4.text()).toStrictEqual('some-description4');
  });

  it('should not "crash" the component if the structure of banner settings is in an old format', () => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $store: {
            getters: {
              'management/all': () => [{ name: 'whatever' },
                // object based on https://github.com/rancher/dashboard/issues/10140#issuecomment-1883252402
                {
                  id:    SETTING.BANNERS,
                  value: JSON.stringify({
                    banner: {
                      color:      '#78c9cf',
                      background: '#27292e',
                      text:       'Hello World!'
                    },
                    showHeader: 'true',
                    showFooter: 'true'
                  })
                }],
              ...defaultStore
            },
          },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    expect(wrapper.vm.globalBannerSettings).toStrictEqual({
      headerFont: '2em',
      footerFont: '2em'
    });
  });

  describe('searching a term', () => {
    describe('should displays a no results message if have clusters but', () => {
      it('given no matching clusters', () => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: 'whatever' }),

          global: {
            mocks: {
              $store: {
                getters: {
                  'management/all': () => [{ nameDisplay: 'something else' }],
                  ...defaultStore
                },
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
      });

      it('given no matched pinned clusters', () => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: 'whatever' }),

          global: {
            mocks: {
              $store: {
                getters: {
                  'management/all': () => [{ nameDisplay: 'something else', pinned: true }],
                  ...defaultStore
                },
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
      });
    });

    describe('should not displays a no results message', () => {
      it('given matching clusters', () => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: search }),

          global: {
            mocks: {
              $store: {
                getters: {
                  'management/all': () => [{ nameDisplay: search }],
                  ...defaultStore
                },
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.clustersFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });

      it('given clusters with status pinned', () => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: search }),

          global: {
            mocks: {
              $store: {
                getters: {
                  'management/all': () => [{ nameDisplay: search, pinned: true }],
                  ...defaultStore
                },
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });
    });
  });
});
