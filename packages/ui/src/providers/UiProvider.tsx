import {
  createContext,
  useContext,
  useMemo,
  type AriaAttributes,
  type ComponentType,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { Direction } from "radix-ui";
import type { IconDirection } from "../icons";

/** Props accepted by the router link component supplied by the portal. */
export interface UiLinkProps {
  to: string;
  className?: string;
  "aria-busy"?: boolean | undefined;
  "aria-current"?: AriaAttributes["aria-current"];
  "aria-disabled"?: boolean | undefined;
  "aria-label"?: string | undefined;
  id?: string | undefined;
  title?: string | undefined;
  target?: string | undefined;
  rel?: string | undefined;
  tabIndex?: number | undefined;
  onClick?: MouseEventHandler<HTMLAnchorElement> | undefined;
  children: ReactNode;
}

interface UiContextValue {
  direction: IconDirection;
  linkComponent?: ComponentType<UiLinkProps> | undefined;
}

const UiContext = createContext<UiContextValue>({ direction: "auto" });

export interface UiProviderProps {
  direction: "ltr" | "rtl";
  linkComponent?: ComponentType<UiLinkProps>;
  children: ReactNode;
}

/** Provides document direction and the portal's navigation link to shared UI components.
 * @param props Current text direction, optional router link, and descendants.
 */
export function UiProvider({ direction, linkComponent, children }: UiProviderProps) {
  const parentLinkComponent = useContext(UiContext).linkComponent;
  const effectiveLinkComponent = linkComponent ?? parentLinkComponent;
  const value = useMemo(
    () => ({ direction, linkComponent: effectiveLinkComponent }),
    [direction, effectiveLinkComponent],
  );
  return (
    <Direction.Provider dir={direction}>
      <UiContext.Provider value={value}>{children}</UiContext.Provider>
    </Direction.Provider>
  );
}

/** Reads the direction-aware UI context and the injected router link.
 * @returns The nearest UI provider value, with left-to-right defaults outside a provider.
 */
export function useUiContext(): UiContextValue {
  return useContext(UiContext);
}
