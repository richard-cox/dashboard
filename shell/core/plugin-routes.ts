import Router, { RouteConfig } from 'vue-router';

interface RouteInfo {
  parentOrRoute: string | RouteConfig;
  route?: RouteConfig;
}

interface RouteInstallInfo {
  plugin: string;
  route: RouteConfig;
}

type RouteInstallHistory = {
  [route: string]: RouteInstallInfo[]
}

export class PluginRoutes {
  router: Router;

  replacedRoutes: RouteInstallHistory = {};

  constructor(router: Router) {
    this.router = router;
  }

  public logRoutes(r: any, indent = 0) {
    const spaces = Array(indent).join(' ');

    r.forEach((s: any) => {
      console.log(`${ spaces }${ s.name } -> ${ s.path }`); // eslint-disable-line no-console
      this.logRoutes(s.children || [], indent + 2);
    });
  }

  // Ensure we put back any routes that the plugin that is being uninstalled added
  public uninstall(plugin: any) {
    // List of routes we need to restore
    const restore: RouteInfo[] = [];

    Object.keys(this.replacedRoutes).forEach((routeName) => {
      const info = this.replacedRoutes[routeName];

      for (let index = 0; index < info.length; index++) {
        const savedRoute = info[index];

        if (savedRoute.plugin === plugin.id) {
          // The plugin that is being uninstalled replaced an existing route that we will restore
          if (index === 0) {
            // Need to restore the previous route, since the plugin owned the active route
            info.shift();

            restore.push({ parentOrRoute: savedRoute.route });

            break;
          } else {
            // Need to updare the previous item so that when it is removed, it restores the correct route
            const previous = info[index - 1];

            previous.route = savedRoute.route;
            info.splice(index, 1);

            break;
          }
        }
      }
    });

    if (restore.length > 0) {
      this.addRoutes(null, restore);
    }
  }

  public addRoutes(plugin: any, routes: RouteInfo[]) {
    const appRoutes = this.router.options.routes || [];
    let replaced = 0;

    // Need to take into account if routes are being replaced
    // Despite what the docs say, routes are not replaced, so we use a workaround
    // Remove all routes that are being replaced
    routes.forEach((r: RouteInfo) => {
      // See if the route exists
      let existing: any;

      if (r.route) {
        // parentOrRoute is the name of the parent route
        const pExisting = appRoutes.findIndex((route: any) => route.name === r.parentOrRoute) as any;
        const path = `${ pExisting.path }${ r.route.path }`;

        // TODO: Validate
        existing = appRoutes.findIndex((route: any) => route.path === path);
      } else {
        // no parent route
        const theRoute = r.parentOrRoute as RouteConfig;

        existing = appRoutes.findIndex((route: any) => route.name === theRoute.name);
      }

      if (existing) {
        const existingRoute = appRoutes[existing];

        appRoutes.splice(existing, 1);
        replaced++;

        // Store the route so we can restore it on uninstall
        if (plugin && existingRoute.name) {
          if (!this.replacedRoutes[existingRoute.name]) {
            this.replacedRoutes[existingRoute.name] = [];
          }

          this.replacedRoutes[existingRoute.name].unshift({
            plugin: plugin.id,
            route:  existingRoute
          });
        }
      }
    });

    let newRouter = this.router;

    if (replaced > 0) {
      newRouter = new Router({
        mode:   'history',
        routes: appRoutes
      }) as any;
    }

    routes.forEach((r: any) => {
      newRouter.addRoute(r.parentOrRoute, r.route);
    });

    if (replaced > 0) {
      (this.router as any).matcher = (newRouter as any).matcher;
    }

    // If we replaced any routes, then we should reload on uninstall
    if (plugin) {
      plugin.reloadOnUninstall = replaced > 0;
    }
  }
}
