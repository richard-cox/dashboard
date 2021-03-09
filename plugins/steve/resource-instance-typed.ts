/* eslint-disable */
import Vue from '*.vue';
import { ANNOTATIONS_TO_IGNORE_REGEX, DESCRIPTION, LABELS_TO_IGNORE_REGEX, NORMAN_NAME } from '@/config/labels-annotations';
import { _CLONE, _CONFIG, _EDIT, _UNFLAG, _VIEW, _YAML, AS, MODE } from '@/config/query-params';
import { DEV } from '@/typed-store/prefs';
import { addObject, addObjects, findBy, removeAt } from '@/utils/array';
import CustomValidators from '@/utils/custom-validators';
import { downloadFile, generateZip } from '@/utils/download';
import { get } from '@/utils/object';
import { eachLimit } from '@/utils/promise';
import { sortableNumericSuffix } from '@/utils/sort';
import { coerceStringTypeToScalarType, escapeHtml, matchesSomeRegex, ucFirst } from '@/utils/string';
import { displayKeyFor, validateBoolean, validateChars, validateDnsLikeTypes, validateLength } from '@/utils/validators';
import jsyaml from 'js-yaml';
import compact from 'lodash/compact';
import forIn from 'lodash/forIn';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import omitBy from 'lodash/omitBy';
import pickBy from 'lodash/pickBy';
import uniq from 'lodash/uniq';
import { ProxiedResource, ProxyResourceInstance, ResourceInstanceForProxy } from '~/plugins/steve/resource.types';
// import Vue from 'vue';
// import { Component, Vue, Prop } from 'vue-property-decorator';

import { cleanForNew, normalizeType } from './normalize';

const STRING_LIKE_TYPES = [
  'string',
  'date',
  'blob',
  'enum',
  'multiline',
  'masked',
  'password',
  'dnsLabel',
  'hostname',
];
const DNS_LIKE_TYPES = ['dnsLabel', 'dnsLabelRestricted', 'hostname'];

const REMAP_STATE = {
  disabled: 'inactive',
  notapplied: 'Not Applied',
  notready: 'Not Ready',
  waitapplied: 'Wait Applied',
  outofsync: 'Out of Sync',
  'in-progress': 'In Progress',
  gitupdating: 'Git Updating',
  errapplied: 'Err Applied',
  waitcheckin: 'Wait Check-In',
};

const DEFAULT_COLOR = 'warning';
const DEFAULT_ICON = 'x';

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_WAIT_TMIMEOUT = 30000;

export const STATES = {
  'in-progress': { color: 'info', icon: 'tag' },
  'pending-rollback': { color: 'info', icon: 'dot-half' },
  'pending-upgrade': { color: 'info', icon: 'dot-half' },
  aborted: { color: 'warning', icon: 'error' },
  activating: { color: 'info', icon: 'tag' },
  active: { color: 'success', icon: 'dot-open' },
  available: { color: 'success', icon: 'dot-open' },
  backedup: { color: 'success', icon: 'backup' },
  bound: { color: 'success', icon: 'dot' },
  building: { color: 'success', icon: 'dot-open' },
  completed: { color: 'success', icon: 'dot' },
  cordoned: { color: 'info', icon: 'tag' },
  count: { color: 'success', icon: 'dot-open' },
  created: { color: 'info', icon: 'tag' },
  creating: { color: 'info', icon: 'tag' },
  deactivating: { color: 'info', icon: 'adjust' },
  degraded: { color: 'warning', icon: 'error' },
  denied: { color: 'error', icon: 'adjust' },
  deployed: { color: 'success', icon: 'dot-open' },
  disabled: { color: 'warning', icon: 'error' },
  disconnected: { color: 'warning', icon: 'error' },
  errapplied: { color: 'error', icon: 'error' },
  error: { color: 'error', icon: 'error' },
  erroring: { color: 'error', icon: 'error' },
  errors: { color: 'error', icon: 'error' },
  expired: { color: 'warning', icon: 'error' },
  fail: { color: 'error', icon: 'error' },
  failed: { color: 'error', icon: 'error' },
  healthy: { color: 'success', icon: 'dot-open' },
  inactive: { color: 'error', icon: 'dot' },
  initializing: { color: 'warning', icon: 'error' },
  inprogress: { color: 'info', icon: 'spinner' },
  locked: { color: 'warning', icon: 'adjust' },
  migrating: { color: 'info', icon: 'info' },
  missing: { color: 'warning', icon: 'adjust' },
  modified: { color: 'warning', icon: 'edit' },
  notApplicable: { color: 'warning', icon: 'tag' },
  notapplied: { color: 'warning', icon: 'tag' },
  notready: { color: 'warning', icon: 'tag' },
  orphaned: { color: 'warning', icon: 'tag' },
  other: { color: 'info', icon: 'info' },
  outofsync: { color: 'warning', icon: 'tag' },
  pass: { color: 'success', icon: 'dot-dotfill' },
  passed: { color: 'success', icon: 'dot-dotfill' },
  paused: { color: 'info', icon: 'info' },
  pending: { color: 'info', icon: 'tag' },
  provisioning: { color: 'info', icon: 'dot' },
  purged: { color: 'error', icon: 'purged' },
  purging: { color: 'info', icon: 'purged' },
  ready: { color: 'success', icon: 'dot-open' },
  reconnecting: { color: 'error', icon: 'error' },
  registering: { color: 'info', icon: 'tag' },
  reinitializing: { color: 'warning', icon: 'error' },
  released: { color: 'warning', icon: 'error' },
  removed: { color: 'error', icon: 'trash' },
  removing: { color: 'info', icon: 'trash' },
  requested: { color: 'info', icon: 'tag' },
  restarting: { color: 'info', icon: 'adjust' },
  restoring: { color: 'info', icon: 'medicalcross' },
  running: { color: 'success', icon: 'dot-open' },
  skip: { color: 'info', icon: 'dot-open' },
  skipped: { color: 'info', icon: 'dot-open' },
  starting: { color: 'info', icon: 'adjust' },
  stopped: { color: 'error', icon: 'dot' },
  stopping: { color: 'info', icon: 'adjust' },
  succeeded: { color: 'success', icon: 'dot-dotfill' },
  success: { color: 'success', icon: 'dot-open' },
  superseded: { color: 'info', icon: 'dot-open' },
  suspended: { color: 'info', icon: 'pause' },
  unavailable: { color: 'error', icon: 'error' },
  unhealthy: { color: 'error', icon: 'error' },
  uninstalled: { color: 'info', icon: 'trash' },
  uninstalling: { color: 'info', icon: 'trash' },
  unknown: { color: 'warning', icon: 'x' },
  untriggered: { color: 'success', icon: 'tag' },
  updating: { color: 'warning', icon: 'tag' },
  waitapplied: { color: 'info', icon: 'tag' },
  waitcheckin: { color: 'warning', icon: 'tag' },
  waiting: { color: 'info', icon: 'tag' },
  warning: { color: 'warning', icon: 'error' },
};

export function getStatesByType(type = 'info') {
  const out = {
    info: [],
    error: [],
    success: [],
    warning: [],
    unknown: [],
  };

  forIn(STATES, (state, stateKey) => {
    if (state.color) {
      if (out[state.color]) {
        out[state.color].push(stateKey);
      } else {
        out.unknown.push(stateKey);
      }
    }
  });

  return out;
}

const SORT_ORDER = {
  error: 1,
  warning: 2,
  info: 3,
  success: 4,
  other: 5,
};

// export function colorForState(state, isError, isTransitioning) {
//   if (isError) {
//     return 'text-error';
//   }

//   if (isTransitioning) {
//     return 'text-info';
//   }

//   const key = (state || 'active').toLowerCase();
//   let color;

//   if (STATES[key] && STATES[key].color) {
//     color = maybeFn.call(proxy, STATES[key].color);
//   }

//   if (!color) {
//     color = DEFAULT_COLOR;
//   }

//   return `text-${color}`;
// }

export function stateDisplay(state) {
  // @TODO use translations
  const key = (state || 'active').toLowerCase();

  if (REMAP_STATE[key]) {
    return REMAP_STATE[key];
  }

  return key.split(/-/).map(ucFirst).join('-');
}

export function stateSort(color, display) {
  color = color.replace(/^(text|bg)-/, '');

  return `${SORT_ORDER[color] || SORT_ORDER['other']} ${display}`;
}

// function maybeFn(val) {
//   if (isFunction(val)) {
//     return val(proxy);
//   }

//   return val;
// }

// KEEP! Commented out to avoid build failures in remaining areas to fix
// const ResourceInstance: ResourceInstanceForProxy<ProxiedResource<ProxyResourceInstance>> = {
//   customValidationRules(proxy) {
//     return [
//       /**
//        * Essentially a fake schema object with additonal params to extend validation
//        *
//        * @param {nullable} Value is nullabel
//        * @param {path} Path on the resource to the value to validate
//        * @param {required} Value required
//        * @param {requiredIf} Value required if value at path not empty
//        * @param {translationKey} Human readable display key for param in path e.g. metadata.name === Name
//        * @param {type} Type of field to validate
//        * @param {validators} array of strings where item is name of exported validator function in custom-validtors, args can be passed by prepending args seperated by colon. e.g maxLength:63
//        */
//       /* {
//         nullable:       false,
//         path:           'spec.ports',
//         required:       true,
//         type:           'array',
//         validators:     ['servicePort'],
//       } */
//     ];
//   },

//   _keytypo(proxy) {
//     const m = proxy['metadata'];

//     if (m) {
//       if (m.uid) {
//         return m.uid;
//       }

//       if (m.namespace) {
//         return `${proxy.type}/${m.namespace}/${m.name}`;
//       }
//     }

//     if (proxy.id) {
//       return `${proxy.type}/${proxy.id}`;
//     }

//     return `${proxy.type}/${Math.random()}`;
//   },

//   _key(proxy) {
//     // TODO: RC typing
//     const m = proxy['metadata'];

//     if (m) {
//       if (m.uid) {
//         return m.uid;
//       }

//       if (m.namespace) {
//         return `${proxy.type}/${m.namespace}/${m.name}`;
//       }
//     }

//     if (proxy.id) {
//       return `${proxy.type}/${proxy.id}`;
//     }

//     return `${proxy.type}/${Math.random()}`;
//   },

//   schema(proxy) {
//     return proxy.$getters['schemaFor'](proxy.type);
//   },

//   toString(proxy) {
//     return () => {
//       return `[${proxy.type}: ${proxy.id}]`;
//     };
//   },

//   description(proxy) {
//     // TODO: RC typing
//     return proxy['metadata']?.annotations?.[DESCRIPTION];
//   },

//   labels(proxy) {
//     const all = proxy['metadata'].labels || {};

//     return omitBy(all, (value, key) => {
//       return matchesSomeRegex(key, proxy.labelsToIgnoreRegexes);
//     });
//   },

//   annotations(proxy) {
//     const all = proxy['metadata'].annotations || {};

//     return omitBy(all, (value, key) => {
//       return matchesSomeRegex(key, proxy.annotationsToIgnoreRegexes);
//     });
//   },

//   typeDisplay(proxy) {
//     const schema = proxy['schema'];

//     if (schema) {
//       return proxy.$rootGetters['type-map/labelFor'](schema);
//     }

//     return '?';
//   },

//   nameDisplay(proxy) {
//     return proxy['displayName'] || proxy['spec']?.displayName || proxy['metadata'].annotations?.[NORMAN_NAME] || proxy['metadata'].name || proxy.id;
//   },

//   nameSort(proxy) {
//     return sortableNumericSuffix(proxy.nameDisplay).toLowerCase();
//   },

//   namespacedName(proxy) {
//     const namespace = proxy['metadata'].namespace;
//     const name = proxy.nameDisplay;

//     if (namespace) {
//       return `${namespace}:${name}`;
//     }

//     return name;
//   },

//   namespacedNameSort(proxy) {
//     return sortableNumericSuffix(proxy.namespacedName).toLowerCase();
//   },

//   name(proxy) {
//     return proxy['_name'] || proxy['metadata'].name;
//   },

//   namespace(proxy) {
//     return proxy['metadata'].namespace;
//   },

//   groupByLabel(proxy) {
//     const name = proxy['metadata'].namespace;
//     let out;

//     if (name) {
//       out = proxy.t('resourceTable.groupLabel.namespace', { name: escapeHtml(name) });
//     } else {
//       out = proxy.t('resourceTable.groupLabel.notInANamespace');
//     }

//     return out;
//   },

//   labelsToIgnoreRegexes(proxy) {
//     return LABELS_TO_IGNORE_REGEX;
//   },

//   setLabels(proxy) {
//     return (val) => {
//       if (!proxy['metadata']) {
//         proxy['metadata'] = {};
//       }

//       const all = proxy['metadata'].labels || {};
//       const wasIgnored = pickBy(all, (value, key) => {
//         return matchesSomeRegex(key, proxy.labelsToIgnoreRegexes);
//       });

//       Vue.set(proxy['metadata'], 'labels', { ...wasIgnored, ...val });
//     };
//   },

//   setLabel(proxy) {
//     return (key, val) => {
//       if (val) {
//         if (!proxy['metadata']) {
//           proxy['metadata'] = {};
//         }

//         if (!proxy['metadata'].labels) {
//           proxy['metadata'].labels = {};
//         }

//         Vue.set(proxy['metadata'].labels, key, val);
//       } else if (proxy['metadata'].labels) {
//         Vue.set(proxy['metadata'].labels, key, undefined);
//         delete proxy['metadata'].labels[key];
//       }
//     };
//   },

//   annotationsToIgnoreRegexes(proxy) {
//     return ANNOTATIONS_TO_IGNORE_REGEX;
//   },

//   setAnnotations(proxy) {
//     return (val) => {
//       if (!proxy['metadata']) {
//         proxy['metadata'] = {};
//       }

//       const all = proxy['metadata'].annotations || {};
//       const wasIgnored = pickBy(all, (value, key) => {
//         return matchesSomeRegex(key, proxy.annotationsToIgnoreRegexes);
//       });

//       Vue.set(proxy['metadata'], 'annotations', { ...wasIgnored, ...val });
//     };
//   },

//   setAnnotation(proxy) {
//     return (key, val) => {
//       if (val) {
//         if (!proxy['metadata']) {
//           proxy['metadata'] = {};
//         }

//         if (!proxy['metadata'].annotations) {
//           proxy['metadata'].annotations = {};
//         }

//         Vue.set(proxy['metadata'].annotations, key, val);
//       } else if (proxy['metadata'].annotations) {
//         Vue.set(proxy['metadata'].annotations, key, undefined);
//         delete proxy['metadata'].annotations[key];
//       }
//     };
//   },

//   // You can override the state by providing your own state (and possibly reading metadata.state)
//   state(proxy) {
//     return proxy['metadata'].state?.name || 'unknown';
//   },

//   // You can override the displayed by providing your own stateDisplay (and possibly using the function exported above)
//   stateDisplay(proxy) {
//     return stateDisplay(proxy.state);
//   },

//   stateColor(proxy) {
//     return colorForState.call(
//       proxy,
//       proxy.state,
//       proxy['metadata'].state?.error,
//       proxy['metadata'].state?.transitioning
//     );
//   },

//   stateBackground(proxy) {
//     return proxy.stateColor.replace('text-', 'bg-');
//   },

//   stateIcon(proxy) {
//     let trans = false;
//     let error = false;

//     if (proxy['metadata'] && proxy['metadata'].state) {
//       trans = proxy['metadata'].state.transitioning;
//       error = proxy['metadata'].state.error;
//     }

//     if (trans) {
//       return 'icon icon-spinner icon-spin';
//     }

//     if (error) {
//       return 'icon icon-error';
//     }

//     const key = (proxy.state || '').toLowerCase();
//     let icon;

//     if (STATES[key] && STATES[key].icon) {
//       icon = maybeFn.call(proxy, STATES[key].icon);
//     }

//     if (!icon) {
//       icon = DEFAULT_ICON;
//     }

//     return `icon icon-${icon}`;
//   },

//   stateSort(proxy) {
//     return stateSort(proxy.stateColor, proxy.stateDisplay);
//   },

//   showMessage(proxy) {
//     const trans = proxy['metadata'].state?.transitioning || false;
//     const error = proxy['metadata'].state?.error || false;
//     const message = proxy['metadata'].state?.message;

//     return (trans || error) && message && message.toLowerCase() !== proxy.stateDisplay.toLowerCase();
//   },

//   // ------------------------------------------------------------------

//   waitForTestFn(proxy) {
//     return (fn, msg, timeoutMs, intervalMs) => {
//       console.log('Starting wait for', msg); // eslint-disable-line no-console

//       if (!timeoutMs) {
//         timeoutMs = DEFAULT_WAIT_TMIMEOUT;
//       }

//       if (!intervalMs) {
//         intervalMs = DEFAULT_WAIT_INTERVAL;
//       }

//       return new Promise((resolve, reject) => {
//         // Do a first check immediately
//         if (fn.apply(proxy)) {
//           console.log('Wait for', msg, 'done immediately'); // eslint-disable-line no-console
//           resolve(proxy);
//         }

//         const timeout = setTimeout(() => {
//           console.log('Wait for', msg, 'timed out'); // eslint-disable-line no-console
//           clearInterval(interval);
//           clearTimeout(timeout);
//           reject(new Error(`Failed while: ${msg}`));
//         }, timeoutMs);

//         const interval = setInterval(() => {
//           if (fn.apply(proxy)) {
//             console.log('Wait for', msg, 'done'); // eslint-disable-line no-console
//             clearInterval(interval);
//             clearTimeout(timeout);
//             resolve(proxy);
//           } else {
//             console.log('Wait for', msg, 'not done yet'); // eslint-disable-line no-console
//           }
//         }, intervalMs);
//       });
//     };
//   },

//   waitForState(proxy) {
//     return (state, timeout, interval) => {
//       return proxy.waitForTestFn(() => {
//         return (proxy.state || '').toLowerCase() === state.toLowerCase();
//       }, `state=${state}`, timeout, interval);
//     };
//   },

//   waitForTransition(proxy) {
//     return () => {
//       return proxy.waitForTestFn(() => {
//         return !proxy.transitioning;
//       }, 'transition completion');
//     };
//   },

//   waitForAction(proxy) {
//     return (name) => {
//       return proxy.waitForTestFn(() => {
//         return proxy.hasAction(name);
//       }, `action=${name}`);
//     };
//   },

//   waitForLink(proxy) {
//     return (name) => {
//       return proxy.waitForTestFn(() => {
//         return proxy.hasLink(name);
//       }, `link=${name}`);
//     };
//   },

//   hasCondition(proxy) {
//     return (condition, withStatus = 'True') => {
//       if (!proxy['status'] || !proxy['status'].conditions) {
//         return false;
//       }

//       const entry = findBy((proxy['status'].conditions || []), 'type', condition);

//       if (!entry) {
//         return false;
//       }

//       if (!withStatus) {
//         return true;
//       }

//       return (entry.status || '').toLowerCase() === `${withStatus}`.toLowerCase();
//     };
//   },

//   waitForCondition(proxy) {
//     return (name, withStatus = 'True', timeoutMs = DEFAULT_WAIT_TMIMEOUT, intervalMs = DEFAULT_WAIT_INTERVAL) => {
//       return proxy.waitForTestFn(() => {
//         return proxy.hasCondition(name, withStatus);
//       }, `condition ${name}=${withStatus}`, timeoutMs, intervalMs);
//     };
//   },

//   // ------------------------------------------------------------------

//   availableActions(proxy) {
//     const all = proxy._availableActions;

//     // Remove disabled items and consecutive dividers
//     let last = null;
//     const out = all.filter((item) => {
//       if (item.enabled === false) {
//         return false;
//       }

//       const cur = item.divider;
//       const ok = !cur || (cur && !last);

//       last = cur;

//       return ok;
//     });

//     // Remove dividers at the beginning
//     while (out.length && out[0].divider) {
//       out.shift();
//     }

//     // Remove dividers at the end
//     while (out.length && out[out.length - 1].divider) {
//       out.pop();
//     }

//     // Remove consecutive dividers in the middle
//     for (let i = 1; i < out.length; i++) {
//       if (out[i].divider && out[i - 1].divider) {
//         removeAt(out, i, 1);
//         i--;
//       }
//     }

//     return out;
//   },

//   // You can add custom actions by overriding your own availableActions (and probably reading _standardActions)
//   _availableActions(proxy) {
//     return proxy._standardActions;
//   },

//   _standardActions(proxy) {
//     const all = [
//       { divider: true },
//       {
//         action: proxy.canUpdate ? 'goToEdit' : 'goToViewConfig',
//         label: proxy.t(proxy.canUpdate ? 'action.edit' : 'action.view'),
//         icon: 'icon icon-edit',
//         enabled: proxy.canCustomEdit,
//       },
//       {
//         action: proxy.canUpdate ? 'goToEditYaml' : 'goToViewYaml',
//         label: proxy.t(proxy.canUpdate ? 'action.editYaml' : 'action.viewYaml'),
//         icon: 'icon icon-file',
//         enabled: proxy.canYaml,
//       },
//       {
//         action: 'download',
//         label: proxy.t('action.download'),
//         icon: 'icon icon-download',
//         bulkable: true,
//         bulkAction: 'downloadBulk',
//         enabled: proxy.canYaml
//       },
//       {
//         action: (proxy.canCustomEdit ? 'goToClone' : 'cloneYaml'),
//         label: proxy.t('action.clone'),
//         icon: 'icon icon-copy',
//         enabled: proxy.canCreate && (proxy.canCustomEdit || proxy.canYaml),
//       },
//       { divider: true },
//       {
//         action: 'promptRemove',
//         altAction: 'remove',
//         label: proxy.t('action.remove'),
//         icon: 'icon icon-trash',
//         bulkable: true,
//         enabled: proxy.canDelete,
//         bulkAction: 'promptRemove',
//       },
//       {
//         action: 'viewInApi',
//         label: proxy.t('action.viewInApi'),
//         icon: 'icon icon-external-link',
//         enabled: proxy.canViewInApi,
//       }
//     ];

//     return all;
//   },

//   // ------------------------------------------------------------------

//   canDelete(proxy) {
//     return proxy.hasLink('remove') && proxy.$rootGetters['type-map/optionsFor'](proxy.type).isRemovable;
//   },

//   canUpdate(proxy) {
//     return proxy.hasLink('update') && proxy.$rootGetters['type-map/optionsFor'](proxy.type).isEditable;
//   },

//   canCustomEdit(proxy) {
//     return proxy.$rootGetters['type-map/hasCustomEdit'](proxy.type, proxy.id);
//   },

//   canCreate(proxy) {
//     if (proxy['schema'] && !proxy['schema']?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
//       return false;
//     }

//     return proxy.$rootGetters['type-map/optionsFor'](proxy.type).isCreatable;
//   },

//   canViewInApi(proxy) {
//     return proxy.hasLink('self') && proxy.$rootGetters['prefs/get'](DEV);
//   },

//   canYaml(proxy) {
//     return proxy.hasLink('rioview') || proxy.hasLink('view');
//   },

//   // ------------------------------------------------------------------

//   hasLink(proxy) {
//     return (linkName) => {
//       return !!proxy.linkFor(linkName);
//     };
//   },

//   linkFor(proxy) {
//     return (linkName) => {
//       return (proxy['links'] || {})[linkName];
//     };
//   },

//   followLink(proxy) {
//     return (linkName, opt = {}) => {
//       if (!opt.url) {
//         opt.url = (proxy['links'] || {})[linkName];
//       }

//       if (opt.urlSuffix) {
//         opt.url += opt.urlSuffix;
//       }

//       if (!opt.url) {
//         throw new Error(`Unknown link ${linkName} on ${proxy.type} ${proxy.id}`);
//       }

//       return proxy.$dispatch('request', opt);
//     };
//   },

//   // ------------------------------------------------------------------

//   hasAction(proxy) {
//     return (actionName) => {
//       return !!proxy.actionLinkFor(actionName);
//     };
//   },

//   actionLinkFor(proxy) {
//     return (actionName) => {
//       // TODO: RC norman vs steve
//       return (proxy['actions'] || proxy['actionLinks'] || {})[actionName];
//     };
//   },

//   doAction(proxy) {
//     return (actionName, body, opt = {}) => {
//       return proxy.$dispatch('resourceAction', {
//         resource: proxy,
//         actionName,
//         body,
//         opt,
//       });
//     };
//   },

//   // ------------------------------------------------------------------

//   patch(proxy) {
//     return (data, opt = {}) => {
//       if (!opt.url) {
//         opt.url = proxy.linkFor('self');
//       }

//       opt.method = 'patch';
//       opt.headers = opt.headers || {};
//       opt.headers['content-type'] = 'application/json-patch+json';
//       opt.data = data;

//       return proxy.$dispatch('request', opt);
//     };
//   },

//   save(proxy) {
//     return async (opt = {}) => {
//       delete proxy.__rehydrate;
//       const forNew = !proxy.id;

//       const errors = await proxy.validationErrors();

//       if (!isEmpty(errors)) {
//         return Promise.reject(errors);
//       }

//       if (proxy['metadata'].resourceVersion) {
//         proxy['metadata'].resourceVersion = `${proxy['metadata'].resourceVersion}`;
//       }

//       if (!opt.url) {
//         if (forNew) {
//           const schema = proxy.$getters['schemaFor'](proxy.type);
//           let url = schema.linkFor('collection');

//           if (schema.attributes && schema.attributes.namespaced) {
//             url += `/${proxy['metadata'].namespace}`;
//           }

//           opt.url = url;
//         } else {
//           opt.url = proxy.linkFor('update') || proxy.linkFor('self');
//         }
//       }

//       if (!opt.method) {
//         opt.method = (forNew ? 'post' : 'put');
//       }

//       if (!opt.headers) {
//         opt.headers = {};
//       }

//       if (!opt.headers['content-type']) {
//         opt.headers['content-type'] = 'application/json';
//       }

//       if (!opt.headers['accept']) {
//         opt.headers['accept'] = 'application/json';
//       }

//       // @TODO remove this once the API maps steve _type <-> k8s type in both directions
//       opt.data = { ...proxy };

//       if (opt?.data._type) {
//         opt.data.type = opt.data._type;
//       }

//       try {
//         const res = await proxy.$dispatch('request', opt);

//         // console.log('### Resource Save', proxy.type, proxy.id);

//         // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
//         if (res && res.kind !== 'Table') {
//           await proxy.$dispatch('load', { data: res, existing: (forNew ? proxy : undefined) });
//         }
//       } catch (e) {
//         if (proxy.type && proxy.id && e?._status === 409) {
//           // If there's a conflict, try to load the new version
//           await proxy.$dispatch('find', {
//             type: proxy.type,
//             id: proxy.id,
//             opt: { force: true }
//           });
//         }

//         return Promise.reject(e);
//       }

//       return proxy;
//     };
//   },

//   remove(proxy) {
//     return async (opt = {}) => {
//       if (!opt.url) {
//         opt.url = (proxy['links'] || {})['self'];
//       }

//       opt.method = 'delete';

//       const res = await proxy.$dispatch('request', opt);

//       if (res?._status === 204) {
//         // If there's no body, assume the resource was immediately deleted
//         // and drop it from the store as if a remove event happened.
//         await proxy.$dispatch('ws.resource.remove', { data: proxy });
//       }
//     };
//   },

//   // ------------------------------------------------------------------

//   currentRoute(proxy) {
//     return () => {
//       if (process.server) {
//         return proxy.$rootState.$route;
//       } else {
//         return window.$nuxt.$route;
//       }
//     };
//   },

//   currentRouter(proxy) {
//     return () => {
//       if (process.server) {
//         return proxy.$rootState.$router;
//       } else {
//         return window.$nuxt.$router;
//       }
//     };
//   },

//   listLocation(proxy) {
//     return {
//       name: `c-cluster-product-resource`,
//       params: {
//         product: proxy.$rootGetters['productId'],
//         cluster: proxy.$rootGetters['clusterId'],
//         resource: proxy.type,
//       }
//     };
//   },

//   _detailLocation(proxy) {
//     const schema = proxy.$getters['schemaFor'](proxy.type);

//     const id = proxy.id?.replace(/.*\//, '');

//     return {
//       name: `c-cluster-product-resource${schema?.attributes?.namespaced ? '-namespace' : ''}-id`,
//       params: {
//         product: proxy.$rootGetters['productId'],
//         cluster: proxy.$rootGetters['clusterId'],
//         resource: proxy.type,
//         namespace: proxy['metadata'].namespace,
//         id,
//       }
//     };
//   },

//   detailLocation(proxy) {
//     return proxy._detailLocation;
//   },

//   goToClone(proxy) {
//     return (moreQuery = {}) => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _CLONE,
//         [AS]: _UNFLAG,
//         ...moreQuery
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   goToEdit(proxy) {
//     return (moreQuery = {}) => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _EDIT,
//         [AS]: _UNFLAG,
//         ...moreQuery
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   goToViewConfig(proxy) {
//     return (moreQuery = {}) => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _VIEW,
//         [AS]: _CONFIG,
//         ...moreQuery
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   goToEditYaml(proxy) {
//     return () => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _EDIT,
//         [AS]: _YAML
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   goToViewYaml(proxy) {
//     return () => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _VIEW,
//         [AS]: _YAML
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   cloneYaml(proxy) {
//     return (moreQuery = {}) => {
//       const location = proxy.detailLocation;

//       location.query = {
//         ...location.query,
//         [MODE]: _CLONE,
//         [AS]: _YAML,
//         ...moreQuery
//       };

//       proxy.currentRouter().push(location);
//     };
//   },

//   download(proxy) {
//     return async () => {
//       const link = proxy.hasLink('rioview') ? 'rioview' : 'view';
//       const value = await proxy.followLink(link, { headers: { accept: 'application/yaml' } });

//       downloadFile(`${proxy.nameDisplay}.yaml`, value.data, 'application/yaml');
//     };
//   },

//   downloadBulk(proxy) {
//     return async (items) => {
//       const files = {};
//       const names = [];

//       for (const item of items) {
//         let name = `${item.nameDisplay}.yaml`;
//         let i = 2;

//         while (names.includes(name)) {
//           name = `${item.nameDisplay}_${i++}.yaml`;
//         }

//         names.push(name);
//       }

//       await eachLimit(items, 10, (item, idx) => {
//         const link = item.hasLink('rioview') ? 'rioview' : 'view';

//         return item.followLink(link, { headers: { accept: 'application/yaml' } }).then((data) => {
//           files[`resources/${names[idx]}`] = data;
//         });
//       });

//       const zip = await generateZip(files);

//       downloadFile('resources.zip', zip, 'application/zip');
//     };
//   },

//   viewInApi(proxy) {
//     return () => {
//       window.open(proxy['links'].self, '_blank');
//     };
//   },

//   promptRemove(proxy) {
//     return (resources = proxy) => {
//       proxy.$dispatch('promptRemove', resources);
//     };
//   },

//   applyDefaults(proxy) {
//     return () => {
//     };
//   },

//   urlFromAttrs(proxy) {
//     const schema = proxy.$getters['schemaFor'](proxy.type);
//     const namespace = proxy['metadata'].namespace || 'default';
//     // const { metadata: { namespace = 'default' } } = proxy; // TODO: RC
//     let url = schema.links.collection;

//     const attributes = schema?.attributes;

//     if (!attributes) {
//       throw new Error('Attributes must be present on the schema');
//     }
//     const { group, resource } = attributes;

//     url = `${url.slice(0, url.indexOf('/v1'))}/apis/${group}/namespaces/${namespace}/${resource}`;

//     return url;
//   },

//   // convert yaml to object, clean for new if creating/cloning
//   // map _type to type
//   cleanYaml(proxy) {
//     return (yaml, mode = 'edit') => {
//       try {
//         const obj = jsyaml.safeLoad(yaml);

//         if (mode !== 'edit') {
//           cleanForNew(obj);
//         }

//         if (obj._type) {
//           obj.type = obj._type;
//           delete obj._type;
//         }
//         const out = jsyaml.safeDump(obj, { skipInvalid: true });

//         return out;
//       } catch (e) {
//         return null;
//       }
//     };
//   },

//   cleanForNew(proxy) {
//     return () => {
//       cleanForNew(proxy);
//     };
//   },

//   yamlForSave(proxy) {
//     return (yaml) => {
//       try {
//         const obj = jsyaml.safeLoad(yaml);

//         if (obj) {
//           if (proxy._type) {
//             obj._type = obj.type;
//           }

//           return jsyaml.safeDump(obj);
//         }
//       } catch (e) {
//         return null;
//       }
//     };
//   },

//   saveYaml(proxy) {
//     return async (yaml) => {
//       const parsed = jsyaml.safeLoad(yaml); // will throw on invalid yaml

//       if (proxy['schema']?.attributes?.namespaced && !parsed['metadata'].namespace) {
//         const err = proxy.$rootGetters['i18n/t']('resourceYaml.errors.namespaceRequired');

//         throw err;
//       }

//       let res;
//       const isCreate = !proxy.id;
//       const headers = {
//         'content-type': 'application/yaml',
//         accept: 'application/json',
//       };

//       if (isCreate) {
//         res = await proxy['schema'].followLink('collection', {
//           method: 'POST',
//           headers,
//           data: yaml
//         });
//       } else {
//         const link = proxy.hasLink('rioupdate') ? 'rioupdate' : 'update';

//         res = await proxy.followLink(link, {
//           method: 'PUT',
//           headers,
//           data: yaml
//         });
//       }

//       // Steve used to return tables and still might, maybe?
//       if (res && res.kind !== 'Table') {
//         await proxy.$dispatch(`load`, {
//           data: res,
//           existing: (isCreate ? proxy : undefined)
//         });
//       }
//     };
//   },

//   validationErrors(proxy) {
//     return (data, ignoreFields) => {
//       const errors = [];
//       const {
//         type: originalType,
//         schema
//       } = data;
//       const type = normalizeType(originalType);

//       if (!originalType) {
//         // eslint-disable-next-line
//         console.warn(proxy.t('validation.noType'), data);

//         return errors;
//       }

//       if (!schema) {
//         // eslint-disable-next-line
//         console.warn(proxy.t('validation.noSchema'), originalType, data);

//         return errors;
//       }

//       const fields = schema.resourceFields || {};
//       const keys = Object.keys(fields);
//       let field, key, val, displayKey;

//       for (let i = 0; i < keys.length; i++) {
//         key = keys[i];
//         field = fields[key];
//         val = get(data, key);
//         displayKey = displayKeyFor(type, key, proxy.$rootGetters);

//         const fieldType = field?.type ? normalizeType(field.type) : null;
//         const valIsString = isString(val);

//         if (ignoreFields && ignoreFields.includes(key)) {
//           continue;
//         }

//         if (val === undefined) {
//           val = null;
//         }

//         if (valIsString) {
//           if (fieldType) {
//             Vue.set(data, key, coerceStringTypeToScalarType(val, fieldType));
//           }

//           // Empty strings on nullable string fields -> null
//           if (field.nullable && val.length === 0 && STRING_LIKE_TYPES.includes(fieldType)) {
//             val = null;

//             Vue.set(data, key, val);
//           }
//         }
//         if (fieldType === 'boolean') {
//           validateBoolean(val, field, displayKey, proxy.$rootGetters, errors);
//         } else {
//           validateLength(val, field, displayKey, proxy.$rootGetters, errors);
//           validateChars(val, field, displayKey, proxy.$rootGetters, errors);
//         }

//         if (errors.length > 0) {
//           errors.push(proxy.t('validation.required', { key: displayKey }));

//           continue;
//         }

//         // IDs claim to be these but are lies...
//         if (key !== 'id' && !isEmpty(val) && DNS_LIKE_TYPES.includes(fieldType)) {
//           // DNS types should be lowercase
//           const tolower = (val || '').toLowerCase();

//           if (tolower !== val) {
//             val = tolower;

//             Vue.set(data, key, val);
//           }

//           errors.push(...validateDnsLikeTypes(val, fieldType, displayKey, proxy.$rootGetters, errors));
//         }
//       }

//       let { customValidationRules } = proxy;

//       if (!isEmpty(customValidationRules)) {
//         if (isFunction(customValidationRules)) {
//           customValidationRules = customValidationRules();
//         }

//         customValidationRules.forEach((rule) => {
//           const {
//             path,
//             requiredIf: requiredIfPath,
//             validators = [],
//             type: fieldType,
//           } = rule;
//           let pathValue = get(data, path);

//           const parsedRules = compact((validators || []));
//           let displayKey = path;

//           if (rule.translationKey && proxy.$rootGetters['i18n/exists'](rule.translationKey)) {
//             displayKey = proxy.t(rule.translationKey);
//           }

//           if (isString(pathValue)) {
//             pathValue = pathValue.trim();
//           }
//           if (requiredIfPath) {
//             const reqIfVal = get(data, requiredIfPath);

//             if (!isEmpty(reqIfVal) && (isEmpty(pathValue) && pathValue !== 0)) {
//               errors.push(proxy.t('validation.required', { key: displayKey }));
//             }
//           }

//           validateLength(pathValue, rule, displayKey, proxy.$rootGetters, errors);
//           validateChars(pathValue, rule, displayKey, proxy.$rootGetters, errors);

//           if (!isEmpty(pathValue) && DNS_LIKE_TYPES.includes(fieldType)) {
//             // DNS types should be lowercase
//             const tolower = (pathValue || '').toLowerCase();

//             if (tolower !== pathValue) {
//               pathValue = tolower;

//               Vue.set(data, path, pathValue);
//             }

//             errors.push(...validateDnsLikeTypes(pathValue, fieldType, displayKey, proxy.$rootGetters, errors));
//           }

//           parsedRules.forEach((validator) => {
//             const validatorAndArgs = validator.split(':');
//             const validatorName = validatorAndArgs.slice(0, 1);
//             const validatorArgs = validatorAndArgs.slice(1) || null;
//             const validatorExists = Object.prototype.hasOwnProperty.call(CustomValidators, validatorName);

//             if (!isEmpty(validatorName) && validatorExists) {
//               CustomValidators[validatorName](pathValue, proxy.$rootGetters, errors, validatorArgs, displayKey);
//             } else if (!isEmpty(validatorName) && !validatorExists) {
//               // eslint-disable-next-line
//               console.warn(proxy.t('validation.custom.missing', { validatorName }));
//             }
//           });
//         });
//       }

//       return uniq(errors);
//     };
//   },

//   ownersByType(proxy) {
//     const { metadata: { ownerReferences = [] } } = proxy;
//     const ownersByType = {};

//     ownerReferences.forEach((owner) => {
//       if (!ownersByType[owner.kind]) {
//         ownersByType[owner.kind] = [owner];
//       } else {
//         ownersByType[owner.kind].push(owner);
//       }
//     });

//     return ownersByType;
//   },

//   owners(proxy) {
//     const owners = [];

//     for (const kind in proxy.ownersByType) {
//       const schema = proxy.$rootGetters['cluster/schema'](kind);

//       if (schema) {
//         const type = schema.id;
//         const allOfResourceType = proxy.$rootGetters['cluster/all'](type);

//         proxy.ownersByType[kind].forEach((resource, idx) => {
//           const resourceInstance = allOfResourceType.find(resource => resource?.metdata?.uid === resource.uid);

//           if (resourceInstance) {
//             owners.push(resourceInstance);
//           }
//         });
//       }
//     }

//     return owners;
//   },

//   details(proxy) {
//     const details = [];

//     if (proxy.owners?.length > 0) {
//       details.push({
//         label: proxy.t('resourceDetail.detailTop.ownerReferences', { count: proxy.owners.length }),
//         formatter: 'ListLinkDetail',
//         content: proxy.owners.map(owner => ({
//           key: owner.id,
//           row: owner,
//           col: {},
//           value: owner['metadata'].name
//         }))
//       });
//     }

//     if (get(proxy, 'metadata.deletionTimestamp')) {
//       details.push({
//         label: proxy.t('resourceDetail.detailTop.deleted'),
//         formatter: 'LiveDate',
//         formatterOpts: { addSuffix: true },
//         content: get(proxy, 'metadata.deletionTimestamp')
//       });
//     }

//     return details;
//   },

//   t(proxy) {
//     return proxy.$rootGetters['i18n/t'];
//   },

//   // Returns array of MODELS that own this resource (async, network call)
//   findOwners(proxy) {
//     return () => {
//       return proxy._getRelationship('owner', 'from');
//     };
//   },

//   // Returns array of {type, namespace, id} objects that own this resource (sync)
//   getOwners(proxy) {
//     return () => {
//       return proxy._getRelationship('owner', 'from');
//     };
//   },

//   findOwned(proxy) {
//     return () => {
//       return proxy._findRelationship('owner', 'to');
//     };
//   },

//   _relationshipsFor(proxy) {
//     return (rel, direction) => {
//       const out = { selectors: [], ids: [] };

//       if (!proxy['metadata'].relationships?.length) {
//         return out;
//       }

//       for (const r of proxy['metadata'].relationships) {
//         if (rel !== 'any' && r.rel !== rel) {
//           continue;
//         }

//         if (!r[`${direction}Type`]) {
//           continue;
//         }

//         if (r.selector) {
//           addObjects(out.selectors, {
//             type: r.toType,
//             namespace: r.toNamespace,
//             selector: r.selector
//           });
//         } else {
//           const type = r[`${direction}Type`];
//           let namespace = r[`${direction}Namespace`];
//           let name = r[`${direction}Id`];

//           if (!namespace && name.includes('/')) {
//             const idx = name.indexOf('/');

//             namespace = name.substr(0, idx);
//             name = name.substr(idx + 1);
//           }

//           const id = (namespace ? `${namespace}/` : '') + name;

//           addObject(out.ids, {
//             type,
//             namespace,
//             name,
//             id,
//           });
//         }
//       }

//       return out;
//     };
//   },

//   _getRelationship(proxy) {
//     return (rel, direction) => {
//       const res = proxy._relationshipsFor(rel, direction);

//       if (res.selectors?.length) {
//         // eslint-disable-next-line no-console
//         console.warn('Sync request for a relationship that is a selector');
//       }

//       return res.ids || [];
//     };
//   },

//   _findRelationship(proxy) {
//     return async (rel, direction) => {
//       const { selectors, ids } = proxy._relationshipsFor(rel, direction);
//       const out = [];

//       for (const sel of selectors) {
//         const matching = await proxy.$dispatch('findMatching', sel);

//         addObjects(out, matching.data);
//       }

//       for (const obj of ids) {
//         const { type, id } = obj;
//         let matching = proxy.$getters['byId'](type, id);

//         if (!matching) {
//           try {
//             matching = await proxy.$dispatch('find', { type, id });
//           } catch {
//           }
//         }
//         if (matching) {
//           addObject(out, matching);
//         }
//       }

//       return out;
//     };
//   },
// };

// export default ResourceInstance;

