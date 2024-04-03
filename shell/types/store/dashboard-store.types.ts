import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';

/**
 * Sort the pagination result
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#sort
 */
export interface PaginationSort {
  /**
   * Name of field within the object to sort by
   */
  field: string,
  asc: boolean
}

/**
 * Filter the pagination result by these specific fields
 *
 * For example
 *
 * - metadata.name=test
 * - metadata.namespace!=system
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#query-parameters
 */
export class PaginationFilterField {
  /**
   * Name of field within the object to filter by for example the x of x=y
   *
   * This can be optional for some (projectsornamespaces)
   */
  field?: string;
  /**
   * Value of field within the object to filter by for example the y of x=y
   */
  value: string;
  /**
   * Equality field within the object to filter by for example the `=` or `!=` of x=y
   */
  equals: boolean;

  constructor(
    { field, value, equals = true }:
    { field?: string; value: string; equals?: boolean; }
  ) {
    this.field = field;
    this.value = value;
    this.equals = equals;
  }
}

/**
 * Represents filter like params, for example
 *
 * - `filter=abc!=xyz&def=123`
 * - `projectsornamespace!=p-3456`
 *
 * ### Params
 * #### Filter
 * - For more information see https://github.com/rancher/steve?tab=readme-ov-file#filter
 *
 * #### Projects Or Namespace
 * - For more information see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 *
 * ### Combining Params
 * Params can be combined in two logical ways
 *
 * 1) AND
 *    - Used when you would like to filter by something like a=1 AND b=2 AND c=3
 *    - To do this multiple instances of `PaginationParam` are used in an array
 *      - Object Structure
 *        ```
 *        [
 *          PaginationParam,
 *          PaginationParam,
 *          PaginationParam
 *        ]
 *        ```
 *      - Results in url
 *        ```
 *        filter=a=1&filter=b=2&filter=c=3
 *        ```
 *      - Examples
 *        - `filter=metadata.namespace=abc&filter=metadata.name=123,property=123`
 * 2) OR
 *    - Used when you would like to filter by something like a=1 OR b=2 OR c=3
 *    - To do this multiple fields within a single PaginationParam is used
 *      - Object Structure
 *        ```
 *        [
 *          PaginationParam {
 *            PaginationFilterField,
 *            PaginationFilterField,
 *            PaginationFilterField
 *          }
 *        ]
 *        ```
 *      - Results in url
 *        ```
 *        filter=a=1,b=2,c=3
 *        ```
 *
 *      - For example `filter=a=1,b=2,c=3`
 *
 *
 * This structure should give enough flexibility to cover all uses.
 *
 *
 */
export abstract class PaginationParam {
  /**
   * Query Param. For example `filter` or `projectsornamespaces`
   */
  param: string;
  /**
   * should fields equal param.
   *
   * For example projectsornamexspaces=x or projectsornamexspaces!=x
   */
  equals: boolean;
  /**
   * Fields to filter by
   *
   * For example metadata.namespace=abc OR metadata.namespace=xyz
   */
  fields: PaginationFilterField[];

  constructor(
    { param, equals = true, fields = [] }:
    { param: string; equals?: boolean; fields?: PaginationFilterField[];
  }) {
    this.param = param;
    this.equals = equals;
    this.fields = fields;
  }
}

/**
 * This is a convenience class for the `filter` param which works some magic, adds defaults and converts to the required PaginationParam format
 *
 * See description for {@link `PaginationParam`} for how multiple of these can be combined together to AND or OR together
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#filter
 */
export class PaginationParamFilter extends PaginationParam {
  constructor(
    { equals = true, fields = [] }:
    { equals?: boolean; fields?: PaginationFilterField[]; }
  ) {
    super({
      param: 'filter',
      equals,
      fields
    });
  }

  /**
   * Convenience method when you just want a simple `filter=x=y` param
   */
  static createSingleField(field: { field?: string; value: string; equals?: boolean; }): PaginationParam {
    return new PaginationParamFilter({ fields: [new PaginationFilterField(field)] });
  }

  /**
   * Convenience method when you just want a simple `filter=a=1,b=2,c=3` PaginationParam
   *
   * These will be OR'd together
   */
  static createMultipleFields(fields: PaginationFilterField[]): PaginationParam {
    return new PaginationParamFilter({ fields });
  }

  /**
   * Convenience method when you just want a simple `filter=metadata.namespace=a` PaginationParam
   */
  static createNamespaceField(namespace: string): PaginationParam {
    return PaginationParamFilter.createSingleField({
      field: 'metadata.namespace',
      value: namespace
    });
  }
}

/**
 * This is a convenience class for the `projectsornamespaces` param which works some magic, adds defaults and converts to the required PaginationParam format
 *
 * See description for {@link `PaginationParam`} for how multiple of these can be combined together to AND or OR together
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 */
export class PaginationParamProjectOrNamespace extends PaginationParam {
  constructor(
    { equals = true, projectOrNamespace = [] }:
    { equals?: boolean; projectOrNamespace?: PaginationFilterField[]; }
  ) {
    const safeFields = projectOrNamespace.map((f) => {
      return {
        ...f,
        value: f.value
          .replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '')
          .replace(NAMESPACE_FILTER_P_FULL_PREFIX, '')
      };
    });

    super({
      param:  'projectsornamespaces',
      equals,
      fields: safeFields
    });
  }
}

/**
 * Pagination settings sent to actions and persisted to store
 */
export interface PaginationArgs {
  page: number,
  pageSize?: number, // TODO: RC Confirm - what happens if none supplied?
  sort?: PaginationSort[],
  filters: PaginationParamFilter[],
  projectsOrNamespaces?: PaginationParamProjectOrNamespace[],
}

/**
 * Overall result of a pagination request.
 *
 * Should not contain actual resources but overall stats (count, pages, etc)
 */
export interface StorePaginationResult { // TODO: RC BUG ccheck coutn page not empy
  count: number,
  pages: number,
  timestamp: number,
}

/**
 * Pagination settings
 * - what was requested
 * - what was received (minus actual resources)
 * Object persisted to store
 */
export interface StorePagination {
    /**
   * This set of pagination settings that created the result
   */
  request: PaginationArgs,
    /**
   * Information in the response outside of the actual resources returned
   */
  result: StorePaginationResult
}

/**
 * Properties on all findX actions
 */
export type ActionCoreFindArgs = {
  force?: boolean,
}

/**
 * Args used for findAll action
 */
export interface ActionFindAllArgs extends ActionCoreFindArgs {
  watch?: boolean,
  namespaced?: string[],
  incremental?: boolean,
  hasManualRefresh?: boolean,
  limit?: number,
}

/**
 * Args used for findPage action
 */
export interface ActionFindPageArgs extends ActionCoreFindArgs {
  pagination: PaginationArgs,
  hasManualRefresh?: boolean,
}
