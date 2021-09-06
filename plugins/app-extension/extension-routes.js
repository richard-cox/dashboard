import epinioRoutes from './epinio/routes';

// TODO: RC DISCUSS needs to be a different file from other extensions... otherwise all file references lose modules... which unwraps quickly

// TODO: RC DISCUSS Registering this within epinio files doesn't happen before store/index plugins is initialised....
const extensions = [
  epinioRoutes
];

export default {

  routes(resolve) {
    // TODO: RC FIX error on duplicate
    return [].concat.apply([], extensions.map(routes => routes(resolve)));
  }
};
