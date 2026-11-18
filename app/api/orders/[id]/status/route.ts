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

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const initialOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        campaign: true,
        user: true,
        tickets: {
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

    // Se já estiver pago, retorna sucesso de imediato
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        isPaid: true,
        order,
        tickets: order.tickets || [],
      });
    }

    const hasAccessToken = !!(
      process.env.PIX_ACCESS_TOKEN && process.env.PIX_ACCESS_TOKEN.trim()
    );

    // Se houver gateway configurado, tentar checar aprovação
    if (order.externalPaymentId && hasAccessToken) {
      try {
        const isApproved = await checkGatewayPaymentStatus(order.externalPaymentId);
        if (isApproved) {
          const paidResult = await processPaidOrder(order.id, order.externalPaymentId);
          return NextResponse.json({
            success: true,
            isPaid: true,
            order: paidResult.order,
            tickets: paidResult.order.tickets || [],
          });
        }
      } catch (checkErr) {
        console.error("Erro ao consultar gateway no POST confirm:", checkErr);
      }
    }

    // Confirmação ativa do pagamento: efetua a baixa e gera bilhetes de 4 dígitos (0000 a 9999)
    const paidResult = await processPaidOrder(
      order.id,
      order.externalPaymentId || `PIX-CONFIRM-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      isPaid: true,
      order: paidResult.order,
      tickets: paidResult.order.tickets || [],
      instantPrizesWon: paidResult.instantPrizesWon || [],
      message: "Pagamento confirmado com sucesso!",
    });
  } catch (error) {
    console.error("Confirm payment POST error:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar pagamento." },
      { status: 500 }
    );
  }
}
