import Project from '@/models/management.cattle.io.project';

export default {

  ...Project,

  _detailLocation() {
    // TODO: RC Q _detailLocation strips cluster from id. This means for spoofed types it will fail to find resource using the truncated id in steve/action request action
    const schema = this.$getters['schemaFor'](this.type);

    return {
      name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
        namespace: this.metadata?.namespace,
        id:        this.id,
      }
    };
  }
};
