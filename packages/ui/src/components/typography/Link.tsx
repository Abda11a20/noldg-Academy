import type { MouseEventHandler, ReactNode } from "react";
import { useUiContext } from "../../providers/UiProvider";
import { assertSafeLinkTarget, resolveSafeLinkRel } from "./link-security";
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
/** Renders navigation through the router link injected by UiProvider. @param props Destination and link attributes. @throws Error outside a provider or for unsafe protocols. */
export function Link({ to, children, className = "", target, rel, ...props }: LinkProps) {
  const { linkComponent: LinkComponent } = useUiContext();
  if (!LinkComponent) throw new Error("Link requires a UiProvider router link component.");
  assertSafeLinkTarget(to);
  return (
    <LinkComponent
      to={to}
      target={target}
      rel={resolveSafeLinkRel(target, rel)}
      className={`text-primary underline-offset-4 hover:underline ${className}`.trim()}
      {...props}
    >
      {children}
    </LinkComponent>
  );
}
