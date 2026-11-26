import { Text } from "@noldg/ui";
import type { OrderSummary } from "@noldg/api/contracts/orders";

interface OrderAdminMetaProps {
  order: OrderSummary;
  labels: {
    student: (value: string) => string;
    teacher: (value: string) => string;
    sender: (value: string) => string;
    methods: Readonly<Record<"instapay" | "wallet" | "cash", string>>;
  };
}

/** Displays the contact and payment reference details available to order administrators.
 * @param props Order data and localized labels; absent optional values are omitted.
 */
export function OrderAdminMeta({ order, labels }: OrderAdminMetaProps) {
  return (
    <div className="space-y-1">
      {order.student?.name ? <Text size="sm">{labels.student(order.student.name)}</Text> : null}
      {order.teacher.name ? <Text size="sm">{labels.teacher(order.teacher.name)}</Text> : null}
      {order.student?.phone ? <Text size="sm">{order.student.phone}</Text> : null}
      {order.paymentMethod ? <Text size="sm">{labels.methods[order.paymentMethod]}</Text> : null}
      {order.senderRef ? <Text size="sm">{labels.sender(order.senderRef)}</Text> : null}
    </div>
  );
}
