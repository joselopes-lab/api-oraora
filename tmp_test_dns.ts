import { dnsService } from './src/services/dns.service';
require('dotenv').config();

async function test() {
  const domain = 'mapon.com.br';
  const expectedIp1 = process.env.FIREBASE_IP_1;
  const expectedIp2 = process.env.FIREBASE_IP_2;
  const expectedIps = [];
  if (expectedIp1) expectedIps.push(expectedIp1);
  if (expectedIp2) expectedIps.push(expectedIp2);
  
  console.log(`Checking domain: ${domain}`);
  console.log(`Expected IPs: ${expectedIps}`);
  
  const connected = await dnsService.verifyDomainPointing(domain, expectedIps);
  
  if (connected) {
    console.log('STATUS: connected (Correct!)');
  } else {
    console.log('STATUS: pending (Still has old A record or different configuration)');
  }
}

test().catch(err => console.error(err));
