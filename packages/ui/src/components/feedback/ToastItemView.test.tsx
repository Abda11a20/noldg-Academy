import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ToastItemView } from "./ToastItemView";
import { UiProvider } from "../../providers/UiProvider";

vi.mock("radix-ui", async () => {
  const React = await import("react");
  const RootContext = React.createContext<(open: boolean) => void>(() => undefined);
  const Root = ({
    children,
    className,
    onOpenChange,
  }: {
    children: ReactNode;
    className: string;
    onOpenChange: (open: boolean) => void;
  }) =>
    React.createElement(
      RootContext.Provider,
      { value: onOpenChange },
      React.createElement("div", { className, onClick: () => onOpenChange(true) }, children),
    );
  const Title = ({ children }: { children: ReactNode }) => React.createElement("h2", {}, children);
  const Description = ({ children }: { children: ReactNode }) =>
    React.createElement("p", {}, children);
  const Close = ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    "aria-label": string;
  }) => {
    const onOpenChange = React.useContext(RootContext);
    if (
      !React.isValidElement<{
        "aria-label"?: string;
        onClick?: (event: React.MouseEvent) => void;
      }>(children)
    )
      return null;
    return React.cloneElement(children, {
      "aria-label": ariaLabel,
      onClick: (event) => {
        event.stopPropagation();
        children.props.onClick?.(event);
        onOpenChange(false);
      },
    });
  };
  const Direction = { Provider: ({ children }: { children: ReactNode }) => children };
  return { Direction, Toast: { Root, Title, Description, Close } };
});

it("only dismisses when the toast closes, not when it opens", () => {
  const onDismiss = vi.fn();
  render(
    <UiProvider direction="ltr">
      <ToastItemView
        item={{ id: 7, title: "Saved", tone: "info" }}
        dismissLabel="Dismiss"
        onDismiss={onDismiss}
      />
    </UiProvider>,
  );
  fireEvent.click(screen.getByText("Saved"));
  expect(onDismiss).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(onDismiss).toHaveBeenCalledWith(7);
});
