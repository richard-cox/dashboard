export function init($plugin, store) {
  const { product, virtualType, basicType } = $plugin.DSL(store, $plugin.name);

  product({
    icon:                'gear',
    inStore:             'cluster',
    inExplorer:          true,
    removable:           false,
    showClusterSwitcher: false,
  });

  virtualType({
    label:      'Test Page',
    icon:       'gear',
    name:       'test-type',
    namespaced: false,
    weight:     99,
    route:      { name: 'c-cluster-test' },
    exact:      true,
    overview:   true
  });

  basicType([
    'test-type',
  ]);
}
