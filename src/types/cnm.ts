// ─────────────────────────────────────────────────────────────────────────────
// types/cnm.ts
//
// Tipos que espelham o schema XML do Chaves na Mão.
// Ref: https://tecnologiacnm.github.io/cnm-xml-documentation/
// ─────────────────────────────────────────────────────────────────────────────

export type Transacao = 'V' | 'L';
export type Finalidade = 'RE' | 'CO' | 'RU';
export type PeriodoLocacao = 1 | 2 | 3 | 4; // 1=Mês 2=Dia 3=Ano 4=Semana

export interface CnmFoto {
  url: string;
  dataAtualizacao?: string; // YYYY-MM-DD HH:MM:SS
}

export interface CnmImovel {
  // ── Obrigatórios ──────────────────────────────────────────────
  referencia: string;
  transacao: Transacao;
  finalidade: Finalidade;
  destaque: 0 | 1;
  tipo: string;
  valor: number;
  estado: string;
  cidade: string;
  bairro: string;
  descritivo: string;

  // ── Opcionais de identificação ────────────────────────────────
  codigoCliente?: string;
  linkCliente?: string;
  titulo?: string;

  // ── Transação / finalidade secundária ─────────────────────────
  transacao2?: Transacao;
  finalidade2?: Finalidade;
  tipo2?: string;

  // ── Valores ───────────────────────────────────────────────────
  valorLocacao?: number;
  valorIptu?: number;
  valorCondominio?: number;

  // ── Área ──────────────────────────────────────────────────────
  areaTotal?: number;
  areaUtil?: number;

  // ── Cômodos ───────────────────────────────────────────────────
  quartos?: number;
  suites?: number;
  garagem?: number;
  banheiro?: number;
  closet?: number;
  salas?: number;
  despensa?: number;
  bar?: number;
  cozinha?: number;
  quartoEmpregada?: number;
  escritorio?: number;
  areaServico?: number;
  lareira?: number;
  varanda?: number;
  lavanderia?: number;

  // ── Endereço ──────────────────────────────────────────────────
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  esconderEndereco?: 0 | 1;
  latitude?: string;
  longitude?: string;

  // ── Mídia / extras ────────────────────────────────────────────
  video?: string;
  tour360?: string;
  dataAtualizacao?: string;

  // ── Condições ─────────────────────────────────────────────────
  aceitaTroca?: 0 | 1;
  aceitaPet?: 0 | 1;
  periodoLocacao?: PeriodoLocacao;

  // ── TAGs compostas ────────────────────────────────────────────
  fotosImovel?: CnmFoto[];
  areaComum?: string[];
  areaPrivativa?: string[];
}

// Resultado do mapeamento com metadados para diagnóstico
export interface MappingResult {
  imovel: CnmImovel;
  propertyId: string;
  warnings: string[]; // campos obrigatórios que estavam ausentes
}