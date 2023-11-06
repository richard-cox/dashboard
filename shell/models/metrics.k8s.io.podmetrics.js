import { NODE } from '@shell/config/types';
import { parseSi } from '@shell/utils/units';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class PodMetric extends SteveModel {
  get totalCpuUsage() {
    return this.containers.reduce((r, c) => {
      r += parseSi(c.usage.cpu);

      return r;
    }, 0);
  }

  get totalMemoryUsage() {
    return this.containers.reduce((r, c) => {
      r += parseSi(c.usage.memory);

      return r;
    }, 0);
  }
  // get cpuUsage() {
  //   return parseSi(this?.usage?.cpu || '0');
  // }

  // get cpuCapacity() {
  //   return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.allocatable?.cpu || '0');
  // }

  // get cpuUsagePercentage() {
  //   return ((this.cpuUsage * 10000) / this.cpuCapacity).toString();
  // }

  // get memoryUsage() {
  //   return parseSi(this?.usage?.memory || '0');
  // }

  // get memoryCapacity() {
  //   return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.memory || '0');
  // }

  // get memoryUsagePercentage() {
  //   return ((this.ramUsage * 10000) / this.ramCapacity).toString();
  // }

  // get storageUsage() {
  //   return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.['ephemeral-storage']) - parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.allocatable?.['ephemeral-storage']);
  // }

  // get storageTotal() {
  //   return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.['ephemeral-storage']);
  // }

  // get inStore() {
  //   return this.$rootGetters['currentProduct'].inStore;
  // }
}
