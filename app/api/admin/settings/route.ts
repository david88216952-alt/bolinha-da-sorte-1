import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPixConfig, savePixConfig } from "@/lib/settings";
import { generatePixData } from "@/lib/pix";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const config = await getPixConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Erro ao carregar configurações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const { receiverType, receiverKey, merchantName, merchantCity } = body;

    if (!receiverKey || !receiverKey.trim()) {
      return NextResponse.json(
        { error: "Informe a Chave Pix ou Link de Pagamento recebedor." },
        { status: 400 }
      );
    }

    const updated = await savePixConfig({
      receiverType: receiverType === "LINK" ? "LINK" : "KEY",
      receiverKey: receiverKey.trim(),
      merchantName: (merchantName || "BOLINHA DA SORTE OFICIAL").trim(),
      merchantCity: (merchantCity || "SAO PAULO").trim(),
    });

    // Generate sample preview payload
    const preview = await generatePixData(
      10.0,
      "PREVIEW",
      updated.receiverKey,
      updated.merchantName,
      updated.merchantCity
    );

    return NextResponse.json({
      success: true,
      config: updated,
      preview: {
        copyPaste: preview.copyPaste,
        qrCodeBase64: preview.qrCodeBase64,
      },
    });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
