
export interface ChangeState {
  increased: boolean,
  positive: boolean
}

export type ChangeIndicatorTestResult = ChangeState | null

export type ChangeIndicatorTest = (old: any, neu: any) => ChangeIndicatorTestResult

export const ChangeIndicatorContextKey = (context: string, key: string): string => `${ context ? `${ context }_` : '' }${ key }`;

export interface ChangeIndicatorHandler {
  calc: ChangeIndicatorTest
}

class ChangeIndicatorService {
  private indicators: Map<string, ChangeIndicatorHandler> = new Map<string, ChangeIndicatorHandler>()

  registerWithContext(context: string, key: string, config: ChangeIndicatorHandler) {
    this.indicators.set(ChangeIndicatorContextKey(context, key), config);
  }

  register(key: string, config: ChangeIndicatorHandler) {
    this.indicators.set(key, config);
  }

  // hasIndicatorWithContext(context: string, key: string): boolean {
  //   return this.hasIndicator(ChangeIndicatorContextKey(context, key));
  // }

  hasIndicator(key: string): boolean {
    return this.indicators.has(key);
  }

  changed(key: string, old: any, neu: any): ChangeIndicatorTestResult {
    const config = this.indicators.get(key);

    if (!config) {
      return null;
    }

    return config.calc(old, neu);
  }
}

const ci = new ChangeIndicatorService();

export default ci;
