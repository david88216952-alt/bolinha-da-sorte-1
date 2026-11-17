import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPixConfig } from "@/lib/settings";
import { generatePixCopyPaste, generatePixData } from "@/lib/pix";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            ticketPrice: true,
            coverImageUrl: true,
            drawDate: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            isInstantPrize: true,
            instantPrizeValue: true,
          },
          orderBy: { ticketNumber: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    // Se o pedido ainda estiver PENDENTE, verificar se a chave ou link Pix recebedor mudou
    if (order.paymentStatus === "PENDING") {
      try {
        const pixConfig = await getPixConfig();
        const freshCopyPaste = generatePixCopyPaste(
          order.totalAmount,
          order.id,
          pixConfig.receiverKey,
          pixConfig.merchantName,
          pixConfig.merchantCity
        );

        // Se o copia e cola atual for diferente (ex: chave recebedora alterada no admin)
        if (order.pixCopyPaste !== freshCopyPaste) {
          const freshPix = await generatePixData(
            order.totalAmount,
            order.id,
            pixConfig.receiverKey,
            pixConfig.merchantName,
            pixConfig.merchantCity
          );

          await prisma.order.update({
            where: { id: order.id },
            data: {
              pixCopyPaste: freshPix.copyPaste,
              pixQrCode: freshPix.qrCodeBase64,
            },
          });

          order.pixCopyPaste = freshPix.copyPaste;
          order.pixQrCode = freshPix.qrCodeBase64;
        }
      } catch (err) {
        console.error("Error refreshing pix data:", err);
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status do pedido." },
      { status: 500 }
    );
  }
}
