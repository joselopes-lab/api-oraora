// ─────────────────────────────────────────────────────────────────────────────
// services/propertyMapper.ts
//
// Converte um documento PropertyDoc do Firestore para o formato CnmImovel
// exigido pelo Chaves na Mão.
//
// ⚠️  ATENÇÃO: Este arquivo é o coração do mapeamento. Se seus campos no
// Firestore tiverem nomes diferentes dos assumidos aqui, ajuste as linhas
// marcadas com "// 👈 AJUSTE" para refletir seu schema real.
// ─────────────────────────────────────────────────────────────────────────────

import { CnmImovel, CnmFoto, Finalidade, MappingResult, Transacao } from '../types/cnm';
import { PropertyDoc } from '../types/firestore';

// ── Helpers de normalização ───────────────────────────────────────────────────

/** Normaliza o tipo de transação para os valores aceitos pelo CNM */
function mapTransacao(value?: string): Transacao | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === 'v' || v === 'venda' || v === 'sale') return 'V';
  if (v === 'l' || v === 'locacao' || v === 'locação' || v === 'aluguel' || v === 'rent') return 'L';
  return undefined;
}

/** Normaliza a finalidade para os valores aceitos pelo CNM */
function mapFinalidade(value?: string): Finalidade | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === 're' || v === 'residencial') return 'RE';
  if (v === 'co' || v === 'comercial') return 'CO';
  if (v === 'ru' || v === 'rural') return 'RU';
  return undefined;
}

/**
 * Normaliza o tipo de imóvel para os valores aceitos pelo Chaves na Mão.
 * Adicione mais mapeamentos conforme necessário.
 */
function mapTipoImovel(value?: string): string {
  if (!value) return 'Apartamento'; // fallback padrão
  const map: Record<string, string> = {
    apartamento: 'Apartamento',
    'apartamento garden': 'Apartamento Garden',
    'apartamento duplex': 'Apartamento Duplex',
    'apartamento triplex': 'Apartamento Triplex',
    cobertura: 'Cobertura',
    'cobertura duplex': 'Cobertura Duplex',
    'cobertura triplex': 'Cobertura Triplex',
    casa: 'Casa',
    'casa em condominio': 'Casa em Condomínio',
    'casa em condomínio': 'Casa em Condomínio',
    'casa de vila': 'Casa de Vila',
    flat: 'Flat',
    kitnet: 'Kitnet/Studio',
    studio: 'Kitnet/Studio',
    'kitnet/studio': 'Kitnet/Studio',
    loft: 'Loft',
    chacara: 'Chácara',
    chácara: 'Chácara',
    sitio: 'Sítio',
    sítio: 'Sítio',
    fazenda: 'Fazenda',
    terreno: 'Terreno',
    village: 'Village',
    // Comercial
    galpao: 'Galpão',
    galpão: 'Galpão',
    loja: 'Loja',
    'sala comercial': 'Sala Comercial',
    'sala/conjunto': 'Sala/Conjunto',
    'predio comercial': 'Prédio Comercial',
    'ponto comercial': 'Ponto Comercial',
    consultorio: 'Consultório',
    consultório: 'Consultório',
  };
  return map[value.toLowerCase()] ?? value;
}

/** Garante que um timestamp do Firestore vire string legível pelo CNM */
function mapTimestamp(ts?: any): string {
  // Retorna a data/hora atual se nenhuma for fornecida.
  if (!ts) {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Se for uma string, garante que está no formato correto.
  if (typeof ts === 'string') {
    return ts.slice(0, 19);
  }

  // Se for um objeto Timestamp do Firestore, converte para string.
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Se for um objeto com _seconds (comum em serializações), converte.
  if (typeof ts === 'object' && ts !== null && typeof ts._seconds === 'number') {
    const date = new Date(ts._seconds * 1000 + (ts._nanoseconds ?? 0) / 1000000);
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
  
  // Como fallback, retorna a data/hora atual para tipos inesperados.
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/** Trunca a descrição para no máximo 3000 caracteres */
function truncateDescricao(text?: string): string {
  if (!text) return '';
  return text.slice(0, 3000);
}

/** Normaliza o CEP para o formato 99999-999 */
function formatCep(cep?: string): string | undefined {
  if (!cep) return undefined;
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// ── Mapeador principal ────────────────────────────────────────────────────────

export function mapPropertyToCnm(propertyId: string, doc: PropertyDoc): MappingResult {
  const warnings: string[] = [];

  const info = doc.informacoesbasicas ?? {};
  const loc = doc.localizacao ?? {};
  const media = doc.midia ?? {};
  const caract = doc.caracteristicasimovel ?? {};

  // ── Transação ──────────────────────────────────────────────────────────────
  // 👈 AJUSTE: se seu campo se chama diferente de tipoTransacao
  const transacao = mapTransacao(info.tipoTransacao);
  const transacao2 = info.tipoTransacao?.toLowerCase() === 'venda_locacao' ? 'L' : undefined;

  if (!transacao) {
    warnings.push(`[${propertyId}] "tipoTransacao" ausente ou inválido — será ignorado no XML.`);
  }

  // ── Finalidade ─────────────────────────────────────────────────────────────
  // 👈 AJUSTE: se seu campo se chama diferente de finalidade
  const finalidade = mapFinalidade(info.finalidade) ?? 'RE';

  // ── Tipo ───────────────────────────────────────────────────────────────────
  // 👈 AJUSTE: se seu campo se chama diferente de tipoImovel
  const tipo = mapTipoImovel(info.tipoImovel);

  // ── Valor ──────────────────────────────────────────────────────────────────
  // Usa valorVenda para transação V, valorLocacao para L
  // 👈 AJUSTE: nomes dos campos de valor
  const transacaoResolvida = transacao ?? 'V';
  const valor =
    transacaoResolvida === 'L'
      ? (info.valorLocacao ?? info.valorVenda ?? 0)
      : (info.valorVenda ?? 0);

  if (!valor) warnings.push(`[${propertyId}] Valor do imóvel está zerado.`);

  // ── Localização ────────────────────────────────────────────────────────────
  // 👈 AJUSTE: nomes dos campos dentro de localizacao
  if (!loc.estado) warnings.push(`[${propertyId}] "estado" (UF) ausente.`);
  if (!loc.cidade) warnings.push(`[${propertyId}] "cidade" ausente.`);
  if (!loc.bairro) warnings.push(`[${propertyId}] "bairro" ausente.`);

  // ── Fotos ──────────────────────────────────────────────────────────────────
  // 👈 AJUSTE: se as fotos estiverem em outro campo
  const fotos: CnmFoto[] = (media.fotos ?? [])
    .filter((f) => !!f.url)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((f) => ({
      url: f.url,
      ...(f.dataAtualizacao ? { dataAtualizacao: f.dataAtualizacao } : {}),
    }));

  // ── Descrição ──────────────────────────────────────────────────────────────
  // 👈 AJUSTE: se sua descrição principal estiver em outro campo
  const descritivo =
    truncateDescricao(info.descricao) ||
    truncateDescricao(doc.seoDescription) ||
    `${tipo} ${loc.bairro ? `no ${loc.bairro}` : ''} ${loc.cidade ?? ''}`.trim();

  if (!descritivo) warnings.push(`[${propertyId}] "descritivo" ausente.`);

  // ── Áreas comuns e privativas ──────────────────────────────────────────────
  // 👈 AJUSTE: se esses arrays estiverem em outros campos
  const areaComum: string[] = doc.areascomuns ?? [];
  const areaPrivativa: string[] = caract.areaPrivativa ?? [];

  // ── Garagem ────────────────────────────────────────────────────────────────
  // Aceita "garagem" ou "vagas" como alternativa
  const garagem = info.garagem ?? info.vagas;

  // ── Latitude / Longitude ───────────────────────────────────────────────────
  const latitude = loc.latitude !== undefined ? String(loc.latitude) : undefined;
  const longitude = loc.longitude !== undefined ? String(loc.longitude) : undefined;

  // ── Vídeo ──────────────────────────────────────────────────────────────────
  const video = doc.youtubeVideoUrl ?? media.videoYoutube;

  // ── Montagem do CnmImovel ──────────────────────────────────────────────────
  const imovel: CnmImovel = {
    // obrigatórios
    referencia: propertyId,
    transacao: transacaoResolvida as Transacao,
    finalidade,
    destaque: info.destaque ? 1 : 0,
    tipo,
    valor,
    estado: (loc.estado ?? '').toUpperCase(),
    cidade: loc.cidade ?? '',
    bairro: loc.bairro ?? '',
    descritivo,

    // identificação
    codigoCliente: propertyId,
    titulo: info.titulo ?? doc.seoTitle,

    // transação dual (venda + locação)
    ...(transacao2 ? { transacao2 } : {}),
    ...(transacao2 && info.valorLocacao ? { valorLocacao: info.valorLocacao } : {}),

    // valores financeiros
    ...(info.valorIPTU ? { valorIptu: info.valorIPTU } : {}),
    ...(info.valorCondominio ? { valorCondominio: info.valorCondominio } : {}),

    // área
    ...(info.areaTotal ? { areaTotal: info.areaTotal } : {}),
    ...(info.areaUtil ? { areaUtil: info.areaUtil } : {}),

    // cômodos
    ...(info.quartos ? { quartos: info.quartos } : {}),
    ...(info.suites ? { suites: info.suites } : {}),
    ...(garagem ? { garagem } : {}),
    ...(info.banheiros ? { banheiro: info.banheiros } : {}),
    ...(info.closets ? { closet: info.closets } : {}),
    ...(info.salas ? { salas: info.salas } : {}),
    ...(info.despensa ? { despensa: info.despensa } : {}),
    ...(info.bar ? { bar: info.bar } : {}),
    ...(info.cozinha ? { cozinha: info.cozinha } : {}),
    ...(info.quartoEmpregada ? { quartoEmpregada: info.quartoEmpregada } : {}),
    ...(info.escritorio ? { escritorio: info.escritorio } : {}),
    ...(info.areaServico ? { areaServico: info.areaServico } : {}),
    ...(info.lareira ? { lareira: info.lareira } : {}),
    ...(info.varanda ? { varanda: info.varanda } : {}),
    ...(info.lavanderia ? { lavanderia: info.lavanderia } : {}),

    // endereço
    ...(loc.cep ? { cep: formatCep(loc.cep) } : {}),
    ...(loc.logradouro ?? loc.endereco ? { endereco: loc.logradouro ?? loc.endereco } : {}),
    ...(loc.numero ? { numero: loc.numero } : {}),
    ...(loc.complemento ? { complemento: loc.complemento } : {}),
    ...(info.esconderEndereco ? { esconderEndereco: 1 } : {}),
    ...(latitude ? { latitude } : {}),
    ...(longitude ? { longitude } : {}),

    // mídia
    ...(video ? { video } : {}),
    ...(media.tourVirtual360 ? { tour360: media.tourVirtual360 } : {}),
    dataAtualizacao: mapTimestamp(doc.createdAt),

    // condições
    ...(info.aceitaTroca !== undefined ? { aceitaTroca: info.aceitaTroca ? 1 : 0 } : {}),
    ...(info.aceitaPet !== undefined ? { aceitaPet: info.aceitaPet ? 1 : 0 } : {}),
    ...(info.periodoLocacao ? { periodoLocacao: info.periodoLocacao } : {}),

    // compostos
    ...(fotos.length > 0 ? { fotosImovel: fotos } : {}),
    ...(areaComum.length > 0 ? { areaComum } : {}),
    ...(areaPrivativa.length > 0 ? { areaPrivativa } : {}),
  };

  return { imovel, propertyId, warnings };
}
