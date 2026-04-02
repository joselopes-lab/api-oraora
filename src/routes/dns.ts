import { Router, Request, Response } from 'express';
import { dnsService } from '../services/dnsService';

const router = Router();

/**
 * GET /api/dns/verify?domain=example.com
 * Verifies if the domain points to our expected Firebase IPs.
 */
router.get('/verify', async (req: Request, res: Response) => {
  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain query parameter is required' });
  }

  try {
    const firebaseIp1 = process.env.FIREBASE_IP_1 || '199.36.158.100';
    const firebaseIp2 = process.env.FIREBASE_IP_2 || '151.101.1.195';
    const expectedIps = [firebaseIp1, firebaseIp2];

    const isConnected = await dnsService.verifyDomainPointing(domain, expectedIps);

    if (isConnected) {
      return res.json({
        status: 'connected',
        domain,
        message: 'Apontamento correto.'
      });
    }

    return res.json({
      status: 'pending',
      domain,
      message: 'Aguardando propagação ou configuração incorreta.'
    });
  } catch (error) {
    console.error(`DNS Verification Error for ${domain}:`, error);
    return res.status(500).json({
      error: 'Failed to verify DNS pointing',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
