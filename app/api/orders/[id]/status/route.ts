import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkGatewayPaymentStatus, processPaidOrder } from "@/lib/pix-gateway";

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

    const hasAccessToken = !!(
      process.env.PIX_ACCESS_TOKEN && process.env.PIX_ACCESS_TOKEN.trim()
    );

    // Se o pedido ainda estiver PENDENTE, consultar ativamente o status na API oficial do gateway bancário (Mercado Pago / Asaas)
    if (order.paymentStatus === "PENDING" && order.externalPaymentId && hasAccessToken) {
      try {
        const isApproved = await checkGatewayPaymentStatus(order.externalPaymentId);
        if (isApproved) {
          // Baixa automática imediata: status para PAID e emissão de números de 0000 a 9999
          const paidResult = await processPaidOrder(order.id, order.externalPaymentId);
          order = paidResult.order;
        }
      } catch (checkErr) {
        console.error("Erro ao consultar gateway no status:", checkErr);
      }
    }

    const isPaid = order.paymentStatus === "PAID";

    return NextResponse.json({
      order,
      paymentStatus: order.paymentStatus,
      isPaid,
      tickets: order.tickets || [],
    });
  } catch (error) {
    console.error("Order status check error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status do pedido." },
      { status: 500 }
    );
  }
}
