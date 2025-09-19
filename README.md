# WordPress MCP Meta Description Generator

An intelligent meta description generator for WordPress that uses the Model Context Protocol (MCP) to create SEO-optimized descriptions with AI assistance. This tool integrates seamlessly with Yoast SEO and provides advanced content analysis capabilities.

## 🚀 Features

- **AI-Powered Generation**: Uses MCP server to generate contextually relevant meta descriptions
- **Multiple Tones**: Professional, casual, technical, and marketing writing styles
- **Content Analysis**: Automatic keyword extraction and content type detection
- **Yoast SEO Integration**: Direct integration with Yoast SEO meta description fields
- **Batch Processing**: Generate meta descriptions for multiple posts simultaneously
- **Real-time Optimization**: Get suggestions for improving your meta descriptions
- **Readability Scoring**: Flesch reading ease calculation for content analysis
- **Both Editors**: Supports Classic Editor and Gutenberg (Block Editor)

## 📋 Requirements

- WordPress 5.0+
- Yoast SEO plugin
- Node.js 18+ (for MCP server)
- PHP 7.4+

## 🛠️ Installation

### Step 1: Clone and Set Up MCP Server

```bash
# Clone the repository
git clone https://github.com/mprattmd/wordpress-mcp-meta-generator.git
cd wordpress-mcp-meta-generator

# Install dependencies
npm install

# Build the TypeScript
npm run build
```

### Step 2: Configure Claude Desktop (Recommended)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    },
    "wordpress-meta-generator": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/wordpress-mcp-meta-generator"
    }
  }
}
```

### Step 3: Install WordPress Plugin

1. Copy the `wordpress-plugin` directory to your WordPress plugins folder:
   ```bash
   cp -r wordpress-plugin /path/to/wordpress/wp-content/plugins/mcp-meta-generator
   ```

2. Activate the plugin in WordPress admin under **Plugins** → **Installed Plugins**

3. Configure the plugin at **Settings** → **MCP Meta Generator**

## ⚙️ Configuration

### WordPress Plugin Settings

1. **MCP Server URL**: Configure how to connect to your MCP server
   - Local development: `http://localhost:3000`
   - Production server: `https://your-server.com/mcp`

2. **Default Tone**: Choose your preferred writing style
   - Professional (formal, authoritative)
   - Casual (friendly, conversational)
   - Technical (precise, industry-specific)
   - Marketing (persuasive, action-oriented)

3. **Auto Generate**: Enable automatic content analysis as you type

### MCP Server Options

The MCP server can be run in several ways:

1. **Local Development**:
   ```bash
   npm start
   ```

2. **Production with PM2**:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name wordpress-mcp-server
   ```

3. **Via Claude Desktop**: Automatically managed when configured

## 🎯 Usage

### Basic Usage

1. **Edit a post or page** in WordPress
2. **Look for the "MCP Meta Description Generator"** meta box in the sidebar
3. **Click "Analyze Content"** to get insights about your content
4. **Select your desired tone** from the dropdown
5. **Click "Generate Meta Description"** to create an optimized description
6. **Review the suggestions** and character count
7. **Click "Apply to Yoast"** to automatically populate the Yoast SEO field

### Advanced Features

#### Content Analysis
- **Word count** and reading time estimation
- **Content type detection** (tutorial, review, listicle, etc.)
- **Keyword extraction** from your content
- **Readability scoring** using Flesch Reading Ease
- **Optimal meta length suggestions** based on content

#### Batch Processing
Generate meta descriptions for multiple posts:

```javascript
// Via JavaScript API
mcpMetaGenerator.batchGenerate([
  { id: '1', title: 'Post 1', content: '...', keywords: ['seo'] },
  { id: '2', title: 'Post 2', content: '...', keywords: ['wordpress'] }
], 'professional');
```

#### Tone Examples

**Professional**: "WordPress SEO optimization: Comprehensive guide to improving search rankings. Learn proven strategies and best practices for meta descriptions."

**Marketing**: "Boost Your WordPress SEO! Discover powerful optimization techniques that increase traffic by 300%. Get started today!"

**Technical**: "Technical implementation of WordPress SEO: Meta description optimization using structured data and semantic markup protocols."

**Casual**: "Want better WordPress SEO? Here's everything you need to know about writing meta descriptions that actually work."

## 🔧 Development

### Project Structure

```
wordpress-mcp-meta-generator/
├── src/
│   └── index.ts              # Main MCP server implementation
├── wordpress-plugin/
│   ├── mcp-meta-generator.php # Main plugin file
│   └── assets/
│       ├── admin.js          # Admin interface JavaScript
│       └── admin.css         # Admin interface styling
├── dist/                     # Compiled TypeScript output
├── package.json              # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md
```

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run tests (when available)
npm test
```

### Available MCP Tools

1. **generate_meta_description**
   - Input: title, content, keywords, maxLength, tone
   - Output: optimized meta description with suggestions

2. **analyze_content**
   - Input: content, title
   - Output: word count, keywords, content type, readability score

3. **batch_generate**
   - Input: array of posts, tone
   - Output: meta descriptions for all posts

## 🔌 Integration Examples

### WordPress Hook Integration

```php
// Auto-generate meta descriptions on post save
add_action('save_post', function($post_id) {
    if (get_post_meta($post_id, '_yoast_wpseo_metadesc', true)) {
        return; // Already has meta description
    }
    
    $generator = new MCPMetaDescriptionGenerator();
    $generator->auto_generate_for_post($post_id);
});
```

### REST API Usage

```php
// Custom REST endpoint for external integrations
add_action('rest_api_init', function() {
    register_rest_route('mcp-meta/v1', '/generate', array(
        'methods' => 'POST',
        'callback' => 'mcp_meta_rest_generate',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
});
```

### JavaScript API

```javascript
// Programmatic access to meta generation
window.mcpMetaGenerator.generateMeta('marketing');
window.mcpMetaGenerator.analyzeContent();
window.mcpMetaGenerator.applyToYoast();
```

## 🐛 Troubleshooting

### Common Issues

1. **"MCP Server URL not configured"**
   - Go to Settings → MCP Meta Generator
   - Add your MCP server URL
   - Test the connection

2. **"Could not find Yoast SEO meta description field"**
   - Ensure Yoast SEO is installed and activated
   - Try refreshing the page
   - Check browser console for JavaScript errors

3. **"Failed to generate meta description"**
   - Check MCP server is running: `npm start`
   - Verify server URL is accessible
   - Check WordPress error logs

4. **JavaScript errors in console**
   - Clear browser cache
   - Disable other plugins temporarily
   - Check for jQuery conflicts

### Debug Mode

Enable WordPress debug mode in `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check logs in `/wp-content/debug.log`.

### MCP Server Debug

```bash
# Run with verbose logging
DEBUG=* npm start

# Test server directly
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"analyze_content","arguments":{"content":"Test content","title":"Test"}}}'
```

## 🚀 Deployment

### Production Deployment

1. **Server Setup**:
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start the server
   pm2 start dist/index.js --name wordpress-mcp-server
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

2. **Nginx Configuration** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /mcp {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **WordPress Configuration**:
   - Update MCP Server URL in plugin settings
   - Test functionality on a staging site first

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## 📊 Performance Optimization

### Caching

```php
// Add caching to WordPress plugin
private function get_cached_analysis($post_id) {
    $cache_key = 'mcp_analysis_' . $post_id;
    $cached = get_transient($cache_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    // Generate new analysis
    $analysis = $this->call_mcp_server('analyze_content', $args);
    
    // Cache for 1 hour
    set_transient($cache_key, $analysis, HOUR_IN_SECONDS);
    
    return $analysis;
}
```

### Rate Limiting

```javascript
// Add rate limiting to MCP server
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript/JavaScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/mprattmd/wordpress-mcp-meta-generator/issues)
- **Documentation**: This README and code comments
- **Community**: Discussions tab on GitHub

## 🙏 Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP framework
- [Yoast SEO](https://yoast.com/) for WordPress SEO integration
- [Anthropic](https://anthropic.com/) for Claude and MCP development

## 📈 Roadmap

- [ ] Add support for other SEO plugins (RankMath, All in One SEO)
- [ ] Implement A/B testing for meta descriptions
- [ ] Add social media description generation
- [ ] Create WordPress.org plugin submission
- [ ] Add multilingual support
- [ ] Develop browser extension for quick generation
- [ ] Implement analytics and performance tracking
- [ ] Add custom prompt templates
- [ ] Create WP-CLI commands for bulk operations

---

**Made with ❤️ for the WordPress community**