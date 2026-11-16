/// <reference types="vite/client" />

declare module "jest-axe" {
  export interface AxeResults {
    violations: readonly { id: string; impact?: string | null }[];
  }

  export function axe(element: Element | string): Promise<AxeResults>;
}
