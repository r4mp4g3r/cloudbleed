const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { initializeMemory, getMemoryContents, simulateDataAccess } = require('./memory_manager');
const { processWithVulnerableParser } = require('./vulnerable_parser');
const { processWithFixedParser } = require('./fixed_parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - configure CORS to handle API requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/html' }));

app.use(express.static(path.join(__dirname, '../frontend')));

initializeMemory();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/memory', (req, res) => {
  try {
    const memoryData = getMemoryContents();
    res.json({ memory: memoryData });
  } catch (error) {
    console.error('Error retrieving memory data:', error);
    res.status(500).json({ error: 'Failed to retrieve memory data', details: error.message });
  }
});

app.post('/api/vulnerable-parser', (req, res) => {
  try {
    const { html, site } = req.body;
    
    if (site) {
      simulateDataAccess(site);
    }
    
    const result = processWithVulnerableParser(html, site);
    res.json(result);
  } catch (error) {
    console.error('Error in vulnerable parser:', error);
    res.status(500).json({ error: 'Parser error', details: error.message });
  }
});

app.post('/api/fixed-parser', (req, res) => {
  try {
    const { html } = req.body;
    const result = processWithFixedParser(html);
    res.json(result);
  } catch (error) {
    console.error('Error in fixed parser:', error);
    res.status(500).json({ error: 'Parser error', details: error.message });
  }
});

app.post('/api/reset-memory', (req, res) => {
  try {
    initializeMemory();
    res.json({ status: 'Memory reset successfully' });
  } catch (error) {
    console.error('Error resetting memory:', error);
    res.status(500).json({ error: 'Reset failed', details: error.message });
  }
});

app.post('/api/simulate-scenario', (req, res) => {
  try {
    const { steps } = req.body;
    const results = [];

    for (const step of steps) {
      if (step.type === 'access') {
        simulateDataAccess(step.site);
        results.push({
          step: step.name,
          action: `Accessed ${step.site}`,
          details: `${step.site} data loaded into server memory`
        });
      } else if (step.type === 'request') {
        const result = processWithVulnerableParser(step.html, step.site);
        results.push({
          step: step.name,
          action: `Request to ${step.site}`,
          response: result,
          leakDetected: result.leakSize > 0
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in scenario simulation:', error);
    res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CloudBleed demo server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to start the demo`);
});