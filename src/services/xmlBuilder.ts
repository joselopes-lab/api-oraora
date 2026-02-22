// ─────────────────────────────────────────────────────────────────────────────
// services/xmlBuilder.ts
//
// Constrói o XML no formato exigido pelo Chaves na Mão.
// Ref: https://tecnologiacnm.github.io/cnm-xml-documentation/
// ─────────────────────────────────────────────────────────────────────────────

import { CnmFoto, CnmImovel } from '../types/cnm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function t(name: string, value: unknown, indent = '    '): string {
  if (value === null || value === undefined || value === '') return '';
  return `${indent}<${name}>${escapeXml(value)}</${name}>\n`;
}

// ── Seções compostas ──────────────────────────────────────────────────────────

function buildFotos(fotos: CnmFoto[]): string {
  if (!fotos?.length) return '';
  const items = fotos
    .map(
      (f) =>
        `      <foto>\n` +
        `        <url>${escapeXml(f.url)}</url>\n` +
        (f.dataAtualizacao ? `        <data_atualizacao>${escapeXml(f.dataAtualizacao)}</data_atualizacao>\n` : '') +
        `      </foto>\n`
    )
    .join('');
  return `    <fotos_imovel>\n${items}    </fotos_imovel>\n`;
}

function buildAreaList(tagName: string, itens: string[]): string {
  if (!itens?.length) return '';
  const items = itens.map((i) => `      <item>${escapeXml(i)}</item>\n`).join('');
  return `    <${tagName}>\n${items}    </${tagName}>\n`;
}

// ── Bloco <imovel> ────────────────────────────────────────────────────────────

function buildImovelBlock(im: CnmImovel): string {
  return (
    `  <imovel>\n` +
    // ── obrigatórios ──────────────────────────────────────────────
    t('referencia', im.referencia) +
    t('transacao', im.transacao) +
    t('finalidade', im.finalidade) +
    t('destaque', im.destaque) +
    t('tipo', im.tipo) +
    t('valor', im.valor) +
    t('estado', im.estado) +
    t('cidade', im.cidade) +
    t('bairro', im.bairro) +
    t('descritivo', im.descritivo) +
    // ── identificação ─────────────────────────────────────────────
    t('codigo_cliente', im.codigoCliente) +
    t('link_cliente', im.linkCliente) +
    t('titulo', im.titulo) +
    // ── transação / finalidade secundária ─────────────────────────
    t('transacao2', im.transacao2) +
    t('finalidade2', im.finalidade2) +
    t('tipo2', im.tipo2) +
    // ── valores ───────────────────────────────────────────────────
    t('valor_locacao', im.valorLocacao) +
    t('valor_iptu', im.valorIptu) +
    t('valor_condominio', im.valorCondominio) +
    // ── área ──────────────────────────────────────────────────────
    t('area_total', im.areaTotal) +
    t('area_util', im.areaUtil) +
    // ── cômodos ───────────────────────────────────────────────────
    t('quartos', im.quartos) +
    t('suites', im.suites) +
    t('garagem', im.garagem) +
    t('banheiro', im.banheiro) +
    t('closet', im.closet) +
    t('salas', im.salas) +
    t('despensa', im.despensa) +
    t('bar', im.bar) +
    t('cozinha', im.cozinha) +
    t('quarto_empregada', im.quartoEmpregada) +
    t('escritorio', im.escritorio) +
    t('area_servico', im.areaServico) +
    t('lareira', im.lareira) +
    t('varanda', im.varanda) +
    t('lavanderia', im.lavanderia) +
    // ── endereço ──────────────────────────────────────────────────
    t('cep', im.cep) +
    t('endereco', im.endereco) +
    t('numero', im.numero) +
    t('complemento', im.complemento) +
    t('esconder_endereco_imovel', im.esconderEndereco) +
    t('latitude', im.latitude) +
    t('longitude', im.longitude) +
    // ── mídia ─────────────────────────────────────────────────────
    t('video', im.video) +
    t('tour_360', im.tour360) +
    t('data_atualizacao', im.dataAtualizacao) +
    // ── condições ─────────────────────────────────────────────────
    t('aceita_troca', im.aceitaTroca) +
    t('aceita_pet', im.aceitaPet) +
    t('periodo_locacao', im.periodoLocacao) +
    // ── compostos ─────────────────────────────────────────────────
    buildFotos(im.fotosImovel ?? []) +
    buildAreaList('area_comum', im.areaComum ?? []) +
    buildAreaList('area_privativa', im.areaPrivativa ?? []) +
    `  </imovel>\n`
  );
}

// ── Exportado ─────────────────────────────────────────────────────────────────

export function buildXml(imoveis: CnmImovel[]): string {
  const body = imoveis.map(buildImovelBlock).join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<document>\n` +
    `  <imoveis>\n` +
    body +
    `  </imoveis>\n` +
    `</document>`
  );
}