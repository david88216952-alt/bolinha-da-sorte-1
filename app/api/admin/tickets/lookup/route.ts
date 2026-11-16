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
    const campaignId = searchParams.get("campaignId");
    const ticketNumber = searchParams.get("ticketNumber");

    if (!campaignId || !ticketNumber) {
      return NextResponse.json(
        { error: "Campanha e número do bilhete são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanNumber = ticketNumber.trim();
    const paddedNumber = cleanNumber.padStart(7, "0");

    const ticket = await prisma.ticket.findFirst({
      where: {
        campaignId,
        ticketNumber: { in: [cleanNumber, paddedNumber] },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            paymentStatus: true,
            quantity: true,
            totalAmount: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({
        found: false,
        message: "Bilhete não encontrado para esta campanha ou ainda não adquirido.",
      });
    }

    const isPaid = ticket.order.paymentStatus === "PAID";

    return NextResponse.json({
      found: true,
      isPaid,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        isInstantPrize: ticket.isInstantPrize,
        instantPrizeValue: ticket.instantPrizeValue,
      },
      buyer: {
        id: ticket.user.id,
        fullName: ticket.user.fullName,
        phone: maskPhone(ticket.user.phone),
        rawPhone: ticket.user.phone,
        email: ticket.user.email,
      },
      order: {
        id: ticket.order.id,
        paymentStatus: ticket.order.paymentStatus,
        quantity: ticket.order.quantity,
        totalAmount: ticket.order.totalAmount,
        createdAt: ticket.order.createdAt,
        paidAt: ticket.order.paidAt,
      },
    });
  } catch (error) {
    console.error("Ticket lookup error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do bilhete." },
      { status: 500 }
    );
  }
}
