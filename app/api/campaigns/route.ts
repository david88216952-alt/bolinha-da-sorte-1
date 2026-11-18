import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // all, active, completed

    let whereClause = {};
    if (filter === "active") {
      whereClause = { status: "ACTIVE" };
    } else if (filter === "completed") {
      whereClause = { status: "COMPLETED" };
    }

    // Ordenar ativas pelo maior valor estimado de prêmio (prizeValue DESC)
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      orderBy: [
        { status: "asc" }, // "ACTIVE" comes before "COMPLETED"
        { prizeValue: "desc" },
      ],
      include: {
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

    // Enriquecer campanhas com cálculos de vendas
    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        // Contar cotas pagas
        const paidAggregate = await prisma.order.aggregate({
          where: {
            campaignId: c.id,
            paymentStatus: "PAID",
          },
          _sum: {
            quantity: true,
          },
        });

        const soldTickets = paidAggregate._sum.quantity || c._count.tickets || 0;
        const totalTickets = c.totalTickets || 10000;
        const percentSold = Math.min(100, Math.round((soldTickets / totalTickets) * 100));

        let parsedPackages = [];
        try {
          parsedPackages = JSON.parse(c.promoPackages || "[]");
        } catch {
          parsedPackages = [];
        }

        let parsedGallery = [];
        try {
          parsedGallery = JSON.parse(c.galleryImages || "[]");
        } catch {
          parsedGallery = [];
        }

        return {
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          prizeValue: c.prizeValue,
          ticketPrice: c.ticketPrice,
          totalTickets: c.totalTickets,
          soldTickets,
          percentSold,
          remainingTickets: Math.max(0, totalTickets - soldTickets),
          promoPackages: parsedPackages,
          promoBannerText: c.promoBannerText,
          drawDate: c.drawDate,
          status: c.status,
          coverImageUrl: c.coverImageUrl,
          galleryImages: parsedGallery,
          createdAt: c.createdAt,
          winner: c.winners[0]
            ? {
                winningTicketNumber: c.winners[0].winningTicketNumber,
                winnerName: c.winners[0].user.fullName,
                awardedAt: c.winners[0].awardedAt,
              }
            : null,
        };
      })
    );

    // Hero: A campanha com status === 'ACTIVE' que possuir o maior prize_value
    const activeCampaigns = enriched.filter((c) => c.status === "ACTIVE");
    const heroCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null;

    return NextResponse.json({
      heroCampaign,
      campaigns: enriched,
    });
  } catch (error) {
    console.error("List campaigns error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar campanhas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 403 }
      );
    }

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
    } = body;

    if (!title || prizeValue === undefined || !ticketPrice) {
      return NextResponse.json(
        { error: "Preencha o título, valor do prêmio e preço da cota." },
        { status: 400 }
      );
    }

    const finalDescription =
      description && description.trim()
        ? description.trim()
        : "Sorteio oficial auditado e baseado na extração da Loteria Federal.";

    const campaign = await prisma.campaign.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || "Participe Agora!",
        description: finalDescription,
        prizeValue: Number(prizeValue),
        ticketPrice: Number(ticketPrice),
        totalTickets: Number(totalTickets) || 10000,
        promoPackages:
          typeof promoPackages === "string"
            ? promoPackages
            : JSON.stringify(promoPackages || []),
        promoBannerText: promoBannerText || null,
        drawDate: drawDate ? new Date(drawDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: status || "ACTIVE",
        coverImageUrl: coverImageUrl || "/placeholder-raffle.jpg",
        galleryImages:
          typeof galleryImages === "string"
            ? galleryImages
            : JSON.stringify(galleryImages || []),
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Erro ao criar campanha." },
      { status: 500 }
    );
  }
}
