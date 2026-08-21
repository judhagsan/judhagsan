import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const LanguageContext = createContext({
  language: "pt",
  setLanguage: () => {},
  t: (key) => key,
});

const translations = {
  pt: {
    // Navigation / General
    "Termos de Uso": "Termos de Uso",
    Contato: "Contato",
    Login: "Login",
    Cadastrar: "Cadastrar",
    Sair: "Sair",
    Voltar: "Voltar",

    // Pindorama Card
    pindorama_desc:
      "Desenvolvido de animador para animador. Combine a arte do frame-a-frame com a eficiência da animação 2D vetorial. Uma engine poderosa para mixed media, otimizada para entregar máxima performance respeitando o seu hardware.",
    pindorama_footer:
      "* É necessário fazer cadastro/login para efetuar o download.",
    Download: "Download",

    // Login Card
    Email: "Email",
    Senha: "Senha",
    Entrar: "Entrar",
    "Entrando...": "Entrando...",
    "Nao tem conta?": "Não tem conta?",
    "Erro de conexao": "Erro de conexão. Tente novamente.",
    "Login falhou": "Não foi possível entrar.",

    // Cadastro Card
    Cadastro: "Cadastro",
    seu_usuario: "seu_usuario",
    Username: "Username",
    Confirmar: "Confirmar",
    min_char: "mín. 8 caracteres",
    "A senha deve ter no minimo 8 caracteres":
      "A senha deve ter no mínimo 8 caracteres.",
    "As senhas nao conferem": "As senhas não conferem.",
    "Aceitar termos obrigadorio":
      "É necessário aceitar os Termos de Uso para se cadastrar.",
    "Cadastro falhou": "Não foi possível cadastrar.",
    "Cadastrando...": "Cadastrando...",
    "Li e aceito os": "Li e aceito os",
    "Ja tem conta?": "Já tem conta?",
    "Verifique seu email": "Verifique seu email",
    "Email de ativacao enviado":
      "Se {email} ainda não estava cadastrado, enviamos um link de ativação. Caso contrário, você receberá uma notificação sobre a tentativa.",
    "Cadastrar outra conta": "Cadastrar outra conta",

    // Contact Card
    "Mensagem enviada!": "Mensagem enviada!",
    "Sucesso ao enviar mensagem":
      "Sua mensagem foi entregue com sucesso. Responderemos o mais breve possível.",
    "Enviar outra mensagem": "Enviar outra mensagem",
    Nome: "Nome",
    "Seu nome": "Seu nome",
    Mensagem: "Mensagem",
    "Escreva sua mensagem aqui...": "Escreva sua mensagem aqui...",
    "Erro ao enviar mensagem": "Ocorreu um erro ao enviar a mensagem.",
    "Erro conexao contato":
      "Erro de conexão. Verifique se você está online e tente novamente.",
    "Enviando...": "Enviando...",
    "Enviar mensagem": "Enviar mensagem",
    "Duvidas gerais": "Dúvidas gerais",
    "Texto duvidas gerais":
      "Para perguntas sobre o site, o software Pindorama ou parcerias, envie o email pelo formulário ou diretamente para o email contato@judhagsan.com.",
    "Texto duvidas uteis": "Responderemos em até 5 dias úteis.",
    "Vulnerabilidades de seguranca": "Vulnerabilidades de segurança",
    "Texto vulnerabilidades":
      'Se você encontrou uma vulnerabilidade de segurança no site ou no Pindorama, por favor reporte de forma privada para contato@judhagsan.com com o assunto "Security - Vulnerabilidade".',
    "Texto nao divulgar":
      "Pedimos para não divulgar publicamente antes de termos chance de corrigir.",

    // Devices Card
    Dispositivos: "Dispositivos",
    "Carregando...": "Carregando...",
    "Erro ao carregar dispositivos": "Erro ao carregar dispositivos.",
    "Nenhum dispositivo registrado":
      "Nenhum dispositivo registrado. Faça login pelo Pindorama no seu computador.",
    SO: "SO",
    CPU: "CPU",
    RAM: "RAM",
    GPU: "GPU",
    Monitor: "Monitor",
    Mesa: "Mesa",
    pausado: "pausado",
    Retomar: "Retomar",
    Pausar: "Pausar",
    Excluir: "Excluir",

    // User Card
    "Excluir conta": "Excluir conta",
    "Texto excluir conta aviso":
      "Esta ação é irreversível. Seus dados, sessões e tokens serão eliminados.",
    "Digite para confirmar": "Digite {username} para confirmar",
    Cancelar: "Cancelar",
    "Excluindo...": "Excluindo...",
    "Bem vindo": "Bem-vindo, {username}",
    "Exportar meus dados": "Exportar meus dados",
    "Exportando...": "Exportando...",
    "Erro exportar": "Não foi possível exportar.",
    "Erro excluir conta": "Não foi possível excluir a conta.",

    // Session Card
    "Versao para platform em breve": "Versão para {platform} em breve.",

    // YouTube Card
    "Ultimos videos": "Últimos vídeos",
    "Ver todos": "Ver todos",
    Assistir: "Assistir",
    "Nao foi possivel carregar os videos":
      "Não foi possível carregar os vídeos",
    Hoje: "Hoje",

    // Apoiador
    Apoiador: "Apoiador",
    Apoiadores: "Apoiadores",
    "Texto agradecimento apoiadores":
      "Pessoas incríveis que mantêm o desenvolvimento do Pindorama vivo. Muito obrigado!",
    "Nenhum apoiador ainda": "Ainda não há apoiadores públicos por aqui.",
    "Erro ao carregar apoiadores": "Não foi possível carregar os apoiadores.",
    "Entrar no Discord": "Entrar no Discord",
    "Discord conectado": "Discord conectado",
    "Ver mural de apoiadores": "Ver mural de apoiadores",
    "Discord conectado com sucesso": "Discord conectado com sucesso!",
    "Erro ao conectar Discord":
      "Não foi possível conectar ao Discord. Tente novamente.",
    "Discord ja vinculado":
      "Esta conta do Discord já está vinculada a outro usuário.",
    "Erro ao salvar": "Não foi possível salvar.",
    "Quero apoiar o Pindorama": "Quero apoiar o Pindorama",

    // Card de apoio (/apoiar e promo na sessão)
    "Apoiar o Pindorama": "Apoiar o Pindorama",
    "Apoie o Pindorama e receba": "Apoie o Pindorama e receba:",
    "Apoie o Pindorama por valor e receba": "Apoie por {valor} e receba:",
    "Pagar com cartao": "Pagar com cartão",
    "Vantagem selo": "Selo de apoiador",
    "Vantagem discord": "Discord privado",
    "Vantagem mural": "Nome no mural",
    "Texto apoio indisponivel":
      "O apoio está temporariamente indisponível enquanto um novo meio de pagamento não entra no ar. Quem já é apoiador mantém todos os benefícios.",
    "Nome no cartao": "Nome no cartão",
    "Numero do cartao": "Número do cartão",
    Validade: "Validade",
    "sufixo mes": "/mês",
    "Processando...": "Processando...",
    "Texto cobranca recorrente":
      "Cobrança mensal no cartão, renovada automaticamente. Você pode cancelar quando quiser.",
    "Pagar com Pix": "Pagar um mês com Pix",

    // Estado da assinatura
    "Apoio ao Pindorama ativo": "Apoio ao Pindorama ativo",
    "Aguardando a cobranca": "Aguardando a cobrança",
    "Cobranca recusada": "Cobrança recusada",
    "Assinatura pendente": "Assinatura pendente",
    "Assinatura cancelada": "Assinatura cancelada",
    "Valor por mes": "{valor} por mês, no cartão",
    "Texto validacao cartao":
      "O Mercado Pago fez uma validação de R$ 0,00 no seu cartão só para confirmar que ele é válido. Isso não é a cobrança, e nada foi debitado por ela.",
    "Texto cobranca a caminho":
      "A primeira cobrança sai em até uma hora. Os benefícios entram na sua conta assim que ela for aprovada, e você não precisa fazer mais nada.",
    "Texto beneficios ate": "Benefícios liberados até {data}.",
    "Texto proxima cobranca": "Próxima cobrança em {data}.",
    "Texto cobranca recusada":
      "A última cobrança não passou. O Mercado Pago tenta de novo por até 10 dias e seu acesso continua nesse período. Se preferir resolver na hora, pague um mês com Pix.",
    "Texto assinatura pendente":
      "O Mercado Pago ainda não autorizou esta assinatura. Se continuar assim por alguns minutos, cancele e tente de novo.",
    "Texto assinatura cancelada":
      "Não haverá novas cobranças. O acesso continua até o fim do período que você já pagou.",
    "Cancelar assinatura": "Cancelar assinatura",
    "Cancelando...": "Cancelando...",
    "Erro ao cancelar":
      "Não foi possível cancelar agora. Tente novamente em instantes.",
    "Erro ao iniciar apoio":
      "Não foi possível iniciar o apoio agora. Tente novamente em instantes.",
    "Erro no cartao":
      "Não foi possível validar o cartão. Confira os dados e tente de novo.",
    "Escaneie o QR Code": "Escaneie o QR Code",
    "Copiar codigo pix": "Copiar código Pix",
    "Codigo copiado": "Código copiado",
    "Texto pix pontual":
      "Este Pix cobre um mês de apoio e não renova sozinho. A assinatura no cartão segue ativa.",

    // YouTube Card (extra)
    "Ver o canal": "Ver o canal",

    // Activation Card
    Sessao: "Sessão",
    Ativar_cadastro: "Ativar cadastro",
    Ativacao: "Ativação",
    "Ativando sua conta...": "Ativando sua conta...",
    "Conta ativada!": "Conta ativada!",
    "Sucesso ativacao":
      "Sua conta foi ativada com sucesso. Agora você já pode entrar.",
    "Ativacao falhou": "Ativação falhou",
    "Voltar ao cadastro": "Voltar ao cadastro",

    // Status Page
    "Status do Sistema": "Status do Sistema",
    "Visao Geral": "Visão Geral",
    "Banco de Dados": "Banco de Dados",
    "Ultima Atualizacao": "Última Atualização",
    "Status Report": "Status Report",
    "Buscando telemetria...": "Buscando telemetria...",
    "Sistemas Operacionais": "Sistemas Operacionais",
    "Carregando metricas...": "Carregando métricas...",
    "Versao (PostgreSQL)": "Versão (PostgreSQL)",
    "Max Conexoes": "Max Conexões",
    "Conexoes Ativas": "Conexões Ativas",
    Uso: "Uso",
  },
  en: {
    // Navigation / General
    "Termos de Uso": "Terms of Use",
    Contato: "Contact",
    Login: "Login",
    Cadastrar: "Register",
    Sair: "Sign Out",
    Voltar: "Back",

    // Pindorama Card
    pindorama_desc:
      "Developed by animator for animator. Combine the art of frame-by-frame with the efficiency of 2D vector animation. A powerful engine for mixed media, optimized to deliver maximum performance while respecting your hardware.",
    pindorama_footer: "* Registration/login is required to download.",
    Download: "Download",

    // Login Card
    Email: "Email",
    Senha: "Password",
    Entrar: "Sign In",
    "Entrando...": "Logging In...",
    "Nao tem conta?": "Don't have an account?",
    "Erro de conexao": "Connection error. Try again.",
    "Login falhou": "Could not log in.",

    // Cadastro Card
    Cadastro: "Sign Up",
    seu_usuario: "your_username",
    Username: "Username",
    Confirmar: "Confirm",
    min_char: "min. 8 characters",
    "A senha deve ter no minimo 8 caracteres":
      "Password must be at least 8 characters long.",
    "As senhas nao conferem": "Passwords do not match.",
    "Aceitar termos obrigadorio":
      "You must accept the Terms of Use to register.",
    "Cadastro falhou": "Could not register.",
    "Cadastrando...": "Registering...",
    "Li e aceito os": "I have read and accept the",
    "Ja tem conta?": "Already have an account?",
    "Verifique seu email": "Check your email",
    "Email de ativacao enviado":
      "If {email} was not registered yet, we sent an activation link. Otherwise, you will receive a notification about the attempt.",
    "Cadastrar outra conta": "Register another account",

    // Contact Card
    "Mensagem enviada!": "Message sent!",
    "Sucesso ao enviar mensagem":
      "Your message has been successfully delivered. We will respond as soon as possible.",
    "Enviar outra mensagem": "Send another message",
    Nome: "Name",
    "Seu nome": "Your name",
    Mensagem: "Message",
    "Escreva sua mensagem aqui...": "Write your message here...",
    "Erro ao enviar mensagem": "An error occurred while sending the message.",
    "Erro conexao contato":
      "Connection error. Please check your internet connection and try again.",
    "Enviando...": "Sending...",
    "Enviar mensagem": "Send message",
    "Duvidas gerais": "General questions",
    "Texto duvidas gerais":
      "For questions about the website, the Pindorama software, or partnerships, send an email using the form or directly to contato@judhagsan.com.",
    "Texto duvidas uteis": "We will respond within 5 business days.",
    "Vulnerabilidades de seguranca": "Security vulnerabilities",
    "Texto vulnerabilidades":
      'If you found a security vulnerability in the website or Pindorama, please report it privately to contato@judhagsan.com with the subject "Security - Vulnerability".',
    "Texto nao divulgar":
      "We ask you not to disclose publicly before we have a chance to fix it.",

    // Devices Card
    Dispositivos: "Devices",
    "Carregando...": "Loading...",
    "Erro ao carregar dispositivos": "Error loading devices.",
    "Nenhum dispositivo registrado":
      "No registered devices. Log in through Pindorama on your computer.",
    SO: "OS",
    CPU: "CPU",
    RAM: "RAM",
    GPU: "GPU",
    Monitor: "Monitor",
    Mesa: "Tablet",
    pausado: "paused",
    Retomar: "Resume",
    Pausar: "Pause",
    Excluir: "Delete",

    // User Card
    "Excluir conta": "Delete account",
    "Texto excluir conta aviso":
      "This action is irreversible. Your data, sessions, and tokens will be deleted.",
    "Digite para confirmar": "Type {username} to confirm",
    Cancelar: "Cancel",
    "Excluindo...": "Deleting...",
    "Bem vindo": "Welcome, {username}",
    "Exportar meus dados": "Export my data",
    "Exportando...": "Exporting...",
    "Erro exportar": "Could not export data.",
    "Erro excluir conta": "Could not delete account.",

    // Session Card
    "Versao para platform em breve": "Version for {platform} coming soon.",

    // YouTube Card
    "Ultimos videos": "Latest videos",
    "Ver todos": "View all",
    Assistir: "Watch",
    "Nao foi possivel carregar os videos": "Could not load videos",
    Hoje: "Today",

    // Apoiador
    Apoiador: "Supporter",
    Apoiadores: "Supporters",
    "Texto agradecimento apoiadores":
      "Amazing people who keep the development of Pindorama alive. Thank you so much!",
    "Nenhum apoiador ainda": "No public supporters here yet.",
    "Erro ao carregar apoiadores": "Could not load supporters.",
    "Entrar no Discord": "Join the Discord",
    "Discord conectado": "Discord connected",
    "Ver mural de apoiadores": "View supporters wall",
    "Discord conectado com sucesso": "Discord connected successfully!",
    "Erro ao conectar Discord": "Could not connect to Discord. Try again.",
    "Discord ja vinculado":
      "This Discord account is already linked to another user.",
    "Erro ao salvar": "Could not save.",
    "Quero apoiar o Pindorama": "I want to support Pindorama",

    // Card de apoio (/apoiar e promo na sessão)
    "Apoiar o Pindorama": "Support Pindorama",
    "Apoie o Pindorama e receba": "Support Pindorama and get:",
    "Apoie o Pindorama por valor e receba": "Support for {valor} and get:",
    "Pagar com cartao": "Pay with card",
    "Vantagem selo": "Supporter badge",
    "Vantagem discord": "Private Discord",
    "Vantagem mural": "Name on the wall",
    "Texto apoio indisponivel":
      "Support is temporarily unavailable while a new payment method isn't live. Current supporters keep all their benefits.",
    "Nome no cartao": "Name on card",
    "Numero do cartao": "Card number",
    Validade: "Expiration",
    "sufixo mes": "/month",
    "Processando...": "Processing...",
    "Texto cobranca recorrente":
      "Monthly charge on your card, renewed automatically. You can cancel any time.",
    "Pagar com Pix": "Pay one month with Pix",

    // Subscription state
    "Apoio ao Pindorama ativo": "Support for Pindorama active",
    "Aguardando a cobranca": "Waiting for the charge",
    "Cobranca recusada": "Charge declined",
    "Assinatura pendente": "Subscription pending",
    "Assinatura cancelada": "Subscription cancelled",
    "Valor por mes": "{valor} per month, on your card",
    "Texto validacao cartao":
      "Mercado Pago ran a R$ 0.00 validation on your card just to confirm it works. That is not the charge, and nothing was debited for it.",
    "Texto cobranca a caminho":
      "The first charge goes out within the hour. The benefits land on your account as soon as it is approved, and there is nothing else for you to do.",
    "Texto beneficios ate": "Benefits active until {data}.",
    "Texto proxima cobranca": "Next charge on {data}.",
    "Texto cobranca recusada":
      "The last charge did not go through. Mercado Pago retries for up to 10 days and your access stays on during that window. To settle it now, pay one month with Pix.",
    "Texto assinatura pendente":
      "Mercado Pago has not authorized this subscription yet. If it stays this way for a few minutes, cancel it and try again.",
    "Texto assinatura cancelada":
      "There will be no further charges. Your access stays until the end of the period you already paid for.",
    "Cancelar assinatura": "Cancel subscription",
    "Cancelando...": "Cancelling...",
    "Erro ao cancelar":
      "We couldn't cancel it right now. Please try again in a moment.",
    "Erro ao iniciar apoio":
      "We couldn't start your support right now. Please try again in a moment.",
    "Erro no cartao":
      "We couldn't validate the card. Check the details and try again.",
    "Escaneie o QR Code": "Scan the QR Code",
    "Copiar codigo pix": "Copy Pix code",
    "Codigo copiado": "Code copied",
    "Texto pix pontual":
      "This Pix covers one month of support and doesn't renew. Your card subscription stays active.",

    // YouTube Card (extra)
    "Ver o canal": "Visit the channel",

    // Activation Card
    Sessao: "Dashboard",
    Ativar_cadastro: "Activate account",
    Ativacao: "Activation",
    "Ativando sua conta...": "Activating your account...",
    "Conta ativada!": "Account activated!",
    "Sucesso ativacao":
      "Your account was successfully activated. You can now sign in.",
    "Ativacao falhou": "Activation failed",
    "Voltar ao cadastro": "Back to sign up",

    // Status Page
    "Status do Sistema": "System Status",
    "Visao Geral": "Overview",
    "Banco de Dados": "Database",
    "Ultima Atualizacao": "Last Update",
    "Status Report": "Status Report",
    "Buscando telemetria...": "Fetching telemetry...",
    "Sistemas Operacionais": "Operational Systems",
    "Carregando metricas...": "Loading metrics...",
    "Versao (PostgreSQL)": "Version (PostgreSQL)",
    "Max Conexoes": "Max Connections",
    "Conexoes Ativas": "Active Connections",
    Uso: "Usage",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("pt");

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved === "pt" || saved === "en") {
      setLanguageState(saved);
      return;
    }

    let isMounted = true;

    async function detectLanguage() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ipapi failed");
        const data = await res.json();
        if (isMounted && data && data.country_code) {
          const code = data.country_code.toUpperCase();
          if (code === "BR" || code === "PT") {
            setLanguageState("pt");
          } else {
            setLanguageState("en");
          }
          return;
        }
      } catch {
        try {
          const res = await fetch("https://ipinfo.io/json");
          if (!res.ok) throw new Error("ipinfo failed");
          const data = await res.json();
          if (isMounted && data && data.country) {
            const code = data.country.toUpperCase();
            if (code === "BR" || code === "PT") {
              setLanguageState("pt");
            } else {
              setLanguageState("en");
            }
            return;
          }
        } catch {
          // Both geo-IP API calls failed or were blocked
        }
      }

      if (isMounted) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.toLowerCase().startsWith("en")) {
          setLanguageState("en");
        } else {
          setLanguageState("pt");
        }
      }
    }

    detectLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang === "pt" || lang === "en") {
      setLanguageState(lang);
      localStorage.setItem("language", lang);
    }
  }, []);

  const t = useCallback(
    (key, replacements = {}) => {
      let translation =
        translations[language]?.[key] || translations["pt"]?.[key] || key;
      Object.entries(replacements).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, v);
      });
      return translation;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default function useLanguage() {
  return useContext(LanguageContext);
}
