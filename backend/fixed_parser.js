/**
 * fixed_parser.js
 * Simulates the fixed version of Cloudflare's HTML parser after the CloudBleed vulnerability was patched.
 */

function processWithFixedParser(html) {
    const response = {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Server': 'cloudflare-fixed'
      },
      content: '',
      processedSize: 0,
      leakSize: 0 
    };
    
    const MAX_BUFFER_SIZE = 128;
    
    const originalSize = html ? html.length : 0;
    response.processedSize = originalSize;
    
    console.log(`[Fixed Parser] Processing ${originalSize} bytes of HTML`);
    
    if (!html || html.length === 0) {
      response.content = '';
      return response;
    }

    if (originalSize > MAX_BUFFER_SIZE) {
      console.log(`[Fixed Parser] Large content detected: ${originalSize} > ${MAX_BUFFER_SIZE}`);
      console.log(`[Fixed Parser] Safely handling with proper bounds checking`);
      
      const truncatedHtml = html.substring(0, MAX_BUFFER_SIZE);
      response.content = truncatedHtml;
      
      response.content += `<!-- Content was truncated to ${MAX_BUFFER_SIZE} bytes -->`;
    } else {
      response.content = html;
    }
    
    response.content += `<!-- Processed by fixed parser: No memory leaks possible -->`;
    return response;
  }
  
  module.exports = {
    processWithFixedParser
  };