import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkGatewayPaymentStatus, processPaidOrder } from "@/lib/pix-gateway";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const initialOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            ticketPrice: true,
            coverImageUrl: true,
            drawDate: true,
            totalTickets: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            isInstantPrize: true,
            instantPrizeValue: true,
          },
          orderBy: { ticketNumber: "asc" },
        },
      },
    });

    if (!initialOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    let order: any = initialOrder;

    // Se o pedido ainda estiver PENDENTE e possuir externalPaymentId, consultar a API oficial do Mercado Pago
    // GET https://api.mercadopago.com/v1/payments/{externalPaymentId}
    if (order.paymentStatus === "PENDING" && order.externalPaymentId) {
      try {
        const isApproved = await checkGatewayPaymentStatus(order.externalPaymentId);
        // SÓ libera os bilhetes (de 0000 a 9999) quando o status oficial retornado pelo banco for 'approved'
        if (isApproved) {
          const paidResult = await processPaidOrder(order.id, order.externalPaymentId);
          order = paidResult.order;
        }
      } catch (checkErr) {
        console.error("Erro ao consultar Mercado Pago em GET /api/orders/[id]/status:", checkErr);
      }
    }

    const isPaid = order.paymentStatus === "PAID";

    return NextResponse.json(
      {
        order,
        paymentStatus: order.paymentStatus,
        isPaid,
        tickets: order.tickets || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Order status check error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status do pedido." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // Redireciona estritamente para GET para eliminar qualquer auto-aprovação fraudulenta
  return GET(request, props);
}
