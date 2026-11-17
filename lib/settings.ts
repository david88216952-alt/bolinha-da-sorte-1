import prisma from "@/lib/prisma";

export interface PixConfig {
  receiverType: "KEY" | "LINK";
  receiverKey: string;
  merchantName: string;
  merchantCity: string;
}

export const DEFAULT_PIX_CONFIG: PixConfig = {
  receiverType: "KEY",
  receiverKey: "+5575991638134",
  merchantName: "BOLINHA DA SORTE OFICIAL",
  merchantCity: "SAO PAULO",
};

export async function getPixConfig(): Promise<PixConfig> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["pix_receiver_type", "pix_receiver_key", "pix_merchant_name", "pix_merchant_city"],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      receiverType: (map.get("pix_receiver_type") as "KEY" | "LINK") || DEFAULT_PIX_CONFIG.receiverType,
      receiverKey: map.get("pix_receiver_key") || DEFAULT_PIX_CONFIG.receiverKey,
      merchantName: map.get("pix_merchant_name") || DEFAULT_PIX_CONFIG.merchantName,
      merchantCity: map.get("pix_merchant_city") || DEFAULT_PIX_CONFIG.merchantCity,
    };
  } catch (err) {
    console.error("Error reading pix config:", err);
    return DEFAULT_PIX_CONFIG;
  }
}

export async function savePixConfig(config: Partial<PixConfig>) {
  const operations = [];

  if (config.receiverType !== undefined) {
    operations.push(
      prisma.systemSetting.upsert({
        where: { key: "pix_receiver_type" },
        update: { value: config.receiverType },
        create: { key: "pix_receiver_type", value: config.receiverType },
      })
    );
  }

  if (config.receiverKey !== undefined) {
    operations.push(
      prisma.systemSetting.upsert({
        where: { key: "pix_receiver_key" },
        update: { value: config.receiverKey.trim() },
        create: { key: "pix_receiver_key", value: config.receiverKey.trim() },
      })
    );
  }

  if (config.merchantName !== undefined) {
    operations.push(
      prisma.systemSetting.upsert({
        where: { key: "pix_merchant_name" },
        update: { value: config.merchantName.trim() },
        create: { key: "pix_merchant_name", value: config.merchantName.trim() },
      })
    );
  }

  if (config.merchantCity !== undefined) {
    operations.push(
      prisma.systemSetting.upsert({
        where: { key: "pix_merchant_city" },
        update: { value: config.merchantCity.trim() },
        create: { key: "pix_merchant_city", value: config.merchantCity.trim() },
      })
    );
  }

  await prisma.$transaction(operations);
  return getPixConfig();
}
