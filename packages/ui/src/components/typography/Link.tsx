import type { MouseEventHandler, ReactNode } from "react";
import { useUiContext } from "../../providers/UiProvider";
export interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  id?: string;
  title?: string;
  target?: string;
  rel?: string;
  tabIndex?: number;
  "aria-label"?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
/** Renders navigation through the router link injected by UiProvider. @param props Destination and link attributes. @throws Error outside a provider. */
export function Link({ to, children, className = "", ...props }: LinkProps) {
  const { linkComponent: LinkComponent } = useUiContext();
  if (!LinkComponent) throw new Error("Link requires a UiProvider router link component.");
  return (
    <LinkComponent
      to={to}
      className={`text-primary underline-offset-4 hover:underline ${className}`.trim()}
      {...props}
    >
      {children}
    </LinkComponent>
  );
}
