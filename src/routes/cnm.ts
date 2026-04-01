// ─────────────────────────────────────────────────────────────────────────────
// routes/cnm.ts
//
// Endpoints públicos por usuário para integração com o Chaves na Mão.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { getPortfolioPropertyIds, getPropertiesByIdsSimple } from '../services/firestoreService';
import { mapPropertyToCnm } from '../services/propertyMapper';
import { buildXml } from '../services/xmlBuilder';
import { xmlCache, warningsCache } from '../services/cache';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Função central: busca carteira + imóveis + gera XML
// ─────────────────────────────────────────────────────────────────────────────

async function generateXmlForUser(userId: string): Promise<{
  xml: string;
  warnings: string[];
  total: number;
  skipped: number;
}> {
  // 1. Busca a carteira do usuário
  const propertyIds = await getPortfolioPropertyIds(userId);

  if (propertyIds === null) {
    throw { status: 404, message: `Carteira não encontrada para o usuário "${userId}".` };
  }

  if (propertyIds.length === 0) {
    return { xml: buildXml([]), warnings: [], total: 0, skipped: 0 };
  }

  // 2. Busca os documentos de imóveis (apenas os visíveis no site)
  const propertiesMap = await getPropertiesByIdsSimple(propertyIds, true);

  const allWarnings: string[] = [];
  const cnmImoveis = [];

  // 3. Mapeia cada imóvel para o formato CNM
  for (const [id, doc] of propertiesMap.entries()) {
    const mappingResult = mapPropertyToCnm(id, doc);
    const { imovel, warnings } = mappingResult;

    allWarnings.push(...warnings);

    if (!imovel.estado || !imovel.cidade || !imovel.bairro) {
      allWarnings.push(`[${id}] Ignorado no XML: endereço incompleto (estado/cidade/bairro).`);
      continue;
    }

    cnmImoveis.push(imovel);
  }

  // 4. Gera o XML e calcula os totais
  const xml = buildXml(cnmImoveis);
  const skipped = propertyIds.length - cnmImoveis.length;

  return {
    xml,
    warnings: allWarnings,
    total: cnmImoveis.length,
    skipped,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /feed/:userId/xml
//
// URL pública para o Chaves na Mão.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/feed/:userId/xml', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId || userId.length < 4) {
    res.status(400).send('userId inválido.');
    return;
  }

  const cached = xmlCache.get(userId);
  if (cached) {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('X-Cache', 'HIT');
    res.send(cached);
    return;
  }

  try {
    const { xml, warnings, total, skipped } = await generateXmlForUser(userId);

    xmlCache.set(userId, xml);
    warningsCache.set(userId, warnings);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('X-Cache', 'MISS');
    res.set('X-Total-Imoveis', String(total));
    res.set('X-Skipped-Imoveis', String(skipped));
    res.send(xml);
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string };
    if (typed.status === 404) {
      res.status(404).send(typed.message ?? 'Não encontrado.');
    } else {
      console.error('[CNM XML ERROR]', err);
      res.status(500).send('Erro interno ao gerar o XML.');
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /feed/:userId/status
//
// Diagnóstico para o desenvolvedor.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/feed/:userId/status', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  xmlCache.invalidate(userId);
  warningsCache.invalidate(userId);

  try {
    const { total, skipped, warnings } = await generateXmlForUser(userId);

    res.json({
      userId,
      totalNoXml: total,
      ignorados: skipped,
      avisos: warnings,
      feedUrl: `${req.protocol}://${req.get('host')}/feed/${userId}/xml`,
    });
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string };
    if (typed.status === 404) {
      res.status(404).json({ erro: typed.message });
    } else {
      console.error('[CNM STATUS ERROR]', err);
      res.status(500).json({ erro: 'Erro interno.' });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /feed/:userId/cache/invalidate
//
// Força a invalidação do cache do usuário.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/feed/:userId/cache/invalidate', (req: Request, res: Response): void => {
  const { userId } = req.params;
  xmlCache.invalidate(userId);
  warningsCache.invalidate(userId);
  res.json({ mensagem: `Cache do usuário "${userId}" invalidado.` });
});

export default router;
