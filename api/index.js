// This file serves as the main API entry point for Vercel

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeMemory, getMemoryContents, simulateDataAccess } = require('../backend/memory_manager');
const { processWithVulnerableParser } = require('../backend/vulnerable_parser');
const { processWithFixedParser } = require('../backend/fixed_parser');

// Initialize Express app for Vercel
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/html' }));

// Initialize server memory with "sensitive" data
initializeMemory();

// Routes
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get memory contents
app.get('/api/memory', (req, res) => {
  res.json({ memory: getMemoryContents() });
});

// Process HTML through vulnerable parser
app.post('/api/vulnerable-parser', (req, res) => {
  const { html, site } = req.body;
  
  // Simulate accessing site-specific data
  if (site) {
    simulateDataAccess(site);
  }
  
  const result = processWithVulnerableParser(html, site);
  res.json(result);
});

// Process HTML through fixed parser
app.post('/api/fixed-parser', (req, res) => {
  const { html } = req.body;
  const result = processWithFixedParser(html);
  res.json(result);
});

// Reset server memory
app.post('/api/reset-memory', (req, res) => {
  initializeMemory();
  res.json({ status: 'Memory reset successfully' });
});

// Simulate real-world scenario
app.post('/api/simulate-scenario', (req, res) => {
  const { steps } = req.body;
  const results = [];

  for (const step of steps) {
    if (step.type === 'access') {
      // Simulate user accessing a website
      simulateDataAccess(step.site);
      results.push({
        step: step.name,
        action: `Accessed ${step.site}`,
        details: `${step.site} data loaded into server memory`
      });
    } else if (step.type === 'request') {
      // Simulate user making a request with HTML content
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
});

// For Vercel, we need to export the Express app as a module
module.exports = app;
