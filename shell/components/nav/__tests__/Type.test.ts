import { mount, RouterLinkStub } from '@vue/test-utils';
import Type from '@shell/components/nav/Type.vue';

// Mandatory to mock vue-router in this test
jest.mock('vue-router');

// Configuration text
const className = 'router-link-active';

describe('component: Type', () => {
  describe('should not use highlight class', () => {
    it('given no hash', () => {
      const wrapper = mount(Type, {
        props: { type: { route: 'something else' } },

        global: {
          mocks:     {
            $route:  { path: 'whatever' },
            $router: { resolve: () => ({ route: { path: 'whatever' } }) },
            $store:  {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => 1,
              }
            }
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(false);
    });

    it('given no path', () => {
      const wrapper = mount(Type, {
        props: { type: { route: 'something else' } },

        global: {
          mocks:     {
            $route:  { hash: 'whatever' },
            $router: { resolve: () => ({ route: { path: 'whatever' } }) },
            $store:  {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => 1,
              }
            }
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(false);
    });

    it('given no matching values', () => {
      const wrapper = mount(Type, {
        props: { type: {} },

        global: {
          mocks:     {
            $route: {
              hash: 'hash',
              path: 'path',
            },
            $router: { resolve: () => ({ route: { path: 'whatever' } }) },
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(false);
    });

    it('given navigation path is bigger than current page route path', () => {
      const wrapper = mount(Type, {
        props: { type: { route: 'not empty' } },

        global: {
          mocks:     {
            $route: {
              hash: 'not empty',
              path: 'whatever',
            },
            $router: { resolve: () => ({ route: { path: 'many/parts' } }) },
            $store:  {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => 1,
              }
            }
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(false);
    });

    it.each([
      // URL with fragments like anchors
      [
        '/c/c-m-hzqf4tqt/explorer/members#project-membership',
        '/c/c-m-hzqf4tqt/explorer/members'
      ],
      // Similar paths
      [
        '/c/c-m-hzqf4tqt/fleet/fleet.cattle.io.bundlenamespacemapping',
        '/c/c-m-hzqf4tqt/fleet/fleet.cattle.io.bundle'
      ],
      // paths with same parts, e.g. parents
      [
        '/c/c-m-hzqf4tqt/fleet',
        '/c/c-m-hzqf4tqt/fleet/management.cattle.io.fleetworkspace'
      ],
    ])('given different current path %p and menu path %p', (currentPath, menuPath) => {
      const wrapper = mount(Type, {
        props: { type: { route: 'not empty' } },

        global: {
          mocks:     {
            $route: {
              hash: 'not empty',
              path: currentPath,
            },
            $router: { resolve: () => ({ route: { path: menuPath } }) },
            $store:  {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => 1,
              }
            }
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(false);
    });
  });

  describe('should use highlight class', () => {
    it.each([
      [
        'same',
        'same'
      ],
    ])('given same current path %p and menu path %p (on first load)', (currentPath, menuPath) => {
      const wrapper = mount(Type, {
        props: { type: { route: 'not empty' } },

        global: {
          mocks:     {
            $route: {
              hash: 'not empty',
              path: currentPath,
            },
            $router: { resolve: () => ({ route: { path: menuPath } }) },
            $store:  {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => 1,
              }
            }
          },

          stubs:     { nLink: RouterLinkStub },
        },
      });

      const highlight = wrapper.find(`.${ className }`);

      expect(highlight.exists()).toBe(true);
    });
  });
});

jest.restoreAllMocks();
