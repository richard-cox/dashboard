const config = require('./node_modules/@rancher/shell/vue.config');

module.exports = config(__dirname, {
  excludes: [],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
