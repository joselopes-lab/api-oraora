import dns from 'dns';

export class DnsService {
  /**
   * Resolves 'A' records for a given domain.
   * @param domain Domain to resolve
   * @returns List of IP addresses
   */
  async resolveARecords(domain: string): Promise<string[]> {
    try {
      // Using Promises version of dns.resolve4
      const addresses = await dns.promises.resolve4(domain);
      return addresses;
    } catch (error: any) {
      if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Verifies if any of the resolved IPs match the expected target IPs.
   * @param domain Domain to verify
   * @param expectedIPs List of allowed IPs
   * @returns true if matched, false otherwise
   */
  async verifyDomainPointing(domain: string, expectedIPs: string[]): Promise<boolean> {
    const resolvedIPs = await this.resolveARecords(domain);
    
    if (resolvedIPs.length === 0) {
      return false;
    }

    // Check if at least one resolved IP is in the expected list
    return resolvedIPs.some(ip => expectedIPs.includes(ip));
  }
}

export const dnsService = new DnsService();
