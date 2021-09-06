import epinioResourceInstance from './epinio-resource-instance' ;

export default {
  ...epinioResourceInstance,

  name() { // TODO: RC API format of resources (common id)
    return this.id;
  }
};
