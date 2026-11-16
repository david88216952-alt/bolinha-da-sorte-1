import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { maskPhone } from "@/lib/phone";

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
    const search = searchParams.get("search");

    // 1. Ranking dos Top Compradores (agrupado por userId para pedidos pagos)
    const topBuyerGroups = await prisma.order.groupBy({
      by: ["userId"],
      where: { paymentStatus: "PAID" },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 20,
    });

    const topUserIds = topBuyerGroups.map((g) => g.userId);
    const topUsers = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    const userMap = new Map(topUsers.map((u) => [u.id, u]));

    const ranking = topBuyerGroups.map((g, index) => {
      const u = userMap.get(g.userId);
      const cleanPhone = (u?.phone || "").replace(/\D/g, "");
      const whatsappUrl = cleanPhone
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
            `Olá ${u?.fullName || "Cliente"}, aqui é da equipe Bolinha da Sorte!`
          )}`
        : null;

      return {
        position: index + 1,
        userId: g.userId,
        fullName: u?.fullName || "Comprador Registrado",
        phone: u ? maskPhone(u.phone) : "",
        rawPhone: u?.phone || "",
        email: u?.email || "",
        whatsappUrl,
        totalTickets: g._sum.quantity || 0,
        totalSpent: g._sum.totalAmount || 0,
        totalOrders: g._count.id || 0,
      };
    });

    // 2. Base de Clientes Cadastrados
    const clientWhere: any = {};
    if (search && search.trim().length > 0) {
      const s = search.trim();
      clientWhere.OR = [
        { fullName: { contains: s } },
        { phone: { contains: s } },
        { email: { contains: s } },
        { cpf: { contains: s } },
      ];
    }

    const clientsList = await prisma.user.findMany({
      where: clientWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        orders: {
          where: { paymentStatus: "PAID" },
          select: {
            quantity: true,
            totalAmount: true,
          },
        },
      },
    });

    const formattedClients = clientsList.map((c) => {
      const totalPaidOrders = c.orders.length;
      const totalTicketsBought = c.orders.reduce((acc, o) => acc + o.quantity, 0);
      const totalAmountSpent = c.orders.reduce((acc, o) => acc + o.totalAmount, 0);
      const cleanPhone = (c.phone || "").replace(/\D/g, "");
      const whatsappUrl = cleanPhone
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
            `Olá ${c.fullName}, tudo bem? Aqui é da equipe Bolinha da Sorte!`
          )}`
        : null;

      return {
        id: c.id,
        fullName: c.fullName,
        phone: maskPhone(c.phone),
        rawPhone: c.phone,
        email: c.email,
        role: c.role,
        createdAt: c.createdAt,
        totalPaidOrders,
        totalTicketsBought,
        totalAmountSpent,
        whatsappUrl,
      };
    });

    const totalClientsCount = await prisma.user.count();

    return NextResponse.json({
      ranking,
      clients: formattedClients,
      stats: {
        totalClients: totalClientsCount,
        activeBuyers: topBuyerGroups.length,
        topBuyer: ranking[0] || null,
      },
    });
  } catch (error) {
    console.error("List admin clients error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar lista de clientes." },
      { status: 500 }
    );
  }
}
