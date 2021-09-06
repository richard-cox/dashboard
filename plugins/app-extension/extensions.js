import epinio from './epinio/index';

// TODO: RC DISCUSS extensions & extension-routes
// TODO: RC DISCUSS Registering this within epinio files doesn't happen before store/index plugins is initialised....
const extensions = [
  epinio
];

export default {

  // registerExtension(ext) {
  //   extensions.push(ext);
  // },

  applyProducts(store) {
    return extensions.forEach(ext => ext.product(store));
  },

  stores() {
    return [].concat.apply([], extensions.map(ext => ext.store()));
  },

};
