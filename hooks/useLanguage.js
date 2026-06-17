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
    Sobre: "Sobre",
    Portfolio: "Portfolio",
    "Em Breve": "Em Breve",
    portfolio_desc:
      "Um espaço dedicado a apresentar projetos, demonstrações técnicas e experimentações artísticas criadas com a Pindorama Engine.",
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
    "Bem vindo": "Bem vindo, {username}",
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
    Sobre: "About",
    Portfolio: "Portfolio",
    "Em Breve": "Coming Soon",
    portfolio_desc:
      "A space dedicated to presenting projects, technical demonstrations, and artistic experiments created with the Pindorama Engine.",
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
