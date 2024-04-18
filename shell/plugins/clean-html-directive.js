import { createApp } from 'vue';
import { purifyHTML } from './clean-html';
const app = createApp({});

export const cleanHtmlDirective = {
  mounted(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  updated(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  unmounted(el) {
    el.innerHTML = '';
  }
};

app.directive('clean-html', cleanHtmlDirective);
