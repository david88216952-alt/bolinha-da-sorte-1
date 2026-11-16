import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpar tabelas existentes
  await prisma.winner.deleteMany();
  await prisma.instantPrize.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuários
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("cliente123", 10);

  const admin = await prisma.user.create({
    data: {
      fullName: "Carlos Eduardo Silveira",
      email: "admin@bolinhadasorte.com.br",
      cpf: "000.111.222-33",
      phone: "(11) 99876-5432",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const lucas = await prisma.user.create({
    data: {
      fullName: "Lucas Matheus Nogueira",
      email: "lucas@cliente.com.br",
      cpf: "123.456.789-00",
      phone: "(43) 99123-4567",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const ricardo = await prisma.user.create({
    data: {
      fullName: "Ricardo Silveira P.",
      email: "ricardo@cliente.com.br",
      cpf: "234.567.890-11",
      phone: "(11) 98111-2233",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const amanda = await prisma.user.create({
    data: {
      fullName: "Amanda Vasconcelos",
      email: "amanda@cliente.com.br",
      cpf: "345.678.901-22",
      phone: "(21) 97222-3344",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const felipe = await prisma.user.create({
    data: {
      fullName: "Felipe Augusto D.",
      email: "felipe@cliente.com.br",
      cpf: "456.789.012-33",
      phone: "(31) 99333-4455",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const marcos = await prisma.user.create({
    data: {
      fullName: "Marcos Vinicius S.",
      email: "marcos@cliente.com.br",
      cpf: "567.890.123-44",
      phone: "(43) 98444-5566",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const juliana = await prisma.user.create({
    data: {
      fullName: "Juliana C. Vasques",
      email: "juliana@cliente.com.br",
      cpf: "678.901.234-55",
      phone: "(61) 99555-6677",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  console.log("Usuários criados!");

  // 2. Campanhas Ativas
  // Campanha 1: Destaque Hero (#1 maior prizeValue ativo)
  const heroPackages = JSON.stringify([
    { qty: 30, price: 1.8, label: "+30 cotas" },
    { qty: 50, price: 3.0, label: "+50 cotas" },
    { qty: 100, price: 6.0, label: "+100 cotas", popular: true },
    { qty: 2000, price: 120.0, label: "+2.000 cotas", bonus: "4x Mais Chances" },
  ]);

  const fordF4000 = await prisma.campaign.create({
    data: {
      title: "CAMINHÃO FORD F4000 CUSTOMIZADO",
      subtitle: "Participe Agora!",
      description:
        "Caminhão Ford F-4000 Customizado completo + Tanque Cheio + R$ 50.000 no Pix, ou opte por receber R$ 500.000,00 limpos e livres de impostos diretamente na sua conta bancária via Pix. Veículo entregue na porta da sua casa em qualquer lugar do Brasil com frete grátis e documentação 100% paga! Sorteio auditado e baseado na extração oficial da Loteria Federal.",
      prizeValue: 500000.0, // Maior valor ativo = Hero Card na Home!
      ticketPrice: 0.06,
      totalTickets: 1000000,
      promoPackages: heroPackages,
      promoBannerText:
        "4x MAIS CHANCES! Reserve acima de 2.000 números e ganhe 4x mais chances no Caminhão F4000!",
      drawDate: new Date("2026-12-20T19:30:00Z"),
      status: "ACTIVE",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCuFVDGr3YTq25cCdFYbo5YYUbzUoRAcBIg5_XpD5iN_0mbIvW6rwvo_pDxamJVl1APimlBbS009DV1mVLCNIlBrOQvgQlkhbS-g8XW1Zf9V6M1mughHgPuwfY4PtRzm6gEIOVY6zJNhXgq80L_3j3AH1YuY3OKsfCHGCzkL9GsuvEVu3DJ3AMjjZwpAqgQqaosn2EBJEmy72JhQ0cqRdzWEBn7RGxatYikxb1G_iIf",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCuFVDGr3YTq25cCdFYbo5YYUbzUoRAcBIg5_XpD5iN_0mbIvW6rwvo_pDxamJVl1APimlBbS009DV1mVLCNIlBrOQvgQlkhbS-g8XW1Zf9V6M1mughHgPuwfY4PtRzm6gEIOVY6zJNhXgq80L_3j3AH1YuY3OKsfCHGCzkL9GsuvEVu3DJ3AMjjZwpAqgQqaosn2EBJEmy72JhQ0cqRdzWEBn7RGxatYikxb1G_iIf",
      ]),
    },
  });

  // Cotas Premiadas (Instant Prizes) da Campanha Ford F4000
  await prisma.instantPrize.createMany({
    data: [
      {
        campaignId: fordF4000.id,
        ticketNumber: "018422",
        prizeValue: 10000.0,
        isClaimed: false,
      },
      {
        campaignId: fordF4000.id,
        ticketNumber: "049210",
        prizeValue: 5000.0,
        isClaimed: true,
        claimedByName: "Carlos Eduardo M.",
        claimedAt: new Date("2026-11-10T14:20:00Z"),
      },
      {
        campaignId: fordF4000.id,
        ticketNumber: "088194",
        prizeValue: 10000.0,
        isClaimed: false,
      },
      {
        campaignId: fordF4000.id,
        ticketNumber: "124091",
        prizeValue: 2500.0,
        isClaimed: true,
        claimedByName: "Renata F. Silva",
        claimedAt: new Date("2026-11-11T16:45:00Z"),
      },
      {
        campaignId: fordF4000.id,
        ticketNumber: "201994",
        prizeValue: 10000.0,
        isClaimed: false,
      },
    ],
  });

  // Campanha 2: Toyota Hilux GR-Sport
  const hilux = await prisma.campaign.create({
    data: {
      title: "Toyota Hilux GR-Sport 4x4 2026 Turbo Diesel 0km",
      subtitle: "Adquira já!",
      description:
        "A picape mais cobiçada do Brasil com pacote esportivo GR completo, tração 4x4, interior em couro com costuras vermelhas ou R$ 380.000,00 no PIX!",
      prizeValue: 380000.0,
      ticketPrice: 0.06,
      totalTickets: 1000000,
      promoPackages: heroPackages,
      promoBannerText: "Super combo: Leve 100 cotas e concorra a R$ 380 mil no Pix!",
      drawDate: new Date("2026-12-15T19:00:00Z"),
      status: "ACTIVE",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAtiYtuSJ7VgMAPqdcbgNcJWRLttwqLNRikloMl-Iwls36a-FQwJ03WwGLDqipafPC0EVK0MYreom2GpavqV-JDNLWbk3DmfMKgD5U1hDs2BWbsl8RyayJd1pWi7xG4rBQuyf3irQXi_gT8qfZYKGO04itJmnn3DRQlFkCBHSzpvapbQabPsA55LDzLGKNvrl61g0OvFhZ4P8UGq8nEnAqFbG1VMVw33yZSLeTgTe1i",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAtiYtuSJ7VgMAPqdcbgNcJWRLttwqLNRikloMl-Iwls36a-FQwJ03WwGLDqipafPC0EVK0MYreom2GpavqV-JDNLWbk3DmfMKgD5U1hDs2BWbsl8RyayJd1pWi7xG4rBQuyf3irQXi_gT8qfZYKGO04itJmnn3DRQlFkCBHSzpvapbQabPsA55LDzLGKNvrl61g0OvFhZ4P8UGq8nEnAqFbG1VMVw33yZSLeTgTe1i",
      ]),
    },
  });

  // Campanha 3: BMW R 1250 GS Adventure
  const bmw = await prisma.campaign.create({
    data: {
      title: "BMW R 1250 GS Adventure Triple Black 0km + R$ 20.000 no PIX",
      subtitle: "Adquira já!",
      description:
        "A big trail definitiva com tanque de 30L, baús originais inclusos, quickshifter, painel TFT conectável e R$ 20.000,00 extras na conta!",
      prizeValue: 140000.0,
      ticketPrice: 0.05,
      totalTickets: 500000,
      promoPackages: heroPackages,
      promoBannerText: "Quase esgotado! Garanta suas cotas da BMW R 1250 GS!",
      drawDate: new Date("2026-11-30T19:00:00Z"),
      status: "ACTIVE",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBBObHk37iBoKUMWbxoABxOZ3vhuATLuzkXRHM_sRvX6o7-JxpwwulO3FFUOOzV1hXwUef7PTuIUV9tTfxsDzUyISv91JVL5Yvudd4-u8CCC-smvrMJxQZuvvDYCt-qDdHh8DKSDpQcIgP1TaO_NP375mNNiRqy2_e5ziV_6sa5tCyMeBAOjHPPwkV1z47BtzGfBbrG-UKITzebM9-tKcDv8TTk9tn35LAdtSO809Ev",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBBObHk37iBoKUMWbxoABxOZ3vhuATLuzkXRHM_sRvX6o7-JxpwwulO3FFUOOzV1hXwUef7PTuIUV9tTfxsDzUyISv91JVL5Yvudd4-u8CCC-smvrMJxQZuvvDYCt-qDdHh8DKSDpQcIgP1TaO_NP375mNNiRqy2_e5ziV_6sa5tCyMeBAOjHPPwkV1z47BtzGfBbrG-UKITzebM9-tKcDv8TTk9tn35LAdtSO809Ev",
      ]),
    },
  });

  // Campanha 4: Pix Premiado 50k
  const pixCamp = await prisma.campaign.create({
    data: {
      title: "Pix Premiado R$ 50.000,00 na Hora",
      subtitle: "Adquira já!",
      description:
        "Dinheiro livre de impostos transferido direto na sua chave Pix no momento do sorteio oficial!",
      prizeValue: 50000.0,
      ticketPrice: 0.02,
      totalTickets: 250000,
      promoPackages: heroPackages,
      promoBannerText: "Apenas R$ 0,02 a cota! O sorteio mais rápido do Brasil!",
      drawDate: new Date("2026-11-25T19:00:00Z"),
      status: "ACTIVE",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDIsEz-m1koq9mv0Rw88cg8D1Mme1sMhgQkU8DKoJR5kWeCqe81I4O8JztEDJSJ9jNbbrYla5zNwyAvp7lOspHLkHNBf0LgQSm9SSBGV0E-j8IKYy6e9fD7d8oYST9e2txmkp6a9r9XQMMkoVQs9zAPjXPRbVYOzxTwfT7NSRUHzzO6G1VjmqG9DEOlnyzom1JOlP-zR19WILtiDe3A7oyxyVRkwxqSXcmNBQYRzwMS",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDIsEz-m1koq9mv0Rw88cg8D1Mme1sMhgQkU8DKoJR5kWeCqe81I4O8JztEDJSJ9jNbbrYla5zNwyAvp7lOspHLkHNBf0LgQSm9SSBGV0E-j8IKYy6e9fD7d8oYST9e2txmkp6a9r9XQMMkoVQs9zAPjXPRbVYOzxTwfT7NSRUHzzO6G1VjmqG9DEOlnyzom1JOlP-zR19WILtiDe3A7oyxyVRkwxqSXcmNBQYRzwMS",
      ]),
    },
  });

  // 3. Campanhas Concluídas
  const corvette = await prisma.campaign.create({
    data: {
      title: "Chevrolet Corvette Stingray Coupe V8",
      subtitle: "Concluído",
      description:
        "Superesportivo americano V8 de 495 cavalos, vermelho tocha com interior em couro esportivo.",
      prizeValue: 850000.0,
      ticketPrice: 0.08,
      totalTickets: 1000000,
      promoPackages: heroPackages,
      drawDate: new Date("2026-03-15T19:00:00Z"),
      status: "COMPLETED",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBqZNUMOm3DoIWwSXG4FfwOHHSSAPm11RyG_UofkVysjUt7rFv-WuyAETfC4XIQaX-Hc1r0XqYkxVPK-PqvvPtYVxwXpJO0XSvjxcr924Zq0gxAtCjy6aw9RRD-dLHTle-wLqOSI8rWQBLvkeREYVrWJgsI5JUXoXoO2_epPNdNPlzRSRd0xYFnwyJ8Wt-QEcCo4_zXn9Kyv0RkonHsx7mhg5xp1hA_S8S3nVE0cQCe",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBqZNUMOm3DoIWwSXG4FfwOHHSSAPm11RyG_UofkVysjUt7rFv-WuyAETfC4XIQaX-Hc1r0XqYkxVPK-PqvvPtYVxwXpJO0XSvjxcr924Zq0gxAtCjy6aw9RRD-dLHTle-wLqOSI8rWQBLvkeREYVrWJgsI5JUXoXoO2_epPNdNPlzRSRd0xYFnwyJ8Wt-QEcCo4_zXn9Kyv0RkonHsx7mhg5xp1hA_S8S3nVE0cQCe",
      ]),
    },
  });

  const iphone = await prisma.campaign.create({
    data: {
      title: "Lote de 5x iPhone 16 Pro Max 512GB",
      subtitle: "Concluído",
      description:
        "5 aparelhos Apple iPhone 16 Pro Max 512GB lacrados em titânio natural com nota fiscal e garantia oficial Apple.",
      prizeValue: 60000.0,
      ticketPrice: 0.03,
      totalTickets: 300000,
      promoPackages: heroPackages,
      drawDate: new Date("2026-03-10T19:00:00Z"),
      status: "COMPLETED",
      coverImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD_IwjhjXQWAVPS20styvPbHyS0r8Eyi5RyR7gDNJHm9go4V47zEQxnmanFttxFywxDj05MrnUrzHV6mJDn4bzx07mnpPKmDU7Zfjj_oPkIUBXecXtn2Lcu5fX-zHjMBgUfmzpoGFnxgSRHgd36sMVh0STrhMJoEGJQtshkwnOPlJIDOQutvdcI9i22HUAAAhJXfEB8iHbsdjX_4YFSszw15FqzVJ5tCiNs232v8XrU",
      galleryImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD_IwjhjXQWAVPS20styvPbHyS0r8Eyi5RyR7gDNJHm9go4V47zEQxnmanFttxFywxDj05MrnUrzHV6mJDn4bzx07mnpPKmDU7Zfjj_oPkIUBXecXtn2Lcu5fX-zHjMBgUfmzpoGFnxgSRHgd36sMVh0STrhMJoEGJQtshkwnOPlJIDOQutvdcI9i22HUAAAhJXfEB8iHbsdjX_4YFSszw15FqzVJ5tCiNs232v8XrU",
      ]),
    },
  });

  // 4. Registrar Ganhadores Oficiais
  await prisma.winner.create({
    data: {
      campaignId: corvette.id,
      userId: marcos.id,
      winningTicketNumber: "0048912",
      winnerPhotoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCbrM-QMhxrHA6cRY-NwboPbpdt6fjANVzcv1GiZROkpACFnH3ICwA6LXuJGeD5jtQlue3HjzoMNWistwFqmM4SjFD0Cjn71BQ6XxMr0z_3VhzDVQDTiQRCmYZ2CoSIgvRXFyNWXPQ87BF9iuEbS9Zk-ng0vDJsg9-zeQxWCk-O7YbGm-9xMLY1LrW2RG0V_J_LsngKPY96JUs1yEBnsqEk0jU8eTz-JinAbI6roLvS",
      awardedAt: new Date("2026-03-15T20:00:00Z"),
    },
  });

  await prisma.winner.create({
    data: {
      campaignId: iphone.id,
      userId: juliana.id,
      winningTicketNumber: "0030627",
      winnerPhotoUrl: null, // Testar fallback para ícone/avatar de troféu para evitar imagem quebrada!
      awardedAt: new Date("2026-03-10T20:00:00Z"),
    },
  });

  // 5. Criar Pedidos e Bilhetes para o Ranking e Minhas Compras
  // Ricardo (1º Lugar - 24.500 cotas = R$ 1.470,00)
  const orderRicardo = await prisma.order.create({
    data: {
      userId: ricardo.id,
      campaignId: fordF4000.id,
      quantity: 24500,
      totalAmount: 1470.0,
      paymentStatus: "PAID",
      pixQrCode: "data:image/png;base64,mock",
      pixCopyPaste: "00020101021226580014br.gov.bcb.pix...",
      externalPaymentId: "PIX-RICARDO-001",
      paidAt: new Date("2026-11-10T10:00:00Z"),
      expiresAt: new Date("2026-11-10T10:15:00Z"),
    },
  });

  // Amanda (2º Lugar - 18.200 cotas = R$ 1.092,00)
  const orderAmanda = await prisma.order.create({
    data: {
      userId: amanda.id,
      campaignId: fordF4000.id,
      quantity: 18200,
      totalAmount: 1092.0,
      paymentStatus: "PAID",
      pixQrCode: "data:image/png;base64,mock",
      pixCopyPaste: "00020101021226580014br.gov.bcb.pix...",
      externalPaymentId: "PIX-AMANDA-001",
      paidAt: new Date("2026-11-11T11:00:00Z"),
      expiresAt: new Date("2026-11-11T11:15:00Z"),
    },
  });

  // Felipe (3º Lugar - 12.000 cotas = R$ 720,00)
  const orderFelipe = await prisma.order.create({
    data: {
      userId: felipe.id,
      campaignId: fordF4000.id,
      quantity: 12000,
      totalAmount: 720.0,
      paymentStatus: "PAID",
      pixQrCode: "data:image/png;base64,mock",
      pixCopyPaste: "00020101021226580014br.gov.bcb.pix...",
      externalPaymentId: "PIX-FELIPE-001",
      paidAt: new Date("2026-11-11T15:00:00Z"),
      expiresAt: new Date("2026-11-11T15:15:00Z"),
    },
  });

  // Lucas (Comprador de Teste - 100 cotas pagas no F4000)
  const orderLucas1 = await prisma.order.create({
    data: {
      userId: lucas.id,
      campaignId: fordF4000.id,
      quantity: 100,
      totalAmount: 6.0,
      paymentStatus: "PAID",
      pixQrCode: "data:image/png;base64,mock",
      pixCopyPaste: "00020101021226580014br.gov.bcb.pix...",
      externalPaymentId: "PIX-LUCAS-001",
      paidAt: new Date("2026-11-12T09:00:00Z"),
      expiresAt: new Date("2026-11-12T09:15:00Z"),
    },
  });

  // Gerar alguns bilhetes de teste para o Lucas
  for (let i = 1; i <= 10; i++) {
    await prisma.ticket.create({
      data: {
        campaignId: fordF4000.id,
        orderId: orderLucas1.id,
        userId: lucas.id,
        ticketNumber: (30600 + i).toString().padStart(7, "0"),
        isInstantPrize: i === 5,
        instantPrizeValue: i === 5 ? 500.0 : null,
      },
    });
  }

  // Lucas (Pedido pendente na Hilux para testar o modal Pix em Minhas Compras)
  await prisma.order.create({
    data: {
      userId: lucas.id,
      campaignId: hilux.id,
      quantity: 50,
      totalAmount: 3.0,
      paymentStatus: "PENDING",
      pixQrCode: "data:image/png;base64,mock",
      pixCopyPaste: "00020101021226580014br.gov.bcb.pix...",
      externalPaymentId: "PIX-LUCAS-PENDING",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  console.log("Banco de dados populado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
