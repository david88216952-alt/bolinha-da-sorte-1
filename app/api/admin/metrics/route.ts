import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // today, 7days, 30days, all
    const campaignId = searchParams.get("campaignId"); // optional filter

    // Construir filtro de datas para pedidos
    let dateFilter: any = {};
    const now = new Date();

    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      dateFilter = { gte: startOfDay };
    } else if (period === "7days") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: past7 };
    } else if (period === "30days") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: past30 };
    }

    const orderWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      orderWhere.createdAt = dateFilter;
    }
    if (campaignId && campaignId !== "all") {
      orderWhere.campaignId = campaignId;
    }

    // 1. Pedidos Pagos
    const paidOrders = await prisma.order.findMany({
      where: {
        ...orderWhere,
        paymentStatus: "PAID",
      },
      select: {
        id: true,
        totalAmount: true,
        quantity: true,
        createdAt: true,
        paidAt: true,
      },
    });

    // 2. Pedidos Pendentes (Aguardando Pix)
    const pendingOrders = await prisma.order.findMany({
      where: {
        ...orderWhere,
        paymentStatus: "PENDING",
      },
      select: {
        quantity: true,
        totalAmount: true,
      },
    });

    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const paidTickets = paidOrders.reduce((acc, o) => acc + o.quantity, 0);
    const pendingTickets = pendingOrders.reduce((acc, o) => acc + o.quantity, 0);
    const averageTicket =
      paidOrders.length > 0
        ? parseFloat((totalRevenue / paidOrders.length).toFixed(2))
        : 0;

    // 3. Campanhas Ativas
    const activeCampaignsCount = await prisma.campaign.count({
      where: { status: "ACTIVE" },
    });

    // 4. Desempenho de todas as campanhas (% de cotas vendidas)
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { prizeValue: "desc" },
    });

    const campaignPerformance = await Promise.all(
      campaigns.map(async (c) => {
        const orderSum = await prisma.order.aggregate({
          where: {
            campaignId: c.id,
            paymentStatus: "PAID",
          },
          _sum: {
            quantity: true,
            totalAmount: true,
          },
        });

        const sold = orderSum._sum.quantity || c._count.tickets || 0;
        const revenue = orderSum._sum.totalAmount || 0;
        const total = c.totalTickets || 1000000;
        const percent = Math.min(100, Math.round((sold / total) * 100));

        return {
          id: c.id,
          title: c.title,
          coverImageUrl: c.coverImageUrl,
          prizeValue: c.prizeValue,
          ticketPrice: c.ticketPrice,
          totalTickets: total,
          soldTickets: sold,
          percentSold: percent,
          revenue,
          status: c.status,
          drawDate: c.drawDate,
        };
      })
    );

    // Separar claramente Mais Vendidas e Menos Vendidas rigorosamente por quantidade de cotas vendidas
    const bestSellers = [...campaignPerformance].sort(
      (a, b) => b.soldTickets - a.soldTickets || b.revenue - a.revenue
    );
    const worstSellers = [...campaignPerformance].sort(
      (a, b) => a.soldTickets - b.soldTickets || a.revenue - b.revenue
    );

    // 5. Gráfico de Evolução de Vendas Diário (últimos 7 dias ou 30 dias conforme período)
    const daysCount = period === "30days" ? 30 : 7;
    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dailyChartData = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayOrders = paidOrders.filter((o) => {
        const orderDate = new Date(o.paidAt || o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayTotalRevenue = dayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const dayTotalTickets = dayOrders.reduce((acc, o) => acc + o.quantity, 0);

      dailyChartData.push({
        dayName: daysOfWeek[dayStart.getDay()],
        date: dayStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        revenue: dayTotalRevenue,
        tickets: dayTotalTickets,
      });
    }

    // 6. Transações Recentes em Tempo Real (respeitando filtro de campanha quando selecionada)
    const recentOrders = await prisma.order.findMany({
      where: campaignId && campaignId !== "all" ? { campaignId } : {},
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const recentTransactions = recentOrders.map((o) => ({
      id: o.id,
      buyerName: o.user.fullName,
      campaignId: o.campaignId,
      campaignTitle: o.campaign.title,
      quantity: o.quantity,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalTicketsSold: paidTickets,
        paidTickets,
        pendingTickets,
        activeCampaignsCount,
        averageTicket,
      },
      bestSellers,
      worstSellers,
      dailyChartData,
      recentTransactions,
      allCampaigns: campaigns.map((c) => ({ id: c.id, title: c.title })),
      allCampaignsPerformance: campaignPerformance,
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar métricas do painel administrativo." },
      { status: 500 }
    );
  }
}
