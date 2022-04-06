import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

import enUS from '@pkg/translations/en-us.yaml'; // TODO: RC doubles up on epinio

// TODO: RC REMOVE
// import { load } from 'js-yaml';
// import fs from 'fs';
// const loadI10n = (locale: string): () => Promise<any> => {
//   return () => {
//     debugger;
//     try {
//       const file = fs.readFileSync(`./translations/${ locale }.yaml`, 'utf8');
//       const phrases = load(file);

//       return Promise.resolve(phrases);
//     } catch (e) {
//       console.error(e);

//       return Promise.reject(e);
//     }
//   };
// };

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.metadata.description = 'Epinio';
  plugin.metadata.name = 'Epinio';
  plugin.metadata.version = '0.6.2';

  // plugin.addI18n('en-us', loadI10n('en-us'));
  plugin.addI18n('en-us', enUS);

  // Load a product
  // plugin.addProduct(require('./product'));
}
