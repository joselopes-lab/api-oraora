import request from 'supertest';
import express from 'express';
import dns from 'dns';
import dnsRouter from '../src/routes/dns';

// Mock dns module
jest.mock('dns', () => ({
  promises: {
    resolve4: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/dns', dnsRouter);

describe('DNS Verification API', () => {
  const FIREBASE_IP_1 = '199.36.158.100';
  const FIREBASE_IP_2 = '151.101.1.195';

  beforeAll(() => {
    process.env.FIREBASE_IP_1 = FIREBASE_IP_1;
    process.env.FIREBASE_IP_2 = FIREBASE_IP_2;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return connected status if domain points to correct Firebase IP', async () => {
    (dns.promises.resolve4 as jest.Mock).mockResolvedValue([FIREBASE_IP_1]);

    const response = await request(app)
      .get('/api/dns/verify')
      .query({ domain: 'www.davicoelho.com.br' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'connected',
      domain: 'www.davicoelho.com.br',
      message: 'Apontamento correto.'
    });
    expect(dns.promises.resolve4).toHaveBeenCalledWith('www.davicoelho.com.br');
  });

  it('should return pending status if domain points to wrong IP', async () => {
    (dns.promises.resolve4 as jest.Mock).mockResolvedValue(['1.2.3.4']);

    const response = await request(app)
      .get('/api/dns/verify')
      .query({ domain: 'wrong.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'pending',
      domain: 'wrong.com',
      message: 'Aguardando propagação ou configuração incorreta.'
    });
  });

  it('should return pending status if domain has no A records', async () => {
    (dns.promises.resolve4 as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/api/dns/verify')
      .query({ domain: 'norecords.com' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending');
  });

  it('should return pending status if domain resolution fails (ENOTFOUND)', async () => {
    const error = new Error('getaddrinfo ENOTFOUND invalid.domain');
    (error as any).code = 'ENOTFOUND';
    (dns.promises.resolve4 as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .get('/api/dns/verify')
      .query({ domain: 'invalid.domain' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending');
  });

  it('should return 400 if domain query parameter is missing', async () => {
    const response = await request(app)
      .get('/api/dns/verify');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 500 if an unexpected error occurs during resolution', async () => {
    (dns.promises.resolve4 as jest.Mock).mockRejectedValue(new Error('Unexpected DNS error'));

    const response = await request(app)
      .get('/api/dns/verify')
      .query({ domain: 'error.com' });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});
