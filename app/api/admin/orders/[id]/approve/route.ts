import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 403 }
      );
    }

    const { id } = await props.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        campaign: true,
        tickets: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "PAID" && order.tickets.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Pedido já se encontra pago e com bilhetes emitidos.",
        order,
      });
    }

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

        const instantPrize = instantPrizesMap.get(ticketNumStr);
        const isInstant = !!instantPrize;
        const prizeValue = instantPrize ? instantPrize.prizeValue : null;

        if (instantPrize) {
          hitInstantPrizes.push(instantPrize);
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

      await tx.ticket.createMany({
        data: generatedTickets,
      });

      return {
        order: updatedOrder,
        ticketsCount: generatedTickets.length,
        instantPrizesWon: hitInstantPrizes,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Pedido aprovado manualmente com sucesso!",
      orderId: result.order.id,
      ticketsCreated: result.ticketsCount,
      instantPrizesWon: result.instantPrizesWon,
    });
  } catch (error) {
    console.error("Admin order approval error:", error);
    return NextResponse.json(
      { error: "Erro ao processar aprovação manual do pedido." },
      { status: 500 }
    );
  }
}
