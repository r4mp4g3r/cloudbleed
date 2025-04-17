/**
 * vulnerable_parser.js
 * 
 * Simulates Cloudflare's HTML parser with the CloudBleed vulnerability.
 */

const { getMemoryChunk, getSpecificSiteData } = require('./memory_manager');

function processWithVulnerableParser(html, site = 'example.com') {
  const response = {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Server': 'cloudflare'
    },
    content: '',
    leakSize: 0,
    leakedData: '',
    processedSize: 0,
    vulnerabilityTriggered: false,
    bufferOverflow: false,
    source: site,
    leakSource: null
  };
  
  const MAX_BUFFER_SIZE = 128;
  
  const originalSize = html ? html.length : 0;
  response.processedSize = originalSize;
  
  console.log(`[Vulnerable Parser] Processing ${originalSize} bytes of HTML for ${site}`);
  
  if (!html || html.length === 0) {
    response.content = '';
    return response;
  }
  
  const triggerPatterns = ['</script>', 'style=', '</style>', '<iframe', '<img', '<div><script>'];
  let isVulnerable = false;
  let triggeringPattern = '';
  
  for (const pattern of triggerPatterns) {
    if (html.includes(pattern)) {
      isVulnerable = true;
      triggeringPattern = pattern;
      response.vulnerabilityTriggered = true;
      console.log(`[Vulnerable Parser] Found triggering pattern: ${pattern}`);
      break;
    }
  }
  
  if (isVulnerable) {
    const isVulnerableSite = site.includes('blog') || site.includes('forum');
    
    const willOverflow = originalSize > MAX_BUFFER_SIZE || Math.random() < (isVulnerableSite ? 0.8 : 0.3);
    
    if (willOverflow) {
      response.bufferOverflow = true;
      console.log(`[Vulnerable Parser] Buffer overflow for ${site} with pattern ${triggeringPattern}`);
      
      let leakedMemory;
      let leakSource;
      
      if (isVulnerableSite) {
        const bankData = getSpecificSiteData('bank.example.com');
        if (bankData) {
          leakedMemory = bankData.data;
          leakSource = 'bank.example.com';
          console.log(`[Vulnerable Parser] Leaking banking data from ${leakSource}`);
        }
      } else {
        const randomSites = ['bank.example.com', 'email.example.com', 'shopping.example.com'];
        leakSource = randomSites[Math.floor(Math.random() * randomSites.length)];
        const siteData = getSpecificSiteData(leakSource);
        
        if (siteData) {
          leakedMemory = siteData.data;
        } else {
          const leakOffset = Math.floor(Math.random() * 1500);
          const leakSize = 20 + Math.floor(Math.random() * 100);
          leakedMemory = getMemoryChunk(leakOffset, leakSize);
        }
      }
      
      if (leakedMemory && leakedMemory.trim().length > 0) {
        response.leakSize = leakedMemory.length;
        response.leakedData = leakedMemory;
        response.leakSource = leakSource;
        
        console.log(`[Vulnerable Parser] Leaked ${leakedMemory.length} bytes from ${leakSource || 'unknown'}: "${leakedMemory}"`);
        
        response.content = `${html}<!-- LEAKED DATA: ${leakedMemory} FROM ${leakSource || 'unknown'} -->`;
      } else {
        response.content = html;
      }
    } else {
      response.content = html;
    }
  } else {
    response.content = html;
  }
  
  return response;
}

module.exports = {
  processWithVulnerableParser
};