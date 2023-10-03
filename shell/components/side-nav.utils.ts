// import { replaceWith, clear, addObjects, addObject } from '@shell/utils/array';
// import { sortBy } from '@shell/utils/sort';
// import { NAME as EXPLORER } from '@shell/config/product/explorer';
// import { BASIC, FAVORITE, USED } from '@shell/store/type-map';
// import { NAME as NAVLINKS } from '@shell/config/product/navlinks';
// import { ucFirst } from '@shell/utils/string';

// type SideNav = {
//   gettingGroups: boolean,
//   clusterReady: boolean,
//   groups: any[],
//   $store: any,
//   $route: any,
//   allNavLinks: any,
//   isExplorer: boolean,
//   activeProducts: any,
//   clusterId: string,
// }

// type Group = {

// }

// export const sideNavGetGroups = (ctx: SideNav) => {
//   const {
//     gettingGroups, clusterReady, groups, $store, isExplorer, activeProducts
//   } = ctx;

//   const getGroups = `getGroups fn TOTAL (id: ${ Date.now() })`;
//   const getProductsGroupsS = 'getProductsGroups';
//   // const getExplorerGroups = 'getExplorerGroups';

//   console.time(getGroups);
//   if ( gettingGroups ) {
//     return;
//   }
//   ctx.gettingGroups = true;

//   if ( !clusterReady ) {
//     clear(ctx.groups);
//     ctx.gettingGroups = false;

//     return;
//   }

//   const currentProduct = $store.getters['productId'];
//   let namespaces = null;

//   if ( !$store.getters['isAllNamespaces'] ) {
//     const namespacesObject = $store.getters['namespaces']();

//     namespaces = Object.keys(namespacesObject);
//   }

//   // Always show cluster-level types, regardless of the namespace filter
//   const namespaceMode = 'both';
//   const out: Group[] = [];
//   const loadProducts = isExplorer ? [EXPLORER] : [];

//   const productMap = activeProducts.reduce((acc: any, p: any) => {
//     return { ...acc, [p.name]: p };
//   }, {});

//   if ( isExplorer ) {
//     for ( const product of activeProducts ) {
//       if ( product.inStore === 'cluster' ) {
//         addObject(loadProducts, product.name);
//       }
//     }
//   }

//   // This should already have come into the list from above, but in case it hasn't...
//   addObject(loadProducts, currentProduct);

//   console.time(getProductsGroupsS);

//   getProductsGroups(ctx, out, loadProducts, namespaceMode, namespaces, productMap);

//   console.timeEnd(getProductsGroupsS);

//   // console.time(getExplorerGroups);

//   getExplorerGroups(ctx, out);

//   // console.timeEnd(getExplorerGroups);

//   replaceWith(groups, ...sortBy(out, ['weight:desc', 'label'], undefined));

//   ctx.gettingGroups = false;
//   console.timeEnd(getGroups);
// };

// const getProductsGroups = (ctx: SideNav, out: Group[], loadProducts: string[], namespaceMode: string, namespaces:string[] | null, productMap: { [key: string]: any}) => {
//   const {
//     gettingGroups, clusterReady, groups, $store, isExplorer, activeProducts, $route, clusterId
//   } = ctx;

//   const timeStamp = `getProductsGroups fn (id: ${ Date.now() })`;

//   console.group(timeStamp);
//   const getProductsGroups = 'getProductsGroups fn TOTAL';
//   const allTypes = 'sub allTypes';
//   const getTree = 'sub getTree';
//   const addObjectss = 'sub addObjects';

//   console.time(getProductsGroups);

//   // const clusterId = $store.getters['clusterId'];
//   const currentType = $route.params.resource || '';

//   debugger;

//   for ( const productId of loadProducts ) {
//     const modes = [BASIC];

//     if ( productId === NAVLINKS ) {
//       // Navlinks produce their own top-level nav items so don't need to show it as a product.
//       continue;
//     }

//     if ( productId === EXPLORER ) {
//       modes.push(FAVORITE);
//       modes.push(USED);
//     }

//     console.time(`${ productId }/${ allTypes }`);
//     const modeTypes = $store.getters['type-map/allTypes'](productId, modes) || {};

//     console.timeEnd(`${ productId }/${ allTypes }`);

//     for ( const mode of modes ) {
//       debugger;

//       const types = modeTypes[mode] || {};

//       console.time(`${ productId }/${ mode }/${ getTree }`);

//       const more = $store.getters['type-map/getTree'](productId, mode, types, clusterId, namespaceMode, namespaces, currentType);

//       console.timeEnd(`${ productId }/${ mode }/${ getTree }`);

//       console.time(`${ productId }/${ mode }/${ addObjectss }`);
//       if ( productId === EXPLORER || !isExplorer ) {
//         addObjects(out, more);
//       } else {
//         const root = more.find((x: any) => x.name === 'root');
//         const other = more.filter((x: any) => x.name !== 'root');

//         const group: Group = {
//           name:     productId,
//           label:    $store.getters['i18n/withFallback'](`product.${ productId }`, null, ucFirst(productId)),
//           children: [...(root?.children || []), ...other],
//           weight:   productMap[productId]?.weight || 0,
//         };

//         addObject(out, group);
//       }
//       console.timeEnd(`${ productId }/${ mode }/${ addObjectss }`);
//     }
//   }

//   console.timeEnd(getProductsGroups);
//   console.groupEnd(timeStamp);
// };

// const getExplorerGroups = (ctx: SideNav, out: Group[]) => {
//   const {
//     gettingGroups, clusterReady, groups, $store, isExplorer, activeProducts, $route, allNavLinks, clusterId
//   } = ctx;

//   if ( isExplorer ) {
//     const toAdd: Group[] = [];
//     const haveGroup: { [key: string]: any} = {};

//     for ( const obj of allNavLinks ) {
//       if ( !obj.link ) {
//         continue;
//       }

//       const groupLabel = obj.spec.group;
//       const groupSlug = obj.normalizedGroup;

//       const entry = {
//         name:        `link-${ obj._key }`,
//         link:        obj.link,
//         target:      obj.actualTarget,
//         label:       obj.labelDisplay,
//         sideLabel:   obj.spec.sideLabel,
//         iconSrc:     obj.spec.iconSrc,
//         description: obj.spec.description,
//       };

//       // If there's a spec.group (groupLabel), all entries with that name go under one nav group
//       if ( groupSlug ) {
//         if ( haveGroup[groupSlug] ) {
//           continue;
//         }

//         haveGroup[groupSlug] = true;

//         toAdd.push({
//           name:     `navlink-group-${ groupSlug }`,
//           label:    groupLabel,
//           isRoot:   true,
//           // This is the item that actually shows up in the nav, since this outer group will be invisible
//           children: [
//             {
//               name:  `navlink-child-${ groupSlug }`,
//               label: groupLabel,
//               route: {
//                 name:   'c-cluster-navlinks-group',
//                 params: {
//                   cluster: clusterId,
//                   group:   groupSlug,
//                 }
//               },
//             }
//           ],
//           weight: -100,
//         });
//       } else {
//         toAdd.push({
//           name:     `navlink-${ entry.name }`,
//           label:    entry.label,
//           isRoot:   true,
//           // This is the item that actually shows up in the nav, since this outer group will be invisible
//           children: [entry],
//           weight:   -100,
//         });
//       }
//     }

//     addObjects(out, toAdd);
//   }
// };
