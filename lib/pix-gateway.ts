import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { generatePixData, PixPayload } from "./pix";
import { getPixConfig } from "./settings";

export interface CreatePixOptions {
  orderId: string;
  amount: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerCpf?: string;
  buyerPhone?: string;
  description?: string;
}

/**
 * Creates a real Pix payment payload.
 * If PIX_ACCESS_TOKEN is present in environment variables, connects to Mercado Pago or Asaas.
 * Otherwise, generates an authentic Central Bank BCB EMV QR Code adhering to the admin settings.
 */
export async function createPixCharge(options: CreatePixOptions): Promise<PixPayload> {
  const { orderId, amount, buyerName, buyerEmail, buyerCpf, description } = options;
  const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();
  const provider = (process.env.PIX_PROVIDER || "MERCADO_PAGO").toUpperCase();
  const pixConfig = await getPixConfig();

  // 1. Tentar integração com Mercado Pago se o token estiver configurado
  if (accessToken && (provider === "MERCADO_PAGO" || accessToken.startsWith("APP_USR-") || accessToken.startsWith("TEST-"))) {
    try {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://bolinhadasorte.com.br").replace(/\/$/, "");
      const cleanCpf = (buyerCpf || "12345678909").replace(/\D/g, "");
      const nameParts = (buyerName || "Comprador Bolinha").trim().split(" ");
      const firstName = nameParts[0] || "Comprador";
      const lastName = nameParts.slice(1).join(" ") || "Sorte";

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: Number(amount.toFixed(2)),
          description: description || `Pedido ${orderId.slice(0, 8)} - Bolinha da Sorte`,
          payment_method_id: "pix",
          payer: {
            email: buyerEmail || "comprador@bolinhadasorte.com.br",
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: "CPF",
              number: cleanCpf.length === 11 ? cleanCpf : "12345678909",
            },
          },
          notification_url: `${appUrl}/api/webhooks/pix`,
          external_reference: orderId,
        }),
      });

      const mpData = await mpResponse.json();

      if (mpResponse.ok && mpData?.point_of_interaction?.transaction_data) {
        const txData = mpData.point_of_interaction.transaction_data;
        const copyPaste = txData.qr_code || "";
        let qrCodeBase64 = txData.qr_code_base64 || "";

        if (qrCodeBase64 && !qrCodeBase64.startsWith("data:image")) {
          qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
        } else if (!qrCodeBase64 && copyPaste) {
          qrCodeBase64 = await QRCode.toDataURL(copyPaste, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 340,
          });
        }

        return {
          qrCodeBase64,
          copyPaste,
          externalPaymentId: String(mpData.id),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
      } else {
        console.warn("Mercado Pago API returned non-OK, falling back to BCB EMV:", mpData);
      }
    } catch (mpErr) {
      console.warn("Mercado Pago request error, falling back to BCB EMV:", mpErr);
    }
  }

  // 2. Tentar integração com Asaas se configurado
  if (accessToken && (provider === "ASAAS" || accessToken.startsWith("$aact_"))) {
    try {
      const asaasBase = process.env.PIX_ENV === "sandbox" ? "https://sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const asaasPaymentRes = await fetch(`${asaasBase}/payments`, {
        method: "POST",
        headers: {
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: "cus_000005725656", // ou cliente padrão
          billingType: "PIX",
          value: Number(amount.toFixed(2)),
          dueDate: dueDate.toISOString().split("T")[0],
          description: description || `Pedido ${orderId.slice(0, 8)} - Bolinha da Sorte`,
          externalReference: orderId,
        }),
      });

      const paymentData = await asaasPaymentRes.json();
      if (asaasPaymentRes.ok && paymentData.id) {
        const qrRes = await fetch(`${asaasBase}/payments/${paymentData.id}/pixQrCode`, {
          headers: { "access_token": accessToken },
        });
        const qrData = await qrRes.json();

        if (qrRes.ok && qrData.payload) {
          const qrCodeBase64 = qrData.encodedImage
            ? (qrData.encodedImage.startsWith("data:") ? qrData.encodedImage : `data:image/png;base64,${qrData.encodedImage}`)
            : await QRCode.toDataURL(qrData.payload);

          return {
            qrCodeBase64,
            copyPaste: qrData.payload,
            externalPaymentId: paymentData.id,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          };
        }
      }
    } catch (asaasErr) {
      console.warn("Asaas request error, falling back to BCB EMV:", asaasErr);
    }
  }

  // 3. Fallback Padrão: Geração Direta EMV BCB autêntica com a chave/link configurada no /admin
  return generatePixData(
    amount,
    orderId,
    pixConfig.receiverKey,
    pixConfig.merchantName,
    pixConfig.merchantCity
  );
}

/**
 * Handles incoming Pix Webhooks for Mercado Pago, Asaas and direct confirmation.
 */
export async function handlePixWebhookNotification(request: Request) {
  try {
    const url = new URL(request.url);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();

    // 1. Identificar ID do pagamento externo ou ID do pedido
    let externalPaymentId = body?.data?.id || body?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
    let targetOrderId = body?.orderId || body?.externalReference || body?.payment?.externalReference;
    let isApproved = body?.status === "PAID" || body?.status === "approved" || body?.event === "PAYMENT_RECEIVED" || body?.event === "PAYMENT_CONFIRMED";

    // 2. Se for notificação do Mercado Pago com paymentId, consultar API para conferir status real
    if (externalPaymentId && accessToken && !isApproved) {
      try {
        const mpCheckRes = await fetch(`https://api.mercadopago.com/v1/payments/${externalPaymentId}`, {
          headers: { "Authorization": `Bearer ${accessToken}` },
        });
        if (mpCheckRes.ok) {
          const mpData = await mpCheckRes.json();
          if (mpData.status === "approved") {
            isApproved = true;
            if (mpData.external_reference) {
              targetOrderId = mpData.external_reference;
            }
          }
        }
      } catch (checkErr) {
        console.error("Error checking Mercado Pago payment status:", checkErr);
      }
    }

    // 3. Buscar o pedido correspondente no banco de dados
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(targetOrderId ? [{ id: targetOrderId }] : []),
          ...(externalPaymentId ? [{ externalPaymentId: String(externalPaymentId) }] : []),
        ],
      },
      include: {
        user: true,
        campaign: true,
        tickets: true,
      },
    });

    if (!order) {
      // Retorna 200 para webhooks de terceiros (como Mercado Pago) não ficarem reenviando
      return { status: 200, json: { message: "Notificação recebida, pedido não localizado.", received: true } };
    }

    // Idempotência: Se já estiver pago, retornar sucesso
    if (order.paymentStatus === "PAID" && order.tickets.length > 0) {
      return {
        status: 200,
        json: {
          success: true,
          message: "Pedido já homologado e pago anteriormente.",
          orderId: order.id,
          ticketsCount: order.tickets.length,
        },
      };
    }

    // Se o pagamento foi aprovado pelo banco / gateway
    if (isApproved || body?.status === "PAID") {
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar status do pedido para PAID
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
        });

        // Buscar último número de bilhete emitido para esta campanha
        const lastTicket = await tx.ticket.findFirst({
          where: { campaignId: order.campaignId },
          orderBy: { ticketNumber: "desc" },
        });

        let nextNumber = lastTicket ? parseInt(lastTicket.ticketNumber, 10) + 1 : 30600;

        // Cotas premiadas ativas
        const availableInstantPrizes = await tx.instantPrize.findMany({
          where: {
            campaignId: order.campaignId,
            isClaimed: false,
          },
        });

        const instantPrizesMap = new Map(
          availableInstantPrizes.map((ip) => [ip.ticketNumber, ip])
        );

        const generatedTickets = [];
        const hitInstantPrizes = [];

        for (let i = 0; i < order.quantity; i++) {
          const ticketNumStr = nextNumber.toString().padStart(7, "0");
          nextNumber++;

          const instantPrize = instantPrizesMap.get(ticketNumStr);
          const isInstant = !!instantPrize;
          const prizeValue = instantPrize ? instantPrize.prizeValue : null;

          if (instantPrize) {
            hitInstantPrizes.push(instantPrize);
            await tx.instantPrize.update({
              where: { id: instantPrize.id },
              data: {
                isClaimed: true,
                claimedByName: order.user?.fullName || "Comprador",
                claimedAt: new Date(),
              },
            });
          }

          generatedTickets.push({
            campaignId: order.campaignId,
            orderId: order.id,
            userId: order.userId,
            ticketNumber: ticketNumStr,
            isInstantPrize: isInstant,
            instantPrizeValue: prizeValue,
          });
        }

        await tx.ticket.createMany({
          data: generatedTickets,
        });

        return {
          order: updatedOrder,
          ticketsCreated: generatedTickets.length,
          instantPrizesWon: hitInstantPrizes,
        };
      });

      return {
        status: 200,
        json: {
          success: true,
          message: "Pagamento Pix homologado e bilhetes emitidos com sucesso!",
          orderId: order.id,
          ticketsCreated: result.ticketsCreated,
          instantPrizesWon: result.instantPrizesWon,
        },
      };
    }

    return {
      status: 200,
      json: { message: "Status recebido sem alteração.", received: true },
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { status: 500, json: { error: "Erro interno no processamento do webhook." } };
  }
}
