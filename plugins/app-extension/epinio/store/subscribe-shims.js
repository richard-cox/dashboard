export const actions = {
  watch({ state, dispatch, getters }, { type, revision }) {
    console.debug('Epinio: Watch: ', type, revision);
  }
};
