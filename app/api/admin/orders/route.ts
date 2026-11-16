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
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search");
    const campaignId = searchParams.get("campaignId");

    const where: any = {};

    if (status && status !== "ALL") {
      where.paymentStatus = status;
    }

    if (campaignId && campaignId !== "ALL") {
      where.campaignId = campaignId;
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      where.OR = [
        { id: { contains: s } },
        { user: { fullName: { contains: s } } },
        { user: { phone: { contains: s } } },
        { user: { email: { contains: s } } },
      ];
    }

    const [orders, totalOrdersCount, paidOrdersCount, pendingOrdersCount, revenueAggregate] =
      await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            campaign: {
              select: {
                id: true,
                title: true,
                ticketPrice: true,
              },
            },
            _count: {
              select: { tickets: true },
            },
          },
        }),
        prisma.order.count(),
        prisma.order.count({ where: { paymentStatus: "PAID" } }),
        prisma.order.count({ where: { paymentStatus: "PENDING" } }),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID" },
          _sum: { totalAmount: true, quantity: true },
        }),
      ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      buyerName: o.user.fullName,
      buyerPhone: o.user.phone,
      buyerEmail: o.user.email,
      campaignId: o.campaignId,
      campaignTitle: o.campaign.title,
      quantity: o.quantity,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      pixKey: o.pixKey,
      pixCopyPaste: o.pixCopyPaste,
      pixQrCode: o.pixQrCode,
      ticketsCount: o._count.tickets,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      expiresAt: o.expiresAt,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      stats: {
        totalOrders: totalOrdersCount,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalRevenue: revenueAggregate._sum.totalAmount || 0,
        totalPaidTickets: revenueAggregate._sum.quantity || 0,
      },
    });
  } catch (error) {
    console.error("List admin orders error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar pedidos administrativos." },
      { status: 500 }
    );
  }
}
