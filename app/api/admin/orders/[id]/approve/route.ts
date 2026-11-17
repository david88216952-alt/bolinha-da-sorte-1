import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { processPaidOrder } from "@/lib/pix-gateway";

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

    const result = await processPaidOrder(id);

    return NextResponse.json({
      success: true,
      message: "Pedido aprovado e bilhetes emitidos com sucesso!",
      order: result.order,
      ticketsCreated: result.ticketsCreated,
      instantPrizesWon: result.instantPrizesWon,
    });
  } catch (error) {
    console.error("Manual approve error:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar pedido manualmente." },
      { status: 500 }
    );
  }
}
