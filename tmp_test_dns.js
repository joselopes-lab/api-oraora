const { dnsService } = require('./src/services/dns.service');
require('dotenv').config();

async function test() {
  const domain = 'mapon.com.br';
  const expectedIps = [process.env.FIREBASE_IP_1, process.env.FIREBASE_IP_2];
  
  console.log(`Checking domain: ${domain}`);
  console.log(`Expected IPs: ${expectedIps}`);
  
  const connected = await dnsService.verifyDomainPointing(domain, expectedIps);
  
  if (connected) {
    console.log('STATUS: connected (Correct!)');
  } else {
    console.log('STATUS: pending (Still has old A record 46.202.145.164 or IPv6)');
  }
}

test();
