import Link from "next/link";
import { ShieldAlert, ShieldCheck, Lock, QrCode } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="w-full bg-[#000000] text-neutral-400 border-t border-neutral-900 mt-auto">
      {/* Top Trust Banner */}
      <div className="border-b border-neutral-900/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Loteria Federal</p>
              <p className="text-neutral-400">Resultados 100% auditáveis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Baixa Automática Pix</p>
              <p className="text-neutral-400">Liberação de cotas em segundos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ambiente Seguro SSL</p>
              <p className="text-neutral-400">Criptografia de ponta a ponta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <span className="font-black text-base">+18</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Jogo Responsável</p>
              <p className="text-neutral-400">Proibido para menores de 18</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo href="/" size="md" contrast="dark" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              A melhor e mais confiável plataforma de rifas e sorteios online do Brasil.
              Premiações entregues com frete grátis e cotas instantâneas pagas na hora via Pix.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">
              Navegação Rápida
            </h4>
            <Link href="/" className="text-xs hover:text-white transition-colors">
              Todas as Campanhas
            </Link>
            <Link href="/minhas-compras" className="text-xs hover:text-white transition-colors">
              Consultar Minhas Compras
            </Link>
            <Link href="/ganhadores" className="text-xs hover:text-white transition-colors">
              Galeria de Ganhadores
            </Link>
            <Link href="/ajuda" className="text-xs hover:text-white transition-colors">
              Dúvidas Frequentes (FAQ)
            </Link>
            <Link href="/admin/login" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-neutral-600" />
              <span>Acesso Administrativo</span>
            </Link>
          </div>

          {/* Contact / Help */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">
              Atendimento e Suporte
            </h4>
            <p className="text-xs text-neutral-400">
              Dúvidas sobre pagamentos, baixa ou cotas premiadas?
            </p>
            <a
              href="https://api.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 rounded-xl mt-1 flex items-center justify-between transition-all group"
            >
              <div>
                <span className="text-[11px] text-neutral-400 uppercase font-semibold block">
                  Suporte Oficial
                </span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5 group-hover:text-emerald-300">
                  <WhatsAppIcon className="w-4 h-4 fill-[#25D366]" />
                  WhatsApp 24/7
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                Online
              </span>
            </a>
          </div>
        </div>

        {/* Mandatory Legal Warning & Copyright */}
        <div className="mt-10 pt-8 border-t border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 text-amber-400/90 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              +18 Venda permitida apenas para maiores de 18 anos. Compre com responsabilidade!
            </span>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            Copyright &copy; 2026 Bolinha da Sorte. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
