/**
 * API Debug Helper
 * This file contains utilities to help debug API connectivity issues
 */

document.addEventListener('DOMContentLoaded', () => {
  const debugButton = document.createElement('button');
  debugButton.textContent = 'Debug API Connection';
  debugButton.className = 'debug-button';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '10px';
  debugButton.style.right = '10px';
  debugButton.style.padding = '8px 15px';
  debugButton.style.backgroundColor = '#444';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  debugButton.style.zIndex = '1000';
  
  document.body.appendChild(debugButton);
  
  debugButton.addEventListener('click', async () => {
    const debugResults = document.createElement('div');
    debugResults.className = 'debug-results';
    debugResults.style.position = 'fixed';
    debugResults.style.top = '50%';
    debugResults.style.left = '50%';
    debugResults.style.transform = 'translate(-50%, -50%)';
    debugResults.style.padding = '20px';
    debugResults.style.backgroundColor = 'white';
    debugResults.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
    debugResults.style.zIndex = '1001';
    debugResults.style.maxWidth = '80%';
    debugResults.style.maxHeight = '80%';
    debugResults.style.overflow = 'auto';
    debugResults.style.borderRadius = '6px';
    
    debugResults.innerHTML = '<h3>API Connection Diagnostics</h3><p>Running tests...</p>';
    document.body.appendChild(debugResults);
    
    try {
      // Test health endpoint
      debugResults.innerHTML += '<p>Testing health endpoint...</p>';
      let healthResponse = await fetch('/api/health');
      let healthData = await healthResponse.json();
      debugResults.innerHTML += `<p>Health check status: ${healthResponse.ok ? '✅' : '❌'} ${JSON.stringify(healthData)}</p>`;
      
      // Test memory endpoint
      debugResults.innerHTML += '<p>Testing memory endpoint...</p>';
      let memoryResponse = await fetch('/api/memory');
      let memStatus = memoryResponse.ok ? '✅' : '❌';
      debugResults.innerHTML += `<p>Memory endpoint status: ${memStatus} (${memoryResponse.status})</p>`;
      
      if (memoryResponse.ok) {
        let memoryData = await memoryResponse.json();
        debugResults.innerHTML += `<p>Memory data received: ${memoryData && memoryData.memory ? '✅' : '❌'}</p>`;
        
        if (memoryData && memoryData.memory) {
          const blocksCount = memoryData.memory.blocks ? memoryData.memory.blocks.length : 'None';
          debugResults.innerHTML += `<p>Memory blocks: ${blocksCount}</p>`;
        } else {
          debugResults.innerHTML += '<p>No memory data available in response</p>';
        }
      } else {
        let errorText = await memoryResponse.text();
        debugResults.innerHTML += `<p>Error: ${errorText}</p>`;
      }
      
      // Network information
      debugResults.innerHTML += '<h4>Network Information</h4>';
      const url = new URL(window.location.href);
      debugResults.innerHTML += `<p>Current URL: ${url.href}</p>`;
      debugResults.innerHTML += `<p>Hostname: ${url.hostname}</p>`;
      debugResults.innerHTML += `<p>Port: ${url.port || 'default'}</p>`;
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.marginTop = '15px';
      closeButton.style.padding = '8px 15px';
      closeButton.style.backgroundColor = '#4a69bd';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      
      closeButton.addEventListener('click', () => {
        document.body.removeChild(debugResults);
      });
      
      debugResults.appendChild(closeButton);
      
    } catch (error) {
      debugResults.innerHTML += `<p>Error during diagnostics: ${error.message}</p>`;
    }
  });
});
