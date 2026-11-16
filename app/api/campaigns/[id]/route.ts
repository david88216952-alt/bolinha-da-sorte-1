import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        instantPrizes: {
          orderBy: { ticketNumber: "asc" },
        },
        winners: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada." },
        { status: 404 }
      );
    }

    // Calcular estatísticas de vendas
    const paidAggregate = await prisma.order.aggregate({
      where: {
        campaignId: campaign.id,
        paymentStatus: "PAID",
      },
      _sum: {
        quantity: true,
      },
    });

    const soldTickets = paidAggregate._sum.quantity || campaign._count.tickets || 0;
    const totalTickets = campaign.totalTickets || 1000000;
    const percentSold = Math.min(100, Math.round((soldTickets / totalTickets) * 100));

    // Ranking de Compradores: Top compradores daquela campanha ordenados pela soma de bilhetes pagos (SUM(quantity))
    // Mostrando: Posição, Nome Completo, Quantidade de Bilhetes e Valor Total Pago (R$)
    const topOrders = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        campaignId: campaign.id,
        paymentStatus: "PAID",
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    // Buscar nomes dos usuários do ranking
    const rankingUsers = await prisma.user.findMany({
      where: {
        id: { in: topOrders.map((o) => o.userId) },
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    const userMap = new Map(rankingUsers.map((u) => [u.id, u.fullName]));

    const topBuyersRanking = topOrders.map((item, index) => ({
      position: index + 1,
      userId: item.userId,
      fullName: userMap.get(item.userId) || "Comprador Anônimo",
      quantity: item._sum.quantity || 0,
      totalAmount: item._sum.totalAmount || 0,
    }));

    let parsedPackages = [];
    try {
      parsedPackages = JSON.parse(campaign.promoPackages || "[]");
    } catch {
      parsedPackages = [];
    }

    let parsedGallery = [];
    try {
      parsedGallery = JSON.parse(campaign.galleryImages || "[]");
    } catch {
      parsedGallery = [];
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        soldTickets,
        percentSold,
        remainingTickets: Math.max(0, totalTickets - soldTickets),
        promoPackages: parsedPackages,
        galleryImages: parsedGallery,
        instantPrizes: campaign.instantPrizes,
        ranking: topBuyersRanking,
        winner: campaign.winners[0]
          ? {
              winningTicketNumber: campaign.winners[0].winningTicketNumber,
              winnerName: campaign.winners[0].user.fullName,
              awardedAt: campaign.winners[0].awardedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes da campanha." },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();

    const {
      title,
      subtitle,
      description,
      prizeValue,
      ticketPrice,
      totalTickets,
      promoPackages,
      promoBannerText,
      drawDate,
      status,
      coverImageUrl,
      galleryImages,
      winningTicketNumber,
      winnerUserId,
    } = body;

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle?.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(prizeValue !== undefined && { prizeValue: Number(prizeValue) }),
        ...(ticketPrice !== undefined && { ticketPrice: Number(ticketPrice) }),
        ...(totalTickets !== undefined && { totalTickets: Number(totalTickets) }),
        ...(promoPackages !== undefined && {
          promoPackages:
            typeof promoPackages === "string"
              ? promoPackages
              : JSON.stringify(promoPackages),
        }),
        ...(promoBannerText !== undefined && { promoBannerText }),
        ...(drawDate !== undefined && { drawDate: new Date(drawDate) }),
        ...(status !== undefined && { status }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(galleryImages !== undefined && {
          galleryImages:
            typeof galleryImages === "string"
              ? galleryImages
              : JSON.stringify(galleryImages),
        }),
      },
    });

    // Se fornecido winningTicketNumber e status COMPLETED, registrar vencedor oficial
    if (winningTicketNumber && status === "COMPLETED") {
      let targetUserId = winnerUserId;
      if (!targetUserId) {
        // Encontrar usuário que possui o bilhete vencedor
        const winningTicket = await prisma.ticket.findFirst({
          where: {
            campaignId: id,
            ticketNumber: winningTicketNumber.trim(),
          },
        });
        if (winningTicket) {
          targetUserId = winningTicket.userId;
        } else {
          targetUserId = admin.id;
        }
      }

      // Upsert winner
      const existingWinner = await prisma.winner.findFirst({
        where: { campaignId: id },
      });

      if (existingWinner) {
        await prisma.winner.update({
          where: { id: existingWinner.id },
          data: {
            winningTicketNumber: winningTicketNumber.trim(),
            userId: targetUserId,
            awardedAt: new Date(),
          },
        });
      } else {
        await prisma.winner.create({
          data: {
            campaignId: id,
            userId: targetUserId,
            winningTicketNumber: winningTicketNumber.trim(),
            awardedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar campanha." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Exclusão segura em cascata de bilhetes, pedidos, ganhadores e cotas premiadas
    await prisma.$transaction([
      prisma.winner.deleteMany({ where: { campaignId: id } }),
      prisma.ticket.deleteMany({ where: { campaignId: id } }),
      prisma.order.deleteMany({ where: { campaignId: id } }),
      prisma.instantPrize.deleteMany({ where: { campaignId: id } }),
      prisma.campaign.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir campanha." },
      { status: 500 }
    );
  }
}
