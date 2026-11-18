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

    // Se o pedido ainda estiver PENDENTE, consultar ativamente o status na API do gateway (Mercado Pago / Asaas)
    if (order.paymentStatus === "PENDING") {
      if (order.externalPaymentId && hasAccessToken) {
        try {
          const isApproved = await checkGatewayPaymentStatus(order.externalPaymentId);
          if (isApproved) {
            const paidResult = await processPaidOrder(order.id, order.externalPaymentId);
            order = paidResult.order;
          }
        } catch (checkErr) {
          console.error("Erro ao consultar gateway no status:", checkErr);
        }
      }
    }

    const isPaid = order.paymentStatus === "PAID";

    return NextResponse.json({
      order,
      paymentStatus: order.paymentStatus,
      isPaid,
      tickets: order.tickets || [],
      isTestMode: !hasAccessToken,
    });
  } catch (error) {
    console.error("Order status check error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status do pedido." },
      { status: 500 }
    );
  }
}

/**
 * Rota POST para homologação e teste:
 * Permite aprovar o pagamento de teste e emitir os bilhetes de 4 dígitos (0000 a 9999)
 * mesmo sem credencial oficial no .env.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const paidResult: any = await processPaidOrder(id);

    return NextResponse.json({
      success: true,
      message: "Pagamento de teste confirmado com sucesso!",
      order: paidResult.order,
      tickets: paidResult.order?.tickets || [],
      isPaid: true,
    });
  } catch (error) {
    console.error("Test confirm error:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar pagamento de teste." },
      { status: 500 }
    );
  }
}
