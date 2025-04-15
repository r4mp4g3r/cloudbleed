/**
 * CloudBleed Vulnerability Visualizer
 * 
 * This script visualizes how the CloudBleed vulnerability works by showing:
 * - Server memory buffer visualization
 * - Request and response flow
 * - Memory corruption and data leakage between different sites
 */

class CloudBleedVisualizer {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
      }
      
      this.memorySize = 512; 
      this.memoryBlocks = []; 
      this.requests = [];
      this.leakLines = []; 
      
      this.colors = {
        site1: '#e74c3c', 
        site2: '#3498db', 
        site3: '#2ecc71', 
        clean: '#ecf0f1', 
        leaked: '#f39c12', 
        corrupted: '#9b59b6', 
        system: '#95a5a6',
        'bank.example.com': '#e74c3c',
        'email.example.com': '#3498db',
        'shopping.example.com': '#2ecc71',
        'api.example.com': '#f39c12',
        'cloud.example.com': '#9b59b6',
        'social.example.com': '#1abc9c',
        'blog.example.com': '#f1c40f',
        'sensitive': '#e74c3c',
        'corrupted': '#9b59b6'
      };
      
      this.activeSite = null; // Track which site has data in memory
      
      this.initializeUI();
      this.setupEventListeners();
      
      this.fetchServerMemory();
    }
    
    initializeUI() {
      this.container.innerHTML = `
        <div class="cloudbleed-visualizer">
          <div class="control-panel">
            <h3>CloudBleed Vulnerability Demonstration</h3>
            <div class="controls">
              <button id="btn-simulate">Run Simulation</button>
              <button id="btn-reset">Reset</button>
              <label>
                <input type="checkbox" id="toggle-fixed-parser" />
                Use Fixed Parser
              </label>
            </div>
            <div class="legend">
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.site1}"></span>Banking Site (Sensitive Data)</div>
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.site2}"></span>Social Media Site</div>
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.site3}"></span>Blog Site (Vulnerable)</div>
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.leaked}"></span>Leaked Banking Data</div>
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.corrupted}"></span>Memory Corruption</div>
              <div class="legend-item"><span class="color-box" style="background-color:${this.colors.system}"></span>System Data</div>
            </div>
          </div>
          
          <div class="visualization-container">
            <div class="sites-container">
              <div class="site" id="site1">
                <h4>Banking Site</h4>
                <div class="site-content">
                  <div class="sensitive-data">
                    <p><strong>CUSTOMER DATA (SENSITIVE)</strong></p>
                    <p>User: john_smith</p>
                    <p>Account: XXXX-XXXX-XXXX-1234</p>
                    <p>Balance: $45,281.93</p>
                    <p>Routing: 078401251</p>
                  </div>
                </div>
                <div class="request-log"></div>
              </div>
              
              <div class="site" id="site2">
                <h4>Social Media Site</h4>
                <div class="site-content">
                  <div class="messages">
                    <p><strong>USER POSTS</strong></p>
                    <p>@user1: Check out my new profile pic!</p>
                    <p>@user2: Having a great vacation in Hawaii!</p>
                  </div>
                </div>
                <div class="request-log"></div>
              </div>
              
              <div class="site" id="site3">
                <h4>Blog Site (VULNERABLE)</h4>
                <div class="site-content">
                  <div class="forum-posts">
                    <p><strong>BLOG POST WITH MALFORMED HTML</strong></p>
                    <p>&lt;div&gt;&lt;script&gt;&lt;div&gt;</p>
                    <p>This unclosed HTML triggers the CloudBleed vulnerability!</p>
                  </div>
                </div>
                <div class="request-log"></div>
              </div>
            </div>
            
            <div class="memory-visualizer">
              <h4>Shared Memory Buffer (Cloudflare Edge Server)</h4>
              <div class="memory-container" id="memory-container"></div>
            </div>
            
            <div class="data-leaks" id="data-leaks">
              <h4>Data Leakage Visualization</h4>
              <div class="leaks-container"></div>
            </div>
          </div>
          
          <div class="explanation-panel">
            <h4>How CloudBleed Works</h4>
            <p>The Cloudflare parser vulnerability (CloudBleed) occurred when the HTML parser encountered specific sequences that triggered buffer overruns. When this happened, memory containing data from other customers' websites could leak into the HTTP responses.</p>
            <div id="current-explanation">Start the simulation to see the vulnerability in action.</div>
          </div>
        </div>
      `;
      
      this.memoryContainer = document.getElementById('memory-container');
      this.initializeMemory();
      
      if (!document.getElementById('cloudbleed-visualizer-styles')) {
        const styles = document.createElement('style');
        styles.id = 'cloudbleed-visualizer-styles';
        styles.textContent = this.getCSS();
        document.head.appendChild(styles);
      }
    }
    
    initializeMemory() {
      this.memoryContainer.innerHTML = '';
      this.memoryBlocks = [];
      
      for (let i = 0; i < this.memorySize; i++) {
        const block = document.createElement('div');
        block.className = 'memory-block';
        block.dataset.index = i;
        block.dataset.content = '';
        block.dataset.owner = 'none';
        block.style.backgroundColor = this.colors.clean;
        
        this.memoryContainer.appendChild(block);
        this.memoryBlocks.push({
          element: block,
          content: '',
          owner: 'none'
        });
      }
    }
    
    setupEventListeners() {
      const simulateBtn = document.getElementById('btn-simulate');
      const resetBtn = document.getElementById('btn-reset');
      const fixedParserToggle = document.getElementById('toggle-fixed-parser');
      
      if (simulateBtn) {
        simulateBtn.addEventListener('click', () => this.runSimulation());
      }
      
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.reset());
      }
      
      if (fixedParserToggle) {
        fixedParserToggle.addEventListener('change', (e) => {
          this.useFixedParser = e.target.checked;
          this.reset();
        });
      }
    }
    
    reset() {
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      
      this.leakLines.forEach(line => {
        if (line && line.parentNode) {
          line.parentNode.removeChild(line);
        }
      });
      this.leakLines = [];
      
      this.initializeMemory();
      
      document.querySelectorAll('.request-log').forEach(log => {
        log.innerHTML = '';
      });
      
      document.querySelector('.leaks-container').innerHTML = '';
      
      document.querySelectorAll('.leaked-data-display').forEach(display => {
        if (display.parentNode) {
          display.parentNode.removeChild(display);
        }
      });
      
      document.getElementById('current-explanation').textContent = 
        'Start the simulation to see the vulnerability in action.';
    }
    
    runSimulation() {
      this.reset();
      this.fetchServerMemory();
      
      const useFixedParser = document.getElementById('toggle-fixed-parser').checked;
      const explanationEl = document.getElementById('current-explanation');
      
      explanationEl.innerHTML = '<p>Starting simulation...</p>';
      
      const steps = [
        () => {
          explanationEl.innerHTML = `
            <p><strong>Step 1: The Banking Site processes customer data</strong></p>
            <p>• Banking site loads sensitive customer information</p>
            <p>• Cloudflare's CDN allocates memory to process this banking data</p>
            <p>• This data includes account numbers, balances, and routing information</p>
          `;
          this.simulateRequest('site1', 'GET /account/summary HTTP/1.1', 
            'Loading sensitive banking information');
          this.allocateMemory('site1', 0, 100, 'User: john_smith\nAccount: XXXX-XXXX-XXXX-1234\nBalance: $45,281.93\nRouting: 078401251');
        },
        
        () => {
          explanationEl.innerHTML = `
            <p><strong>Step 2: A Social Media Site makes a request</strong></p>
            <p>• Social media site loads user posts and content</p>
            <p>• Cloudflare allocates new memory for this unrelated website</p>
            <p>• Memory is shared across all Cloudflare customer websites</p>
          `;
          this.simulateRequest('site2', 'GET /feed HTTP/1.1', 
            'Loading user social media feed');
          this.allocateMemory('site2', 120, 200, '@user1: Check out my new profile pic!\n@user2: Having a great vacation in Hawaii!');
        },
        
        () => {
          explanationEl.innerHTML = `
            <p><strong>Step 3: The Blog Site contains malformed HTML</strong></p>
            <p>• Blog site contains unclosed HTML tags: &lt;div&gt;&lt;script&gt;&lt;div&gt;</p>
            <p>• This malformed HTML confuses Cloudflare's parser</p>
            <p>• The vulnerable parser fails to properly validate input boundaries</p>
          `;
          
          this.simulateRequest('site3', 'POST /blog/post HTTP/1.1', 
            'Post contains malformed HTML with unclosed tags: <div><script><div>');
            
          this.allocateMemory('site3', 220, 280, 'Blog post with malformed HTML: <div><script><div>\nThis triggers the CloudBleed vulnerability!');
          
          if (!useFixedParser) {
            setTimeout(() => {
              this.simulateBufferOverflow('site3', 280, 50);
            }, 1000);
          }
        },
        
        () => {
          if (!useFixedParser) {
            explanationEl.innerHTML = `
              <p><strong>Step 4: The Vulnerable Parser Overflows Its Buffer</strong></p>
              <p>• The malformed HTML triggers a buffer overflow in Cloudflare's parser</p>
              <p>• The parser reads beyond its allocated memory boundary</p>
              <p>• This causes memory corruption and accesses other customers' data</p>
              <p>• Banking data from an unrelated site is now accessible to the Blog site</p>
            `;
            
            this.corruptMemory(280, 330);
            
            setTimeout(() => {
              this.simulateDataLeak('site1', 'site3', 50, 80, 'Account: XXXX-XXXX-XXXX-1234\nBalance: $45,281.93\nRouting: 078401251');
            }, 1000);
          } else {
            explanationEl.innerHTML = `
              <p><strong>Step 4: The Fixed Parser Respects Memory Boundaries</strong></p>
              <p>• The patched parser properly validates HTML boundaries</p>
              <p>• Malformed HTML is handled safely without buffer overflows</p>
              <p>• Memory isolation between customers is maintained</p>
              <p>• No sensitive data leaks between different websites</p>
            `;
          }
        },
        
        () => {
          if (!useFixedParser) {
            explanationEl.innerHTML = `
              <p><strong>CloudBleed Vulnerability Summary</strong></p>
              <p>• The vulnerability occurred when Cloudflare's HTML parser encountered specific patterns that caused buffer overruns</p>
              <p>• As demonstrated, this allowed the Blog site to inadvertently receive leaked banking data from an unrelated customer</p>
              <p>• This exposed sensitive financial information to unauthorized parties</p>
              <p>• In February 2017, Cloudflare patched this vulnerability after it was discovered by Google's Project Zero</p>
              <p>• Toggle "Use Fixed Parser" and run the simulation again to see how the patched version prevents this vulnerability</p>
            `;
          } else {
            explanationEl.innerHTML = `
              <p><strong>Fixed Parser Protection</strong></p>
              <p>• With proper boundary checking, buffer overruns are prevented</p>
              <p>• Even with malformed HTML, the parser safely handles the content</p>
              <p>• Strict memory isolation between different customers' data is maintained</p>
              <p>• This demonstrates why proper input validation and memory management are critical for security</p>
              <p>• Uncheck "Use Fixed Parser" to see the vulnerable version again</p>
            `;
          }
        }
      ];
      
      let stepIndex = 0;
      steps[stepIndex]();
      
      this.simulationInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          steps[stepIndex]();
        } else {
          clearInterval(this.simulationInterval);
        }
      }, 4000); 
    }
    
    simulateRequest(siteId, requestHeader, description) {
      const requestLog = document.querySelector(`#${siteId} .request-log`);
      const requestEl = document.createElement('div');
      requestEl.className = 'request';
      requestEl.innerHTML = `
        <div class="request-header">${requestHeader}</div>
        <div class="request-desc">${description}</div>
      `;
      requestLog.appendChild(requestEl);
      
      requestEl.style.opacity = 0;
      setTimeout(() => {
        requestEl.style.opacity = 1;
      }, 100);
    }
    
    allocateMemory(owner, startIndex, length, content) {
      for (let i = startIndex; i < startIndex + length && i < this.memorySize; i++) {
        if (i >= this.memoryBlocks.length) continue;
        
        const block = this.memoryBlocks[i];
        block.owner = owner;
        block.content = content;
        
        setTimeout(() => {
          block.element.style.backgroundColor = this.colors[owner];
          block.element.dataset.owner = owner;
          block.element.dataset.content = content;
          
          block.element.title = `Memory block ${i}: ${content.substr(0, 20)}${content.length > 20 ? '...' : ''}`;
        }, (i - startIndex) * 10);
      }
    }
    
    simulateBufferOverflow(owner, startIndex, overflowLength) {
      for (let i = startIndex; i < startIndex + overflowLength && i < this.memorySize; i++) {
        if (i >= this.memoryBlocks.length) continue;
        
        const block = this.memoryBlocks[i];
        
        setTimeout(() => {
          block.element.style.backgroundColor = this.colors.corrupted;
          block.element.classList.add('corrupted');
          
          block.element.classList.add('shake');
          setTimeout(() => {
            block.element.classList.remove('shake');
          }, 500);
        }, (i - startIndex) * 50);
      }
    }
    
    corruptMemory(startIndex, endIndex) {
      for (let i = startIndex; i < endIndex && i < this.memorySize; i++) {
        if (i >= this.memoryBlocks.length) continue;
        
        const block = this.memoryBlocks[i];
        
        setTimeout(() => {
          block.element.style.backgroundColor = this.colors.corrupted;
          block.element.classList.add('corrupted');
        }, (i - startIndex) * 30);
      }
    }
    
    simulateDataLeak(fromSite, toSite, startOffset, length, leakedContent) {
      const leaksContainer = document.querySelector('.leaks-container');
      
      const leakEl = document.createElement('div');
      leakEl.className = 'data-leak';
      leakEl.innerHTML = `
        <div class="leak-header">🚨 SECURITY BREACH: Banking Data Leaked!</div>
        <div class="leak-details">
          <p><strong>Source:</strong> Banking Site (${fromSite})</p>
          <p><strong>Leaked to:</strong> Blog Site (${toSite})</p>
          <div class="leaked-content">
            <p class="leak-data-title">Leaked Banking Information:</p>
            <pre>${leakedContent || "Unknown data"}</pre>
          </div>
          <p class="leak-explanation">This sensitive banking data was leaked because of the CloudBleed vulnerability in Cloudflare's parser.</p>
        </div>
      `;
      leaksContainer.appendChild(leakEl);
      
      const sourceEl = document.getElementById(fromSite);
      const targetEl = document.getElementById(toSite);
      
      if (sourceEl && targetEl) {
        const leakLine = document.createElement('div');
        leakLine.className = 'leak-line';
        document.body.appendChild(leakLine);
        
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const lineLength = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI;
        
        leakLine.style.width = `${lineLength}px`;
        leakLine.style.left = `${sourceX}px`;
        leakLine.style.top = `${sourceY}px`;
        leakLine.style.transform = `rotate(${angle}deg)`;
        
        const arrow = document.createElement('div');
        arrow.className = 'leak-arrow';
        document.body.appendChild(arrow);
        
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        arrow.style.left = `${midX - 10}px`;
        arrow.style.top = `${midY - 10}px`;
        arrow.style.transform = `rotate(${angle + 90}deg)`;
        
        leakLine.style.opacity = 0;
        arrow.style.opacity = 0;
        setTimeout(() => {
          leakLine.style.opacity = 1;
          arrow.style.opacity = 1;
        }, 100);
        
        this.leakLines.push(leakLine);
        this.leakLines.push(arrow);
      }
      
      const targetSiteContent = document.querySelector(`#${toSite} .site-content`);
      const leakedDataEl = document.createElement('div');
      leakedDataEl.className = 'leaked-data-display';
      leakedDataEl.innerHTML = `
        <div class="leak-warning">⚠️ LEAKED BANKING DATA APPEARS IN RESPONSE:</div>
        <pre class="leaked-data-content">${leakedContent}</pre>
      `;
      targetSiteContent.appendChild(leakedDataEl);
      
      for (let i = 0; i < length; i++) {
        if (i >= this.memoryBlocks.length) continue;
        
        const blockIndex = startOffset + i;
        if (blockIndex >= this.memoryBlocks.length) continue;
        
        const block = this.memoryBlocks[blockIndex];
        
        setTimeout(() => {
          block.element.style.backgroundColor = this.colors.leaked;
          block.element.classList.add('leaked');
          block.element.classList.add('pulse');
          
          block.element.title = `LEAKED BANKING DATA: ${leakedContent ? leakedContent.substring(0, 30) + '...' : 'Sensitive information'}`;
          
          setTimeout(() => {
            block.element.classList.remove('pulse');
          }, 2000);
        }, i * 100);
      }
    }
    
    getCSS() {
      return `
        .cloudbleed-visualizer {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .control-panel {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .controls button {
          padding: 8px 15px;
          background-color: #4a69bd;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .controls button:hover {
          background-color: #1e3799;
        }
        
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
          margin-top: 10px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          padding: 5px 10px;
          border-radius: 3px;
          background-color: rgba(0,0,0,0.03);
        }
        
        .color-box {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          border-radius: 3px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .visualization-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .sites-container {
          display: flex;
          gap: 20px;
          justify-content: space-between;
        }
        
        .site {
          flex: 1;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          min-height: 200px;
        }
        
        .site h4 {
          font-size: 1.1rem;
          margin-top: 0;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        #site1 {
          background-color: rgba(231, 76, 60, 0.05);
          border-left: 5px solid #e74c3c;
        }
        
        #site1 h4::after {
          content: "SENSITIVE DATA";
          position: absolute;
          right: 0;
          top: 0;
          font-size: 0.7rem;
          background-color: rgba(231, 76, 60, 0.1);
          color: #c0392b;
          padding: 3px 8px;
          border-radius: 3px;
          font-weight: normal;
        }
        
        #site2 {
          background-color: rgba(52, 152, 219, 0.05);
          border-left: 5px solid #3498db;
        }
        
        #site3 {
          background-color: rgba(46, 204, 113, 0.05);
          border-left: 5px solid #2ecc71;
        }
        
        #site3 h4::after {
          content: "VULNERABLE";
          position: absolute;
          right: 0;
          top: 0;
          font-size: 0.7rem;
          background-color: rgba(241, 196, 15, 0.2);
          color: #d35400;
          padding: 3px 8px;
          border-radius: 3px;
          font-weight: normal;
        }
        
        .site-content {
          min-height: 120px;
          margin-bottom: 15px;
          position: relative;
        }
        
        .sensitive-data {
          background-color: rgba(231, 76, 60, 0.05);
          padding: 10px;
          border-radius: 4px;
          border: 1px dashed rgba(231, 76, 60, 0.4);
        }
        
        .messages, .forum-posts {
          padding: 10px;
          border-radius: 4px;
          border: 1px dashed rgba(0, 0, 0, 0.1);
        }
        
        .request-log {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 10px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 12px;
          min-height: 50px;
          max-height: 150px;
          overflow-y: auto;
        }
        
        .request {
          margin-bottom: 8px;
          padding: 5px;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 3px;
          transition: opacity 0.3s ease;
        }
        
        .request-header {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .memory-visualizer {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .memory-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding: 10px;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
          min-height: 50px;
        }
        
        .memory-block {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }
        
        .memory-block:hover {
          transform: scale(1.5);
          z-index: 10;
          box-shadow: 0 0 10px rgba(44, 62, 80, 0.3);
        }
        
        .data-leaks {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .leaks-container {
          min-height: 50px;
        }
        
        .data-leak {
          padding: 20px;
          background-color: rgba(231, 76, 60, 0.05);
          border: 2px solid #e74c3c;
          margin-bottom: 20px;
          border-radius: 6px;
          animation: fadeIn 0.5s ease;
          box-shadow: 0 3px 15px rgba(231, 76, 60, 0.2);
          position: relative;
        }
        
        .leak-header {
          font-weight: bold;
          color: #c0392b;
          margin-bottom: 15px;
          font-size: 1.1rem;
          padding-bottom: 10px;
          border-bottom: 1px dashed rgba(231, 76, 60, 0.3);
        }
        
        .leak-details p {
          margin-bottom: 8px;
        }
        
        .leak-line {
          position: fixed;
          height: 4px;
          background: linear-gradient(to right, rgba(231, 76, 60, 0.8), rgba(243, 156, 18, 0.8));
          transform-origin: left center;
          z-index: 1000;
          pointer-events: none;
          transition: opacity 0.5s ease;
          box-shadow: 0 0 15px rgba(231, 76, 60, 0.5);
          animation: pulseLine 1.5s infinite;
        }
        
        .leak-arrow {
          position: fixed;
          width: 0; 
          height: 0; 
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 15px solid rgba(231, 76, 60, 0.9);
          z-index: 1001;
          pointer-events: none;
        }
        
        @keyframes pulseLine {
          0% { opacity: 0.6; height: 4px; }
          50% { opacity: 1; height: 6px; }
          100% { opacity: 0.6; height: 4px; }
        }
        
        .leaked-data-display {
          margin-top: 15px;
          padding: 12px;
          background-color: rgba(243, 156, 18, 0.1);
          border: 2px dashed #e74c3c;
          border-radius: 4px;
          position: relative;
          animation: flashWarning 2s infinite;
        }
        
        .leak-warning {
          font-weight: bold;
          color: #c0392b;
          margin-bottom: 6px;
        }
        
        .leaked-data-content {
          background-color: rgba(231, 76, 60, 0.1);
          padding: 8px;
          margin: 0;
          color: #c0392b;
          font-family: monospace;
          font-size: 0.9rem;
          white-space: pre-wrap;
          border-radius: 3px;
        }
        
        .leak-explanation {
          font-style: italic;
          margin-top: 10px;
          color: #7f8c8d;
          font-size: 0.9rem;
        }
        
        .leaked-content {
          background-color: rgba(231, 76, 60, 0.05);
          border-radius: 4px;
          padding: 15px;
          margin: 15px 0;
          border-left: 3px solid #e74c3c;
        }
        
        .leaked-content pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: monospace;
          color: #c0392b;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        @keyframes flashWarning {
          0% { box-shadow: 0 0 5px rgba(231, 76, 60, 0.3); }
          50% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.8); }
          100% { box-shadow: 0 0 5px rgba(231, 76, 60, 0.3); }
        }
        
        .memory-block.leaked {
          background-color: #f39c12 !important;
          box-shadow: 0 0 8px rgba(243, 156, 18, 0.8);
          z-index: 2;
          position: relative;
        }
        
        .memory-block.corrupted {
          background-color: #9b59b6 !important;
          box-shadow: 0 0 8px rgba(155, 89, 182, 0.8);
          z-index: 2;
        }
        
        .memory-block.system {
          background-color: #95a5a6 !important;
        }
        
        .explanation-panel {
          background-color: white;
          border-radius: 6px;
          padding: 20px;
          margin-top: 30px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        }
        
        .explanation-panel h4 {
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .explanation-panel p {
          margin-bottom: 10px;
          line-height: 1.7;
        }
        
        .explanation-panel p strong {
          color: #2980b9;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 15px rgba(243, 156, 18, 1); }
          100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); }
        }
        
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(-3px); }
          100% { transform: translateX(0); }
        }
        
        .pulse {
          animation: pulse 1s ease infinite;
        }
        
        .shake {
          animation: shake 0.3s ease;
        }
        
        .memory-visualizer h4, .data-leaks h4 {
          margin: 0;
          padding: 10px;
          background-color: #f8f9fa;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          font-size: 1rem;
          color: #2c3e50;
          border-bottom: 1px solid #eee;
        }
      `;
    }
    
    /**
     * Fetch server memory data and update visualization
     */
    fetchServerMemory() {
      if (this.memoryContainer) {
        this.memoryContainer.innerHTML = '<div class="loading-indicator">Loading memory data...</div>';
      }
      
      console.log('Fetching memory data from server...');
      
      fetch('/api/memory')
        .then(response => {
          if (!response.ok) {
            console.error(`Server returned status: ${response.status}`);
            return response.text().then(text => {
              throw new Error(`Server error (${response.status}): ${text}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Memory data received:', data);
          if (data && data.memory) {
            this.activeSite = data.memory.activeSite || null;
            this.updateFromServerData(data.memory);
          } else {
            console.error('Invalid memory data format:', data);
            throw new Error('Invalid memory data format received from server');
          }
        })
        .catch(error => {
          console.error('Memory fetch error:', error);
          if (this.memoryContainer) {
            this.memoryContainer.innerHTML = `
              <div class="error">
                Error fetching memory data: ${error.message}
                <br><br>
                <button class="retry-button" onclick="window.cloudbleedVisualizer.fetchServerMemory()">
                  Retry
                </button>
              </div>`;
          }
        });
    }
    
    updateFromServerData(memoryData) {
      this.initializeMemory();
      
      if (!memoryData.blocks || memoryData.blocks.length === 0) {
        this.memoryContainer.innerHTML = '<div class="no-data">No memory data available</div>';
        return;
      }
      
      let currentOffset = 0;
      memoryData.blocks.forEach(block => {
        const blockSize = block.size || 0;
        let owner = block.type || 'clean';
        
        if (blockSize > 0) {
          this.allocateMemory(owner, currentOffset, blockSize, block.data || '');
          currentOffset += blockSize;
        }
      });
      
      if (this.memoryContainer) {
        const noteElement = document.createElement('div');
        noteElement.className = 'memory-note';
        
        const activeSiteMsg = this.activeSite 
          ? `Active site in memory: ${this.activeSite}` 
          : 'No site-specific data currently in memory';
          
        noteElement.textContent = `Memory visualization showing ${memoryData.blocks.length} blocks (${memoryData.totalSize || 0} bytes total). ${activeSiteMsg}`;
        this.memoryContainer.appendChild(noteElement);
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const visualizerContainer = document.getElementById('visualizer-container');
    
    if (visualizerContainer) {
      console.log("Initializing CloudBleedVisualizer on container:", visualizerContainer);
      window.cloudbleedVisualizer = new CloudBleedVisualizer('visualizer-container');
    } else {
      console.error("Visualizer container not found in the DOM!");
    }
    
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        if (tabId === 'memory-view' && window.cloudbleedVisualizer) {
          console.log("Tab activated: Refreshing CloudBleedVisualizer");
          window.cloudbleedVisualizer.fetchServerMemory();
        }
      });
    });
  });
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudBleedVisualizer;
  }