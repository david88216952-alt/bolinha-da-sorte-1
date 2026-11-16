import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { maskPhone } from "@/lib/phone";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const winners = await prisma.winner.findMany({
      orderBy: { awardedAt: "desc" },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            prizeValue: true,
            coverImageUrl: true,
          },
        },
        user: {
          select: {
            fullName: true,
            phone: true,
            // CPF is strictly excluded from query to guarantee LGPD compliance!
          },
        },
      },
    });

    // Formatar estritamente o telefone no back-end antes de enviar ao front-end: (XX) *****-****
    const safeWinners = winners.map((w) => ({
      id: w.id,
      campaignId: w.campaignId,
      campaignTitle: w.campaign.title,
      campaignCoverImage: w.campaign.coverImageUrl,
      prizeValue: w.campaign.prizeValue,
      winnerName: w.user.fullName,
      maskedPhone: maskPhone(w.user.phone), // (XX) *****-****
      winningTicketNumber: w.winningTicketNumber,
      winnerPhotoUrl: w.winnerPhotoUrl, // Nullable - fallback rendered on front-end
      awardedAt: w.awardedAt,
    }));

    return NextResponse.json({
      winners: safeWinners,
    });
  } catch (error) {
    console.error("List winners error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar ganhadores." },
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
    const { campaignId, userId, winningTicketNumber, winnerPhotoUrl, awardedAt } = body;

    if (!campaignId || !winningTicketNumber) {
      return NextResponse.json(
        { error: "Campanha e número sorteado são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanNumber = winningTicketNumber.trim();
    const paddedNumber = cleanNumber.padStart(7, "0");

    const ticket = await prisma.ticket.findFirst({
      where: {
        campaignId,
        ticketNumber: { in: [cleanNumber, paddedNumber] },
      },
      include: {
        order: true,
        user: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "O bilhete premiado informado não foi encontrado para esta campanha." },
        { status: 400 }
      );
    }

    if (ticket.order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "O bilhete informado pertence a um pedido pendente (não pago). Somente bilhetes pagos podem ser homologados." },
        { status: 400 }
      );
    }

    const targetUserId = ticket.userId;
    const finalTicketNumber = ticket.ticketNumber;

    const winner = await prisma.winner.create({
      data: {
        campaignId,
        userId: targetUserId,
        winningTicketNumber: finalTicketNumber,
        winnerPhotoUrl: winnerPhotoUrl || null,
        awardedAt: awardedAt ? new Date(awardedAt) : new Date(),
      },
    });

    // Marcar a campanha como COMPLETED
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true, winner });
  } catch (error) {
    console.error("Create winner error:", error);
    return NextResponse.json(
      { error: "Erro ao registrar ganhador." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do ganhador é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.winner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete winner error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir ganhador." },
      { status: 500 }
    );
  }
}
