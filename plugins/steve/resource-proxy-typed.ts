import { lookup } from './model-loader';
import ResourceInstance from './resource-instance';
import { BaseResource, ProxiedResource } from '~/plugins/steve/resource.types';

export const SELF = '__[[SELF]]__';
export const ALREADY_A_PROXY = '__[[PROXY]]__';
export const PRIVATE = '__[[PRIVATE]]__';

const FAKE_CONSTRUCTOR = function() { };

FAKE_CONSTRUCTOR.toString = function() {
  return 'ResourceProxy';
};

const nativeProperties = ['description'];

export const proxyFor = <T extends BaseResource>(ctx, obj: T, isClone = false): ProxiedResource<T> => {
  // Attributes associated to the proxy, but not stored on the actual backing object
  let priv;

  if (obj[ALREADY_A_PROXY]) {
    return obj as unknown as ProxiedResource<T>;
  }

  if (process.server) {
    Object.defineProperty(obj, '__rehydrate', {
      value:        ctx.state.config.namespace,
      enumerable:   true,
      configurable: true
    });

    if (isClone) {
      Object.defineProperty(obj, '__clone', {
        value:        true,
        enumerable:   true,
        configurable: true,
        writable:     true
      });
    }
  }

  const mappedType = ctx.rootGetters['type-map/componentFor'](obj.type);
  const model = lookup(mappedType, obj?.metadata?.name) || ResourceInstance;

  // Hack for now, the resource-instance name() overwrites the model name.
  if (obj.name) {
    obj._name = obj.name;
    delete obj.name;
  }

  const proxy = new Proxy(obj, {
    get: (target: object, name: string | symbol, receiver: any) => {
      // define custom traps here:
      if (name === ALREADY_A_PROXY) {
        return true;
      } else if (name === SELF) {
        return obj;
      } else if (name === Symbol.toStringTag) {
        name = 'toString';
      } else if (typeof name !== 'string') {
        return target[name];
      } else if (name === 'constructor') {
        // To satisfy vue-devtools
        return FAKE_CONSTRUCTOR;
      } else if (name.startsWith('$')) {
        return ctx[name.substr(1)];
      } else if (name === PRIVATE) {
        if (!priv) {
          priv = {};
        }

        return priv;
      }

      let fn;

      if (model && Object.prototype.hasOwnProperty.call(model, name)) {
        fn = model[name];
      } else if (nativeProperties.includes(name) && obj[name] !== undefined) {
        // If there's not a model specific override for this property check if it exists natively in the object... otherwise fall back on
        // the default resource instance property/fn. This ensures it's correctly stored over fetch/clone/etc and sent when persisted
        return obj[name];
      }

      if (!fn) {
        fn = ResourceInstance[name];
      }

      if (fn && fn.call) {
        return fn(proxy);
      }

      return target[name];

      // // optional test whether property exists using the Reflect class:
      // if (!Reflect.has(target, property)) {
      //   throw Error(`Property ${property} does not exist`);
      // }
      // // proxy to the target using the Reflect class:
      // return Reflect.get(target, property);
    },
  });

  return proxy;
};

// export function proxyFor(ctx, obj, isClone = false) {
//   // Attributes associated to the proxy, but not stored on the actual backing object
//   let priv;

//   if (obj[ALREADY_A_PROXY]) {
//     return obj;
//   }

//   if (process.server) {
//     Object.defineProperty(obj, '__rehydrate', {
//       value: ctx.state.config.namespace,
//       enumerable: true,
//       configurable: true
//     });

//     if (isClone) {
//       Object.defineProperty(obj, '__clone', {
//         value: true,
//         enumerable: true,
//         configurable: true,
//         writable: true
//       });
//     }
//   }

//   const mappedType = ctx.rootGetters['type-map/componentFor'](obj.type);
//   const model = lookup(mappedType, obj?.metadata?.name) || ResourceInstance;

//   // Hack for now, the resource-instance name() overwrites the model name.
//   if (obj.name) {
//     obj._name = obj.name;
//     delete obj.name;
//   }

//   const proxy = new Proxy(obj, {
//     get(target, name) {
//       if (name === ALREADY_A_PROXY) {
//         return true;
//       } else if (name === SELF) {
//         return obj;
//       } else if (name === Symbol.toStringTag) {
//         name = 'toString';
//       } else if (typeof name !== 'string') {
//         return target[name];
//       } else if (name === 'constructor') {
//         // To satisfy vue-devtools
//         return FAKE_CONSTRUCTOR;
//       } else if (name.startsWith('$')) {
//         return ctx[name.substr(1)];
//       } else if (name === PRIVATE) {
//         if (!priv) {
//           priv = {};
//         }

//         return priv;
//       }

//       let fn;

//       if (model && Object.prototype.hasOwnProperty.call(model, name)) {
//         fn = model[name];
//       } else if (nativeProperties.includes(name) && obj[name] !== undefined) {
//         // If there's not a model specific override for this property check if it exists natively in the object... otherwise fall back on
//         // the default resource instance property/fn. This ensures it's correctly stored over fetch/clone/etc and sent when persisted
//         return obj[name];
//       }

//       if (!fn) {
//         fn = ResourceInstance[name];
//       }

//       if (fn && fn.call) {
//         return fn.call(proxy);
//       }

//       return target[name];
//     },
//   });

//   return proxy;
// }
