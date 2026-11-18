import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { generatePixData, PixPayload } from "./pix";
import { getPixConfig } from "./settings";
import { OFFICIAL_PIX_KEY } from "./pix-emv";

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

/**
 * Retorna a URL base do sistema para configuração de Webhooks
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
 * Cria uma cobrança Pix real em um gateway oficial (Mercado Pago ou Asaas)
 * ou gera o BR Code EMV autêntico do Banco Central com a chave oficial +5575991638134.
 */
export async function createPixCharge(options: CreatePixOptions): Promise<PixPayload> {
  const { orderId, amount, buyerName, buyerEmail, buyerCpf, description, baseUrl } = options;
  const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();
  const provider = (process.env.PIX_PROVIDER || "").toUpperCase();
  const pixConfig = await getPixConfig();
  const appUrl = getAppBaseUrl(baseUrl);
  const webhookUrl = `${appUrl}/api/webhooks/pix`;

  // 1. Tentar integração com Mercado Pago se o token estiver configurado
  const isMercadoPago =
    accessToken &&
    (provider === "MERCADO_PAGO" ||
      accessToken.startsWith("APP_USR-") ||
      accessToken.startsWith("TEST-") ||
      (!provider && !accessToken.startsWith("$aact_")));

  if (isMercadoPago) {
    try {
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
        console.warn("Mercado Pago retornou erro, acionando fallback EMV:", mpData);
      }
    } catch (mpErr) {
      console.warn("Erro ao conectar ao Mercado Pago, acionando fallback EMV:", mpErr);
    }
  }

  // 2. Tentar integração com Asaas se configurado
  const isAsaas =
    accessToken &&
    (provider === "ASAAS" || accessToken.startsWith("$aact_"));

  if (isAsaas) {
    try {
      const asaasBase =
        process.env.PIX_ENV === "sandbox"
          ? "https://sandbox.asaas.com/v3"
          : "https://api.asaas.com/v3";
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      // Criar cobrança no Asaas
      const asaasPaymentRes = await fetch(`${asaasBase}/payments`, {
        method: "POST",
        headers: {
          access_token: accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: "cus_000005725656", // ID do cliente ou padrão
          billingType: "PIX",
          value: Number(amount.toFixed(2)),
          dueDate: dueDate.toISOString().split("T")[0],
          description: description || `Pedido ${orderId.slice(0, 8)} - Bolinha da Sorte`,
          externalReference: orderId,
          postalService: false,
        }),
      });

      const paymentData = await asaasPaymentRes.json();
      if (asaasPaymentRes.ok && paymentData.id) {
        const qrRes = await fetch(`${asaasBase}/payments/${paymentData.id}/pixQrCode`, {
          headers: { access_token: accessToken },
        });
        const qrData = await qrRes.json();

        if (qrRes.ok && qrData.payload) {
          const qrCodeBase64 = qrData.encodedImage
            ? qrData.encodedImage.startsWith("data:")
              ? qrData.encodedImage
              : `data:image/png;base64,${qrData.encodedImage}`
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
      console.warn("Erro ao conectar ao Asaas, acionando fallback EMV:", asaasErr);
    }
  }

  // 3. Fallback Padrão: Geração Direta BR Code EMV Banco Central com a chave oficial +5575991638134
  return generatePixData(
    amount,
    orderId,
    pixConfig.receiverKey || OFFICIAL_PIX_KEY,
    pixConfig.merchantName,
    pixConfig.merchantCity
  );
}

/**
 * Consulta a API oficial do Gateway de Pagamento para verificar se a cobrança foi aprovada.
 */
export async function checkGatewayPaymentStatus(externalPaymentId: string): Promise<boolean> {
  const accessToken = (process.env.PIX_ACCESS_TOKEN || "").trim();
  if (!externalPaymentId || !accessToken) return false;

  const provider = (process.env.PIX_PROVIDER || "").toUpperCase();
  const isMercadoPago =
    provider === "MERCADO_PAGO" ||
    accessToken.startsWith("APP_USR-") ||
    accessToken.startsWith("TEST-") ||
    (!provider && !accessToken.startsWith("$aact_"));

  if (isMercadoPago) {
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalPaymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.status === "approved";
      }
    } catch (err) {
      console.error("Erro ao consultar Mercado Pago:", err);
    }
  }

  const isAsaas = provider === "ASAAS" || accessToken.startsWith("$aact_");
  if (isAsaas) {
    try {
      const asaasBase =
        process.env.PIX_ENV === "sandbox"
          ? "https://sandbox.asaas.com/v3"
          : "https://api.asaas.com/v3";
      const res = await fetch(`${asaasBase}/payments/${externalPaymentId}`, {
        headers: { access_token: accessToken },
      });
      if (res.ok) {
        const data = await res.json();
        return data.status === "RECEIVED" || data.status === "CONFIRMED";
      }
    } catch (err) {
      console.error("Erro ao consultar Asaas:", err);
    }
  }

  return false;
}

/**
 * Processa a baixa atômica de um pedido pago:
 * Atualiza o status para 'PAID', gera os bilhetes sequenciais na tabela tickets
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

    const generatedTickets = [];
    const hitInstantPrizes = [];

    // Gerar números de 4 dígitos (0000 a 9999) sequenciais sem duplicidade
    let currentCandidate = 0;

    for (let i = 0; i < order.quantity; i++) {
      while (
        currentCandidate < maxCapacity &&
        usedNumbers.has(currentCandidate.toString().padStart(4, "0"))
      ) {
        currentCandidate++;
      }

      if (currentCandidate >= maxCapacity) {
        // Capacidade máxima da campanha atingida (10.000 cotas)
        break;
      }

      const ticketNumStr = currentCandidate.toString().padStart(4, "0");
      usedNumbers.add(ticketNumStr);
      currentCandidate++;

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

    // 4. Criação em lote dos bilhetes
    if (generatedTickets.length > 0) {
      await tx.ticket.createMany({
        data: generatedTickets,
      });
    }

    // Buscar os bilhetes criados para compor o retorno
    const tickets = await tx.ticket.findMany({
      where: { orderId: order.id },
      orderBy: { ticketNumber: "asc" },
    });

    return {
      order: {
        ...updatedOrder,
        tickets,
      },
      ticketsCreated: generatedTickets.length,
      instantPrizesWon: hitInstantPrizes,
    };
  });
}

/**
 * Processa notificações de Webhooks para Mercado Pago, Asaas e confirmações diretas.
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
      body?.status === "PAID" ||
      body?.status === "approved" ||
      body?.event === "PAYMENT_RECEIVED" ||
      body?.event === "PAYMENT_CONFIRMED";

    // 2. Se for notificação do Mercado Pago com paymentId, validar status na API oficial
    if (externalPaymentId && accessToken && !isApproved) {
      try {
        const mpCheckRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${externalPaymentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
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
        console.error("Erro ao validar pagamento no Mercado Pago:", checkErr);
      }
    }

    // 3. Se for notificação do Asaas com paymentId, validar status na API oficial
    if (externalPaymentId && accessToken && !isApproved && (body?.event?.startsWith("PAYMENT_") || accessToken.startsWith("$aact_"))) {
      try {
        const asaasBase =
          process.env.PIX_ENV === "sandbox"
            ? "https://sandbox.asaas.com/v3"
            : "https://api.asaas.com/v3";
        const asaasCheckRes = await fetch(`${asaasBase}/payments/${externalPaymentId}`, {
          headers: { access_token: accessToken },
        });
        if (asaasCheckRes.ok) {
          const asaasData = await asaasCheckRes.json();
          if (asaasData.status === "RECEIVED" || asaasData.status === "CONFIRMED") {
            isApproved = true;
            if (asaasData.externalReference) {
              targetOrderId = asaasData.externalReference;
            }
          }
        }
      } catch (checkErr) {
        console.error("Erro ao validar pagamento no Asaas:", checkErr);
      }
    }

    // 4. Buscar o pedido correspondente no banco de dados
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(targetOrderId ? [{ id: targetOrderId }] : []),
          ...(externalPaymentId ? [{ externalPaymentId: String(externalPaymentId) }] : []),
        ],
      },
    });

    if (!order) {
      // Retorna 200 para webhooks de gateways de terceiros não ficarem reenviando em loop
      return {
        status: 200,
        json: {
          message: "Notificação recebida com sucesso, pedido não pendente ou já processado.",
          received: true,
        },
      };
    }

    // 5. Se o pagamento foi aprovado, executar baixa atômica
    if (isApproved || body?.status === "PAID") {
      const result = await processPaidOrder(order.id, externalPaymentId ? String(externalPaymentId) : undefined);

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
      json: { message: "Status recebido sem alteração de homologação.", received: true },
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { status: 500, json: { error: "Erro interno no processamento do webhook." } };
  }
}
