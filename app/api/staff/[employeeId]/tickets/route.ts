import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface RawTicket {
  _id: string;
  invoice: number;
  grandTotal: number;
  paidStatus: string;
  ticketTakenBy: string;
  ticketName?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  paymentMethod?: string;
  archivedAt?: string | null;
}

interface EnrichedTicket {
  _id: string;
  invoice: number;
  grandTotal: number;
  paidStatus: string;
  ticketTakenBy: string;
  ticketName?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  paymentMethod?: string;
  archivedAt?: string | null;
}

interface BillMapValue {
  grandTotal?: number;
  ticketName?: string;
  generatedBy?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) => {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── Fetch tickets ───────────────────────────────────────────────
    const ticketParams = new URLSearchParams();
    ticketParams.set("limit", "500");
    if (startDate) ticketParams.set("from_date", startDate);
    if (endDate) ticketParams.set("to_date", endDate);

    const ticketsRes = await fetch(
      `${BASE}/business/ticket?${ticketParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!ticketsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: ticketsRes.status },
      );
    }

    const ticketsJson = await ticketsRes.json();
    const allTickets: RawTicket[] = ticketsJson?.data?.allTickets ?? [];

    // Filter by employee
    const employeeTickets = allTickets.filter(
      (ticket) => ticket.ticketTakenBy === employeeId,
    );

    // ── Enrich tickets with bill data for customer details ──────────
    let billsUrl = `${BASE}/business/ticket/bills?limit=1000`;
    if (startDate) billsUrl += `&startDate=${startDate}`;
    if (endDate) billsUrl += `&endDate=${endDate}`;

    const billsRes = await fetch(billsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Build bill lookup map: invoiceNo → bill record
    const billMap = new Map<number, BillMapValue>();

    if (billsRes.ok) {
      const billsData = await billsRes.json();

      const allBills: Record<string, unknown>[] =
        billsData?.data?.bill ?? billsData?.bill ?? billsData?.data ?? [];
      for (const bill of allBills) {
        const key = (bill.invoiceNo as number) ?? (bill.paidBillNo as number);
        if (key) {
          billMap.set(key, {
            grandTotal: bill.grandTotal as number | undefined,
            ticketName: bill.ticketName as string | undefined,
            generatedBy: bill.generatedBy as string | undefined,
            customerName: bill.customerName as string | undefined,
            customerPhone: bill.customerPhone as string | undefined,
            paymentMethod: bill.paymentMethod as string | undefined,
            paidAt: bill.paidAt as string | undefined,
          });
        }
      }
    }

    // ── Enrich tickets ──────────────────────────────────────────────
    const enrichedTickets: EnrichedTicket[] = employeeTickets.map((ticket) => {
      const bill = billMap.get(ticket.invoice);

      // Use bill's customer data (generatedBy = customer name from the bill)
      const customerName = bill?.customerName || "—";
      // Use createdAt from ticket (already in Nepal time), fallback to bill's paidAt
      const createdAt = ticket.createdAt || "—";

      return {
        _id: ticket._id,
        invoice: ticket.invoice,
        grandTotal: ticket.grandTotal ?? bill?.grandTotal ?? 0,
        paidStatus: ticket.paidStatus,
        ticketTakenBy: ticket.ticketTakenBy,
        ticketName: bill?.ticketName || ticket.ticketName || "—",
        customerName,
        customerPhone: bill?.customerPhone || "—",
        createdAt,
        paymentMethod: ticket.paymentMethod || bill?.paymentMethod || "—",
        archivedAt: ticket.archivedAt ?? null,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        tickets: enrichedTickets,
        totalCount: enrichedTickets.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch employee tickets" },
      { status: 500 },
    );
  }
};
