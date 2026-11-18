import type { ReactNode } from "react";
import type { IconName } from "../../icons";
import { Icon } from "../icon/Icon";
import { Spinner } from "../spinner/Spinner";
export interface ButtonContentProps {
  loading: boolean;
  iconStart?: IconName | undefined;
  iconEnd?: IconName | undefined;
  children?: ReactNode;
}
/** Renders optional button icons, loading spinner, and content. @param props Button content states. */
export function ButtonContent({ loading, iconStart, iconEnd, children }: ButtonContentProps) {
  return (
    <>
      {loading ? <Spinner /> : null}
      {!loading && iconStart ? <Icon name={iconStart} size="sm" /> : null}
      {children}
      {!loading && iconEnd ? <Icon name={iconEnd} size="sm" /> : null}
    </>
  );
}
