# Getting Started


First read through the [README](../README.md). This covers a lot of useful information that this page references and supplements. It's helpful reviewing the README again once more experience is gained.

## Terminology
| Term | Description | 
|-------|--------------|
| Dashboard / Cluster Explorer / Vue UI | TODO |
| Manager / Cluster Manager / Ember UI | TODO |
| Norman | TODO |
| Steve | TODO |
| Rancher Product | TODO |
| RKE | TODO |
| SSR | Server Side Rendering. Enabled by default when developing |
| SPA | Single Page Application. Enabled by default in production |

## Concepts

### API
See [APIs](../README#apis).

The older Norman API is served on `v3`. The newer Steve API is served on `v1` (see https://github.com/rancher/api-spec/blob/master/specification.md).

In both cases the schema's returned will dictate 
- Which resources are shown
- What operations (create, update, delete, etc) can be made against resource/s
- What actions (archive, change password, etc) can be made against resource/s

In addition the resources themselves can dictate 
- What actions can be made against the collection

The above, plus other factors, will effect what is shown by the UI
- Resources in the cluster explorer
- Edit resource buttons
- Delete resource
- etc

There are other factors that assist in this, namely values from the `type-map`. More details can be found throughout this document.

> When catching exceptions thrown by anything that contacts the API use `/utils/error exceptionToErrorsArray` to correctly parse the response into a commonly accepted array of errors

### Store
State is cached locally via [Vuex](https://vuex.vuejs.org/). See the Model section for retrieving information from the store.

See [README#vuex-stores](../README#what-is-it) for the basics. The most important concepts are described first, the three parts of the store `management`, `cluster` and `rancher`. These are often used when interacting with the store. These sections contain schema information for each supported type and per type type the resource instance and list data. 

In code there are common ways to access core store functionality

|Location|type|object|example|
|----|----|----|----|
| `/model/x` | Dispatching Actions | `this.$dispatch` | `this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true })`
| `/model/x` | Access getters (store type) | `this.$getters` | `this.$getters['schemaFor'](this.type)`
| `/model/x` | Access getters (all) | `this.$rootGetters` | `this.$rootGetters['productId']`
| component | Dispatching Actions | `this.$store.dispatch` | `this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id })`
| component | Access getters | `this.$store.getters` | `this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value)`

> Prefixing a resource property with `$`, as per model rows above, results in calling the store type directly. For further details on resources, proxy's and types see further below in this doc.

### Resources
A resource is an instance of a schema e.g. the `admin` user is an instance of type `management.cattle.io.user` from the `Steve` API. 

#### Schemas
Schemas are provided in bulk via the APIs and cached locally in the relevant store (`management`, `rancher`, etc).

A schema can be fetched via 

```
import { POD } from '@/config/types';

this.$store.getters['cluster/schemaFor'](POD)`
```

As mentioned before the schema's dictact the functionality available to that type and will dictate what is shown by the UI.

#### Virtual and Spoofed Resource Types

Much of the side nav menu is determined by the schema's associated with the product. This is explained in more detail in TODO

Virtual Types can be created to add additional menu items to the side nav. These are purely for adding navigation. Examples of virtual types can be found by searching for `virtualType`. For instance the `Users & Authentication` product has a virtual type of 'config' to show the `Auth Providers` page.

Spoofed Types, like virtual types, add menu items but also define a spoofed schema and a `getInstances` function to provide a list of objects of the spoofed type. This allows the app to then make use of the generic list, detail, edit, etc pages used for standard types.

> Any resources returned by `getInstances` should have a `kind` matching the spoofed type

#### Proxy Object and Common Functionality
When resources are retrieved from the store they will be wrapped in a Proxy object - `/plugins/steve/resource-proxy.js`. This exposes common properties and functions from `/plugins/steve/resource-instance.js`. These can be overridden per resource type via optional files in `/models`. For example the `nameDisplay` value for the type `management.cattle.io.user` avoids using the `nameDisplay` from `resource-instance` by adding a `nameDisplay` function to `/models/management.cattle.io.user.js`.

> As resources are proxy instances using spread (`{ ...<resource>}`) will not work as expected. In such cases it's normally better to first `clone` (see below) and then make the required changes.

Common functionality provided by `resource-instance` includes information on how to display common properties, capabilities of the resource type and actions to execute such as `save`, `remove`, `goToEdit`

```

<user object>.save();

<project object>.remove();

<role binding object>.goToEdit();

```

> Note `toString` in `resource-instance`, this will change how the object is representing via console.log, etc. More on this later TODO

#### Create and Fetching Resource/s

Most of the options to create and fetch resources can be achieved via dispatching actions defined in `/plugins/steve/actions.js`

| Action| Example Command | Description |
|--------|-------|-----|
| Create | `$store.$dispatch('<store type>/create', <new object>)`| Creates a new Proxy object of the required type (type must be included in the new object) |
| Clone | `$store.$dispatch('<store type>/clone', { resource: <existing object> })` | Performs a deep clone and create a proxy from it |
| Fetch all of a resource type | `$store.dispatch('<store type>/findAll', { type: <resource type> })` | Fetches all resource of the given type. Also, when applicable will register the type for automatic updates. If the type has already been fetch return the local cached list |
| Fetch a resource by ID | `$store.dispatch('<store type>/find', { type: <resource type>, id: <resource id> })` | Finds the resource matching the ID. If the type has already been fetched return the local cached instance. |
| Fetch resources by label | `$store.dispatch('<store type>/findMatching', { type: <resource type>, selector: <label map>TODO: CHECK })` | Fetches resources that have metadata.labels matching that of the name-value properties in the selector |

> Once objects of most types are fetched they will be automatically updated. See [README#synching-state](../README##synching-state) for more info. For some types this does not happen. For those cases, or when an immediate update is required, adding `force: true` to the `find` style actions will result in a fresh http request.

It's possible to retrieve values from the store synchronously via `getters`. For resources this is not normally advised (they may not yet have been fetched), however for items such as schema's is valid. Some of the core getters are defined in `/plugins/steve/getters.js`

```

$store.getters['<store type>/byId'](<resource type>, <id>])

$store.getters['<store type>/schemaFor'](<resource type>)`

```


# Development

## Stack

See [README#what-is-it](../README#what-is-it)

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
- Kube Cluster - Use the `remove` command in [System Tools](https://rancher.com/docs/rancher/v2.x/en/system-tools/) client 


## Environment

Developers are free to use the IDE and modern browser of their choosing. Here's some tips on some in particular

### VS Code
- Install the `vetur` extension. This contains syntax highlighting, IntelliSense, snippets, formatting, etc)

### Chrome
- Install the Chrome `vue-devtools` extension to view the Vuex store.
  
  > This can consume a lot of the host's resources. It's recommended to `pause` Vuex history (nav to Vue tab in DevTools and toggle the `Recording` button top right of the history section)

## Running / Debugging Dashboard

### Running the Dashboard

See the [Running For Development](../README#running-for-development) section on how to bring up the Dashboard locally

### Debugging the Dashboard

#### SSR vs SPA
It's important to understand the difference between SSR and SPA modes described in the [Server-Side-Rendering (SSR)](../README#server-side-rendering-ssr) section. When running in the default SSR mode you will not be able to step through some methods such as Vue components `async fetch`. It is therefore advised to switch to SPA mode before attempting to step through the code.

#### Breakpoints
Finding the correct file in Dev Tools and reliably setting a breakpoint can be hit and miss, even in SPA mode. It is advised to manually add a `debugger` statement in code instead. 

#### Examining the contents of a Resource
Due to the way Dashboard resources are constructed examining the contents of one can sometimes provide unexpected results. It's recommended to read the TODO: section before continuing.

- When viewing the object via template `{{ resource }}` the `resource-instance.js` toString method will print out a basic interpretation
- When printing the object via console the resource's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) will be displayed. To make this simpler to view use `JSON.parse(JSON.stringify(<resource>))`.

> Why are my resource's `nameDisplay`, `description`, etc missing?
> These are part of the common underlying `resource-instance.js` or, if the resource type has it, the type's own `model`.

### Exploring the API
The API serves up an interface to [browse both Norman and Steve API's](https://github.com/rancher/api-ui). Both will list supported schema's and allow the user fetch individual or collections of resources. The schema's will describe the actions executable against individual or collections of resource. For Norman it will also show fields that can be filtered on.

The dashboard will proxy requests to the API, so the interfaces are available via `<Dashboard URL>/v3` (Norman) and `<Dashboard URL>/v1` (Steve)

## Menus, Pages and Components
### Products & Side Nav
Products are top level features that are reached via the header top left menu. Some are built in (`Cluster Explorer`, `Apps & Marketplace`, `Users & Authentication`) and some are enabled after installing the required helm charts via `Apps & Marketplace` (see 'Rancher' charts in the `Charts` page ).

Settings for each product can be found in `/config/product`. These will define the product itself, menu items in side nav, spoofed types, etc. These are normally done by via manipulating the `type-map` part of the store with functions in `/store/type-map.js`. Some stand out functions include

- `basicType` - Defines a type or group of types, that will show in the side nav
-  `weightGroup`/`weightType` - Set the position of the group/tye for this product. Pay attention to the `forBasic` boolean which should be true if the menu item is classed as basic.
- `configureType` - Provider/Override UI features for the type (is creatable, show state in header/table, etc). These are accessible via the `type-map/optionsFor` action

> There's some docs for these functions are the top of the `type-map.js` file
 
## UI Components for Resource Types

The dashboard has a framework to support conditionally presenting and navigate around...

- Collections of resources in a common table (Resource List). Usually shown when clicking on the side nav name type.
- Visual overview of a resource (Resource Detail). Usually shown when clicking on a List's row's name.
- Creating, Viewing and Editing a resource as a form (Resource Edit).
- Viewing and Editing a resource as YAML (Resource YAML)

By default only the table and, if enabled by the resource type, viewing/editing as YAML. To provide a richer experience the resource's table columns should be defined and custom overview and edit pages provided.

### Resource List

The top level list page is defined in `./components/ResourceList`. This displays a common masthead and table for the given resource type. Without any customisation the columns are restricted to a base set of `state`, `nameDisplay`, `namespace` and `ages`. More information can be found in function `/store/type-map.js headersFor`.


#### Customisation
Customisation of the table can be done via changing configuration revolving around the resource's type. This uses the default ResourceList component and no additional pages are defined.

More complicated customisation can be done via overriding the ResourceList component with a per resource type component defined in `/list`. This replaces the ResourceList but often uses the same underlying table component `/components/ResourceTable`.

Table column definitions can be found in `/config/table-headers.js`. Common columns should be added here, instance specific types can be defined in the component.

```
export const SIMPLE_NAME = {
  name:     'name',
  labelKey: 'tableHeaders.simpleName',
  value:    'name',
  sort:     ['name'],
  width:    200
};
```

Column definitions will determine what is shown in it's section of the row. This will either be a property from the row (`value`), a component defined (`formatter`, which links to a component in `/components/formatter`) or an inline formatter (defined in the `ResourceTables` contents, see example below, requires custom list component). 

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

The actions menu for a table row is constructed from the actions returned via the resource type. Therefore the base list comes from the common `resource-instance` which can be supplmented/overwritten by the resource type's `model`. Individual actions can be marked as `bulkable`, which means they are shown as buttons above the list and applied to selected rows.

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

The Create/Edit Yaml experience is controlled by the `/components/ResourceYaml.vue` component. Other features are handled by custom components described below.

Special attention should be made of the `mode` and `as` params that's available via the `CreateEditView` mixin (as well as other helpful functionality). Changing these should change the behaviour of the resource details page (depending on the availability of resource type custom components).

| Mode Param | As Param | Content |
|------------|----------|-------|
| blank | blank | Shows the View YAML or Customised Detail component|
| blank | `config` | Shows the View YAML or Customised Edit component (in read only mode)|
| `edit` | blank | Shows the Customised Edit component|
| `edit` | `yaml` | Shows the Edit Yaml component|

In addition the Create process (assessable with the same url + `create`) is also managed by the resource detail page with similar param features 

| Mode Param | As Param | Content |
|------------|----------|-------| 
| blank | `yaml` | Show the Edit YAML component in create mode
| `edit` | blank | Show the Customised Edit component in create mode
| `clone` | blank | Shows the Customised Edit component in create mode pre-populated with an existing resource

#### Detail Customisation

A more detailed overview page can be added by creating a resource type component in `/detail/`. This should provide a more eye pleasing presentation than a collection inputs or yaml blob.

#### Edit Customisation

A more compelling edit experience can be created by adding a resource type component in `/edit/`. This should display a form like experience. Wrapping this in `CruResource` will provide generic error handling and cancel/save buttons.

This customisation should also support the `as=config` param, where the form is displayed and populated but is not editable.

## Styling
TODO:
scss
`hand`
`text-muted`
``

## Internationalisation i18n / Localisation i10n

### i18n
All on screen text should be localised and implemented in the default `en-US` locale. There are different ways to access localised text

> `t` should be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })`

In HTML

```
<t k="<path to localisation" />
{{ t("<path to localisation") }}
```

Many components will also accept a localisation path via a `value-key` property, instead of the translated text in `value`.

In JS

```
this.t('<path to localisation')
```

A localisation can be checked with

```
this.$store.getters['i18n/exists']('<path to localisation')

this.$store.getters['i18n/withFallback']('<path to localisation', null, '<fallback>'))
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

### Localisation
Localisation files can be found in `./assets/translations/en-us.yaml`

## Other UI Features
### Icons 
Icons are font based and can be shown via the icon class

```
<i class="icon icon-fw icon-gear" /></a>
```

Icons can be browsed via `assets/fonts/icons/demo.html`

Additional icon styles can be found in via `assets/styles/fonts/_icons.scss`

### Date
The Dashboard uses the [dayjs](https://day.js.org/) library to handle dates, times and date algebra. However when showing a date and time they should take into account the date and time format. Therefore it's advised to use a formatter such as `/components/formatter/Date.vue` to display them.

### Loading Indicator

When a component uses `async fetch` it's best practise to gate the component template on it associated boolean `$fetchState.pending`. When the component is page based this should be applied to the `/components/Loading` component

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

Configuration for this is in `plugins/shortkey.js` which. At the time of writing this contains options to disable keyboard shortcuts in `input`, `textarea` and `select` elements.

## Troubleshooting
### Multiple `Could not freeze errors` in `yarn dev` terminal
This is most probably due to a correct cache in `/node_modules/.cache`. Exit out of `yarn run` and run `yarn run clean` and then try again.
### Cannot find new schema
Ensure that your schema text in `/config/types.js` is singular, not plural
### Fetching the name of a resource type

Good - Trims the text and respects `.` in path to type's string
```
store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2)
```
Bad - Does not trim text, issues when resource type contains `.`
```
store.getters['i18n/t'](`typeLabel.${ NORMAN.SPOOFED.GROUP_PRINCIPAL }`, { count: 2 })
```


# Configuring Authentication Types
## Keycloak
1. Bring up a local Keycloak instance in docker using the instructions at [here](https://www.keycloak.org/getting-started/getting-started-docker).
   > Ensure that the admin user has a first name, last name and email. These fields are referenced in the Keycloak client's mappers which are then referenced in the Rancher's auth provider config.
1. Using either the Ember or Vue UI set up the Keycloak auth provider by follow the instructions at [here](https://rancher.com/docs/rancher/v2.x/en/admin-settings/authentication/keycloak/)
   > Double check the client has the correct checkboxes set, specifically the Mappers `group` entry.

   > For the SAML Metadata, export the Client in the Keycloack UI via the `Installation` tab as `SAML Metadata SPSSODescriptor` and then follow the `NOTE` instructions regarding `EntitiesDescriptor` and `EntityDescriptor`. For a better set of instructions see [step 6](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b).
   
   > For key and cert files, export the Client in the Keycloak UI via the `Clients` list page and extract & wrap the `saml.signing.certificate` and `saml.signing.private.key` as cert files (see [step 5](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b) for more info). 


TODO: 
Each resource type has 
Plugins/Nuxt/Styles



--------------

divider

---------

divider

# TOSORT

## Vue docs/helpers

<!-- |Product| Cluster Specific | Description|
|-------|-----------|----|
| Cluster Explorer | Yes | Cluster specific view of kube resources, stats, etc|
| Apps & Marketplace | Yes | Helm Repo & Chart Management |
| OPA Gatekeeper | Yes | Policy based governance for Kubernetes clusters |
| Users & Authentication | No | Manage dashboard Auth Providers and Users
| Continuous Delivery | No | CI based on Rancher's 'Fleet' | -->
