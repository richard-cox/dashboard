// function getResourceFromRoute(to) {
//   let resource = to.params?.resource;

//   if ( !resource ) {
//     const match = to.name?.match(/^c-cluster-([^-]+)/);

//     if ( match ) {
//       resource = match[2];
//     }
//   }

//   return resource;
// }

export default function({
  route, app, store, redirect, $cookies, req, isDev, from, $plugin, next
}) {
  // TODO: don't do for xyz

  // Don't forget something we're navigating to
  // const resource = getResourceFromRoute(route);
  // const ignoreTYpes = !!resource ? { [resource]: true } : {};

  // console.warn('resource from route:', resource, route);

  // store.dispatch('garbageCollect', ignoreTYpes);
}
