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

    // Se o pedido estiver PENDENTE e houver gateway configurado, consultar a API oficial do banco
    if (order.paymentStatus === "PENDING" && order.externalPaymentId && hasAccessToken) {
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

/**
 * Confirmação de Pagamento Ativa:
 * - Em Produção (com PIX_ACCESS_TOKEN no .env): Consulta o gateway oficial para garantir que o dinheiro entrou.
 * - Em Localhost / Teste (sem PIX_ACCESS_TOKEN): Dá baixa atômica e emite os bilhetes para testar todo o fluxo.
 */
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

    // Se já estiver pago, retorna os dados e bilhetes
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        isPaid: true,
        order,
        tickets: order.tickets || [],
        message: "Pagamento já confirmado!",
      });
    }

    const hasAccessToken = !!(
      process.env.PIX_ACCESS_TOKEN && process.env.PIX_ACCESS_TOKEN.trim()
    );

    // Se houver gateway configurado (Produção), consulta obrigatoriamente a API oficial do banco
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
            instantPrizesWon: paidResult.instantPrizesWon || [],
            message: "Pagamento aprovado pelo banco com sucesso!",
          });
        }
      } catch (checkErr) {
        console.error("Erro ao validar pagamento no gateway:", checkErr);
      }

      // Se há gateway mas o banco ainda não acusou recebimento:
      return NextResponse.json({
        success: false,
        isPaid: false,
        message: "Pagamento ainda não identificado pelo banco. Se você acabou de pagar pelo seu aplicativo bancário, aguarde alguns instantes enquanto a instituição financeira processa e clique em verificar novamente.",
      });
    }

    // Se não há gateway configurado (Ambiente Local / Desenvolvimento):
    // Efetua a baixa atômica real e gera os bilhetes oficiais de 4 dígitos (0000 a 9999)
    const paidResult = await processPaidOrder(
      order.id,
      order.externalPaymentId || `PIX-CONFIRMED-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      isPaid: true,
      order: paidResult.order,
      tickets: paidResult.order.tickets || [],
      instantPrizesWon: paidResult.instantPrizesWon || [],
      message: "Pagamento confirmado com sucesso! Seus bilhetes foram gerados.",
    });
  } catch (error) {
    console.error("Confirm payment POST error:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar pagamento." },
      { status: 500 }
    );
  }
}
