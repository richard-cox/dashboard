export interface OptPaginationSort { field: string, asc: boolean }

/**
 * Pagination settings sent to actions and persisted to store
 */
export interface OptPagination {
  namespaces?: string[];
  page: number,
  pageSize: number,
  sort: OptPaginationSort[],
  filter: { field: string, value: string }[],
}

/**
 * Overall result of a pagination request.
 *
 * Should not contain actual resources but overall stats (count, pages, etc)
 */
export interface StorePaginationResult {
  count: number,
  pages: number,
  timestamp: number,
}

/**
 * Pagination settings
 * - what was requested
 * - what was received (mins actual resources)
 * Object persisted to store
 */
export interface StorePagination {
  request: OptPagination,
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
  pagination: OptPagination,
  hasManualRefresh?: boolean,
}
