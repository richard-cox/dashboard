// Taken from @nuxt/vue-app/template/client.js

import { createApp } from 'vue';
import fetch from 'unfetch';
import middleware from '../config/middleware.js';
import {
  applyAsyncData,
  promisify,
  middlewareSeries,
  sanitizeComponent,
  resolveRouteComponents,
  getMatchedComponents,
  getMatchedComponentsInstances,
  flatMapComponents,
  setContext,
  compile,
  getQueryDiff,
  globalHandleError,
  isSamePath,
  urlJoin
} from '../utils/nuxt.js';
import { extendApp } from './index.js';
import fetchMixin from '../mixins/fetch.client';
import { nuxtLinkAlias } from '../components/nuxt/nuxt-link.client.js'; // should be included after ./index.js
import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';
const vueApp = createApp({});

// Mimic old @nuxt/vue-app/template/client.js
const isDev = process.env.dev;
const debug = isDev;

// Fetch mixin
vueApp.mixin(fetchMixin);

// Component: <NuxtLink>
// TODO: #9541 Remove for Vue 3 migration
vueApp.component('NuxtLink', nuxtLinkAlias('NuxtLink'));
vueApp.component('NLink', nuxtLinkAlias('NLink'));

if (!global.fetch) {
  global.fetch = fetch;
}

// Global shared references
let _lastPaths = [];
let configApp;
let configRouter;

const NUXT = {};

const $config = nuxt.publicRuntimeConfig || {}; // eslint-disable-line no-undef

if ($config._app) {
  __webpack_public_path__ = urlJoin($config._app.cdnURL, $config._app.assetsPath); // eslint-disable-line camelcase, no-undef
}

Object.assign(vueApp.config, { silent: false, performance: true });

if (debug) {
  const defaultErrorHandler = vueApp.config.errorHandler;

  vueApp.config.errorHandler = async(err, vm, info, ...rest) => {
    // Call other handler if exist
    let handled = null;

    if (typeof defaultErrorHandler === 'function') {
      handled = defaultErrorHandler(err, vm, info, ...rest);
    }
    if (handled === true) {
      return handled;
    }

    if (vm && vm.$root) {
      const nuxtApp = Object.keys(window.$globalApp)
        .find((nuxtInstance) => vm.$root[nuxtInstance]);

      // Show Nuxt Error Page
      if (nuxtApp && vm.$root[nuxtApp].error && info !== 'render function') {
        const currentApp = vm.$root[nuxtApp];

        currentApp.error(err);
      }
    }

    if (typeof defaultErrorHandler === 'function') {
      return handled;
    }

    // Log to console
    if (process.env.NODE_ENV !== 'production') {
      console.error(err); // eslint-disable-line no-console
    } else {
      console.error(err.message || err); // eslint-disable-line no-console
    }
  };
}

const errorHandler = vueApp.config.errorHandler || console.error; // eslint-disable-line no-console

// Create and mount App
extendApp(NUXT.publicRuntimeConfig).then(mountApp).then(({ store }) => vueApp.use(store)).catch(errorHandler); // eslint-disable-line no-undef

async function loadAsyncComponents(to, from, next) {
  // Check if route changed (this._routeChanged), only if the page is not an error (for validate())
  this._routeChanged = Boolean(configApp.nuxt.err) || from.name !== to.name;
  this._paramChanged = !this._routeChanged && from.path !== to.path;
  this._queryChanged = !this._paramChanged && from.fullPath !== to.fullPath;
  this._diffQuery = (this._queryChanged ? getQueryDiff(to.query, from.query) : []);

  if ((this._routeChanged || this._paramChanged) && this.$loading.start && !this.$loading.manual) {
    this.$loading.start();
  }

  try {
    if (this._queryChanged) {
      const Components = await resolveRouteComponents(
        to,
        (Component, instance) => ({ Component, instance })
      );
      // Add a marker on each component that it needs to refresh or not
      const startLoader = Components.some(({ Component, instance }) => {
        const watchQuery = Component.options.watchQuery;

        if (watchQuery === true) {
          return true;
        }
        if (Array.isArray(watchQuery)) {
          return watchQuery.some((key) => this._diffQuery[key]);
        }
        if (typeof watchQuery === 'function') {
          return watchQuery.apply(instance, [to.query, from.query]);
        }

        return false;
      });

      if (startLoader && this.$loading.start && !this.$loading.manual) {
        this.$loading.start();
      }
    }
    // Call next()
    next();
  } catch (error) {
    const err = error || {};
    const statusCode = err.statusCode || err.status || (err.response && err.response.status) || 500;
    const message = err.message || '';

    // Handle chunk loading errors
    // This may be due to a new deployment or a network problem
    if (/^Loading( CSS)? chunk (\d)+ failed\./.test(message)) {
      window.location.reload(true /* skip cache */);

      return; // prevent error page blinking for user
    }

    this.error({ statusCode, message });
    next();
  }
}

// Get matched components
function resolveComponents(route) {
  return flatMapComponents(route, async(Component, _, match, key, index) => {
    // If component is not resolved yet, resolve it
    if (typeof Component === 'function' && !Component.options) {
      Component = await Component();
    }

    // Sanitize it and save it
    Component._Ctor = sanitizeComponent(Component);

    match.components[key] = Component;

    return Component;
  });
}

function callMiddleware(Components, context) {
  let midd = ['i18n'];
  let unknownMiddleware = false;

  Components.forEach((Component) => {
    if (Component.options.middleware) {
      midd = midd.concat(Component.options.middleware);
    }
  });

  midd = midd.map((name) => {
    if (typeof name === 'function') {
      return name;
    }
    if (typeof middleware[name] !== 'function') {
      unknownMiddleware = true;
      this.error({ statusCode: 500, message: `Unknown middleware ${ name }` });
    }

    return middleware[name];
  });

  if (unknownMiddleware) {
    return;
  }

  return middlewareSeries(midd, context);
}

async function render(to, from, next) {
  if (this._routeChanged === false && this._paramChanged === false && this._queryChanged === false) {
    return next();
  }

  if (to === from) {
    _lastPaths = [];
  } else {
    const fromMatches = [];

    _lastPaths = getMatchedComponents(from, fromMatches).map((Component, i) => {
      return compile(from.matched[fromMatches[i]].path)(from.params);
    });
  }

  // nextCalled is true when redirected
  let nextCalled = false;
  const _next = (path) => {
    if (from.path === path.path && this.$loading.finish) {
      this.$loading.finish();
    }

    if (from.path !== path.path && this.$loading.pause) {
      this.$loading.pause();
    }

    if (nextCalled) {
      return;
    }

    nextCalled = true;
    next(path);
  };

  // Update context
  await setContext(configApp, {
    route: to,
    from,
    next:  _next.bind(this)
  });
  this._dateLastError = configApp.nuxt.dateErr;
  this._hadError = Boolean(configApp.nuxt.err);

  // Get route's matched components
  const matches = [];
  const Components = getMatchedComponents(to, matches);

  // If no Components matched, generate 404
  if (!Components.length) {
    // Call the authenticated middleware. This used to attempt to load the error layout but because it was missing it would:
    // 1. load the default layout instead
    // 2. then call the authenticated middleware
    // 3. Authenticated middleware would then load plugins and check to see if there was a valid route and navigate to that if it existed
    // 4. This would allow harvester cluster pages to load on page reload
    // We should really make authenticated middleware do less...
    await callMiddleware.call(this, [{ options: { middleware: ['authenticated'] } }], configApp.context);

    if (nextCalled) {
      return;
    }

    // Show error page
    this.error({ statusCode: 404, message: 'This page could not be found' });

    return next();
  }

  // Update ._data and other properties if hot reloaded
  Components.forEach((Component) => {
    if (Component._Ctor && Component._Ctor.options) {
      Component.options.asyncData = Component._Ctor.options.asyncData;
      Component.options.fetch = Component._Ctor.options.fetch;
    }
  });

  try {
    // Call middleware
    await callMiddleware.call(this, Components, configApp.context);
    if (nextCalled) {
      return;
    }
    if (configApp.context._errored) {
      return next();
    }

    // Call middleware for layout
    await callMiddleware.call(this, Components, configApp.context);
    if (nextCalled) {
      return;
    }
    if (configApp.context._errored) {
      return next();
    }

    // Call .validate()
    let isValid = true;

    try {
      for (const Component of Components) {
        if (typeof Component.options.validate !== 'function') {
          continue;
        }

        isValid = await Component.options.validate(configApp.context);

        if (!isValid) {
          break;
        }
      }
    } catch (validationError) {
      // ...If .validate() threw an error
      this.error({
        statusCode: validationError.statusCode || '500',
        message:    validationError.message
      });

      return next();
    }

    // ...If .validate() returned false
    if (!isValid) {
      this.error({ statusCode: 404, message: 'This page could not be found' });

      return next();
    }

    let instances;

    // Call asyncData & fetch hooks on components matched by the route.
    await Promise.all(Components.map((Component, i) => {
      // Check if only children route changed
      Component._path = compile(to.matched[matches[i]].path)(to.params);
      Component._dataRefresh = false;
      const childPathChanged = Component._path !== _lastPaths[i];

      // Refresh component (call asyncData & fetch) when:
      // Route path changed part includes current component
      // Or route param changed part includes current component and watchParam is not `false`
      // Or route query is changed and watchQuery returns `true`
      if (this._routeChanged && childPathChanged) {
        Component._dataRefresh = true;
      } else if (this._paramChanged && childPathChanged) {
        const watchParam = Component.options.watchParam;

        Component._dataRefresh = watchParam !== false;
      } else if (this._queryChanged) {
        const watchQuery = Component.options.watchQuery;

        if (watchQuery === true) {
          Component._dataRefresh = true;
        } else if (Array.isArray(watchQuery)) {
          Component._dataRefresh = watchQuery.some((key) => this._diffQuery[key]);
        } else if (typeof watchQuery === 'function') {
          if (!instances) {
            instances = getMatchedComponentsInstances(to);
          }
          Component._dataRefresh = watchQuery.apply(instances[i], [to.query, from.query]);
        }
      }
      if (!this._hadError && this._isMounted && !Component._dataRefresh) {
        return;
      }

      const promises = [];

      const hasAsyncData = (
        Component.options.asyncData &&
        typeof Component.options.asyncData === 'function'
      );

      const hasFetch = Boolean(Component.options.fetch) && Component.options.fetch.length;

      const loadingIncrease = (hasAsyncData && hasFetch) ? 30 : 45;

      // Call asyncData(context)
      if (hasAsyncData) {
        const promise = promisify(Component.options.asyncData, configApp.context);

        promise.then((asyncDataResult) => {
          applyAsyncData(Component, asyncDataResult);

          if (this.$loading.increase) {
            this.$loading.increase(loadingIncrease);
          }
        });
        promises.push(promise);
      }

      // Check disabled page loading
      this.$loading.manual = Component.options.loading === false;

      // Call fetch(context)
      if (hasFetch) {
        let p = Component.options.fetch(configApp.context);

        if (!p || (!(p instanceof Promise) && (typeof p.then !== 'function'))) {
          p = Promise.resolve(p);
        }
        p.then((fetchResult) => {
          if (this.$loading.increase) {
            this.$loading.increase(loadingIncrease);
          }
        });
        promises.push(p);
      }

      return Promise.all(promises);
    }));

    // If not redirected
    if (!nextCalled) {
      if (this.$loading.finish && !this.$loading.manual) {
        this.$loading.finish();
      }

      next();
    }
  } catch (err) {
    const error = err || {};

    _lastPaths = [];

    globalHandleError(error);

    this.error(error);
    next();
  }
}

// Fix components format in matched, it's due to code-splitting of vue-router
function normalizeComponents(to, ___) {
  flatMapComponents(to, (Component, _, match, key) => {
    if (typeof Component === 'object' && !Component.options) {
      // Updated via vue-router resolveAsyncComponents()
      Component._Ctor = Component;
      match.components[key] = Component;
    }

    return Component;
  });
}

function checkForErrors(app) {
  // Hide error component if no error
  if (configApp._hadError && configApp._dateLastError === configApp.$options.nuxt.dateErr) {
    configApp.error();
  }
}

// When navigating on a different route but the same component is used, Vue.js
// Will not update the instance data, so we have to update $data ourselves
function fixPrepatch(to, ___) {
  if (this._routeChanged === false && this._paramChanged === false && this._queryChanged === false) {
    return;
  }

  const instances = getMatchedComponentsInstances(to);
  const Components = getMatchedComponents(to);

  nextTick(() => {
    instances.forEach((instance, i) => {
      if (!instance || instance._isDestroyed) {
        return;
      }

      if (
        instance.constructor._dataRefresh &&
        Components[i] === instance.constructor &&
        instance.$vnode.data.keepAlive !== true &&
        typeof instance.constructor.options.data === 'function'
      ) {
        const newData = instance.constructor.options.data.call(instance);

        for (const key in newData) {
          instance.$data[key] = newData[key];
        }
      }
    });

    checkForErrors(this);

    // Hot reloading
    if (isDev) {
      setTimeout(() => hotReloadAPI(this), 100);
    }
  });
}

function nuxtReady(_app) {
  window.onNuxtReadyCbs.forEach((cb) => {
    if (typeof cb === 'function') {
      cb(_app);
    }
  });
  // Special JSDOM
  if (typeof window._onNuxtLoaded === 'function') {
    window._onNuxtLoaded(_app);
  }
}

const noopData = () => {
  return {};
};
const noopFetch = () => {};

// Special hot reload with asyncData(context)
function getNuxtChildComponents($parent, $components = []) {
  $parent.$children.forEach(($child) => {
    if ($child.$vnode && $child.$vnode.data.nuxtChild && !$components.find((c) => (c.$options.__file === $child.$options.__file))) {
      $components.push($child);
    }
    if ($child.$children && $child.$children.length) {
      getNuxtChildComponents($child, $components);
    }
  });

  return $components;
}

function hotReloadAPI(_app) {
  if (!module.hot) {
    return;
  }

  const $components = getNuxtChildComponents(window.$globalApp, []);

  $components.forEach(addHotReload.bind(_app));
}

function addHotReload($component, depth) {
  if ($component.$vnode.data._hasHotReload) {
    return;
  }
  $component.$vnode.data._hasHotReload = true;

  const _forceUpdate = $component.$forceUpdate.bind($component.$parent);

  $component.$vnode.context.$forceUpdate = async() => {
    const Components = getMatchedComponents(configRouter.currentRoute);
    const Component = Components[depth];

    if (!Component) {
      return _forceUpdate();
    }
    if (typeof Component === 'object' && !Component.options) {
      // Updated via vue-router resolveAsyncComponents()
      Component._Ctor = Component;
    }
    this.error();
    const promises = [];
    const next = function(path) {
      this.$loading.finish && this.$loading.finish();
      configRouter.push(path);
    };

    await setContext(configApp, {
      route: configRouter.currentRoute,
      isHMR: true,
      next:  next.bind(this)
    });
    const context = configApp.context;

    if (this.$loading.start && !this.$loading.manual) {
      this.$loading.start();
    }

    callMiddleware.call(this, Components, context)
      .then(() => {
        return callMiddleware.call(this, Components, context);
      })

      .then(() => {
      // Call asyncData(context)
        const pAsyncData = promisify(Component.options.asyncData || noopData, context);

        pAsyncData.then((asyncDataResult) => {
          applyAsyncData(Component, asyncDataResult);
          this.$loading.increase && this.$loading.increase(30);
        });
        promises.push(pAsyncData);

        // Call fetch()
        Component.options.fetch = Component.options.fetch || noopFetch;
        let pFetch = Component.options.fetch.length && Component.options.fetch(context);

        if (!pFetch || (!(pFetch instanceof Promise) && (typeof pFetch.then !== 'function'))) {
          pFetch = Promise.resolve(pFetch);
        }
        pFetch.then(() => this.$loading.increase && this.$loading.increase(30));
        promises.push(pFetch);

        return Promise.all(promises);
      })
      .then(() => {
        this.$loading.finish && this.$loading.finish();
        _forceUpdate();
        setTimeout(() => hotReloadAPI(this), 100);
      });
  };
}

async function mountApp(__app) {
  // Set global variables
  configApp = __app.app;
  configRouter = __app.router;

  // Create Vue instance
  const _app = createApp(configApp);

  // Mounts Vue app to DOM element
  const mount = () => {
    _app.$mount('#app');

    // Add afterEach router hooks
    configRouter.afterEach(normalizeComponents);

    configRouter.afterEach(fixPrepatch.bind(_app));

    // Listen for first Vue update
    nextTick(() => {
      // Call window.{{globals.readyCallback}} callbacks
      nuxtReady(_app);

      if (isDev) {
        // Enable hot reloading
        hotReloadAPI(_app);
      }
    });
  };

  // Resolve route components
  const Components = await Promise.all(resolveComponents(configApp.context.route));

  if (Components.length) {
    _lastPaths = configRouter.currentRoute.matched.map((route) => compile(route.path)(configRouter.currentRoute.params));
  }

  // Initialize error handler
  _app.$loading = {}; // To avoid error while _app.$nuxt does not exist
  if (NUXT.error) {
    _app.error(NUXT.error);
  }

  // Add beforeEach router hooks
  configRouter.beforeEach(loadAsyncComponents.bind(_app));
  configRouter.beforeEach(render.bind(_app));
  configRouter.beforeEach((from, to, next) => {
    if (from?.name !== to?.name) {
      updatePageTitle(getVendor());
    }

    next();
  });

  // Fix in static: remove trailing slash to force hydration
  // Full static, if server-rendered: hydrate, to allow custom redirect to generated page

  // Fix in static: remove trailing slash to force hydration
  if (NUXT.serverRendered && isSamePath(NUXT.routePath, _app.context.route.path)) {
    return mount();
  }

  // First render on client-side
  const clientFirstMount = () => {
    normalizeComponents(configRouter.currentRoute, configRouter.currentRoute);
    checkForErrors(_app);
    // Don't call fixPrepatch.call(_app, configRouter.currentRoute, configRouter.currentRoute) since it's first render
    mount();
  };

  // fix: force next tick to avoid having same timestamp when an error happen on spa fallback
  await new Promise((resolve) => setTimeout(resolve, 0));
  render.call(_app, configRouter.currentRoute, configRouter.currentRoute, (path) => {
    // If not redirected
    if (!path) {
      clientFirstMount();

      return;
    }

    // Add a one-time afterEach hook to
    // mount the app wait for redirect and route gets resolved
    const unregisterHook = configRouter.afterEach((to, from) => {
      unregisterHook();
      clientFirstMount();
    });

    // Push the path and let route to be resolved
    configRouter.push(path, undefined, (err) => {
      if (err) {
        errorHandler(err);
      }
    });
  });
}
