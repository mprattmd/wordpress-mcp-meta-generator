#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import the existing MCP server class
import './index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WordPress MCP Meta Description Generator HTTP API',
    version: '1.0.0'
  });
});

// Main API endpoint for WordPress
app.post('/api/generate', async (req, res) => {
  try {
    const { tool, args } = req.body;
    
    if (!tool || !args) {
      return res.status(400).json({
        error: 'Missing tool or args parameter'
      });
    }

    // Create a temporary MCP server instance for this request
    const result = await handleMCPRequest(tool, args);
    
    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Handle MCP requests
async function handleMCPRequest(tool, args) {
  // Import and use the MCP server logic
  const { WordPressMCPMetaServer } = await import('./index.js');
  
  const server = new WordPressMCPMetaServer();
  
  // Simulate the MCP call
  if (tool === 'generate_meta_description') {
    return await server.generateMetaDescription(args);
  } else if (tool === 'analyze_content') {
    return await server.analyzeContent(args);
  } else if (tool === 'batch_generate') {
    return await server.batchGenerate(args);
  } else {
    throw new Error(`Unknown tool: ${tool}`);
  }
}

app.listen(PORT, () => {
  console.log(`WordPress MCP HTTP API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`API endpoint: http://localhost:${PORT}/api/generate`);
});

export default app;