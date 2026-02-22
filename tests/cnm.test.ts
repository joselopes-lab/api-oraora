
import request from 'supertest';
import express from 'express';
import cnmRouter from '../src/routes/cnm';
import * as firestoreService from '../src/services/firestoreService';
import * as propertyMapper from '../src/services/propertyMapper';
import * as xmlBuilder from '../src/services/xmlBuilder';
import { xmlCache, warningsCache } from '../src/services/cache';
import { PropertyDoc } from '../src/types/firestore';
import { CnmImovel, MappingResult } from '../src/types/cnm';

// Mock das dependências
jest.mock('../src/services/firestoreService');
jest.mock('../src/services/propertyMapper');
jest.mock('../src/services/xmlBuilder');
jest.mock('../src/services/cache');

const mockedFirestore = firestoreService as jest.Mocked<typeof firestoreService>;
const mockedMapper = propertyMapper as jest.Mocked<typeof propertyMapper>;
const mockedXmlBuilder = xmlBuilder as jest.Mocked<typeof xmlBuilder>;

const app = express();
app.use('/', cnmRouter);

describe('CNM Routes', () => {
  // Suprime o console.error durante os testes para uma saída mais limpa
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /feed/:userId/status', () => {

    it('should return 404 if user portfolio is not found', async () => {
      mockedFirestore.getPortfolioPropertyIds.mockResolvedValue(null);

      const response = await request(app).get('/feed/nonexistent-user/status');

      expect(response.status).toBe(404);
      // CORREÇÃO: Ajusta a mensagem de erro para corresponder à implementação real
      expect(response.body).toEqual({ erro: 'Carteira não encontrada para o usuário \"nonexistent-user\".' });
    });

    it('should return 500 on internal server error', async () => {
      mockedFirestore.getPortfolioPropertyIds.mockRejectedValue(new Error('Firestore unavailable'));

      const response = await request(app).get('/feed/error-user/status');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ erro: 'Erro interno.' });
    });

    it('should process and return status correctly', async () => {
      const userId = 'test-user';
      const propertyIds = ['prop1', 'prop2-skipped'];
      
      const mockPropertyDoc: PropertyDoc = { 
        brokerId: userId, 
        isVisibleOnSite: true,
        estado: 'SP',
        cidade: 'São Paulo',
        bairro: 'Pinheiros'
      } as unknown as PropertyDoc;
      
      const properties = new Map<string, PropertyDoc>([['prop1', mockPropertyDoc]]);
      
      const mappingResult: MappingResult = {
        imovel: { referencia: 'prop1', estado: 'SP', cidade: 'São Paulo', bairro: 'Pinheiros' } as CnmImovel,
        propertyId: 'prop1',
        warnings: ['Aviso de teste'],
      };

      mockedFirestore.getPortfolioPropertyIds.mockResolvedValue(propertyIds);
      // CORREÇÃO: Mock da função correta `getPropertiesByIdsSimple`
      mockedFirestore.getPropertiesByIdsSimple.mockResolvedValue(properties);
      mockedMapper.mapPropertyToCnm.mockReturnValue(mappingResult);

      const response = await request(app).get(`/feed/${userId}/status`);

      expect(response.status).toBe(200);
      // CORREÇÃO: Valida os campos corretos retornados pela API de status
      expect(response.body.userId).toBe(userId);
      expect(response.body.totalNoXml).toBe(1);
      expect(response.body.ignorados).toBe(1); // 'prop2-skipped' não estava no mapa de propriedades
      expect(response.body.avisos).toEqual(['Aviso de teste']);
      expect(response.body.feedUrl).toContain(`/feed/${userId}/xml`);
    });
  });

  describe('POST /feed/:userId/cache/invalidate', () => {
    it('should invalidate user cache and return success message', async () => {
      const userId = 'user-to-invalidate';
      const response = await request(app).post(`/feed/${userId}/cache/invalidate`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mensagem: `Cache do usuário "${userId}" invalidado.` });
    });
  });
});
