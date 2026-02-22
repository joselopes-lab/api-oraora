// ─────────────────────────────────────────────────────────────────────────────
// services/firestoreService.ts
//
// Acesso ao Firestore: lê a carteira do usuário (portfolios) e busca
// os imóveis correspondentes (properties) em batch.
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin';
import { PortfolioDoc, PropertyDoc } from '../types/firestore';

const PORTFOLIOS_COLLECTION = 'portfolios';   // 
const PROPERTIES_COLLECTION = 'properties';   // 
const BATCH_SIZE = 30;                         // Firestore limita 'in' a 30 itens

/**
 * Retorna os IDs dos imóveis na carteira do usuário.
 * Retorna null se o documento não existir.
 */
export async function getPortfolioPropertyIds(userId: string): Promise<string[] | null> {
  const db = admin.firestore();
  const docRef = db.collection(PORTFOLIOS_COLLECTION).doc(userId);
  const snap = await docRef.get();

  if (!snap.exists) return null;

  const data = snap.data() as PortfolioDoc;
  return data.propertyIds ?? [];
}

/**
 * Busca os documentos de imóveis a partir de uma lista de IDs.
 * Faz a busca em batches para respeitar o limite do Firestore.
 * Filtra automaticamente imóveis com isVisibleOnSite = false.
 */
export async function getPropertiesByIds(
  propertyIds: string[],
  onlyVisible = true
): Promise<Map<string, PropertyDoc>> {
  const db = admin.firestore();
  const result = new Map<string, PropertyDoc>();

  if (propertyIds.length === 0) return result;

  // Divide em batches de BATCH_SIZE (limite do operador 'in' no Firestore)
  for (let i = 0; i < propertyIds.length; i += BATCH_SIZE) {
    const chunk = propertyIds.slice(i, i + BATCH_SIZE);

    const snap = await db
      .collection(PROPERTIES_COLLECTION)
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as PropertyDoc;
      if (onlyVisible && data.isVisibleOnSite === false) continue;
      result.set(doc.id, data);
    }
  }

  return result;
}

/**
 * Versão alternativa mais simples: busca cada documento individualmente.
 * Use esta se tiver problemas com o filtro por __name__ acima.
 */
export async function getPropertiesByIdsSimple(
  propertyIds: string[],
  onlyVisible = true
): Promise<Map<string, PropertyDoc>> {
  const db = admin.firestore();
  const result = new Map<string, PropertyDoc>();

  if (propertyIds.length === 0) return result;

  // Busca paralela com Promise.all para eficiência
  const chunks: string[][] = [];
  for (let i = 0; i < propertyIds.length; i += BATCH_SIZE) {
    chunks.push(propertyIds.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (id) => {
        const snap = await db.collection(PROPERTIES_COLLECTION).doc(id).get();
        if (!snap.exists) return;
        const data = snap.data() as PropertyDoc;
        if (onlyVisible && data.isVisibleOnSite === false) return;
        result.set(snap.id, data);
      })
    );
  }

  return result;
}
