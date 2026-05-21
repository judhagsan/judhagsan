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
            Política de Privacidade
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
              Esta política descreve como o site{" "}
              <span className="text-cyan-300">judhagsan.com</span> e o software
              desktop <span className="text-cyan-300">Pindorama</span> tratam
              seus dados pessoais, em conformidade com a Lei Geral de Proteção
              de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
            <p>
              O controlador dos dados é o responsável pelo domínio judhagsan.com
              (Judhagsan), referido nesta política simplesmente como
              &quot;nós&quot;.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p>Coletamos apenas o estritamente necessário para o serviço:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="text-white/90">Cadastro:</span> username, email
                e senha (armazenada apenas como hash bcrypt, jamais em texto
                puro).
              </li>
              <li>
                <span className="text-white/90">Sessão:</span> token de sessão
                em cookie <code className="text-cyan-300">session_id</code>{" "}
                (httpOnly), data de criação e expiração.
              </li>
              <li>
                <span className="text-white/90">Ativação de conta:</span> token
                temporário enviado por email (válido por 15 minutos).
              </li>
              <li>
                <span className="text-white/90">Logs de servidor:</span>{" "}
                endereço IP e User-Agent, registrados pelo provedor de
                hospedagem para fins de segurança e operação.
              </li>
              <li>
                <span className="text-white/90">Pindorama (desktop):</span> ao
                fazer login no app, o mesmo conjunto de dados acima é tratado.
                Ao verificar atualizações, seu IP é registrado pelo servidor.
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
                para prover o serviço solicitado (login, distribuição do app).
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
                Senhas armazenadas com hash bcrypt (14 rounds em produção).
              </li>
              <li>
                Cookies de sessão com flags{" "}
                <code className="text-cyan-300">httpOnly</code>,{" "}
                <code className="text-cyan-300">secure</code> e{" "}
                <code className="text-cyan-300">sameSite=lax</code>.
              </li>
              <li>
                Tokens de sessão gerados por gerador criptográfico seguro (96
                caracteres hexadecimais).
              </li>
              <li>Conexões via HTTPS e banco de dados com SSL.</li>
            </ul>
          </Section>

          <Section title="9. Cookies">
            <p>
              Utilizamos um único cookie estritamente necessário (
              <code className="text-cyan-300">session_id</code>) para manter sua
              sessão autenticada. Não utilizamos cookies de analytics, marketing
              ou rastreamento.
            </p>
          </Section>

          <Section title="10. Pindorama (software desktop)">
            <p>
              Caso você utilize o Pindorama, observe que o aplicativo armazena
              localmente, no seu computador, o token de sessão e dados básicos
              do perfil para permitir login persistente:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="text-white/90">macOS:</span>{" "}
                <code className="text-cyan-300 text-xs">
                  ~/Library/Application Support/Pindorama/session.toml
                </code>
              </li>
              <li>
                <span className="text-white/90">Linux:</span>{" "}
                <code className="text-cyan-300 text-xs">
                  ~/.config/Pindorama/session.toml
                </code>
              </li>
              <li>
                <span className="text-white/90">Windows:</span>{" "}
                <code className="text-cyan-300 text-xs">
                  %APPDATA%\Pindorama\session.toml
                </code>
              </li>
            </ul>
            <p>
              Você pode desativar o login persistente desmarcando a opção
              &quot;Stay signed in&quot; na tela de login do app. A verificação
              automática de atualizações envia uma requisição HTTPS ao
              judhagsan.com contendo a versão do app e o sistema operacional.
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

          <Section title="12. Como exercer seus direitos">
            <p>
              Envie um email para{" "}
              <a
                href="mailto:contato@judhagsan.com?subject=LGPD%20-%20Solicita%C3%A7%C3%A3o"
                className="text-cyan-300 hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
              >
                <MailIcon size={14} />
                contato@judhagsan.com
              </a>{" "}
              com o assunto{" "}
              <span className="text-white/90">
                &quot;LGPD - Solicitação&quot;
              </span>
              , identificando-se com o email cadastrado e descrevendo seu
              pedido. Responderemos em até 15 dias.
            </p>
          </Section>

          <Section title="13. Menores de idade">
            <p>
              Este serviço não é direcionado a pessoas com menos de 18 anos. Não
              coletamos intencionalmente dados de menores. Caso identifique o
              cadastro de um menor, entre em contato pelo email acima para que
              seja eliminado.
            </p>
          </Section>

          <Section title="14. Alterações nesta política">
            <p>
              Eventuais alterações serão publicadas nesta página com a
              respectiva data de atualização. Recomendamos consultas periódicas.
            </p>
          </Section>

          <Section title="15. Encarregado de Tratamento (DPO)">
            <p>
              Contato do Encarregado pelo Tratamento de Dados Pessoais:{" "}
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
