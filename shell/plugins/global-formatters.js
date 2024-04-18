import { createApp } from 'vue';
const vueApp = createApp({});

const components = require.context('@shell/components/formatter', false, /[A-Z]\w+\.(vue)$/);

components.keys().forEach((fileName) => {
  const componentConfig = components(fileName);
  const componentName = fileName.split('/').pop().split('.')[0];

  vueApp.component(componentName, componentConfig.default || componentConfig);
});
