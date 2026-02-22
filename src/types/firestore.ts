// ─────────────────────────────────────────────────────────────────────────────
// types/firestore.ts
//
// Espelha a estrutura real das collections no Firestore.
// Ajuste os sub-campos conforme necessário no seu projeto.
// ─────────────────────────────────────────────────────────────────────────────

// ── Collection: portfolios ────────────────────────────────────────────────────
// Documento cujo ID = UID do usuário (brokerId)
export interface PortfolioDoc {
    propertyIds: string[]; // UIDs dos imóveis que pertencem à carteira
    brokerId?: string;
    createdAt?: FirebaseFirestore.Timestamp;
    updatedAt?: FirebaseFirestore.Timestamp;
  }
  
  // ── Collection: properties ───────────────────────────────────────────────────
  // Documento cujo ID = UID do imóvel
  export interface PropertyDoc {
    // ── Identificação ────────────────────────────────────────────
    brokerId: string;
    builderId?: string;
    clientId?: string;
    personaIds?: string[];
    slug?: string;
    isVisibleOnSite: boolean;
    clicks?: number;
    views?: number;
    createdAt?: FirebaseFirestore.Timestamp;
  
    // ── SEO ──────────────────────────────────────────────────────
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
  
    // ── Informações básicas do imóvel ─────────────────────────────
    // Campos que você provavelmente tem aqui. Ajuste conforme seu schema.
    informacoesbasicas?: InformacoesBasicas;
  
    // ── Localização ───────────────────────────────────────────────
    localizacao?: Localizacao;
  
    // ── Mídias ───────────────────────────────────────────────────
    midia?: Midia;
  
    // ── Características e comodidades ────────────────────────────
    caracteristicasimovel?: CaracteristicasImovel;
    areascomuns?: string[]; // ex: ["Piscina", "Academia", "Salão de Festas"]
  
    // ── Documentação / status ─────────────────────────────────────
    documentacao?: Documentacao;
    statusobra?: StatusObra;
  
    // ── Contato e extras ─────────────────────────────────────────
    contato?: Contato;
    proximidades?: string[];
    youtubeVideoUrl?: string;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Sub-tipos
  // ─────────────────────────────────────────────────────────────────────────────
  
  export interface InformacoesBasicas {
    // Tipo do imóvel no formato do Chaves na Mão
    // ex: "Apartamento", "Casa", "Cobertura", "Flat", "Kitnet/Studio"
    tipoImovel?: string;
  
    // Transação: "V" = Venda, "L" = Locação
    tipoTransacao?: string; // "venda" | "locacao" | "venda_locacao"
  
    // Valores
    valorVenda?: number;
    valorLocacao?: number;
    valorIPTU?: number;
    valorCondominio?: number;
  
    // Finalidade: "RE" = Residencial, "CO" = Comercial, "RU" = Rural
    finalidade?: string; // "residencial" | "comercial" | "rural"
  
    // Metragem
    areaTotal?: number;
    areaUtil?: number;
  
    // Cômodos
    quartos?: number;
    suites?: number;
    banheiros?: number;
    garagem?: number;
    vagas?: number; // alternativa para garagem
    closets?: number;
    salas?: number;
    varanda?: number;
    lavanderia?: number;
    areaServico?: number;
    cozinha?: number;
    despensa?: number;
    bar?: number;
    lareira?: number;
    escritorio?: number;
    quartoEmpregada?: number;
  
    // Flags
    aceitaTroca?: boolean;
    aceitaPet?: boolean;
    destaque?: boolean;
    esconderEndereco?: boolean;
  
    // Período de locação: 1=Mês, 2=Dia, 3=Ano, 4=Semana
    periodoLocacao?: 1 | 2 | 3 | 4;
  
    // Descrição do imóvel (máx 3000 chars para CNM)
    descricao?: string;
  
    // Título
    titulo?: string;
  }
  
  export interface Localizacao {
    estado?: string; // UF com 2 letras, ex: "SP"
    cidade?: string;
    bairro?: string;
    cep?: string;
    logradouro?: string; // nome da rua sem número
    endereco?: string;   // alternativa: rua completa
    numero?: string;
    complemento?: string;
    latitude?: string | number;
    longitude?: string | number;
  }
  
  export interface Midia {
    fotos?: FotoItem[];
    tourVirtual360?: string;
    videoYoutube?: string; // alternativa ao campo raiz youtubeVideoUrl
  }
  
  export interface FotoItem {
    url: string;
    ordem?: number;
    legenda?: string;
    dataAtualizacao?: string; // formato: "YYYY-MM-DD HH:MM:SS"
  }
  
  export interface CaracteristicasImovel {
    // Características da área privativa (dentro do imóvel)
    areaPrivativa?: string[]; // ex: ["Ar-condicionado", "Piso laminado"]
    // Outros campos de características que você possa ter
    [key: string]: unknown;
  }
  
  export interface Documentacao {
    matricula?: string;
    registroIncorporacao?: string;
    habiteSeObtido?: boolean;
    [key: string]: unknown;
  }
  
  export interface StatusObra {
    status?: string; // ex: "pronto", "em_construcao", "lancamento"
    previsaoEntrega?: string;
    [key: string]: unknown;
  }
  
  export interface Contato {
    nome?: string;
    telefone?: string;
    email?: string;
    [key: string]: unknown;
  }