import { createApp } from 'vue';
import ShortKey from 'vue-shortkey';
const vueApp = createApp({});

vueApp.use(ShortKey, { prevent: ['input', 'textarea', 'select'] });
