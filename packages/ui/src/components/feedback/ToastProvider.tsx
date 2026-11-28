import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast as Primitive } from "radix-ui";
import { useUiContext } from "../../providers/UiProvider";
import { ToastItemView } from "./ToastItemView";
import { MAX_TOASTS } from "./toast-constants";

export type ToastTone = "info" | "success" | "warning" | "danger";
export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
}
interface ToastItem extends ToastInput {
  id: number;
}
interface ToastContextValue {
  notify: (toast: ToastInput) => void;
  dismiss: (id: number) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  dismissLabel: string;
  regionLabel?: string | undefined;
}

/** Provides a bounded, accessible toast queue with direction-aware placement.
 * @param props Application subtree and translated notification labels.
 */
export function ToastProvider({ children, dismissLabel, regionLabel }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const { direction } = useUiContext();
  const dismiss = useCallback(
    (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const notify = useCallback((toast: ToastInput) => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((current) => [...current, { ...toast, id }].slice(-MAX_TOASTS));
  }, []);
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      <Primitive.Provider swipeDirection={direction === "rtl" ? "left" : "right"}>
        {children}
        <Primitive.Viewport
          aria-label={regionLabel ?? dismissLabel}
          className="fixed end-4 top-4 z-toast flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none"
        >
          {items.map((item) => (
            <ToastItemView
              dismissLabel={dismissLabel}
              item={item}
              key={item.id}
              onDismiss={dismiss}
            />
          ))}
        </Primitive.Viewport>
      </Primitive.Provider>
    </ToastContext.Provider>
  );
}

/** Returns the toast notification and dismissal actions from the nearest provider.
 * @returns Notification functions.
 * @throws Error if rendered outside ToastProvider.
 */
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}
