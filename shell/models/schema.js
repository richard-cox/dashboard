import Resource from '@shell/plugins/dashboard-store/resource-class';
import { STEVE } from '@shell/config/types';

export default class Schema extends Resource {
  constructor(...args) {
    super(...args);

    if (!args[0].resourceFields) {
      this.resourceFieldsFromSchemaDefinitions = true;
    }
  }

  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }

  // ---------
  _schemaDefinitions;
  // get schemaDefinitions() {

  // }
  get schemaDefinitions() {
    if (!this._schemaDefinitions) {
      return null;
    }

    return {
      self:   this._schemaDefinitions.self,
      others: this._schemaDefinitions.others.map((d) => this.$getters['byId'](STEVE.SCHEMA_DEFINITION, d.id))
    };
  }

  async fetchResourceFields() {
    // const fromStore = this.$getters['byId'](STEVE.SCHEMA_DEFINITION, this.id);

    if (this._schemaDefinitions?.self) {
      return this._schemaDefinitions?.self;
    }

    const res = await this.$dispatch('request', {
      type: STEVE.SCHEMA_DEFINITION,
      url:  `/v1/schemaDefinitions/${ this.id }` // TODO: Michael. url creation looks at links.collection. can have but no collectionMethods? determine local / kube id
    });

    // TODO: RC skipped resourceFields.x.create|update
    const resourceSchemaDefinitions = [];
    const schemaDefinitionForStore = [];
    let self;

    Object.entries(res.definitions).forEach(([id, d]) => {
      resourceSchemaDefinitions.push(id);
      const def = {
        ...d,
        type: STEVE.SCHEMA_DEFINITION,
        id:   d.type // TODO: RC
      };

      if (id === res.definitionType) {
        self = def;
      } else {
        schemaDefinitionForStore.push(def);
      }
    });

    this._schemaDefinitions = {
      self,
      others: resourceSchemaDefinitions
    };

    await this.$dispatch('loadMulti', schemaDefinitionForStore);

    const schemaDefinition = this.$getters['byId'](STEVE.SCHEMA_DEFINITION, res.definitionType);

    // const res = await this.$dispatch('find', {
    //   type: STEVE.SCHEMA_DEFINITION,
    //   id:   this.id,
    //   opt:  { url: `/v1/schemaDefinitions/${ this.id }` } // TODO: Michael. url creation looks at links.collection. can have but no collectionMethods? determine local / kube id
    // });

    debugger;

    return schemaDefinition;
  }

  _resourceFields;
  _requiresResourceFieldsFromSchemaDefinitions;
  resourceFieldsFromSchemaDefinitions;

  get resourceFields() {
    if (this._resourceFields) {
      return this._resourceFields;
    }

    if (!this._resourceFieldsFromSchemaDefinitions) {
      this._resourceFieldsFromSchemaDefinitions = this.fetchResourceFields();
    }

    return this._resourceFieldsFromSchemaDefinitions;
    // const schemaDefinition = this.$getters['byId'](STEVE.SCHEMA_DEFINITION, this.id);

    // TODO: RC only for Steve
    // this.$dispatch()
  }

  set resourceFields(resourceFields) {
    this._resourceFields = resourceFields;
  }
}

export function parseType(str) {
  if ( str.startsWith('array[') ) {
    return ['array', ...parseType(str.slice(6, -1))];
  } else if ( str.startsWith('map[') ) {
    return ['map', ...parseType(str.slice(4, -1))];
  } else {
    return [str];
  }
}
