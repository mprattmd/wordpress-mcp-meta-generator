#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// MCP Server implementation
interface MetaDescriptionRequest {
  title: string;
  content: string;
  keywords?: string[];
  maxLength?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'marketing';
}

interface ContentAnalysis {
  title: string;
  wordCount: number;
  topKeywords: string[];
  suggestedMetaLength: number;
  contentType: string;
  readabilityScore?: number;
}

class WordPressMCPMetaServer {
  
  async generateMetaDescription(request: MetaDescriptionRequest) {
    const { 
      title, 
      content, 
      keywords = [], 
      maxLength = 155, 
      tone = 'professional' 
    } = request;

    // Validate inputs
    if (!title?.trim()) {
      throw new Error("Title cannot be empty");
    }
    
    if (!content?.trim()) {
      throw new Error("Content cannot be empty");
    }

    // Process content
    const contentPreview = this.extractContentPreview(content, 1000);
    const analysis = this.performContentAnalysis(content, title);
    
    // Generate meta description
    const metaDescription = await this.createMetaDescription({
      title,
      content: contentPreview,
      keywords,
      maxLength,
      tone: tone as 'professional' | 'casual' | 'technical' | 'marketing'
    });

    const suggestions = this.getOptimizationSuggestions(metaDescription, keywords, analysis);

    return {
      success: true,
      metaDescription,
      length: metaDescription.length,
      tone,
      keywords,
      suggestions,
      analysis: {
        wordCount: analysis.wordCount,
        contentType: analysis.contentType,
        topKeywords: analysis.topKeywords.slice(0, 5)
      }
    };
  }

  async analyzeContent(args: { content: string; title: string }) {
    const { content, title } = args;
    
    if (!content?.trim()) {
      throw new Error("Content cannot be empty");
    }
    
    const analysis = this.performContentAnalysis(content, title);
    
    return {
      success: true,
      ...analysis
    };
  }

  async batchGenerate(args: { posts: any[]; tone?: string }) {
    const { posts, tone = 'professional' } = args;
    
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error("Posts array cannot be empty");
    }

    const results = [];
    
    for (const post of posts) {
      try {
        const result = await this.generateMetaDescription({
          title: post.title,
          content: post.content,
          keywords: post.keywords || [],
          maxLength: 155,
          tone: tone as 'professional' | 'casual' | 'technical' | 'marketing'
        });
        
        results.push({
          id: post.id,
          success: true,
          metaDescription: result.metaDescription,
          length: result.length,
          suggestions: result.suggestions
        });
      } catch (error) {
        results.push({
          id: post.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      results
    };
  }

  private extractContentPreview(content: string, maxLength: number): string {
    // Remove HTML tags and normalize whitespace
    const cleanContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    
    // Try to cut at sentence boundary
    const sentences = cleanContent.split(/[.!?]+/);
    let preview = '';
    
    for (const sentence of sentences) {
      if ((preview + sentence + '. ').length > maxLength) {
        break;
      }
      preview += sentence + '. ';
    }
    
    return preview.trim() || cleanContent.substring(0, maxLength - 3) + '...';
  }

  private performContentAnalysis(content: string, title: string): ContentAnalysis {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
      
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
    
    return {
      title,
      wordCount: words.length,
      topKeywords,
      suggestedMetaLength: Math.min(155, Math.max(120, Math.floor(words.length / 12))),
      contentType: this.detectContentType(content, title),
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }

  private detectContentType(content: string, title: string): string {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('how to') || lowerContent.includes('step')) return 'tutorial';
    if (lowerTitle.includes('review') || lowerContent.includes('pros and cons')) return 'review';
    if (lowerTitle.includes('list') || /^\d+\.|\n\d+\.|\n•/.test(content)) return 'listicle';
    if (lowerContent.includes('what is') || lowerContent.includes('definition')) return 'informational';
    if (lowerContent.includes('buy') || lowerContent.includes('price')) return 'commercial';
    
    return 'general';
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Simplified Flesch Reading Ease score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private async createMetaDescription(params: MetaDescriptionRequest): Promise<string> {
    const { title, content, keywords, maxLength, tone } = params;
    
    // Enhanced meta description generation logic
    const contentSummary = this.createContentSummary(content, maxLength! - title.length - 20);
    const keywordPhrase = keywords && keywords.length > 0 ? keywords[0] : '';
    
    let description = '';
    
    // Generate based on content type and tone
    switch (tone) {
      case 'marketing':
        description = this.createMarketingDescription(title, contentSummary, keywordPhrase || '', maxLength!);
        break;
      case 'technical':
        description = this.createTechnicalDescription(title, contentSummary, keywordPhrase || '', maxLength!);
        break;
      case 'casual':
        description = this.createCasualDescription(title, contentSummary, keywordPhrase || '', maxLength!);
        break;
      default:
        description = this.createProfessionalDescription(title, contentSummary, keywordPhrase || '', maxLength!);
    }
    
    // Ensure length constraint
    if (description.length > maxLength!) {
      description = description.substring(0, maxLength! - 3) + '...';
    }
    
    return description;
  }

  private createContentSummary(content: string, maxLength: number): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length === 0) return content.substring(0, maxLength);
    
    const firstSentence = sentences[0];
    if (!firstSentence) return content.substring(0, maxLength);
    
    let summary = firstSentence.trim();
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  }

  private createMarketingDescription(title: string, summary: string, keyword: string, maxLength: number): string {
    const actionWords = ['Discover', 'Learn', 'Get', 'Find', 'Unlock', 'Master'];
    const action = actionWords[Math.floor(Math.random() * actionWords.length)];
    
    if (keyword) {
      return `${action} ${keyword} with our ${title.toLowerCase()}. ${summary}`.substring(0, maxLength);
    }
    return `${action} ${title.toLowerCase()}. ${summary}`.substring(0, maxLength);
  }

  private createTechnicalDescription(title: string, summary: string, keyword: string, maxLength: number): string {
    if (keyword) {
      return `Technical guide to ${keyword}: ${title}. ${summary}`.substring(0, maxLength);
    }
    return `${title}: ${summary}`.substring(0, maxLength);
  }

  private createCasualDescription(title: string, summary: string, keyword: string, maxLength: number): string {
    const casual_starters = ['Check out', 'Looking for', 'Want to know about', 'Here\'s everything about'];
    const starter = casual_starters[Math.floor(Math.random() * casual_starters.length)];
    
    if (keyword) {
      return `${starter} ${keyword}? ${title}. ${summary}`.substring(0, maxLength);
    }
    return `${starter} ${title.toLowerCase()}. ${summary}`.substring(0, maxLength);
  }

  private createProfessionalDescription(title: string, summary: string, keyword: string, maxLength: number): string {
    if (keyword && !summary.toLowerCase().includes(keyword.toLowerCase())) {
      return `${title}: Professional guide to ${keyword}. ${summary}`.substring(0, maxLength);
    }
    return `${title}. ${summary}`.substring(0, maxLength);
  }

  private getOptimizationSuggestions(
    metaDescription: string, 
    keywords: string[], 
    analysis: ContentAnalysis
  ): string[] {
    const suggestions: string[] = [];
    
    // Length suggestions
    if (metaDescription.length < 120) {
      suggestions.push('Consider making the description longer (120-155 characters is optimal for SEO)');
    } else if (metaDescription.length > 155) {
      suggestions.push('Description exceeds recommended length - consider shortening to under 155 characters');
    }
    
    // Keyword suggestions
    if (keywords.length > 0) {
      const hasMainKeyword = keywords.some(k => 
        metaDescription.toLowerCase().includes(k.toLowerCase())
      );
      if (!hasMainKeyword) {
        suggestions.push(`Consider including your primary keyword "${keywords[0]}" in the meta description`);
      }
    }
    
    // Content type specific suggestions
    if (analysis.contentType === 'tutorial' && !metaDescription.toLowerCase().includes('how')) {
      suggestions.push('For tutorial content, consider including "how to" in your meta description');
    }
    
    if (analysis.contentType === 'review' && !metaDescription.match(/\b(review|rating|pros|cons)\b/i)) {
      suggestions.push('For review content, consider mentioning "review", "rating", or "pros and cons"');
    }
    
    // Call to action suggestion
    if (!metaDescription.match(/\b(learn|discover|find|get|read|see)\b/i)) {
      suggestions.push('Consider adding a call-to-action word like "learn", "discover", or "find out"');
    }
    
    // Punctuation suggestion
    if (!metaDescription.match(/[.!?]$/)) {
      suggestions.push('Consider ending with proper punctuation for better readability');
    }
    
    return suggestions;
  }
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get API key from environment or generate one
const API_KEY = process.env.MCP_API_KEY || crypto.randomBytes(32).toString('hex');

// Log API key on startup
console.log('\n🔑 API Key for WordPress plugin:', API_KEY);
console.log('   Save this key in your WordPress plugin settings!\n');

// Authentication middleware
function authenticateApiKey(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // Skip auth for health check
  if (req.path === '/') {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    console.log('❌ Authentication failed: No API key provided');
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide an API key in the X-API-Key header or Authorization: Bearer header'
    });
    return;
  }

  if (apiKey !== API_KEY) {
    console.log('❌ Authentication failed: Invalid API key');
    res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
    return;
  }

  console.log('✅ Authentication successful');
  next();
}

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// CORS - accept all origins but require API key
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: '*',
  maxAge: 86400
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply authentication to all routes except health check
app.use(authenticateApiKey);

// Initialize MCP server
const mcpServer = new WordPressMCPMetaServer();

// Health check endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WordPress MCP Meta Description Generator HTTP API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    cors: 'enabled',
    auth: 'required',
    authMethod: 'API key in X-API-Key or Authorization header'
  });
});

// API endpoints (auth required)
app.post('/api/generate', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { tool, args } = req.body;
    
    if (!tool || !args) {
      res.status(400).json({
        error: 'Missing tool or args parameter',
        required: 'Both "tool" and "args" are required',
        received: { tool, args: args ? 'present' : 'missing' }
      });
      return;
    }

    let result;
    
    // Route to appropriate method
    switch (tool) {
      case 'generate_meta_description':
        result = await mcpServer.generateMetaDescription(args);
        break;
      case 'analyze_content':
        result = await mcpServer.analyzeContent(args);
        break;
      case 'batch_generate':
        result = await mcpServer.batchGenerate(args);
        break;
      default:
        res.status(400).json({
          error: `Unknown tool: ${tool}`,
          available_tools: ['generate_meta_description', 'analyze_content', 'batch_generate']
        });
        return;
    }
    
    console.log('Sending response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    available_endpoints: ['GET /', 'POST /api/generate'],
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
function createServer() {
  const server = http.createServer(app);
  const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  server.listen(portNumber, '0.0.0.0', () => {
    console.log(`\n🌐 WordPress MCP HTTP API running on port ${portNumber}`);
    console.log(`🔗 Health check: http://localhost:${portNumber}/`);
    console.log(`🚀 API endpoint: http://localhost:${portNumber}/api/generate`);
    console.log(`✅ CORS enabled for all origins`);
    console.log(`🔐 API key authentication required`);
    console.log(`📡 Listening on 0.0.0.0:${portNumber}\n`);
  });
  return server;
}

// Start the server
const server = createServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;