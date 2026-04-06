export type NotificationType =
  | "FINANCIAL_REQUEST_CREATED"
  | "FINANCIAL_REQUEST_APPROVED"
  | "FINANCIAL_REQUEST_DECLINED"
  | "EXPENSE_CHARGE_CREATED"
  | "EXPENSE_PROOF_UPLOADED"
  | "EXPENSE_PROOF_APPROVED"
  | "EXPENSE_PROOF_DECLINED"
  | "SESSION_CLOSED"
  | "INVITATION_CREATED"
  | "TEST";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

interface FinancialRequestContext {
  requesterName: string;
  requestType: "INITIAL_BUYIN" | "REBUY";
  amount: number;
  groupId: string;
  sessionId: string;
  requestId?: string;
}

interface ExpenseContext {
  payerName?: string;
  receiverName?: string;
  amount: number;
  groupId: string;
  sessionId: string;
  expenseId?: string;
  chargeId?: string;
}

interface SessionContext {
  groupId: string;
  sessionId: string;
  date?: string;
}

interface InvitationContext {
  creatorName: string;
  title: string;
  groupId: string;
  invitationId?: string;
}

export function buildPayload(
  type: NotificationType,
  context:
    | FinancialRequestContext
    | ExpenseContext
    | SessionContext
    | InvitationContext
    | Record<string, string>
): NotificationPayload {
  const icon = "/icons/icon-192x192.png";
  const badge = "/icons/icon-96x96.png";

  switch (type) {
    case "FINANCIAL_REQUEST_CREATED": {
      const ctx = context as FinancialRequestContext;
      const label = ctx.requestType === "REBUY" ? "רה-ביי" : "ביי-אין";
      return {
        type,
        title: `🃏 בקשת ${label} חדשה`,
        body: `${ctx.requesterName} מבקש ${label} של ₪${ctx.amount}`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `financial-request-${ctx.sessionId}`,
      };
    }
    case "FINANCIAL_REQUEST_APPROVED": {
      const ctx = context as FinancialRequestContext;
      const label = ctx.requestType === "REBUY" ? "רה-ביי" : "ביי-אין";
      return {
        type,
        title: `✅ בקשת ${label} אושרה`,
        body: `הבקשה שלך ל-₪${ctx.amount} אושרה`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `financial-approved-${ctx.requestId}`,
      };
    }
    case "FINANCIAL_REQUEST_DECLINED": {
      const ctx = context as FinancialRequestContext;
      const label = ctx.requestType === "REBUY" ? "רה-ביי" : "ביי-אין";
      return {
        type,
        title: `❌ בקשת ${label} נדחתה`,
        body: `הבקשה שלך ל-₪${ctx.amount} נדחתה על ידי המנהל`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `financial-declined-${ctx.requestId}`,
      };
    }
    case "EXPENSE_CHARGE_CREATED": {
      const ctx = context as ExpenseContext;
      return {
        type,
        title: `💸 בקשת תשלום חדשה`,
        body: `יש לך חיוב של ₪${ctx.amount} להעברה`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `expense-charge-${ctx.chargeId}`,
      };
    }
    case "EXPENSE_PROOF_UPLOADED": {
      const ctx = context as ExpenseContext;
      return {
        type,
        title: `📸 הוכחת תשלום התקבלה`,
        body: `${ctx.payerName ?? "משתמש"} העלה הוכחת תשלום של ₪${ctx.amount} — כנס לאשר`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `expense-proof-${ctx.chargeId}`,
      };
    }
    case "EXPENSE_PROOF_APPROVED": {
      const ctx = context as ExpenseContext;
      return {
        type,
        title: `✅ תשלום אושר`,
        body: `${ctx.receiverName ?? "מקבל התשלום"} אישר את התשלום שלך של ₪${ctx.amount}`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `expense-approved-${ctx.chargeId}`,
      };
    }
    case "EXPENSE_PROOF_DECLINED": {
      const ctx = context as ExpenseContext;
      return {
        type,
        title: `❌ הוכחת תשלום נדחתה`,
        body: `${ctx.receiverName ?? "מקבל התשלום"} דחה את ההוכחה — יש להעלות שוב`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `expense-declined-${ctx.chargeId}`,
      };
    }
    case "SESSION_CLOSED": {
      const ctx = context as SessionContext;
      return {
        type,
        title: `🔒 הערב נסגר`,
        body: `החישגוזים מוכנים — בדוק כמה אתה חייב/מגיע לך`,
        url: `/groups/${ctx.groupId}/sessions/${ctx.sessionId}`,
        icon,
        badge,
        tag: `session-closed-${ctx.sessionId}`,
      };
    }
    case "INVITATION_CREATED": {
      const ctx = context as InvitationContext;
      return {
        type,
        title: `✉️ הזמנה חדשה לערב`,
        body: `${ctx.creatorName} הזמין לערב: ${ctx.title}`,
        url: `/groups/${ctx.groupId}/invitations`,
        icon,
        badge,
        tag: `invitation-${ctx.invitationId}`,
      };
    }
    case "TEST": {
      return {
        type,
        title: `🃏 בדיקת התראות`,
        body: `מערכת ההתראות פועלת כראוי!`,
        url: `/dashboard`,
        icon,
        badge,
        tag: `test-${Date.now()}`,
      };
    }
    default:
      return {
        type,
        title: "Poker League",
        body: "",
        url: "/dashboard",
        icon,
        badge,
        tag: "generic",
      };
  }
}
