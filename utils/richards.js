export default {
  // TODO: RC DONT COMMIT!!
  log(msg, args) {
    console.warn(`RC!!!!!!!-${ new Date().getTime() }!!!!!!!:${ msg }`, args);
  }
};
