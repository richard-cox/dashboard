## Concepts

### API
See [APIs](../../../README#apis).

The older Norman API is served on `/v3`. The newer Steve API (see [here](https://github.com/rancher/api-spec/blob/master/specification.md) for spec) is served on `/v1` .

In both cases the schema's returned dictate 
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

> When catching exceptions thrown by anything that contacts the API use `utils/error exceptionToErrorsArray` to correctly parse the response into a commonly accepted array of errors

### Store
State is cached locally via [Vuex](https://vuex.vuejs.org/). See the Model section for retrieving information from the store.

See [README#vuex-stores](../../../README#what-is-it) for the basics. The most important concepts are described first i.e. the three store parts `management`, `cluster` and `rancher`. These sections contain schema information for each supported type and, per type, the resource instance and list data. 

Store objects are accessed in different ways, below are common ways they are referenced by models and components

|Location|type|object|example|
|----|----|----|----|
| `/model/<resource type>` | Dispatching Actions | `this.$dispatch` | `this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true })`
| `/model/<resource type>` | Access getters (store type) | `this.$getters` | `this.$getters['schemaFor'](this.type)`
| `/model/<resource type>` | Access getters (all) | `this.$rootGetters` | `this.$rootGetters['productId']`
| component | Dispatching Actions | `this.$store.dispatch` | ``this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id })``
| component | Access getters | `this.$store.getters` | `this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value)`

> Prefixing a property in a model with `$`, as per `model` rows above, results in calling properties on the store object directly. For further details on resources, proxy's and types see further below in this doc.

> Troubleshooting: Fetching the name of a resource type
>
> Good - Trims the text and respects `.` in path to type's string - `store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2)`
>
> Bad - Does not trim text, issues when resource type contains "`.`" - ``store.getters['i18n/t'](`typeLabel.${ NORMAN.SPOOFED.GROUP_PRINCIPAL }`, { count: 2 })``

### Resources
A resource is an instance of a schema e.g. the `admin` user is an instance of type `management.cattle.io.user` from the `Steve` API. 

#### Schemas
Schemas are provided in bulk via the APIs and cached locally in the relevant store (`management`, `rancher`, etc).

A schema can be fetched synchronously via store getter

```
import { POD } from '@/config/types';

this.$store.getters['cluster/schemaFor'](POD)`
```

> Troubleshooting: Cannot find new schema
> 
> Ensure that your schema text in `/config/types.js` is singular, not plural

As mentioned before a schema dictates the functionality available to that type and what is shown for the type in the UI.

#### Virtual and Spoofed Resource Types

The side nav is populated by resource types that have been applied to the current product. Virtual Types are a way to add additional menu items. These are purely for adding navigation and do not support tables or details views. Examples of virtual types can be found by searching for `virtualType`. For instance the `Users & Authentication` product has a virtual type of 'config' to show the `Auth Providers` page.

Spoofed Types, like virtual types, add menu items but also define a spoofed schema and a `getInstances` function. The latter provides a list of objects of the spoofed type. This allows the app to then make use of the generic list, detail, edit, etc pages used for standard types.

> Any resources returned by `getInstances` should have a `kind` matching required type. This results in the tables showing the correct actions, handling create/edit, etc.

#### Proxy Object and Common Functionality
When resources are retrieved from the store they will be wrapped in a Proxy object - `/plugins/steve/resource-proxy.js`. This exposes common properties and functions from `/plugins/steve/resource-instance.js`. These can be overridden per resource type via optional files in `/models`. For example the `nameDisplay` value for the type `management.cattle.io.user` avoids using the `nameDisplay` from `resource-instance` by adding a `nameDisplay` function to `/models/management.cattle.io.user.js`.

> As resources are proxy instances spreading (`{ ...<resource>}`) will not work as expected. In such cases it's normally better to first `clone` (see below) and then make the required changes.

Common functionality provided by `resource-instance` includes information on how to display common properties, capabilities of the resource type and actions to execute such as `save`, `remove`, `goToEdit`

```

<user object>.save();

<project object>.remove();

<role binding object>.goToEdit();

```

> Note the `toString` property in `resource-instance`. This will change how the object is presented via console.log, etc. Read on to understand other ways to view resource properties.

#### Create and Fetch Resource/s

Most of the options to create and fetch resources can be achieved via dispatching actions defined in `/plugins/steve/actions.js`

| Action| Example Command | Description |
|--------|-------|-----|
| Create | `$store.$dispatch('<store type>/create', <new object>)`| Creates a new Proxy object of the required type (`type` property must be included in the new object) |
| Clone | `$store.$dispatch('<store type>/clone', { resource: <existing object> })` | Performs a deep clone and creates a proxy from it |
| Fetch all of a resource type | `$store.dispatch('<store type>/findAll', { type: <resource type> })` | Fetches all resources of the given type. Also, when applicable, will register the type for automatic updates. If the type has already been fetched return the local cached list instead |
| Fetch a resource by ID | `$store.dispatch('<store type>/find', { type: <resource type>, id: <resource id> })` | Finds the resource matching the ID. If the type has already been fetched return the local cached instance. |
| Fetch resources by label | `$store.dispatch('<store type>/findMatching', { type: <resource type>, selector: <label name:value map> })` | Fetches resources that have `metadata.labels` matching that of the name-value properties in the selector |

> Once objects of most types are fetched they will be automatically updated. See [README#synching-state](../../../README##synching-state) for more info. For some types this does not happen. For those cases, or when an immediate update is required, adding `force: true` to the `find` style actions will result in a fresh http request.

It's possible to retrieve values from the store synchronously via `getters`. For resources this is not normally advised (they may not yet have been fetched), however for items such as schema's is valid. Some of the core getters are defined in `/plugins/steve/getters.js`

```
$store.getters['<store type>/byId'](<resource type>, <id>])

$store.getters['<store type>/schemaFor'](<resource type>)`
```

