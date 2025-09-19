#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

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
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "wordpress-meta-description-generator",
        version: "1.0.0",
        description: "Generate SEO-optimized meta descriptions for WordPress content"
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "generate_meta_description",
            description: "Generate SEO-optimized meta descriptions for WordPress posts/pages",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The page/post title",
                  maxLength: 200
                },
                content: {
                  type: "string", 
                  description: "The main content of the page/post",
                  maxLength: 5000
                },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Target keywords for SEO (optional)",
                  maxItems: 10
                },
                maxLength: {
                  type: "number",
                  description: "Maximum length of meta description",
                  default: 155,
                  minimum: 50,
                  maximum: 300
                },
                tone: {
                  type: "string",
                  enum: ["professional", "casual", "technical", "marketing"],
                  description: "Tone of the meta description",
                  default: "professional"
                }
              },
              required: ["title", "content"],
              additionalProperties: false
            }
          },
          {
            name: "analyze_content",
            description: "Analyze content to extract key themes and suggest keywords",
            inputSchema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Content to analyze",
                  maxLength: 10000
                },
                title: {
                  type: "string", 
                  description: "Title of the content",
                  maxLength: 200
                }
              },
              required: ["content", "title"],
              additionalProperties: false
            }
          },
          {
            name: "batch_generate",
            description: "Generate meta descriptions for multiple posts at once",
            inputSchema: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string", maxLength: 200 },
                      content: { type: "string", maxLength: 3000 },
                      keywords: {
                        type: "array",
                        items: { type: "string" },
                        maxItems: 5
                      }
                    },
                    required: ["id", "title", "content"]
                  },
                  maxItems: 20
                },
                tone: {
                  type: "string",
                  enum: ["professional", "casual", "technical", "marketing"],
                  default: "professional"
                }
              },
              required: ["posts"],
              additionalProperties: false
            }
          }
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "generate_meta_description":
            return await this.generateMetaDescription(args as MetaDescriptionRequest);
            
          case "analyze_content":
            return await this.analyzeContent(args as { content: string; title: string });
            
          case "batch_generate":
            return await this.batchGenerate(args as { posts: any[]; tone?: string });
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async generateMetaDescription(request: MetaDescriptionRequest) {
    const { 
      title, 
      content, 
      keywords = [], 
      maxLength = 155, 
      tone = 'professional' 
    } = request;

    // Validate inputs
    if (!title?.trim()) {
      throw new McpError(ErrorCode.InvalidParams, "Title cannot be empty");
    }
    
    if (!content?.trim()) {
      throw new McpError(ErrorCode.InvalidParams, "Content cannot be empty");
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
      tone
    });

    const suggestions = this.getOptimizationSuggestions(metaDescription, keywords, analysis);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
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
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeContent(args: { content: string; title: string }) {
    const { content, title } = args;
    
    if (!content?.trim()) {
      throw new McpError(ErrorCode.InvalidParams, "Content cannot be empty");
    }
    
    const analysis = this.performContentAnalysis(content, title);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            ...analysis
          }, null, 2)
        }
      ]
    };
  }

  private async batchGenerate(args: { posts: any[]; tone?: string }) {
    const { posts, tone = 'professional' } = args;
    
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, "Posts array cannot be empty");
    }

    const results = [];
    
    for (const post of posts) {
      try {
        const result = await this.generateMetaDescription({
          title: post.title,
          content: post.content,
          keywords: post.keywords || [],
          maxLength: 155,
          tone
        });
        
        const parsed = JSON.parse(result.content[0].text);
        results.push({
          id: post.id,
          success: true,
          metaDescription: parsed.metaDescription,
          length: parsed.length,
          suggestions: parsed.suggestions
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
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            processed: results.length,
            results
          }, null, 2)
        }
      ]
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
        description = this.createMarketingDescription(title, contentSummary, keywordPhrase, maxLength!);
        break;
      case 'technical':
        description = this.createTechnicalDescription(title, contentSummary, keywordPhrase, maxLength!);
        break;
      case 'casual':
        description = this.createCasualDescription(title, contentSummary, keywordPhrase, maxLength!);
        break;
      default:
        description = this.createProfessionalDescription(title, contentSummary, keywordPhrase, maxLength!);
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
    
    let summary = sentences[0].trim();
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr for status (stdout is used for MCP communication)
    console.error("WordPress Meta Description Generator MCP server running on stdio");
    console.error(`Server capabilities: ${JSON.stringify(this.server.getCapabilities())}`);
  }
}

// Start the server
const server = new WordPressMCPMetaServer();
server.run().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});