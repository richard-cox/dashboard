import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';

// TODO: RC
// why classes? adds obvious typing to js files (double check) (instead of random json blob)
// adds convienens ways to construct without having to be explicit. a lot of times probably don't want advanced cases
// adds defaults. simplified construction
// conviences. jsdoc (note link#property does not work)

/**
 * Sort the pagination result
 *
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#sort
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
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#query-parameters
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
 * - For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#filter
 *
 * #### Projects Or Namespace
 * - For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
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
    {
      param: string;
      /**
       * should param equal fields
       *
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
      /**
       * Collection of fields to filter by
       *
       * For definition see {@link PaginationParam} `fields`
       */
      fields?: PaginationFilterField[];
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
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#filter
 */
export class PaginationParamFilter extends PaginationParam {
  constructor(
    { equals = true, fields = [] }:
    {
      /**
       * should param equal fields
       *
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
      /**
       * Collection of fields to filter by.
       *
       * Fields are ORd together
       *
       * For definition see {@link PaginationParam} `fields`
       */
      fields?: PaginationFilterField[];
    }
  ) {
    super({
      param: 'filter',
      equals,
      fields
    });
  }

  /**
   * Convenience method when you just want an instance of {@link PaginationParamFilter} with a simple `filter=x=y` param
   */
  static createSingleField(field: { field?: string; value: string; equals?: boolean; }): PaginationParam {
    return new PaginationParamFilter({ fields: [new PaginationFilterField(field)] });
  }

  /**
   * Convenience method when you just want an instance of {@link PaginationParamFilter} with a simple `filter=a=1,b=2,c=3` PaginationParam
   *
   * These will be OR'd together
   */
  static createMultipleFields(fields: PaginationFilterField[]): PaginationParam {
    return new PaginationParamFilter({ fields });
  }

  /**
   * Convenience method when you just want an instance of {@link PaginationParamFilter} with a simple `filter=metadata.namespace=a` PaginationParam
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
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 */
export class PaginationParamProjectOrNamespace extends PaginationParam {
  constructor(
    { equals = true, projectOrNamespace = [] }:
    {
      /**
       * should param equal fields
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
       /**
       * Collection of projects / namespace id's to filter by
       *
       * These are OR'd together
       *
       * For clarification on definition see {@link PaginationFilterField}
       */
      projectOrNamespace?: string[];
    }
  ) {
    const safeFields = projectOrNamespace.map((f) => {
      return new PaginationFilterField({
        value: f
          .replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '')
          .replace(NAMESPACE_FILTER_P_FULL_PREFIX, '')
      });
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
export class PaginationArgs { // implements IPaginationArgs
  /**
   * Page number to fetch
   */
  page: number;
  /**
   * Number of results in the page
   *
   * Defaults to -1 // TODO: RC Confirm - what happens if none supplied?
   */
  pageSize: number;
  /**
   * Sort the results
   *
   * For more info see {@link PaginationSort}
   */
  sort: PaginationSort[];
  /**
   * A collection of `filter` params
   *
   * For more info see {@link PaginationParamFilter}
   */
  filters: PaginationParamFilter[];
  /**
   * A collection of `projectsornamespace` params
   *
   * For more info see {@link PaginationParamProjectOrNamespace}
   */
  projectsOrNamespaces: PaginationParamProjectOrNamespace[];

  /**
   * Creates an instance of PaginationArgs.
   *
   * Contains defaults to avoid creating complex json objects all the time
   */
  constructor({
    page = 1,
    pageSize = -1,
    sort = [],
    filters = [],
    projectsOrNamespaces = [],
  }:
  // This would be neater as just Partial<PaginationArgs> but we lose all jsdoc
  {
    /**
     * For definition see {@link PaginationArgs} `page`
     */
    page?: number,
    /**
     * For definition see {@link PaginationArgs} `pageSize`
     */
    pageSize?: number, // TODO: RC Confirm - what happens if none supplied?
    /**
     * For definition see {@link PaginationArgs} `sort`
     */
    sort?: PaginationSort[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `filters`
     */
    filters?: PaginationParamFilter | PaginationParamFilter[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `projectsOrNamespaces`
     */
    projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[],
  }) {
    this.page = page;
    this.pageSize = pageSize;
    this.sort = sort;
    if (filters) {
      this.filters = Array.isArray(filters) ? filters : [filters];
    } else {
      this.filters = [];
    }
    if (projectsOrNamespaces) {
      this.projectsOrNamespaces = Array.isArray(projectsOrNamespaces) ? projectsOrNamespaces : [projectsOrNamespaces];
    } else {
      this.projectsOrNamespaces = [];
    }
  }
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
  /**
   * Set of pagination settings that creates the url.
   *
   * This is stored and can be used to compare in new request to determine if we already have this page
   */
  pagination: PaginationArgs,
  hasManualRefresh?: boolean,
}

/**
 * Pagination settings sent to actions and persisted to store
 */
// export interface IPaginationArgs {
//   page: number,
//   pageSize?: number, // TODO: RC Confirm - what happens if none supplied?
//   sort?: PaginationSort[],
//   /**
//    * // TODO: RC
//    * `filter` params
//    *
//    * See description for ???
//    */
//   filters: PaginationParamFilter[],
//   /**
//    * // TODO: RC
//    * `projectsornamespaces` params
//    *
//    * See description for ???
//    */
//   projectsOrNamespaces?: PaginationParamProjectOrNamespace[],
// }

// type PartiallyOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// type aaa = PartiallyOptional<PaginationArgs, 'page'>

// type Override<T, O extends { [F in keyof Partial<T>]: unknown }> = Omit<T, keyof O> & O;
// type bbb = Override<PaginationArgs, {
//   /**
//    * grrr
//    */
//   filters?: PaginationParamFilter | PaginationParamFilter[]
// }>

// interface IPaginationArgs {
//   page: number;
//   pageSize: number; // TODO: RC Confirm - what happens if none supplied?
//   sort: PaginationSort[];
//   /**
//    * IPaginationArgs
//    * // TODO: RCaaaa
//    * `filter` params
//    *
//    * See description for ???
//    */
//   filters: PaginationParamFilter[];
//   /**
//    * IPaginationArgs
//    * // TODO: RC
//    * `projectsornamespaces` params
//    *
//    * See description for ???
//    */
//   projectsOrNamespaces: PaginationParamProjectOrNamespace[];
// }

// interface IPaginationArgsOptional extends Omit<Partial<IPaginationArgs>, 'filters' | 'projectsOrNamespaces'> {
//   /**
//    * IPaginationArgsOptional
//    *
//    * Convience param to accept either a single filter or multiple filters (which will be AND'd together)
//    */
//   filters?: PaginationParamFilter | PaginationParamFilter[],
//   /**
//    * IPaginationArgsOptional
//    * // TODO: RC
//    * `projectsornamespaces` params
//    *
//    * See description for ???
//    */
//   projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[],

// }
// const ccc: IPaginationArgsOptional = {};

/**
 * PaginationArgs with optional args.
 *
 * This would be neater as just Partial<PaginationArgs> but we lose all jsdoc
 */
// interface PaginationArgsCtor {
//   /**
//    * For definition see {@link PaginationArgs} `page`
//    */
//   page?: number,
//   /**
//    * For definition see {@link PaginationArgs} `pageSize`
//    */
//   pageSize?: number, // TODO: RC Confirm - what happens if none supplied?
//   /**
//    * For definition see {@link PaginationArgs} `sort`
//    */
//   sort?: PaginationSort[],
//   /**
//    * Automatically wrap if not an array
//    *
//    * For definition see {@link PaginationArgs} `filters`
//    */
//   filters?: PaginationParamFilter | PaginationParamFilter[],
//   /**
//    * Automatically wrap if not an array
//    *
//    * For definition see {@link PaginationArgs} `projectsOrNamespaces`
//    */
//   projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[],
// }
