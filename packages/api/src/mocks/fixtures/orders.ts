import type { OrderList, OrderSettings, OrderSummary } from "../../contracts/orders";

export const MOCK_ORDER_SERVER_NOW = "2026-11-26T10:00:00.000Z";
export const MOCK_EXPIRING_SOON_CUTOFF = "2026-11-27T10:00:00.000Z";

export const MOCK_ORDER_SETTINGS: OrderSettings = {
  paymentInstructions: {
    ar: "حوّل المبلغ إلى رقم الدعم الموضح، ثم أكّد الطلب.",
    en: "Transfer the amount to the support number shown, then confirm the order.",
  },
  supportWhatsappNumber: "+201001234567",
  orderExpiryHours: 48,
};

export const MOCK_ORDERS: OrderSummary[] = [
  {
    id: "order-awaiting-soon",
    orderNumber: "ORD-2026-00041",
    status: "awaiting_payment",
    priceSnapshot: { fullPrice: 1200, announcedCount: 8, remainingCount: 5, amount: 750 },
    paymentMethod: "instapay",
    senderRef: "+201011112222",
    expiresAt: "2026-11-26T10:20:00.000Z",
    createdAt: "2026-11-25T10:00:00.000Z",
    serverNow: MOCK_ORDER_SERVER_NOW,
    product: { id: "product-algebra", name: "Algebra package", type: "package" },
    teacher: { id: "teacher-nour", name: "Nour Hassan" },
    student: { id: "student-mona", name: "منى علي", phone: "+201011112222" },
    payment: { status: "submitted", notes: null, createdAt: "2026-11-25T10:04:00.000Z" },
  },
  {
    id: "order-completed",
    orderNumber: "ORD-2026-00040",
    status: "completed",
    priceSnapshot: { fullPrice: 300, announcedCount: 1, remainingCount: 1, amount: 300 },
    paymentMethod: "wallet",
    senderRef: "+201155556666",
    expiresAt: null,
    createdAt: "2026-11-20T12:00:00.000Z",
    serverNow: MOCK_ORDER_SERVER_NOW,
    product: { id: "product-physics", name: "Physics lesson", type: "lesson" },
    teacher: { id: "teacher-omar", name: "عمر السيد" },
    student: { id: "student-john", name: "John Samir", phone: "+201155556666" },
    payment: { status: "confirmed", notes: null, createdAt: "2026-11-20T12:04:00.000Z" },
  },
  {
    id: "order-rejected",
    orderNumber: "ORD-2026-00039",
    status: "rejected",
    priceSnapshot: { fullPrice: 900, announcedCount: 6, remainingCount: 2, amount: 300 },
    paymentMethod: "cash",
    senderRef: null,
    expiresAt: null,
    createdAt: "2026-11-18T08:00:00.000Z",
    product: { id: "product-chemistry", name: "Chemistry bundle", type: "package" },
    teacher: { id: "teacher-salma", name: "سلمى عادل" },
    student: { id: "student-mona", name: "منى علي", phone: "+201011112222" },
    rejectionReason: "The payment amount could not be confirmed.",
    payment: { status: "rejected", notes: null, createdAt: "2026-11-18T08:03:00.000Z" },
  },
  {
    id: "order-expired",
    orderNumber: "ORD-2026-00038",
    status: "expired",
    priceSnapshot: { fullPrice: 650, announcedCount: 5, remainingCount: 4, amount: 520 },
    paymentMethod: "instapay",
    senderRef: null,
    expiresAt: "2026-11-18T10:00:00.000Z",
    createdAt: "2026-11-16T10:00:00.000Z",
    product: { id: "product-english", name: "English revision", type: "package" },
    teacher: { id: "teacher-mariam", name: "Mariam Adel" },
    student: { id: "student-john", name: "John Samir", phone: "+201155556666" },
    payment: null,
  },
  {
    id: "order-cancelled",
    orderNumber: "ORD-2026-00037",
    status: "cancelled",
    priceSnapshot: { fullPrice: 400, announcedCount: 2, remainingCount: 2, amount: 400 },
    paymentMethod: "wallet",
    senderRef: null,
    expiresAt: null,
    createdAt: "2026-11-14T10:00:00.000Z",
    product: { id: "product-history", name: "History lessons", type: "package" },
    teacher: { id: "teacher-hany", name: "هاني محمود" },
    student: { id: "student-mona", name: "منى علي", phone: "+201011112222" },
    payment: null,
  },
];

export const MOCK_ORDER_LIST: OrderList = {
  items: MOCK_ORDERS,
  page: 1,
  pageSize: 10,
  total: MOCK_ORDERS.length,
  serverNow: MOCK_ORDER_SERVER_NOW,
};
