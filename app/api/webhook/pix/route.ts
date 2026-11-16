import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, externalPaymentId, status } = body;

    // Localizar o pedido pelo orderId ou pelo externalPaymentId
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(externalPaymentId ? [{ externalPaymentId }] : []),
        ],
      },
      include: {
        user: true,
        campaign: true,
        tickets: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não localizado para baixa." },
        { status: 404 }
      );
    }

    // Idempotência: Se já estiver pago, retornar sucesso imediatamente
    if (order.paymentStatus === "PAID" && order.tickets.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Pedido já se encontra pago e com bilhetes emitidos.",
        orderId: order.id,
        ticketsCount: order.tickets.length,
      });
    }

    // Transação segura para garantir baixa e emissão de bilhetes sem duplicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status do pedido para PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });

      // 2. Buscar último número de bilhete emitido para esta campanha
      const lastTicket = await tx.ticket.findFirst({
        where: { campaignId: order.campaignId },
        orderBy: { ticketNumber: "desc" },
      });

      let nextNumber = lastTicket ? parseInt(lastTicket.ticketNumber, 10) + 1 : 30600;

      // 3. Buscar cotas premiadas ativas desta campanha para checagem imediata
      const availableInstantPrizes = await tx.instantPrize.findMany({
        where: {
          campaignId: order.campaignId,
          isClaimed: false,
        },
      });

      const instantPrizesMap = new Map(
        availableInstantPrizes.map((ip) => [ip.ticketNumber, ip])
      );

      const generatedTickets = [];
      const hitInstantPrizes = [];

      for (let i = 0; i < order.quantity; i++) {
        const ticketNumStr = nextNumber.toString().padStart(7, "0");
        nextNumber++;

        // Checar se o número gerado corresponde a uma cota premiada
        const instantPrize = instantPrizesMap.get(ticketNumStr);
        const isInstant = !!instantPrize;
        const prizeValue = instantPrize ? instantPrize.prizeValue : null;

        if (instantPrize) {
          hitInstantPrizes.push(instantPrize);
          // Marcar cota premiada como resgatada
          await tx.instantPrize.update({
            where: { id: instantPrize.id },
            data: {
              isClaimed: true,
              claimedByName: order.user.fullName,
              claimedAt: new Date(),
            },
          });
        }

        generatedTickets.push({
          campaignId: order.campaignId,
          orderId: order.id,
          userId: order.userId,
          ticketNumber: ticketNumStr,
          isInstantPrize: isInstant,
          instantPrizeValue: prizeValue,
        });
      }

      // Inserir os bilhetes gerados
      await tx.ticket.createMany({
        data: generatedTickets,
      });

      return {
        order: updatedOrder,
        ticketsCreated: generatedTickets.length,
        instantPrizesHit: hitInstantPrizes,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Baixa realizada com sucesso via Webhook Pix.",
      orderId: result.order.id,
      ticketsCreated: result.ticketsCreated,
      instantPrizesWon: result.instantPrizesHit,
    });
  } catch (error) {
    console.error("Pix Webhook error:", error);
    return NextResponse.json(
      { error: "Erro ao processar confirmação do webhook Pix." },
      { status: 500 }
    );
  }
}
