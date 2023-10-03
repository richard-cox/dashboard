import { BASIC, getters } from '../type-map';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import {
  CATALOG,
  COUNT,
  SCHEMA,
  MANAGEMENT,
  NAMESPACE
} from '@shell/config/types';

describe.only('type-map', () => {
  describe('getters', () => {
    describe('allTypes', () => {
      const generateDefaults = (productName = EXPLORER, productStore = 'cluster') => {
        return {
          productName,
          productStore,

          state: {
            products: [{
              name:    EXPLORER,
              inStore: productStore,
            }]
          },
          typeMapGetters: {
            labelFor:          () => '',
            optionsFor:        () => {},
            groupForBasicType: () => {}
          },
          rootState:   {},
          rootGetters: {
            [`${ productStore }/all`]: (schema: string) => {
              return [];
            },
            'prefs/get': (pref) => {},

          },

          modes: []

        };
      };

      it('empty', () => {
        const {
          state, typeMapGetters, rootState, rootGetters, productName, modes
        } = generateDefaults();

        const expectedGroups = { };

        const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

        expect(groups).toStrictEqual(expectedGroups);
      });

      it('basic', () => {
        const {
          state, typeMapGetters, rootState, rootGetters, productName
        } = generateDefaults();

        const testState = {
          ...state,
          virtualTypes: { [productName]: [] },
          spoofedTypes: { [productName]: [] }
        };

        const modes = [BASIC];

        const expectedGroups = { };

        const groups = getters.allTypes(testState, typeMapGetters, rootState, rootGetters)(productName, modes);

        expect(groups).toStrictEqual(expectedGroups);
      });

      it.only('basic with an entry', () => {
        const {
          state, typeMapGetters, rootState, rootGetters, productName, productStore
        } = generateDefaults();

        const testState = {
          ...state,
          virtualTypes: { [productName]: [] },
          spoofedTypes: { [productName]: [] }
        };

        const testRootGetters = {
          ...rootGetters,
          [`${ productStore }/all`]: (resource: string) => {
            console.warn('!!!!', resource);
            switch (resource) {
            case SCHEMA:
              return [{
                id:   'pod',
                type: SCHEMA
              }];
            case COUNT:
              return [{ counts: {} }];
            }

            return [];
          },
        };

        const modes = [BASIC];

        const expectedGroups = { };

        const groups = getters.allTypes(testState, typeMapGetters, rootState, testRootGetters)(productName, modes);

        expect(groups).toStrictEqual(expectedGroups);
      });
    });
  });
});
