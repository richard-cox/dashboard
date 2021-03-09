
import { ALREADY_A_PROXY, SELF, PRIVATE } from './resource-proxy';

interface ProxyOverrides<T> {
  [ALREADY_A_PROXY]: true;
  [SELF]: T,
  // [Symbol.toStringTag]: string,
  ['toString']: string,
  ['constructor']: () => void,
  [PRIVATE]: Object,

  _type: string;
  __rehydrate: string;
  transitioning?: boolean; // TODO: RC
}

type Labels = { [key: string]: string; };
type Annotations = { [key: string]: string; };

export type BaseResource = {
  type: string;
  id?: string;
  name?: string;
  _name?: string;
    // TODO: RC this is kube specific but base.... as they're refered to directly in the resource instance
  metadata?: {
    name: string;
    annotations: Annotations;
    labels: Labels;
    state: any;
  };
};

type AxiosOpt = { // TODO: RC check & typing
  url?: string;
  urlSuffix?: string;
  method?: string,
  headers?: {},
  data?: any;
};
type VueLocation = { // TODO: RC check & typing
  name: string;
  params: { [key: string]: string; };
  query: { [key: string]: string; };
};
type ValidationRule = {
  path: string,
  requiredIf: string,
  validators: any[],
  type: string,
  translationKey: string;
};
// type Relationship

export interface ProxyResourceInstance {
  customValidationRules: ValidationRule[];
  labels: Labels;
  annotations: Annotations;
  description: string;
  typeDisplay: string;
  nameDisplay: string;

  nameSort: string;

  namespacedName: string;

  namespacedNameSort: string;

  name: string;
  namespace: string;

  groupByLabel: string;

  labelsToIgnoreRegexes: RegExp[];

  setLabels: (vals: Labels) => void;

  setLabel: (key: string, val: string) => void;

  annotationsToIgnoreRegexes: RegExp[];

  setAnnotations: (vals: Annotations) => void;

  setAnnotation: (key: string, val: string) => void;

  // You can override the state by providing your own state (and possibly reading metadata.state)
  state: string;

  // You can override the displayed by providing your own stateDisplay (and possibly using the function exported above)
  stateDisplay: string;

  stateColor: string;

  stateBackground: string;

  stateIcon: string;

  stateSort: string;

  showMessage: boolean;

  // ------------------------------------------------------------------

  waitForTestFn: (fn, msg, timeoutMs, intervalMs) => Promise<any>;

  waitForState: (state, timeout, interval) => Promise<any>;

  waitForTransition: () => Promise<any>;

  waitForAction: (name) => Promise<any>;

  waitForLink: (name) => Promise<any>;

  hasCondition: (condition, withStatus: string) => boolean;

  waitForCondition: (name, withStatus: string, timeoutMs: number, intervalMs: number) => Promise<any>;

  // ------------------------------------------------------------------

  availableActions: any[];// TODO: RC type

  // You can add custom actions by overriding your own availableActions (and probably reading _standardActions)
  _availableActions: any[];// TODO: RC type

  _standardActions: any[];// TODO: RC type,

  // ------------------------------------------------------------------

  canDelete: boolean;

  canUpdate: boolean;

  canCustomEdit: boolean;

  canCreate: boolean;

  canViewInApi: boolean;

  canYaml: boolean;

  // ------------------------------------------------------------------

  hasLink: (linkName) => any; // TODO: RC typing

  linkFor: (linkName) => any; // TODO: RC typing

  followLink: (linkName, opt: AxiosOpt) => Promise<any>; // TODO: RC typing

  // ------------------------------------------------------------------

  hasAction: (actionName) => boolean;

  actionLinkFor: (linkName) => any; // TODO: RC typing

  doAction: (actionName, body, opt: AxiosOpt) => Promise<any>; // TODO: RC typing

  // ------------------------------------------------------------------

  patch: (data, opt: AxiosOpt) => Promise<any>; // TODO: RC typing

  save: (opt?: AxiosOpt) => Promise<any>; // TODO: RC typing

  remove: (opt: AxiosOpt) => Promise<any>; // TODO: RC typing

  // ------------------------------------------------------------------

  currentRoute: () => any; // TODO: RC typing routing;

  currentRouter: () => any; // TODO: RC typing routing;

  listLocation: VueLocation; // TODO: RC typing - location

  _detailLocation: VueLocation; // TODO: RC typing - location

  detailLocation: VueLocation; // TODO: RC typing - location

  goToClone: (moreQuery: object) => void;

  goToEdit: (moreQuery: object) => void;

  goToViewConfig: (moreQuery: object) => void;

  goToEditYaml: () => void;

  goToViewYaml: () => void;

  cloneYaml: (moreQuery: object) => void;

  download: () => Promise<void>;

  downloadBulk: (items) => Promise<void>;

  viewInApi: () => void;

  promptRemove: (resources: ProxiedResource[]) => void;

  applyDefaults: () => void;

  urlFromAttrs: string[];

  // convert yaml to object, clean for new if creating/cloning
  // map _type to type
  cleanYaml: (yaml, mode: string) => object;

  cleanForNew: () => any; // TODO: RC typing

  yamlForSave: (yaml) => object;

  saveYaml: (yaml) => Promise<void>;

  validationErrors: (data, ignoreFields) => string[];

  ownersByType: { [kind: string]: string; };
  owners: any[];

  details: any[]; // TODO: RC typing

  // TODO: RC proxy.$rootGetters['i18n/t']
  t: (...args: any[]) => string;

  // Returns array of MODELS that own this resource (async, network call)
  findOwners: () => any[]; // TODO: RC typing - owner

  // Returns array of {type, namespace, id} objects that own this resource (sync)
  getOwners: () => any[]; // TODO: RC typing - owner

  findOwned: () => any; // TODO: RC typing - owner

  _relationshipsFor: () => any[]; // TODO: RC typing - relationships

  _getRelationship: (rel, direction) => string[];

  _findRelationship: (rel, direction) => Promise<any>; // TODO: RC typing
};

/**
 * Model - ./model/<type> definition
 * Resource - actual underlying object (e.g. a KubeResource)
 */
export type ProxiedResource<Model = Partial<ProxyResourceInstance>, Resource = BaseResource> = Model & ProxyOverrides<Resource> & ProxyResourceInstance & Resource;

export type ResourceInstanceForProxy<T extends { [key: string]: any; }> = {
  [P in keyof T]: (proxy: ProxiedResource) => T[P]
};

// interface TestResource extends BaseResource {
//   a: number,
//   b: string,
// };
// const testobj: TestResource = {
//   type: 'My Type',
//   a:    1,
//   b:    '2'
// };

// interface TestModel extends Partial<ProxyResourceInstance> {
//   nameDisplay: string;
//   nameDisplay2: string;
// };

// const test2 = {} as ProxiedResource<TestModel, TestResource>;
