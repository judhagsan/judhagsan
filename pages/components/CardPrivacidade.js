import {
  ShieldLockIcon,
  MailIcon,
  CalendarIcon,
  XIcon,
} from "@primer/octicons-react";

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
      <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

export default function CardPrivacidade({ onClose }) {
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="shrink-0 mb-5 flex items-center justify-between gap-4 relative z-10">
          <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
            <ShieldLockIcon size={20} className="text-cyan-300" />
            Termos de Uso
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
              <CalendarIcon size={12} className="relative -top-px" />
              Última atualização: 21 de maio de 2026
            </p>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="cursor-pointer text-red-400 hover:text-red-300 transition-colors shrink-0"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-6">
          <Section title="1. Quem somos">
            <p>
              Estes Termos e Condições de Uso têm como objetivo regular a
              utilização do site{" "}
              <span className="text-cyan-300">judhagsan.com</span> e do software{" "}
              <span className="text-cyan-300">Pindorama</span> pelos seus
              Usuários, desenvolvidos por{" "}
              <span className="text-white/90">
                JUDHA GUILHERME DE OLIVEIRA SANTOS
              </span>
              , com sede em São Paulo — SP (Brasil), inscrito sob o CNPJ nº{" "}
              <span className="text-white/90">35.266.920/0001-30</span>.
            </p>
            <p>
              Para a utilização do site judhagsan.com e do software Pindorama é
              obrigatório ler e aceitar os Termos e Condições de Uso.
            </p>
            <p>
              Eventuais alterações nos Termos e Condições de Uso entram em vigor
              no momento de sua publicação e os Usuários serão informados destas
              alterações por email. Caso não as aceite, o acesso ao
              judhagsan.com ou ao Pindorama pelo Usuário deverá ser
              interrompido. Cabe também ao Usuário verificar regularmente se
              existem atualizações aos Termos e Condições de Uso.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p>Coletamos apenas o estritamente necessário para o serviço:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="text-white/90">Cadastro:</span> nome de
                usuário, email e senha (sempre armazenada com criptografia,
                nunca em texto puro).
              </li>
              <li>
                <span className="text-white/90">Sessão:</span> identificador de
                sessão para manter você autenticado, com data de criação e
                expiração.
              </li>
              <li>
                <span className="text-white/90">Ativação de conta:</span> link
                temporário enviado por email para confirmar o cadastro.
              </li>
              <li>
                <span className="text-white/90">Logs de servidor:</span>{" "}
                endereço IP e informações do navegador, registrados pelo
                provedor de hospedagem para fins de segurança e operação.
              </li>
              <li>
                <span className="text-white/90">Pindorama (desktop):</span> ao
                fazer login no Software, o mesmo conjunto de dados acima é
                tratado. Ao verificar atualizações, o seu endereço IP é
                registrado pelo servidor.
              </li>
            </ul>
          </Section>

          <Section title="3. Finalidades">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Criação, autenticação e gerenciamento da sua conta.</li>
              <li>Envio de email transacional de ativação de conta.</li>
              <li>Distribuição e atualização do software Pindorama.</li>
              <li>
                Garantia de segurança (prevenção de fraude, abuso e detecção de
                incidentes).
              </li>
            </ul>
          </Section>

          <Section title="4. Base legal (Art. 7º LGPD)">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="text-white/90">Consentimento</span> — fornecido
                no cadastro, ao aceitar esta política.
              </li>
              <li>
                <span className="text-white/90">Execução de contrato</span> —
                para prover o serviço solicitado (login, distribuição do
                Software).
              </li>
              <li>
                <span className="text-white/90">Legítimo interesse</span> — para
                segurança operacional e prevenção a fraudes.
              </li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento com terceiros">
            <p>
              Não vendemos seus dados. Compartilhamos apenas com prestadores
              estritamente necessários:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="text-white/90">Vercel Inc.</span> — hospedagem
                do site e do banco de dados (EUA).
              </li>
              <li>
                <span className="text-white/90">GitHub Inc.</span> — hospedagem
                das releases do Pindorama distribuídas via download (EUA).
              </li>
              <li>
                <span className="text-white/90">Provedor de email SMTP</span> —
                envio de emails transacionais.
              </li>
            </ul>
          </Section>

          <Section title="6. Transferência internacional">
            <p>
              Os dados são processados em servidores localizados nos Estados
              Unidos. A transferência ocorre com base nas hipóteses previstas no
              Art. 33 da LGPD (execução de contrato e legítimo interesse), com
              adoção de medidas técnicas e contratuais de proteção pelos
              prestadores indicados acima.
            </p>
          </Section>

          <Section title="7. Tempo de retenção">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Token de ativação: 15 minutos.</li>
              <li>Token de sessão: 30 dias a partir da última atividade.</li>
              <li>
                Dados de conta: enquanto o cadastro estiver ativo. Após
                solicitação de exclusão, em até 15 dias úteis (exceto quando a
                guarda for exigida por obrigação legal).
              </li>
              <li>
                Logs de servidor: retidos pelo prazo padrão do provedor de
                hospedagem.
              </li>
            </ul>
          </Section>

          <Section title="8. Segurança">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                Senhas armazenadas com criptografia, jamais em texto puro.
              </li>
              <li>Cookies de sessão protegidos para evitar acesso indevido.</li>
              <li>Identificadores de sessão gerados de forma aleatória.</li>
              <li>
                Toda a comunicação entre o seu dispositivo e os servidores é
                criptografada.
              </li>
            </ul>
          </Section>

          <Section title="9. Cookies">
            <p>
              Utilizamos apenas um cookie estritamente necessário para manter a
              sua sessão autenticada. Não utilizamos cookies de analytics,
              marketing ou rastreamento.
            </p>
          </Section>

          <Section title="10. Pindorama (software desktop)">
            <p>
              Caso você utilize o Pindorama, o Software armazena localmente no
              seu computador o identificador da sua sessão e dados básicos do
              perfil para permitir login persistente. Você pode desativar o
              login persistente desmarcando a opção{" "}
              <span className="text-white/90">&quot;Stay signed in&quot;</span>{" "}
              na tela de login do Software.
            </p>
            <p>
              A verificação automática de atualizações envia uma requisição ao
              judhagsan.com contendo apenas a versão do Software e o sistema
              operacional utilizado.
            </p>
          </Section>

          <Section title="11. Seus direitos como titular (Art. 18 LGPD)">
            <p>A qualquer momento você pode:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar os dados que mantemos sobre você;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Solicitar a anonimização, bloqueio ou eliminação de dados
                desnecessários ou tratados em desconformidade;
              </li>
              <li>
                Solicitar a portabilidade dos seus dados a outro fornecedor;
              </li>
              <li>Eliminar os dados tratados com base no seu consentimento;</li>
              <li>
                Obter informação sobre entidades públicas ou privadas com as
                quais compartilhamos seus dados;
              </li>
              <li>
                Revogar o consentimento dado anteriormente, a qualquer momento.
              </li>
            </ul>
          </Section>

          <Section title="12. Alterações nesta política">
            <p>
              Eventuais alterações serão publicadas nesta página com a
              respectiva data de atualização. Recomendamos consultas periódicas.
            </p>
          </Section>

          <Section title="13. Encarregado de Tratamento (DPO)">
            <p>
              Identidade do Encarregado pelo Tratamento de Dados Pessoais:{" "}
              <span className="text-white/90">
                JUDHA GUILHERME DE OLIVEIRA SANTOS
              </span>{" "}
              — CNPJ 35.266.920/0001-30.
            </p>
            <p>
              Contato:{" "}
              <a
                href="mailto:contato@judhagsan.com"
                className="text-cyan-300 hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
              >
                <MailIcon size={14} />
                contato@judhagsan.com
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
