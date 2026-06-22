import {
  ShieldLockIcon,
  MailIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

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
  const { language, t } = useLanguage();

  const lastUpdateLabel =
    language === "en"
      ? "Last update: May 28, 2026"
      : "Última atualização: 28 de maio de 2026";

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="shrink-0 mb-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("Voltar")}
                  className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
                >
                  <ArrowLeftIcon size={18} />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
                <ShieldLockIcon size={20} />
              </div>
              <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
                {t("Termos de Uso")}
              </h2>
            </div>
            <div className="flex items-center gap-4 mt-1 lg:mt-0">
              <p className="hidden lg:flex text-xs uppercase tracking-widest text-white/40 items-center gap-2">
                <CalendarIcon size={12} className="relative -top-px" />
                {lastUpdateLabel}
              </p>
            </div>
          </div>
          <p className="lg:hidden mt-2 text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
            <CalendarIcon size={12} className="relative -top-px" />
            {lastUpdateLabel}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-6">
          {language === "en" ? (
            <>
              <Section title="1. Who we are">
                <p>
                  These Terms and Conditions of Use aim to regulate the use of
                  the website{" "}
                  <span className="text-cyan-300">judhagsan.com</span> and the
                  software <span className="text-cyan-300">Pindorama</span> by
                  their Users, developed by{" "}
                  <span className="text-white/90">
                    JUDHA GUILHERME DE OLIVEIRA SANTOS
                  </span>
                  , based in São Paulo — SP (Brazil), registered under CNPJ
                  number{" "}
                  <span className="text-white/90">35.266.920/0001-30</span>.
                </p>
                <p>
                  To use the judhagsan.com website and the Pindorama software,
                  it is mandatory to read and accept the Terms and Conditions of
                  Use.
                </p>
                <p>
                  Any changes to the Terms and Conditions of Use take effect at
                  the moment of their publication and Users will be informed of
                  these modifications by email. If you do not accept them, the
                  User&apos;s access to judhagsan.com or Pindorama must be
                  discontinued. It is also the User&apos;s responsibility to
                  regularly check for updates to the Terms and Conditions of
                  Use.
                </p>
              </Section>

              <Section title="2. Data we collect">
                <p>
                  We collect only what is strictly necessary to run the service:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    <span className="text-white/90">Registration:</span>{" "}
                    username, email, and password (always stored with
                    encryption, never in plain text).
                  </li>
                  <li>
                    <span className="text-white/90">Session:</span> session
                    identifier to keep you authenticated, with creation and
                    expiration dates.
                  </li>
                  <li>
                    <span className="text-white/90">Account activation:</span>{" "}
                    temporary link sent by email to confirm registration.
                  </li>
                  <li>
                    <span className="text-white/90">Server logs:</span> IP
                    address and browser information, recorded by the hosting
                    provider for security and operational purposes.
                  </li>
                  <li>
                    <span className="text-white/90">Pindorama (desktop):</span>{" "}
                    when logging into the Software, the same set of data above
                    is processed. When checking for updates, your IP address is
                    logged by the server.
                  </li>
                  <li>
                    <span className="text-white/90">
                      Device specifications (Pindorama telemetry):
                    </span>{" "}
                    when logging into the Software, we record a unique hardware
                    identifier (stable motherboard UUID, used only to
                    deduplicate the same computer between sessions), operating
                    system, processor (CPU), RAM memory, graphics card (GPU),
                    connected monitors (resolution and refresh rate), drawing
                    tablet (manufacturer and model, when connected), and
                    Pindorama version. This information is used exclusively for
                    bug diagnosis, support, and development of Software
                    compatibility with different hardware setups. You can view,
                    pause updates, or delete this information at any time in{" "}
                    <span className="text-cyan-300">/sessao</span>.
                  </li>
                </ul>
              </Section>

              <Section title="3. Purposes">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    Creation, authentication, and management of your account.
                  </li>
                  <li>Sending transactional account activation emails.</li>
                  <li>Distribution and updates of the Pindorama software.</li>
                  <li>
                    Bug diagnosis, technical support, and development of
                    Software compatibility with different hardware setups (via
                    device specifications collected upon login).
                  </li>
                  <li>
                    Security assurance (fraud prevention, abuse prevention, and
                    incident detection).
                  </li>
                </ul>
              </Section>

              <Section title="4. Legal basis">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    <span className="text-white/90">Consent</span> — provided
                    during registration upon accepting this policy.
                  </li>
                  <li>
                    <span className="text-white/90">Contract execution</span> —
                    to provide the requested service (login, Software
                    distribution).
                  </li>
                  <li>
                    <span className="text-white/90">Legitimate interest</span> —
                    for operational security and fraud prevention.
                  </li>
                </ul>
              </Section>

              <Section title="5. Sharing with third parties">
                <p>
                  We do not sell your data. We only share it with strictly
                  necessary providers:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    <span className="text-white/90">Vercel Inc.</span> — website
                    and database hosting (USA).
                  </li>
                  <li>
                    <span className="text-white/90">GitHub Inc.</span> — hosting
                    Pindorama releases distributed via download (USA).
                  </li>
                  <li>
                    <span className="text-white/90">SMTP Email Provider</span> —
                    sending transactional emails.
                  </li>
                </ul>
              </Section>

              <Section title="6. International transfer">
                <p>
                  Data is processed in servers located in the United States. The
                  transfer occurs based on contract execution and legitimate
                  interest, with the adoption of technical and contractual
                  protection measures by the providers listed above.
                </p>
              </Section>

              <Section title="7. Retention period">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Activation token: 15 minutes.</li>
                  <li>Session token: 30 days from last activity.</li>
                  <li>
                    Account data: as long as the registration is active. After a
                    deletion request, within 15 business days (except when
                    retention is required by legal obligation).
                  </li>
                  <li>
                    Device specifications: as long as the device is in use. You
                    can delete manually at any time in{" "}
                    <span className="text-cyan-300">/sessao</span>.
                  </li>
                  <li>
                    Server logs: retained for the standard duration set by the
                    hosting provider.
                  </li>
                </ul>
              </Section>

              <Section title="8. Security">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    Passwords stored with encryption, never in plain text.
                  </li>
                  <li>
                    Protected session cookies to prevent unauthorized access.
                  </li>
                  <li>Session identifiers generated randomly.</li>
                  <li>
                    All communication between your device and the servers is
                    encrypted.
                  </li>
                </ul>
              </Section>

              <Section title="9. Cookies">
                <p>
                  We only use one strictly necessary cookie to keep your session
                  authenticated. We do not use cookies for analytics, marketing,
                  or tracking.
                </p>
              </Section>

              <Section title="10. Pindorama (desktop software)">
                <p>
                  If you use Pindorama, the Software stores your session
                  identifier and basic profile data locally on your computer to
                  allow persistent login. You can disable persistent login by
                  unchecking the{" "}
                  <span className="text-white/90">
                    &quot;Stay signed in&quot;
                  </span>{" "}
                  option on the Software&apos;s login screen.
                </p>
                <p>
                  The automatic update check sends a request to judhagsan.com
                  containing only the Software version and the operating system
                  used.
                </p>
              </Section>

              <Section title="11. Changes to this policy">
                <p>
                  Any changes will be published on this page with the respective
                  update date. We recommend checking back periodically.
                </p>
              </Section>

              <Section title="12. Privacy contact info">
                <p>
                  Controller:{" "}
                  <span className="text-white/90">
                    JUDHA GUILHERME DE OLIVEIRA SANTOS
                  </span>{" "}
                  — CNPJ 35.266.920/0001-30.
                </p>
                <p>
                  Contact:{" "}
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
            </>
          ) : (
            <>
              <Section title="1. Quem somos">
                <p>
                  Estes Termos e Condições de Uso têm como objetivo regular a
                  utilização do site{" "}
                  <span className="text-cyan-300">judhagsan.com</span> e do
                  software <span className="text-cyan-300">Pindorama</span>{" "}
                  pelos seus Usuários, desenvolvidos por{" "}
                  <span className="text-white/90">
                    JUDHA GUILHERME DE OLIVEIRA SANTOS
                  </span>
                  , com sede em São Paulo — SP (Brasil), inscrito sob o CNPJ nº{" "}
                  <span className="text-white/90">35.266.920/0001-30</span>.
                </p>
                <p>
                  Para a utilização do site judhagsan.com e do software
                  Pindorama é obrigatório ler e aceitar os Termos e Condições de
                  Uso.
                </p>
                <p>
                  Eventuais alterações nos Termos e Condições de Uso entram em
                  vigor no momento de sua publicação e os Usuários serão
                  informados destas alterações por email. Caso não as aceite, o
                  acesso ao judhagsan.com ou ao Pindorama pelo Usuário deverá
                  ser interrompido. Cabe também ao Usuário verificar
                  regularmente se existem atualizações aos Termos e Condições de
                  Uso.
                </p>
              </Section>

              <Section title="2. Dados que coletamos">
                <p>
                  Coletamos apenas o estritamente necessário para o serviço:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    <span className="text-white/90">Cadastro:</span> nome de
                    usuário, email e senha (sempre armazenada com criptografia,
                    nunca em texto puro).
                  </li>
                  <li>
                    <span className="text-white/90">Sessão:</span> identificador
                    de sessão para manter você autenticado, com data de criação
                    e expiração.
                  </li>
                  <li>
                    <span className="text-white/90">Ativação de conta:</span>{" "}
                    link temporário enviado por email para confirmar o cadastro.
                  </li>
                  <li>
                    <span className="text-white/90">Logs de servidor:</span>{" "}
                    endereço IP e informações do navegador, registrados pelo
                    provedor de hospedagem para fins de segurança e operação.
                  </li>
                  <li>
                    <span className="text-white/90">Pindorama (desktop):</span>{" "}
                    ao fazer login no Software, o mesmo conjunto de dados acima
                    é tratado. Ao verificar atualizações, o seu endereço IP é
                    registrado pelo servidor.
                  </li>
                  <li>
                    <span className="text-white/90">
                      Especificações do dispositivo (telemetria do Pindorama):
                    </span>{" "}
                    ao fazer login no Software, registramos identificador único
                    do hardware (UUID estável da placa-mãe, usado apenas para
                    deduplicar o mesmo computador entre sessões), sistema
                    operacional, processador (CPU), memória RAM, placa gráfica
                    (GPU), monitores conectados (resolução e taxa de
                    atualização), mesa digitalizadora (fabricante e modelo,
                    quando conectada) e versão do Pindorama. Essa informação é
                    usada exclusivamente para diagnóstico de bugs, suporte e
                    desenvolvimento da compatibilidade do Software com
                    diferentes hardwares. Você pode visualizar, pausar a
                    atualização ou excluir essas informações a qualquer momento
                    em <span className="text-cyan-300">/sessao</span>.
                  </li>
                </ul>
              </Section>

              <Section title="3. Finalidades">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Criação, autenticação e gerenciamento da sua conta.</li>
                  <li>Envio de email transacional de ativação de conta.</li>
                  <li>Distribuição e atualização do software Pindorama.</li>
                  <li>
                    Diagnóstico de bugs, suporte técnico e desenvolvimento da
                    compatibilidade do Software com diferentes hardwares (via
                    especificações de dispositivo coletadas após login).
                  </li>
                  <li>
                    Garantia de segurança (prevenção de fraude, abuso e detecção
                    de incidentes).
                  </li>
                </ul>
              </Section>

              <Section title="4. Base legal">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>
                    <span className="text-white/90">Consentimento</span> —
                    fornecido no cadastro, ao aceitar esta política.
                  </li>
                  <li>
                    <span className="text-white/90">Execução de contrato</span>{" "}
                    — para prover o serviço solicitado (login, distribuição do
                    Software).
                  </li>
                  <li>
                    <span className="text-white/90">Legítimo interesse</span> —
                    para segurança operacional e prevenção a fraudes.
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
                    <span className="text-white/90">Vercel Inc.</span> —
                    hospedagem do site e do banco de dados (EUA).
                  </li>
                  <li>
                    <span className="text-white/90">GitHub Inc.</span> —
                    hospedagem das releases do Pindorama distribuídas via
                    download (EUA).
                  </li>
                  <li>
                    <span className="text-white/90">
                      Provedor de email SMTP
                    </span>{" "}
                    — envio de emails transacionais.
                  </li>
                </ul>
              </Section>

              <Section title="6. Transferência internacional">
                <p>
                  Os dados são processados em servidores localizados nos Estados
                  Unidos. A transferência ocorre com base em execução de
                  contrato e legítimo interesse, com adoção de medidas técnicas
                  e contratuais de proteção pelos prestadores indicados acima.
                </p>
              </Section>

              <Section title="7. Tempo de retenção">
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Token de ativação: 15 minutos.</li>
                  <li>
                    Token de sessão: 30 dias a partir da última atividade.
                  </li>
                  <li>
                    Dados de conta: enquanto o cadastro estiver ativo. Após
                    solicitação de exclusão, em até 15 dias úteis (exceto quando
                    a guarda for exigida por obrigação legal).
                  </li>
                  <li>
                    Especificações de dispositivo: enquanto o dispositivo
                    estiver em uso. Você pode excluir manualmente a qualquer
                    momento em <span className="text-cyan-300">/sessao</span>.
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
                  <li>
                    Cookies de sessão protegidos para evitar acesso indevido.
                  </li>
                  <li>Identificadores de sessão gerados de forma aleatória.</li>
                  <li>
                    Toda a comunicação entre o seu dispositivo e os servidores é
                    criptografada.
                  </li>
                </ul>
              </Section>

              <Section title="9. Cookies">
                <p>
                  Utilizamos apenas um cookie estritamente necessário para
                  manter a sua sessão autenticada. Não utilizamos cookies de
                  analytics, marketing ou rastreamento.
                </p>
              </Section>

              <Section title="10. Pindorama (software desktop)">
                <p>
                  Caso você utilize o Pindorama, o Software armazena localmente
                  no seu computador o identificador da sua sessão e dados
                  básicos do perfil para permitir login persistente. Você pode
                  desativar o login persistente desmarcando a opção{" "}
                  <span className="text-white/90">
                    &quot;Stay signed in&quot;
                  </span>{" "}
                  na tela de login do Software.
                </p>
                <p>
                  A verificação automática de atualizações envia uma requisição
                  ao judhagsan.com contendo apenas a versão do Software e o
                  sistema operacional utilizado.
                </p>
              </Section>

              <Section title="11. Alterações nesta política">
                <p>
                  Eventuais alterações serão publicadas nesta página com a
                  respectiva data de atualização. Recomendamos consultas
                  periódicas.
                </p>
              </Section>

              <Section title="12. Contato para questões de privacidade">
                <p>
                  Responsável:{" "}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
