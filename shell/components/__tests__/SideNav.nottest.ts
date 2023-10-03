// import SideNav from '@shell/components/SideNav.vue';
// import { mount, shallowMount, createLocalVue } from '@vue/test-utils';

// import { DefaultProps } from 'vue/types/options';
// import { ExtendedVue, Vue } from 'vue/types/vue';
// import Vuex from 'vuex';

// describe('component: SideNav.vue', () => {
//   const localVue = createLocalVue();

//   localVue.use(Vuex);

//   // const wrapper = mount(SideNav, { propsData: { title: 'Simple box title' } });
//   // const store = new Vuex.Store({
//   //   modules: {
//   //     // 'action-menu': {
//   //     //   namespaced: true,
//   //     //   state:      {
//   //     //     showPromptRestore: true,
//   //     //     toRestore:         [{
//   //     //       isRke2:   true,
//   //     //       type:     CAPI.RANCHER_CLUSTER,
//   //     //       metadata: { name: RKE2_CLUSTER_NAME },
//   //     //       snapShots
//   //     //     }]
//   //     //   },
//   //     // },
//   //   },
//   //   getters: { 'i18n/t': () => jest.fn(), 'prefs/get': () => jest.fn() },
//   //   actions: { 'management/findAll': jest.fn().mockResolvedValue(snapShots), 'rancher/findAll': jest.fn().mockResolvedValue([]) }
//   // });
//   // const wrapper = shallowMount(SideNav as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
//   //   store,
//   //   localVue
//   // });

//   const wrapper = mount(SideNav, {
//     computed: {
//       showClusterTools: () => false,
//       isVirtualProduct: () => false,
//       displayVersion:   () => '',
//       clusterReady:     () => true,
//     },
//     mocks: {
//       clusterReady: true,
//       $store:       {
//         getters: {
//           'i18n/t':   () => 'NA',
//           namespaces: () => [],
//         }
//       },
//       $fetchState: { pending: false }
//     },
//     // directives: { shortkey: () => jest.fn() }
//   });

//   it('getGroups', () => {
//     expect(wrapper.vm.groups).toStrictEqual({ });

//     wrapper.vm.getGroups();
//     expect(wrapper.vm.groups).toStrictEqual({ });
//   });

//   // it('show close button', async() => {
//   //   await wrapper.setProps({ canClose: true });
//   //   const closeButton = wrapper.find(`[data-testid="simple-box-close"]`);

//   //   expect(closeButton.element).toBeDefined();
//   // });

//   // it('close emit', async() => {
//   //   await wrapper.setProps({ canClose: true });
//   //   const closeButton = wrapper.find(`[data-testid="simple-box-close"]`);

//   //   await closeButton.trigger('click');

//   //   expect(wrapper.emitted('close')).toBeTruthy();
//   // });
// });
