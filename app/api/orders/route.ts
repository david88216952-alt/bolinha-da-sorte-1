import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createPixCharge } from "@/lib/pix-gateway";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar conectado para realizar um pedido.", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { campaignId, quantity, pixKey } = body;

    const parsedQty = parseInt(quantity, 10);
    if (!campaignId || isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: "Quantidade e campanha são obrigatórias." },
        { status: 400 }
      );
    }

    if (!pixKey || !pixKey.trim()) {
      return NextResponse.json(
        { error: "Por favor, informe sua chave Pix (CPF, telefone, e-mail ou chave aleatória) antes de gerar o pagamento." },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Esta campanha não está aberta para compras." },
        { status: 400 }
      );
    }

    const totalAmount = parseFloat((parsedQty * campaign.ticketPrice).toFixed(2));

    // Buscar dados do comprador para a emissão do Pix
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, cpf: true, phone: true },
    });

    // Criar pedido prévio para obter o ID
    const initialOrder = await prisma.order.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        quantity: parsedQty,
        totalAmount,
        paymentStatus: "PENDING",
        pixQrCode: "",
        pixCopyPaste: "",
        pixKey: pixKey.trim(),
        externalPaymentId: "",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos de reserva
      },
    });

    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // Gerar Pix real (Mercado Pago, Asaas ou EMV Central Bank com chave do admin)
    const pixData = await createPixCharge({
      orderId: initialOrder.id,
      amount: totalAmount,
      buyerName: userDb?.fullName || user.fullName,
      buyerEmail: userDb?.email || user.email,
      buyerCpf: userDb?.cpf || (pixKey.includes("@") ? "" : pixKey),
      buyerPhone: userDb?.phone,
      description: `Pedido ${initialOrder.id.slice(0, 8)} - ${campaign.title}`,
      baseUrl,
    });

    const order = await prisma.order.update({
      where: { id: initialOrder.id },
      data: {
        pixQrCode: pixData.qrCodeBase64,
        pixCopyPaste: pixData.copyPaste,
        externalPaymentId: pixData.externalPaymentId,
        expiresAt: pixData.expiresAt,
      },
      include: {
        campaign: {
          select: {
            title: true,
            ticketPrice: true,
            coverImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar cobrança Pix." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query"); // CPF or Phone search

    const sessionUser = await getSessionUser();

    let targetUserId: string | null = sessionUser ? sessionUser.id : null;

    // Se houver busca por telefone ou CPF
    if (query && query.trim().length >= 3) {
      const cleanQuery = query.replace(/\D/g, "");
      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [
            { cpf: query.trim() },
            { cpf: cleanQuery },
            { phone: query.trim() },
            { phone: cleanQuery },
          ],
        },
      });

      if (foundUser) {
        targetUserId = foundUser.id;
      } else if (!sessionUser) {
        // Busca não encontrou ninguém e usuário não está logado
        return NextResponse.json({ orders: [] });
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            ticketPrice: true,
            coverImageUrl: true,
            status: true,
            drawDate: true,
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

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List orders error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar compras." },
      { status: 500 }
    );
  }
}
