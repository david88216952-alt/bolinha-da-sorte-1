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

/**
 * Endpoint de Verificação Oficial Ativa (Anti-Fraude):
 * Valida rigorosamente junto à API bancária oficial se o Pix realmente foi pago e creditado.
 * NUNCA libera bilhetes sem a confirmação real do banco (previne golpes e bypass).
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

    // Se o pedido já estiver confirmado e pago, retorna os bilhetes
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        isPaid: true,
        order,
        tickets: order.tickets || [],
        message: "Pagamento já confirmado pelo banco!",
      });
    }

    const hasAccessToken = !!(
      process.env.PIX_ACCESS_TOKEN && process.env.PIX_ACCESS_TOKEN.trim()
    );

    // Consulta em tempo real à API oficial do Gateway Bancário
    if (order.externalPaymentId && hasAccessToken) {
      try {
        const isApproved = await checkGatewayPaymentStatus(order.externalPaymentId);
        if (isApproved) {
          // Confirmação bancária legítima confirmada pelo gateway: baixa atômica
          const paidResult = await processPaidOrder(order.id, order.externalPaymentId);
          return NextResponse.json({
            success: true,
            isPaid: true,
            order: paidResult.order,
            tickets: paidResult.order.tickets || [],
            instantPrizesWon: paidResult.instantPrizesWon || [],
            message: "Pagamento identificado e aprovado pelo banco com sucesso!",
          });
        }
      } catch (checkErr) {
        console.error("Erro ao validar pagamento no gateway:", checkErr);
      }
    }

    // Se o banco ainda não confirmou o pagamento: NÃO LIBERA NENHUM BILHETE (ANTI-FRAUDE)
    return NextResponse.json({
      success: false,
      isPaid: false,
      message: hasAccessToken
        ? "Pagamento ainda não identificado pelo banco. Se você acabou de pagar pelo seu aplicativo bancário, aguarde alguns instantes enquanto a instituição financeira processa e clique em verificar novamente."
        : "Aguardando confirmação bancária. Para validação 100% automática e antifraude em tempo real, configure seu PIX_ACCESS_TOKEN do gateway (Mercado Pago ou Asaas) no arquivo .env.",
    });
  } catch (error) {
    console.error("Confirm payment POST error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status no banco." },
      { status: 500 }
    );
  }
}
