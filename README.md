# Bolinha da Sorte — Plataforma Oficial de Rifas e Sorteios

Plataforma full-stack completa e responsiva para venda de rifas online, cotas instantâneas e sorteios auditados pela Loteria Federal, reunindo em uma única base de código a **área pública dos compradores** e o **Centro de Comando Administrativo v2.0 (/admin)** com controle de acesso estrito.

---

## 🎯 Principais Recursos

### 🛒 Área Pública (Mobile-First)
- **Catálogo de Campanhas:** Destaque dinâmico para a rifa ativa de maior premiação e listagem dos sorteios disponíveis.
- **Checkout Pix Inteligente:** Seleção de cotas unitárias ou pacotes promocionais com cadastro obrigatório da Chave Pix do comprador (CPF, telefone, e-mail ou chave aleatória).
- **QR Code e Copia e Cola:** Geração instantânea de pagamento Pix com confirmação automática de cotas.
- **Meus Bilhetes:** Consulta simplificada das compras e números da sorte gerados.
- **Galeria de Ganhadores:** Histórico público com fotos, bilhetes sorteados e datas.
- **Modo Claro / Modo Escuro:** Alternador de tema no cabeçalho com persistência no navegador.

### 🛡️ Painel Administrativo (/admin — Centro de Comando v2.0)
- **Segurança e Proteção por Role:** Acesso exclusivo para administradores (`role === 'ADMIN'`). Usuários comuns são bloqueados com tela de aviso.
- **Visão Geral & Gráficos:** Cards de faturamento, cotas pagas, ticket médio e gráfico de evolução temporal (7 ou 30 dias).
- **Gerenciador de Campanhas:** Cadastro e edição em 2 colunas com upload de fotos de capa, galeria de imagens e pacotes dinâmicos (`+30`, `+50`, `+100`, `+2000`).
- **Pedidos & Pagamentos Pix:** Auditoria em tempo real, visualização de bilhetes e aprovação manual de pagamentos pendentes.
- **Clientes & Ranking:** Ranking VIP dos maiores compradores de cotas e base completa com link direto para WhatsApp.
- **Sorteios & Homologação:** Busca automática do comprador ao digitar o bilhete premiado, validação de status pago e registro oficial de ganhadores.
- **Interface Otimizada:** Sidebar retrátil com suporte a arraste e tabelas com suporte a rolagem horizontal por arraste de mouse (`drag-to-scroll`).

---

## 🚀 Tecnologias Utilizadas

- **Front-end:** [Next.js](https://nextjs.org/) (App Router + Turbopack), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com suporte a classes dark mode
- **Ícones:** [Lucide Icons](https://lucide.dev/)
- **Banco de Dados & ORM:** [Prisma ORM](https://www.prisma.io/) com SQLite (compatível com PostgreSQL)
- **Autenticação:** JWT com cookies HTTP-only seguros e bcrypt para hash de senhas
- **Efeitos Visuais:** Canvas Confetti

---

## 💻 Como Executar o Projeto Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/david88216952-alt/bolinha-da-sorte-1.git
cd bolinha-da-sorte-1
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar o banco de dados
```bash
npx prisma db push
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔑 Credenciais Padrão do Administrador

- **E-mail:** `admin@bolinhadasorte.com.br`
- **Senha:** `admin123`
- **URL Direta:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 📄 Licença

Propriedade privada — Bolinha da Sorte. Todos os direitos reservados.
