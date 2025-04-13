/**
 * demo.js
 * Main controller logic for the CloudBleed demonstration
 */
const API_BASE_URL = '/api';
const API_ENDPOINTS = {
  vulnerableParser: `${API_BASE_URL}/vulnerable-parser`,
  fixedParser: `${API_BASE_URL}/fixed-parser`,
  memory: `${API_BASE_URL}/memory`,
  resetMemory: `${API_BASE_URL}/reset-memory`,
  simulateScenario: `${API_BASE_URL}/simulate-scenario`
};

const elements = {

  tabButtons: document.querySelectorAll('.tab-button'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  htmlInput: document.getElementById('html-input'),
  siteSelector: document.getElementById('site-selector'),
  sendVulnerableBtn: document.getElementById('send-vulnerable'),
  sendFixedBtn: document.getElementById('send-fixed'),
  useTriggerBtn: document.getElementById('use-trigger'),
  useComplexBtn: document.getElementById('use-complex'),
  resetMemoryBtn: document.getElementById('reset-memory'),
  vulnerableResult: document.getElementById('vulnerable-result'),
  fixedResult: document.getElementById('fixed-result'),
  vulnerableStatus: document.getElementById('vulnerable-status'),
  fixedStatus: document.getElementById('fixed-status'),
  
  refreshMemoryBtn: document.getElementById('refresh-memory'),
  clearMemoryBtn: document.getElementById('clear-memory'),
  memoryContainer: document.getElementById('memory-container'),
  
  runScenarioBtn: document.getElementById('run-scenario'),
  resetScenarioBtn: document.getElementById('reset-scenario'),
  scenarioStepsList: document.getElementById('scenario-steps-list'),
  scenarioUrl: document.getElementById('scenario-url'),
  scenarioContent: document.getElementById('scenario-content'),
  scenarioLogContainer: document.getElementById('scenario-log-container')
};

const sampleContent = {
  trigger: '<p>This content has a </script> tag that triggers the parser</p>',
  complex: `<div><p style='color:red;'>This is a complex HTML with <style>.class{color:blue;}</style> 
and many nested tags that will cause the parser to overflow its buffer when 
specific optimizations are applied to the content.</p></div>`
};

document.addEventListener('DOMContentLoaded', () => {
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      elements.tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      elements.tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
      
      if (tabId === 'memory-view') {
        refreshMemoryView();
      }
    });
  });
  
  elements.sendVulnerableBtn.addEventListener('click', sendToVulnerableParser);
  elements.sendFixedBtn.addEventListener('click', sendToFixedParser);
  elements.useTriggerBtn.addEventListener('click', () => {
    elements.htmlInput.value = sampleContent.trigger;
  });
  elements.useComplexBtn.addEventListener('click', () => {
    elements.htmlInput.value = sampleContent.complex;
  });
  elements.resetMemoryBtn.addEventListener('click', resetServerMemory);
  
  elements.refreshMemoryBtn.addEventListener('click', refreshMemoryView);
  elements.clearMemoryBtn.addEventListener('click', resetServerMemory);
  
  elements.runScenarioBtn.addEventListener('click', runScenario);
  elements.resetScenarioBtn.addEventListener('click', resetScenario);
  
  refreshMemoryView();
});

/**
 * Send HTML to the vulnerable parser
 */
async function sendToVulnerableParser() {
  const html = elements.htmlInput.value.trim();
  if (!html) {
    updateStatus(elements.vulnerableStatus, 'warning', 'Please enter some HTML content');
    return;
  }
  
  const site = elements.siteSelector.value;
  
  try {
    updateStatus(elements.vulnerableStatus, 'info', 'Sending request...');
    
    const response = await fetch(API_ENDPOINTS.vulnerableParser, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html, site })
    });
    
    const result = await response.json();
    
    if (result.leakSize > 0) {
      updateStatus(elements.vulnerableStatus, 'error', `Vulnerability triggered! ${result.leakSize} bytes leaked`);
      
      const contentWithHighlight = result.content.replace(
        /<!-- LEAKED DATA: (.*?) -->/g, 
        '<div class="leaked-data">LEAKED DATA: $1</div>'
      );
      
      elements.vulnerableResult.innerHTML = formatResponse(result, contentWithHighlight);
    } else if (result.vulnerabilityTriggered) {
      updateStatus(elements.vulnerableStatus, 'warning', 'Vulnerability triggered but no data leaked this time');
      elements.vulnerableResult.innerHTML = formatResponse(result);
    } else {
      updateStatus(elements.vulnerableStatus, 'success', 'Request processed successfully (no vulnerability triggered)');
      elements.vulnerableResult.innerHTML = formatResponse(result);
    }
    
    if (document.getElementById('memory-view').classList.contains('active')) {
      refreshMemoryView();
    }
    
  } catch (error) {
    console.error('Error sending to vulnerable parser:', error);
    updateStatus(elements.vulnerableStatus, 'error', 'Error: Could not process request');
    elements.vulnerableResult.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

/**
 * Send HTML to the fixed parser
 */
async function sendToFixedParser() {
  const html = elements.htmlInput.value.trim();
  if (!html) {
    updateStatus(elements.fixedStatus, 'warning', 'Please enter some HTML content');
    return;
  }
  
  try {
    updateStatus(elements.fixedStatus, 'info', 'Sending request...');
    
    const response = await fetch(API_ENDPOINTS.fixedParser, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html })
    });
    
    const result = await response.json();
    
    updateStatus(elements.fixedStatus, 'success', 'Request processed successfully with fixed parser');
    elements.fixedResult.innerHTML = formatResponse(result);
    
  } catch (error) {
    console.error('Error sending to fixed parser:', error);
    updateStatus(elements.fixedStatus, 'error', 'Error: Could not process request');
    elements.fixedResult.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

/**
 * Reset the server memory
 */
async function resetServerMemory() {
  try {
    const response = await fetch(API_ENDPOINTS.resetMemory, { method: 'POST' });
    const result = await response.json();
    
    if (result.status.includes('success')) {
      if (document.getElementById('memory-view').classList.contains('active')) {
        refreshMemoryView();
      }
      
      alert('Server memory has been reset successfully');
    }
  } catch (error) {
    console.error('Error resetting server memory:', error);
    alert('Error: Could not reset server memory');
  }
}

/**
 * Refresh the memory view visualization
 */
async function refreshMemoryView() {
    try {
      elements.memoryContainer.innerHTML = '<div class="loading">Loading memory data...</div>';
      
      const response = await fetch(API_ENDPOINTS.memory);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Memory data received:", data);
      
      const memoryData = transformMemoryData(data.memory);
      
      renderMemoryView(memoryData);
      
      if (window.cloudbleedVisualizer) {
        window.cloudbleedVisualizer.fetchServerMemory();
      }
    } catch (error) {
      console.error('Error refreshing memory view:', error);
      elements.memoryContainer.innerHTML = `<div class="error">Error loading memory data: ${error.message}</div>`;
    }
  }
  
  /**
   * Transform raw memory data into a format suitable for visualization
   */
  function transformMemoryData(rawData) {
    if (!rawData || !rawData.blocks || rawData.blocks.length === 0) {
      return {
        size: 0,
        blocks: [],
        sections: []
      };
    }
    
    const size = rawData.totalSize || rawData.size || 4096;
    
    const blocks = rawData.blocks.map(block => {
      const percentage = (block.size / size) * 100;
      
      return {
        type: block.type || 'clean',
        data: block.data || '',
        percentage: percentage.toFixed(2)
      };
    });
    
    const sections = rawData.sections || [];
    
    return { size, blocks, sections };
  }

/**
 * Run the CloudBleed scenario demonstration
 */
async function runScenario() {
  elements.runScenarioBtn.disabled = true;
  elements.resetScenarioBtn.disabled = true;
  
  resetScenario(false);
  
  addScenarioLog('Starting CloudBleed scenario demonstration...', 'info');
  
  const scenarioSteps = [
    {
      type: 'access',
      name: 'Bank login',
      site: 'bank.example.com',
      delay: 1000
    },
    {
      type: 'request',
      name: 'Process transaction',
      site: 'bank.example.com',
      html: '<div class="transaction" data-account="12345" data-amount="1000.00">Transfer $1000 to Account #54321</div>',
      delay: 2000
    },
    {
      type: 'access',
      name: 'Visit blog',
      site: 'blog.example.com',
      delay: 1500
    },
    {
      type: 'request',
      name: 'View blog post',
      site: 'blog.example.com',
      html: `<div class="blog-post">
  <h1 class="blog-title">10 Tips for Web Security</h1>
  <div class="blog-meta">Posted by: Jane Smith | April 12, 2025</div>
  <div class="blog-content">
    <p>Web security is more important than ever in today's connected world.</p>
    <p style="color: blue;">This paragraph has a style attribute that triggers the CloudBleed vulnerability.</p>
    <p>Make sure your passwords are strong and unique for each site you visit!</p>
  </div>
  <div class="blog-tags">
    <span class="blog-tag">Security</span>
    <span class="blog-tag">Web Development</span>
    <span class="blog-tag">Tips</span>
  </div>
</div>`,
      delay: 2500
    }
  ];
  
  try {
    await fetch(API_ENDPOINTS.resetMemory, { method: 'POST' });
    
    if (window.cloudbleedVisualizer) {
      window.cloudbleedVisualizer.reset();
    }
    
    const response = await fetch(API_ENDPOINTS.simulateScenario, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ steps: scenarioSteps })
    });
    
    const scenarioResults = await response.json();
    
    for (let i = 0; i < scenarioResults.results.length; i++) {
      const result = scenarioResults.results[i];
      const step = scenarioSteps[i];
      
      highlightScenarioStep(i);
      
      elements.scenarioUrl.textContent = `https://${step.site}`;
      
      addScenarioLog(`Step ${i+1}: ${result.action}`, 'info');
      
      if (step.type === 'request') {
        if (step.site === 'bank.example.com') {
          showBankInterface();
          addScenarioLog('Bank transaction processed', 'success');
        } else if (step.site === 'blog.example.com') {
          if (result.leakDetected) {
            const leakedContent = result.response.content.replace(
              /<!-- LEAKED DATA: (.*?) -->/g, 
              '<div class="leaked-data">LEAKED DATA: $1</div>'
            );
            
            showBlogWithLeak(leakedContent);
            
            addScenarioLog('WARNING: Memory leak detected in response!', 'error');
            addScenarioLog(`${result.response.leakSize} bytes of sensitive data leaked`, 'error');
            addScenarioLog('This is the CloudBleed vulnerability in action', 'warning');
          } else {
            showBlogInterface();
            addScenarioLog('Blog post loaded successfully', 'success');
          }
        }
      } else if (step.type === 'access') {
        if (step.site === 'bank.example.com') {
          showBankLoginPage();
        } else if (step.site === 'blog.example.com') {
          showBlogHomePage();
        }
      }
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
    
    addScenarioLog('Scenario completed. CloudBleed vulnerability demonstration finished.', 'success');
    
    if (document.getElementById('memory-view').classList.contains('active')) {
      refreshMemoryView();
    } else if (window.cloudbleedVisualizer) {
      window.cloudbleedVisualizer.fetchServerMemory();
    }
    
    document.querySelectorAll('#scenario-steps-list li').forEach(li => {
      li.classList.remove('active');
      li.classList.add('completed');
    });
    
  } catch (error) {
    console.error('Error running scenario:', error);
    addScenarioLog(`Error: ${error.message}`, 'error');
  } finally {
    elements.runScenarioBtn.disabled = false;
    elements.resetScenarioBtn.disabled = false;
  }
}
/**
 * Reset the scenario demo to its initial state
 */
function resetScenario(showMessage = true) {
  document.querySelectorAll('#scenario-steps-list li').forEach(li => {
    li.classList.remove('active', 'completed');
  });
  
  elements.scenarioUrl.textContent = 'https://';
  elements.scenarioContent.innerHTML = `
    <div class="scenario-placeholder">
      <i class="fas fa-globe fa-3x"></i>
      <p>The scenario visualization will appear here</p>
      <p>Click "Run Demonstration" to begin</p>
    </div>
  `;
  
  elements.scenarioLogContainer.innerHTML = '<p class="log-entry">Waiting for scenario to run...</p>';
  
  if (showMessage) {
    alert('Scenario has been reset');
  }
}

/**
 * Helper function to update the status indicator
 */
function updateStatus(statusElement, type, message) {
  const statusDot = statusElement.querySelector('.status-dot');
  const statusText = statusElement.querySelector('.status-text');
  
  statusDot.classList.remove('success', 'error', 'warning');
  
  if (type === 'success') {
    statusDot.classList.add('success');
  } else if (type === 'error') {
    statusDot.classList.add('error');
  } else if (type === 'warning') {
    statusDot.classList.add('warning');
  }
  
  statusText.textContent = message;
}

/**
 * Format the response object for display
 */
function formatResponse(response, customContent = null) {
  let output = '';
  output += `<strong>HTTP Status:</strong> ${response.status}<br>`;
  output += '<strong>Headers:</strong><br>';
  
  for (const [key, value] of Object.entries(response.headers)) {
    output += `${key}: ${value}<br>`;
  }
  
  output += '<br><strong>Content:</strong><br>';
  
  if (customContent) {
    output += customContent;
  } else {
    output += response.content;
  }
  
  if (response.vulnerabilityTriggered) {
    output += '<br><br><strong>Debug Info:</strong><br>';
    output += `Vulnerability Triggered: ${response.vulnerabilityTriggered}<br>`;
    output += `Buffer Overflow: ${response.bufferOverflow}<br>`;
    output += `Processed Size: ${response.processedSize} bytes<br>`;
    
    if (response.leakSize > 0) {
        output += `<div class="leak-info">Leaked Data Size: ${response.leakSize} bytes</div>`;
        output += `<div class="leak-info">Leaked Data: ${response.leakedData || "Unknown"}</div>`;
      }
    }
    
    return output;
  }
  
  /**
   * Render the memory view visualization
   */
  function renderMemoryView(memoryData) {
    if (!memoryData || !memoryData.blocks) {
      elements.memoryContainer.innerHTML = '<p>No memory data available</p>';
      return;
    }
    
    let html = '<div class="memory-visualization">';
    
    html += `<div class="memory-header">
      <h3>Server Memory Visualization (${memoryData.size} bytes)</h3>
      <div class="memory-legend">
        <span class="memory-block clean"></span> Clean
        <span class="memory-block sensitive"></span> Sensitive Data
        <span class="memory-block corrupted"></span> Corrupted Memory
      </div>
    </div>`;
    
    html += '<div class="memory-blocks">';
    
    memoryData.blocks.forEach(block => {
      const blockClass = block.type || 'clean';
      const tooltip = block.data ? `data-tooltip="${block.data}"` : '';
      
      html += `<div class="memory-block ${blockClass}" ${tooltip} style="width: ${block.percentage}%"></div>`;
    });
    
    html += '</div></div>';
    
    if (memoryData.sections && memoryData.sections.length > 0) {
      html += '<div class="memory-sections">';
      html += '<h3>Memory Sections:</h3>';
      
      memoryData.sections.forEach(section => {
        html += `<div class="memory-section">
          <h4>${section.name} (${section.start}-${section.end})</h4>
          <pre class="memory-content">${section.content}</pre>
        </div>`;
      });
      
      html += '</div>';
    }
    
    elements.memoryContainer.innerHTML = html;
  }
  
  /**
   * Highlight the current step in the scenario demo
   */
  function highlightScenarioStep(stepIndex) {
    const steps = document.querySelectorAll('#scenario-steps-list li');
    steps.forEach((step, index) => {
      if (index < stepIndex) {
        step.classList.remove('active');
        step.classList.add('completed');
      } else if (index === stepIndex) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }
  
  /**
   * Show bank login interface in the scenario browser
   */
  function showBankLoginPage() {
    elements.scenarioContent.innerHTML = `
      <div class="scenario-browser-content bank">
        <h2>SecureBank Online Banking</h2>
        <div class="login-form">
          <div class="form-group">
            <label>Username:</label>
            <input type="text" value="user123" readonly>
          </div>
          <div class="form-group">
            <label>Password:</label>
            <input type="password" value="••••••••" readonly>
          </div>
          <button>Log In</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Show bank transaction interface in the scenario browser
   */
  function showBankInterface() {
    elements.scenarioContent.innerHTML = `
      <div class="scenario-browser-content bank">
        <h2>SecureBank Online Banking</h2>
        <div class="account-info">
          <h3>Welcome, John Smith</h3>
          <div class="account-balance">
            <span>Current Balance:</span>
            <strong>$45,281.93</strong>
          </div>
          <div class="transaction-form">
            <h4>Transfer Funds</h4>
            <div class="form-group">
              <label>To Account:</label>
              <input type="text" value="54321" readonly>
            </div>
            <div class="form-group">
              <label>Amount:</label>
              <input type="text" value="$1,000.00" readonly>
            </div>
            <button>Complete Transfer</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Show blog home page in the scenario browser
   */
  function showBlogHomePage() {
    elements.scenarioContent.innerHTML = `
      <div class="scenario-browser-content blog">
        <h2>TechBlog: Latest in Web Development</h2>
        <div class="blog-posts">
          <div class="blog-post-card">
            <h3>10 Tips for Web Security</h3>
            <p>Web security is more important than ever in today's connected world.</p>
            <button>Read More</button>
          </div>
          <div class="blog-post-card">
            <h3>Introduction to CSS Grid</h3>
            <p>Learn how to use CSS Grid for modern layouts.</p>
            <button>Read More</button>
          </div>
          <div class="blog-post-card">
            <h3>JavaScript Promises Explained</h3>
            <p>Understand how to work with asynchronous code in JavaScript.</p>
            <button>Read More</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Show blog with leaked data in the scenario browser
   */
  function showBlogWithLeak(content) {
    elements.scenarioContent.innerHTML = `
      <div class="scenario-browser-content blog">
        <h2>TechBlog: 10 Tips for Web Security</h2>
        <div class="blog-content">
          ${content}
        </div>
      </div>
    `;
  }
  
  /**
   * Add a log entry to the scenario log
   */
  function addScenarioLog(message, type = 'info') {
    const logEntry = document.createElement('p');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${message}`;
    
    elements.scenarioLogContainer.appendChild(logEntry);
    elements.scenarioLogContainer.scrollTop = elements.scenarioLogContainer.scrollHeight;
  }