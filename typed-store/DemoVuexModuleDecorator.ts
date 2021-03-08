import { Module, VuexModule, Mutation } from 'vuex-module-decorators';

@Module({
  name: 'DemoVuexModuleDecorator',
  stateFactory: true,
  namespaced: true,
})
export default class DemoVuexModuleDecorator extends VuexModule {
  wheels = 2

  @Mutation
  incrWheels(extra) {
    this.wheels += extra;
  }

  get axles() {
    return this.wheels / 2;
  }
}
