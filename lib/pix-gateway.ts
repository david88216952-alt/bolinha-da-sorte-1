import prisma from "./prisma";
import QRCode from "qrcode";
import { getPixConfig } from "./settings";

export interface CreatePixOptions {
  orderId: string;
  amount: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerCpf?: string;
  buyerPhone?: string;
  description?: string;
  baseUrl?: string;
}

export interface PixPayload {
  qrCodeBase64: string;
  copyPaste: string;
  externalPaymentId: string;
  expiresAt: Date;
}

/**
 * Retorna a URL base do site para configurar os webhooks de notificação do gateway
 */
export function getAppBaseUrl(customUrl?: string): string {
  const url = (
    customUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://bolinhadasorte.com.br"
  ).replace(/\/$/, "");
  return url;
}

/**
 * Cria a cobrança Pix real DIRETAMENTE na API oficial do Mercado Pago (POST https://api.mercadopago.com/v1/payments)
 * utilizando o PIX_ACCESS_TOKEN do .env e salvando o externalPaymentId.
 * Sem geração estática local no checkout.
 */
export async function createPixCharge(options: CreatePixOptions): Promise<PixPayload> {
  const { orderId, amount, buyerName, buyerEmail, buyerCpf, description, baseUrl } = options;
  const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();
  const appUrl = getAppBaseUrl(baseUrl);
  const webhookUrl = `${appUrl}/api/webhooks/pix`;

  if (!accessToken) {
    throw new Error(
      "PIX_ACCESS_TOKEN não está configurado no arquivo .env. Configure o seu Access Token de produção do Mercado Pago para gerar a cobrança Pix real."
    );
  }

  const cleanCpf = (buyerCpf || "12345678909").replace(/\D/g, "");
  const nameParts = (buyerName || "Comprador Bolinha").trim().split(" ");
  const firstName = nameParts[0] || "Comprador";
  const lastName = nameParts.slice(1).join(" ") || "Sorte";

  const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
      notification_url: webhookUrl,
      external_reference: orderId,
    }),
  });

  const mpData = await mpResponse.json();

  if (!mpResponse.ok || !mpData?.point_of_interaction?.transaction_data) {
    const errorMsg =
      mpData?.message ||
      mpData?.error ||
      (mpData?.cause && mpData.cause[0]?.description) ||
      "Falha ao gerar cobrança Pix no Mercado Pago.";
    console.error("Erro Mercado Pago API:", mpData);
    throw new Error(errorMsg);
  }

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
}

/**
 * Consulta a API oficial do Mercado Pago (GET https://api.mercadopago.com/v1/payments/{externalPaymentId})
 * Retorna true APENAS quando o status retornado pelo banco for 'approved'.
 */
export async function checkGatewayPaymentStatus(externalPaymentId: string): Promise<boolean> {
  const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();
  if (!accessToken || !externalPaymentId) {
    return false;
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data.status === "approved";
    }
  } catch (err) {
    console.error("Erro ao consultar status no Mercado Pago:", err);
  }

  return false;
}

/**
 * Processa a baixa atômica de um pedido pago:
 * Atualiza o status para 'PAID', gera os bilhetes sequenciais de 4 dígitos (0000 a 9999) na tabela tickets
 * e atribui cotas premiadas caso acertadas.
 */
export async function processPaidOrder(orderId: string, externalPaymentId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      campaign: true,
      tickets: true,
    },
  });

  if (!order) {
    throw new Error(`Pedido ${orderId} não encontrado.`);
  }

  // Idempotência: Se já estiver pago com bilhetes criados, retornar sucesso imediato
  if (order.paymentStatus === "PAID" && order.tickets.length > 0) {
    return {
      order,
      alreadyPaid: true,
      ticketsCreated: order.tickets.length,
      instantPrizesWon: [],
    };
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Atualizar status do pedido para PAID
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        ...(externalPaymentId ? { externalPaymentId } : {}),
      },
    });

    // Se já havia bilhetes criados anteriormente (ex: retry)
    if (order.tickets.length > 0) {
      return {
        order: { ...updatedOrder, tickets: order.tickets },
        ticketsCreated: order.tickets.length,
        instantPrizesWon: [],
      };
    }

    // 2. Buscar todos os bilhetes já emitidos para esta campanha para garantir unicidade absoluta (0000 a 9999)
    const existingTickets = await tx.ticket.findMany({
      where: { campaignId: order.campaignId },
      select: { ticketNumber: true },
    });

    const usedNumbers = new Set(existingTickets.map((t) => t.ticketNumber));
    const maxCapacity = Math.min(10000, order.campaign?.totalTickets || 10000);

    // 3. Buscar cotas premiadas ativas desta campanha para checagem imediata
    const availableInstantPrizes = await tx.instantPrize.findMany({
      where: {
        campaignId: order.campaignId,
        isClaimed: false,
      },
    });

    const instantPrizesMap = new Map(
      availableInstantPrizes.map((ip) => [ip.ticketNumber, ip])
    );

    // 4. Selecionar sequencialmente bilhetes livres no padrão estrito de 4 dígitos (0000 a 9999)
    const ticketsToCreate: Array<{
      orderId: string;
      campaignId: string;
      userId: string;
      ticketNumber: string;
      isInstantPrize: boolean;
      instantPrizeValue: number | null;
    }> = [];

    const prizesClaimed: Array<{
      id: string;
      ticketNumber: string;
      prizeValue: number;
    }> = [];

    let currentCandidate = 0;
    while (ticketsToCreate.length < order.quantity && currentCandidate < maxCapacity) {
      const formattedNumber = String(currentCandidate).padStart(4, "0");
      if (!usedNumbers.has(formattedNumber)) {
        usedNumbers.add(formattedNumber);

        // Checar se o bilhete é uma cota premiada
        const instantPrize = instantPrizesMap.get(formattedNumber);
        const isWinner = !!instantPrize;

        ticketsToCreate.push({
          orderId: order.id,
          campaignId: order.campaignId,
          userId: order.userId,
          ticketNumber: formattedNumber,
          isInstantPrize: isWinner,
          instantPrizeValue: isWinner ? instantPrize.prizeValue : null,
        });

        if (isWinner && instantPrize) {
          prizesClaimed.push({
            id: instantPrize.id,
            ticketNumber: formattedNumber,
            prizeValue: instantPrize.prizeValue,
          });
        }
      }
      currentCandidate++;
    }

    if (ticketsToCreate.length < order.quantity) {
      throw new Error(
        `Capacidade esgotada: restam apenas ${ticketsToCreate.length} bilhetes disponíveis nesta campanha (capacidade de 10.000 cotas).`
      );
    }

    // 5. Inserir bilhetes em lote
    await tx.ticket.createMany({
      data: ticketsToCreate,
    });

    // 6. Atualizar cotas premiadas achadas
    for (const prize of prizesClaimed) {
      await tx.instantPrize.update({
        where: { id: prize.id },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
          claimedByName: order.user?.fullName || "Ganhador Instantâneo",
        },
      });
    }

    const finalOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: {
        tickets: {
          orderBy: { ticketNumber: "asc" },
        },
        campaign: true,
        user: true,
      },
    });

    return {
      order: finalOrder,
      alreadyPaid: false,
      ticketsCreated: ticketsToCreate.length,
      instantPrizesWon: prizesClaimed,
    };
  });
}

/**
 * Processa Webhook oficial do Mercado Pago (/api/webhooks/pix)
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

    let externalPaymentId =
      body?.data?.id ||
      body?.id ||
      body?.payment?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    let targetOrderId =
      body?.orderId ||
      body?.externalReference ||
      body?.payment?.externalReference ||
      body?.external_reference;

    let isApproved =
      body?.status === "approved" ||
      body?.status === "PAID" ||
      body?.event === "PAYMENT_RECEIVED";

    // Validar status real na API oficial do Mercado Pago
    if (externalPaymentId && accessToken && !isApproved) {
      try {
        const mpCheckRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${externalPaymentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );
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
        console.error("Erro ao validar pagamento no Mercado Pago via Webhook:", checkErr);
      }
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(targetOrderId ? [{ id: targetOrderId }] : []),
          ...(externalPaymentId ? [{ externalPaymentId: String(externalPaymentId) }] : []),
        ],
      },
    });

    if (!order) {
      return { status: 200, json: { received: true, note: "Pedido não localizado" } };
    }

    if (order.paymentStatus === "PAID") {
      return { status: 200, json: { received: true, note: "Pedido já estava pago" } };
    }

    if (isApproved) {
      const result = await processPaidOrder(order.id, externalPaymentId ? String(externalPaymentId) : undefined);
      return {
        status: 200,
        json: {
          success: true,
          orderId: order.id,
          ticketsCreated: result.ticketsCreated,
        },
      };
    }

    return { status: 200, json: { received: true, status: "PENDING" } };
  } catch (err: any) {
    console.error("Erro no processamento do webhook Pix:", err);
    return { status: 200, json: { error: err.message } };
  }
}
