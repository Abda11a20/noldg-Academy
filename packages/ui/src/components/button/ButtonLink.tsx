import type { ComponentType, MouseEventHandler, ReactNode } from "react";
import type { UiLinkProps } from "../../providers/UiProvider";
export interface ButtonLinkProps {
  linkComponent?: ComponentType<UiLinkProps> | undefined;
  to: string;
  target?: string | undefined;
  disabled?: boolean | undefined;
  loading: boolean;
  className: string;
  label?: string | undefined;
  id?: string | undefined;
  rel?: string | undefined;
  title?: string | undefined;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement> | undefined;
  children: ReactNode;
}
/** Renders button-styled navigation and blocks activation while unavailable. @param props Link provider and button presentation. @throws Error when no provider link is available. */
export function ButtonLink({
  linkComponent: LinkComponent,
  to,
  target,
  disabled,
  loading,
  className,
  label,
  id,
  rel,
  title,
  onClick,
  children,
}: ButtonLinkProps) {
  if (!LinkComponent) throw new Error("Button navigation requires a UiProvider link component.");
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <LinkComponent
      aria-busy={loading}
      aria-disabled={Boolean(disabled || loading)}
      aria-label={label}
      className={className}
      id={id}
      onClick={handleClick}
      rel={rel}
      tabIndex={disabled || loading ? -1 : undefined}
      target={target}
      title={title}
      to={to}
    >
      {children}
    </LinkComponent>
  );
}
