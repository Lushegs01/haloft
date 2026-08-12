import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Scale, TrendingUp } from "lucide-react";
import { ReconcileForm } from "./reconcile-form";

/**
 * The finance queue.
 *
 * This page is the other half of the payment work: the recording path
 * classifies every charge and raises an obligation where one exists, and
 * a person settles it here. Before this existed, an overpayment or a
 * duplicate produced a line in a log file and nothing else — there was
 * nowhere for the money to be owed FROM.
 *
 * Four things, in the order they matter:
 *
 *   1. Ledger imbalances. Should always be empty. A row here means a
 *      payment's entries do not sum to zero, which is money recorded and
 *      not accounted for. It sits at the top because it is the only thing
 *      on this page that indicates a bug rather than an event.
 *   2. Charges we could not attach to a booking at all.
 *   3. The reconciliation queue: over, short, duplicate, wrong currency.
 *   4. What the platform earned, for the period.
 */

export const dynamic = "force-dynamic";

function naira(value: number | null | undefined) {
  return "₦" + Number(value ?? 0).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  });
}

const anomalyLabels: Record<string, { label: string; className: string }> = {
  overpayment: {
    label: "Overpaid",
    className: "bg-amber/10 text-amber border-amber/20",
  },
  underpayment: {
    label: "Underpaid",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  duplicate_payment: {
    label: "Duplicate",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  currency_mismatch: {
    label: "Wrong currency",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export default async function AdminFinancePage() {
  const supabase = await createClient();

  const [{ data: queue }, { data: imbalances }, { data: exceptions }, { data: totals }] =
    await Promise.all([
      supabase
        .from("payment_reconciliation_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("ledger_imbalances").select("*").limit(20),
      supabase
        .from("payment_exceptions")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ledger_entries")
        .select("entry_type, signed_amount")
        .limit(10000),
    ]);

  // Small enough to total in the page; past that this becomes a view.
  const sums = (totals ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.entry_type as string;
    acc[key] = (acc[key] ?? 0) + Number(row.signed_amount ?? 0);
    return acc;
  }, {});

  // Categories read as "what is owed / what was earned", which is the
  // negation of the signed sum — see the convention note in 014.
  const grossReceived = sums["gateway_charge"] ?? 0;
  const gatewayFees = -(sums["gateway_fee"] ?? 0);
  const commission = -(sums["platform_commission"] ?? 0);
  const landlordOwed = -(sums["landlord_payable"] ?? 0);
  const refundsOwed = -(sums["refund_due"] ?? 0);

  const stats = [
    { label: "Gross received", value: naira(grossReceived), icon: TrendingUp },
    { label: "Platform revenue", value: naira(commission), icon: Scale },
    { label: "Owed to landlords", value: naira(landlordOwed), icon: Scale },
    { label: "Owed back to students", value: naira(refundsOwed), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">
          Every charge that needs a decision, and what the books say.
        </p>
      </div>

      {/* ── Imbalances: should never have rows ─────────────── */}
      {imbalances && imbalances.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Ledger imbalance — {imbalances.length} payment(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              These payments have entries that do not sum to zero. That is money
              recorded and not accounted for, and it means a bug rather than an
              event. Do not reconcile around it — investigate it.
            </p>
            {imbalances.map((row) => (
              <p key={row.payment_id} className="font-mono text-xs">
                {row.payment_id} — off by {naira(row.imbalance)} across {row.entries} entries
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <stat.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="truncate text-xl font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gatewayFees > 0 && (
        <p className="text-xs text-muted-foreground">
          Gateway fees to date: {naira(gatewayFees)}. These come out of the
          platform&rsquo;s share, never the landlord&rsquo;s.
        </p>
      )}

      {/* ── The queue ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Needs a decision</CardTitle>
        </CardHeader>
        <CardContent>
          {queue && queue.length > 0 ? (
            <ul className="divide-y">
              {queue.map((row) => {
                const anomaly = anomalyLabels[row.anomaly ?? ""] ?? {
                  label: row.anomaly ?? "Anomaly",
                  className: "",
                };

                return (
                  <li key={row.payment_id} className="space-y-3 py-5 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={anomaly.className}>
                        {anomaly.label}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {row.reconciliation_status?.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.transaction_reference}
                      </span>
                    </div>

                    <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
                      <p>
                        Charged <strong>{naira(row.amount)}</strong>
                        {row.expected_amount !== null && (
                          <span className="text-muted-foreground">
                            {" "}
                            against {naira(row.expected_amount)}
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        Variance{" "}
                        <strong className="text-foreground">{naira(row.variance)}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Owed back{" "}
                        <strong className="text-foreground">
                          {naira(row.refund_outstanding)}
                        </strong>
                        {Number(row.refunded_amount ?? 0) > 0 && (
                          <span> · {naira(row.refunded_amount)} already refunded</span>
                        )}
                      </p>
                    </div>

                    {row.reconciliation_notes && (
                      <p className="text-xs text-muted-foreground">
                        {row.reconciliation_notes}
                      </p>
                    )}

                    <ReconcileForm
                      paymentId={row.payment_id as string}
                      outstanding={Number(row.refund_outstanding ?? 0)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Nothing to reconcile. Every charge matched its booking.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Unattachable charges ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Charges with no booking</CardTitle>
        </CardHeader>
        <CardContent>
          {exceptions && exceptions.length > 0 ? (
            <ul className="divide-y text-sm">
              {exceptions.map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline gap-3 py-3">
                  <span className="font-mono text-xs">{row.reference}</span>
                  <strong>{naira(row.amount)}</strong>
                  <Badge variant="outline" className="capitalize">
                    {row.reason.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              None. Every charge the gateway confirmed found its booking.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
