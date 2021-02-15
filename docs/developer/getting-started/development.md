# Development

## Stack

See [README#what-is-it](../README#what-is-it).

A good base knowledge of Vue, Vuex and Nuxt should be reached before going through the code. Looking through `nuxt.config.js` is a good way to understand how the Dashboard is glued together, importantly how plugins are brought in and how the frontend proxies requests to Rancher's APIs.


### Helpful links
Description | Link
-----| ---
Core Vue Docs | https://vuejs.org/v2/guide
Vue Template/Directive Shorthands | https://vuejs.org/v2/guide/syntax.html
Vue Conditional rendering | https://vuejs.org/v2/guide/conditional.html
Vuex Core Docs | https://vuex.vuejs.org/
Nuxt Get Started | https://nuxtjs.org/docs/2.x/get-started/installation
Nuxt Structure | https://nuxtjs.org/docs/2.x/directory-structure
Axios (HTTP Requests) | https://axios.nuxtjs.org/options
HTTP Proxy middleware | https://github.com/nuxt-community/proxy-module (https://github.com/chimurai/http-proxy-middleware)

## Platform

The Dashboard is shipped with the Rancher package which contains the Rancher API. When developing locally the Dashboard must point to an instance of the Rancher API.

### Installing Rancher
See https://rancher.com/docs/rancher/v2.x/en/installation/. This covers two methods confirmed to work with the Dashboard
- [Single Docker Container](https://rancher.com/docs/rancher/v2.x/en/installation/other-installation-methods/single-node-docker/)
- [Kube Cluster (via Helm)](https://rancher.com/docs/rancher/v2.x/en/installation/install-rancher-on-k8s/)

Also for consideration
- [RKE in a binary (rancherd)](https://rancher.com/docs/rancher/v2.x/en/installation/install-rancher-on-linux/)

You should be able to reach the older Ember UI by navigating to the Rancher API url. This same API Url will be used later when starting up the Dashboard.

### Uninstalling Rancher
- Docker - This should be a simple `docker stop` & `docker rm`
- Kube Cluster -  Use `helm delete` as usual and then the `remove` command from [System Tools](https://rancher.com/docs/rancher/v2.x/en/system-tools/) client 


## Environment

Developers are free to use the IDE and modern browser of their choosing. Here's some tips on some in particular

### VS Code
- Install the `vetur` extension. This contains syntax highlighting, IntelliSense, snippets, formatting, etc)

### Chrome
- Install the Chrome `vue-devtools` extension to view the Vuex store.
  
  > This can consume a lot of the host's resources. It's recommended to pause Vuex history (nav to Vue tab in DevTools and toggle the `Recording` button top right of the history section)

## Running / Debugging Dashboard

### Running the Dashboard

See the [Running For Development](../README#running-for-development) section on how to bring up the Dashboard locally

> Troubleshooting: Multiple `Could not freeze errors` in `yarn dev` terminal
>
> This is most probably due to a correct cache in `/node_modules/.cache`. Exit out of `yarn run` and run `yarn run clean` and then try again.

### Debugging the Dashboard

#### SSR vs SPA
It's important to understand the difference between SSR and SPA modes described in the [Server-Side-Rendering (SSR)](../README#server-side-rendering-ssr) section. When running in the default SSR mode you will not be able to step through some methods such as Vue component's `async fetch`. It is therefore advised to switch to SPA mode before attempting to step through the code (see linked guide.. either start with `--spa` or load page with url parm `?spa` / `&spa`).

#### Breakpoints
Finding the correct file in Dev Tools and reliably setting a breakpoint can be hit and miss, even in SPA mode. It is advised to manually add a `debugger` statement in code instead. 

#### Examining the contents of a Resource
Due to the way Dashboard resources are constructed examining the contents of one can sometimes provide unexpected results. It's recommended to read the sections covering resource proxy and resource instance before continuing.

- When viewing the object via template `{{ resource }}` the `resource-instance.js` `toString` method will print out a basic interpretation
- When printing the object via console the resource's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) will be displayed. To make this simpler to view use `JSON.parse(JSON.stringify(<resource>))`.

> Q Why are my resource's `nameDisplay`, `description`, etc missing?
>
> A These are part of the common underlying `resource-instance.js` or, if the resource type has it, the type's own `model`.

### Exploring the API
The API serves up an interface to [browse both Norman and Steve API's](https://github.com/rancher/api-ui). Both will list supported schema's and allow the user to fetch individual or collections of resources. The schema's will describe the actions executable against individual or collections of resource. For Norman it will also show fields that can be filtered on.

The dashboard will proxy requests to the API, so the interfaces are available via `<Dashboard URL>/v3` (Norman) and `<Dashboard URL>/v1` (Steve)

## Menus, Pages and Components
### Products & Side Nav
Products are top level features that are reached via the header top left menu. Some are built in (`Cluster Explorer`, `Apps & Marketplace`, `Users & Authentication`) and some are enabled after installing the required helm charts via `Apps & Marketplace` (see 'Rancher' charts in the `Charts` page ).

Configuration for each product can be found in `/config/product`. These define the product itself, menu items in side nav, spoofed types, etc. These settings are stored in the `type-map` section of the store and manipulated with functions in `/store/type-map.js`. Some stand out functions include

- `basicType` - Defines a type or group of types that will show in the side nav
-  `weightGroup`/`weightType` - Set the position of the group/tye for this product. Pay attention to the `forBasic` boolean which should be true if the menu item is classed as basic.
- `configureType` - Provider/Override UI features for the type (is creatable, show state in header/table, etc). These are accessible via the `type-map/optionsFor` action

> There's some docs for these functions are the top of the `type-map.js` file
 
## UI Components for Resource Types

The dashboard has a framework and set of components to support (conditional) representation of resource type/s. Common UI features include

- Collections of resources in a common table (Resource List). Usually shown when clicking on the side nav name type.
- Visual overview of a resource (Resource Detail). Usually shown when clicking on a List's row's name.
- Creating, Viewing and Editing a resource as a form (Resource Edit).
- Viewing and Editing a resource as YAML (Resource YAML)

By default only the table and, if enabled by the resource type, viewing/editing as YAML are enabled. To provide a richer experience the resource's table columns should be defined and custom overview and edit pages provided.

### Resource List

The top level list page is defined in `./components/ResourceList`. This displays a common masthead and table for the given resource type. Without any customisation the columns are restricted to a base set of `state`, `nameDisplay`, `namespace` and `ages`. More information can be found in function `/store/type-map.js headersFor`.


#### Customisation
Customising columns and actions in a table can be done via changing the resources type's configuration. This is found in either the product's configuration or the resource types `model`, read on for more details. At this level the default `ResourceList` component is used and no additional pages have to be defined. T

More complicated customisation can be done via overriding the ResourceList component with a per resource type component defined in `/list`, e.g. `/list/catalog.cattle.io.app.vue` is used whenever the user clicks on the side nav for the Apps type. These components replace `ResourceList` but often use the same underlying table component `/components/ResourceTable`.

Table column definitions can be found in `/config/table-headers.js`. Common columns should be added here, list override specific types can be defined in the component.

```
export const SIMPLE_NAME = {
  name:     'name',
  labelKey: 'tableHeaders.simpleName',
  value:    'name',
  sort:     ['name'],
  width:    200
};
```

Column definitions will determine what is shown in it's section of the row. This will either be a property from the row (`value`), a component (`formatter`, which links to a component in `/components/formatter`) or an inline formatter (defined in the `ResourceTables` contents, see example below, requires custom list component). 

``` 
<ResourceTable ...>
  <template #cell:workspace="{row}">
    <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
    <span v-else class="text-muted">&mdash;</span>
  </template>
</ResourceTable>
```

Column definitions are grouped together and applied per resource type via `/store/type-map.js headers`. 

```
headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
```

When providing a custom list these default headers can be accessed via 

```
$store.getters['type-map/headersFor'](<schema>)
```

The actions menu for a table row is constructed from the actions returned via the resource type. Therefore the base list comes from the common `resource-instance` which can be supplemented/overridden by the resource type's `model`. Individual actions can be marked as `bulkable`, which means they are shown as buttons above the list and applied to all selected rows.

```
{
  action:     'promptRemove',
  altAction:  'remove',
  label:      this.t('action.remove'),
  icon:       'icon icon-trash',
  bulkable:   true,
  enabled:    this.canDelete,
  bulkAction: 'promptRemove',
}
```

### Resource Detail

The top level detail page is defined in `./components/ResourceDetail`. This is a container page that covers a number of resource instance use cases (create, edit, view, etc). Like resource list this contains a common `Masthead` and additionally a sub header `DetailTop` (displays common properties of resources such as description, labels, annotations, etc). For a resource type that provides no customisation it will mostly likely just display a way to view and edit the resource by YAML.

The Create/Edit Yaml experience is controlled by `/components/ResourceYaml.vue`. Other features are handled by custom components described below.

Special attention should be made of the `mode` and `as` params that's available via the `CreateEditView` mixin (as well as other helpful functionality). Changing these should change the behaviour of the resource details page (depending on the availability of resource type custom components).

| `mode` | `as` | Content |
|------------|----------|-------|
| falsy | falsy | Shows the View YAML or Customised Detail component|
| falsy | `config` | Shows the View YAML or Customised Edit component (in read only mode)|
| `edit` | falsy | Shows the Customised Edit component|
| `edit` | `yaml` | Shows the Edit Yaml component|

In addition the Create process (assessable with the same url + `/create`) is also managed by the resource detail page with similar param options. 

| `mode` | `as` | Content |
|------------|----------|-------| 
| falsy | `yaml` | Show the Edit YAML component in create mode
| `edit` | falsy | Show the Customised Edit component in create mode
| `clone` | falsy | Shows the Customised Edit component in create mode pre-populated with an existing resource

#### Detail Customisation

A more detailed overview page can be added by creating a resource type component in `/detail/`. This should provide a more eye pleasing presentation than a collection of inputs or yaml blob.

#### Edit Customisation

A more compelling edit experience can be created by adding a resource type component in `/edit/`. This should display a form like experience. Wrapping this in `CruResource` will provide generic error handling and cancel/save buttons.

This customisation should also support the `as=config` param, where the form is displayed and populated but is not editable.

## Styling

SCSS Styles can be found in `assets/styles/`. It's recommended to browse through some of the common styles in `_helpers.scss` and `_mixings.scss`.

## Internationalisation i18n / Localisation i10n

### i18n
All on screen text should be localised and implemented in the default `en-US` locale. There are different ways to access localised text

> `t` can be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })`

In HTML

```
<t k="<path to localisation>" />
{{ t("<path to localisation>1") }}
```

Many components will also accept a localisation path via a `value-key` property, instead of the translated text in `value`.

In JS

```
this.t('<path to localisation')
```

A localisation can be checked with

```
this.$store.getters['i18n/exists']('<path to localisation>')

this.$store.getters['i18n/withFallback']('<path to localisation>', null, '<fallback>'))
```

### i10n 

Localisation files can be found in `./assets/translations/en-us.yaml`.

Please follow precedents in file to determine where new translations should be place.

Form fields are conventionally defined in translations as <some prefix>.<field name>.{label,description,enum options if applicable} e.g.

```
account:
  apiKey:
    description:
      label: Description
      placeholder: Optionally enter a description to help you identify this API Key
```

## Other UI Features
### Icons 
Icons are font based and can be shown via the icon class

```
<i class="icon icon-fw icon-gear" /></a>
```

Icons can be browsed via `assets/fonts/icons/demo.html`.

Additional icon styles can be found in via `assets/styles/fonts/_icons.scss`.

### Date
The Dashboard uses the [dayjs](https://day.js.org/) library to handle dates, times and date algebra. However when showing a date and time they should take into account the date and time format. Therefore it's advised to use a formatter such as `/components/formatter/Date.vue` to display them.

### Loading Indicator

When a component uses `async fetch` it's best practise to gate the component template on fetch's `$fetchState.pending`. When the component is page based this should be applied to the `/components/Loading` component

```
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    ...
  </div>
</template>
```

### Keyboard shortcuts 

Shortcuts are implemented via [`vue-shortkey`](https://github.com/iFgR/vue-shortkey)

```
<button v-shortkey.once="['n']" class="hide" @shortkey="focus()" />
```

Configuration for this is in `plugins/shortkey.js`. At the time of writing this contains options to disable keyboard shortcuts in `input`, `textarea` and `select` elements.
