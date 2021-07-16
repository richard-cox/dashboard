
export default {
  name() {
    return this.id;
  },

  detailLocation() {
    return {
      ...this._detailLocation,
      name: `ext-epinio-c-cluster-resource-id`,
    };
  },
};
