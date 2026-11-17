import { NextResponse } from "next/server";
import { handlePixWebhookNotification } from "@/lib/pix-gateway";

export async function POST(request: Request) {
  const result = await handlePixWebhookNotification(request);
  return NextResponse.json(result.json, { status: result.status });
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    gateway: "Bolinha da Sorte Pix Webhook v2.0",
    providers: ["MERCADO_PAGO", "ASAAS", "DIRECT_BCB"],
  });
}
