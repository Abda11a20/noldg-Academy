import { Fragment } from "react";
import { Icon } from "../icon/Icon";
import { Link } from "../typography/Link";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}
export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  label: string;
}

/** Renders a labelled breadcrumb trail using the injected router link.
 * @param props Ordered breadcrumb labels and optional destinations.
 */
export function Breadcrumbs({ items, label }: BreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2 text-sm text-foreground-muted">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <li>
              {item.to && index < items.length - 1 ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={index === items.length - 1 ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
            {index < items.length - 1 ? (
              <li aria-hidden="true">
                <Icon name="chevronEnd" size="sm" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
