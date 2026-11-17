import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createPixCharge, getAppBaseUrl } from "@/lib/pix-gateway";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      campaignId,
      quantity,
      pixKey,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCpf,
    } = body;

    const parsedQty = parseInt(quantity, 10);
    if (!campaignId || isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: "Quantidade e campanha são obrigatórias." },
        { status: 400 }
      );
    }

    // Identificar usuário autenticado ou pelo cadastro
    let user = await getSessionUser();

    if (!user) {
      // Se foram passados dados do comprador diretamente no checkout
      if (buyerEmail || buyerPhone || buyerCpf) {
        const identifier = (buyerEmail || buyerPhone || buyerCpf).trim();
        user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(buyerEmail ? [{ email: buyerEmail.trim().toLowerCase() }] : []),
              ...(buyerCpf ? [{ cpf: buyerCpf.replace(/\D/g, "") }] : []),
              ...(buyerPhone ? [{ phone: buyerPhone.replace(/\D/g, "") }] : []),
            ],
          },
        });

        // Se ainda não existir cadastro, criar usuário básico para este comprador
        if (!user && (buyerEmail || buyerPhone)) {
          const defaultCpf = buyerCpf ? buyerCpf.replace(/\D/g, "") : `CPF${Date.now()}`;
          const defaultEmail = buyerEmail ? buyerEmail.trim().toLowerCase() : `comprador${Date.now()}@bolinhadasorte.com.br`;
          const defaultPhone = buyerPhone ? buyerPhone.replace(/\D/g, "") : "75991638134";

          user = await prisma.user.create({
            data: {
              fullName: buyerName || "Comprador Bolinha",
              cpf: defaultCpf,
              email: defaultEmail,
              phone: defaultPhone,
              passwordHash: "CHECKOUT_GUEST",
            },
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar conectado para realizar um pedido.", requireLogin: true },
        { status: 401 }
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

    // Buscar dados mais atualizados do comprador
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, cpf: true, phone: true },
    });

    const finalPixKey = (pixKey || userDb?.phone || userDb?.cpf || "75991638134").trim();

    // 1. Criar pedido prévio no banco de dados
    const initialOrder = await prisma.order.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        quantity: parsedQty,
        totalAmount,
        paymentStatus: "PENDING",
        pixQrCode: "",
        pixCopyPaste: "",
        pixKey: finalPixKey,
        externalPaymentId: "",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos de reserva
      },
    });

    // Detectar URL base do request para envio preciso do notification_url (/api/webhooks/pix)
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // 2. Gerar cobrança Pix oficial na API do gateway com notification_url apontando para /api/webhooks/pix
    const pixData = await createPixCharge({
      orderId: initialOrder.id,
      amount: totalAmount,
      buyerName: buyerName || userDb?.fullName || user.fullName,
      buyerEmail: buyerEmail || userDb?.email || user.email,
      buyerCpf: buyerCpf || userDb?.cpf || (finalPixKey.includes("@") ? "" : finalPixKey),
      buyerPhone: buyerPhone || userDb?.phone,
      description: `Pedido ${initialOrder.id.slice(0, 8)} - ${campaign.title}`,
      baseUrl,
    });

    // 3. Atualizar o pedido salvando externalPaymentId, pixQrCode e pixCopyPaste
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
            id: true,
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
    console.error("Checkout order error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar cobrança Pix do pedido." },
      { status: 500 }
    );
  }
}
