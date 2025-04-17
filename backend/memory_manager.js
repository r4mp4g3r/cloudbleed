/**
 * memory_manager.js
 * 
 * Simulates shared server memory where data from different websites 
 * can potentially leak into each other due to the CloudBleed vulnerability.
 */

const MEMORY_SIZE = 4096;
let serverMemory = Buffer.alloc(MEMORY_SIZE, 0);

const sensitiveData = {
  'bank.example.com': [
    { offset: 100, data: 'ACCOUNT_NUMBER=1234567890' },
    { offset: 150, data: 'BALANCE=$45,281.93' },
    { offset: 200, data: 'ROUTING_NUMBER=078401251' },
    { offset: 250, data: 'ACCOUNT_HOLDER=John Smith' }
  ],
  'email.example.com': [
    { offset: 400, data: 'EMAIL=user@example.com' },
    { offset: 450, data: 'PASSWORD=SecretPass123!' },
    { offset: 500, data: 'RECOVERY_PHONE=555-123-4567' }
  ],
  'shopping.example.com': [
    { offset: 700, data: 'CREDIT_CARD=4111-1111-1111-1111' },
    { offset: 750, data: 'EXPIRY=12/25' },
    { offset: 800, data: 'CVV=123' },
    { offset: 850, data: 'SHIPPING_ADDRESS=123 Main St, Anytown, USA' }
  ],
  'api.example.com': [
    { offset: 1000, data: 'API_KEY=sk_test_BQokikJOvBiI2HlWgH4olfQ2' },
    { offset: 1050, data: 'API_SECRET=whsec_8WHeAQfqNSaMCCkEPV4Csbh9LOKvVF3C' }
  ],
  'cloud.example.com': [
    { offset: 1200, data: 'AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE' },
    { offset: 1250, data: 'AWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' }
  ],
  'social.example.com': [
    { offset: 1400, data: 'AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    { offset: 1450, data: 'USER_ID=user_1234567890' },
    { offset: 1500, data: 'SESSION_ID=sess_vQEDRGQBDqyFvmxd' }
  ]
};

function initializeMemory() {
  serverMemory.fill(0);

  const baseData = [
    { offset: 0, data: 'ADMIN_PASSWORD=SuperSecretAdmin2023!' },
    { offset: 50, data: 'DATABASE_URL=mysql://user:dbpass123@internal-db.example.com/userdata' },
    { offset: 1600, data: 'PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj34Gkx...' }
  ];
  
  for (const item of baseData) {
    serverMemory.write(item.data, item.offset);
  }
  
  for (const site in sensitiveData) {
    console.log(`Loading sensitive data for ${site}`);
    for (const item of sensitiveData[site]) {
      serverMemory.write(item.data, item.offset);
      console.log(`  - Offset ${item.offset}: ${item.data}`);
    }
  }
}

function simulateDataAccess(site) {
  if (sensitiveData[site]) {
    for (const item of sensitiveData[site]) {
      serverMemory.write(item.data, item.offset);
    }
    return true;
  }
  return false;
}

function getMemoryChunk(offset, size) {
  if (offset + size > MEMORY_SIZE) {
    size = MEMORY_SIZE - offset;
  }
  
  if (size <= 0) return '';
  
  if (Math.random() < 0.8) {
    const bankData = sensitiveData['bank.example.com'];
    if (bankData && bankData.length > 0) {
      const bankItem = bankData[Math.floor(Math.random() * bankData.length)];
      return bankItem.data;
    }
  }
  
  return serverMemory.slice(offset, offset + size).toString();
}

function getSpecificSiteData(site) {
  if (sensitiveData[site] && sensitiveData[site].length > 0) {
    const dataIndex = Math.floor(Math.random() * sensitiveData[site].length);
    const item = sensitiveData[site][dataIndex];
    
    return {
      site: site,
      offset: item.offset,
      data: item.data,
      type: site.split('.')[0]
    };
  }
  return null;
}

function getMemoryContents() {
    const blocks = [];
    const sections = [];
    
    const sensitiveRegions = new Set();
    
    for (const site in sensitiveData) {
      for (const item of sensitiveData[site]) {
        const start = item.offset;
        const end = item.offset + item.data.length;
        
        for (let i = start; i < end; i++) {
          sensitiveRegions.add(i);
        }
        
        sections.push({
          name: `${site} data`,
          start: start,
          end: end,
          content: item.data,
          site: site
        });
      }
    }
    
    const byteTypes = new Array(MEMORY_SIZE).fill('clean');
    for (let i = 0; i < MEMORY_SIZE; i++) {
      if (sensitiveRegions.has(i)) {
        byteTypes[i] = 'sensitive';
      } else if (serverMemory[i] !== 0) {
        byteTypes[i] = 'corrupted';
      }
    }

    let currentType = byteTypes[0];
    let blockStart = 0;
    let currentData = '';
    
    for (let i = 0; i <= MEMORY_SIZE; i++) {
      const byteType = i < MEMORY_SIZE ? byteTypes[i] : null;

      if (byteType !== currentType || i === MEMORY_SIZE) {
        if (currentType !== 'clean' || (i - blockStart) > 64) {
          let blockData = '';
          for (let j = blockStart; j < i; j++) {
            const byte = serverMemory[j];
            if (byte !== 0) {
              blockData += String.fromCharCode(byte >= 32 && byte <= 126 ? byte : 46); // Use '.' for non-printable
            }
          }
          
          blocks.push({
            type: currentType,
            size: i - blockStart,
            offset: blockStart,
            data: blockData.substring(0, 100) + (blockData.length > 100 ? '...' : '')
          });
        }
        
        if (i < MEMORY_SIZE) {
          blockStart = i;
          currentType = byteType;
          currentData = '';
        }
      }
    }
    
    return {
      totalSize: MEMORY_SIZE,
      blocks: blocks,
      sections: sections,
      rawMemory: Array.from(serverMemory).map((byte, index) => ({
        byte: byte,
        type: byteTypes[index]
      }))
    };
}

module.exports = {
  initializeMemory,
  simulateDataAccess,
  getMemoryChunk,
  getMemoryContents,
  getSpecificSiteData
};