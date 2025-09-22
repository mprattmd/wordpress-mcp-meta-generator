# Image Alt Text Generator for WordPress

## Overview

This feature extends the WordPress MCP Meta Generator plugin with AI-powered image alt text generation capabilities. It helps you create descriptive, SEO-friendly alt text for images in your WordPress posts and pages.

## Features

### 1. Single Image Alt Text Generation
- Generate alt text for individual images
- Context-aware generation using page title and surrounding content
- SEO keyword integration
- Best practices validation

### 2. Batch Processing
- Analyze multiple images at once
- Generate alt text for all images in a post/page
- Bulk operations across multiple posts

### 3. Image Analysis
- Identify images missing alt text
- Flag alt text that needs improvement
- Check for common issues (too short, redundant words, etc.)

### 4. SEO Optimization
- Optimal length recommendations (30-125 characters)
- Keyword inclusion suggestions
- Accessibility best practices

## Installation

### MCP Server Setup

1. The updated MCP server with image alt text capabilities is in `src/index-alt-text.ts`

2. Update your MCP server:
   ```bash
   # Copy the new file
   cp src/index-alt-text.ts src/index.ts
   
   # Rebuild
   npm run build
   
   # Restart the server
   npm start
   ```

### WordPress Plugin Setup

1. Copy the image alt text addon to your WordPress plugins directory:
   ```bash
   cp wordpress-plugin/image-alt-text-addon.php /path/to/wordpress/wp-content/plugins/
   ```

2. Create the assets directory structure:
   ```bash
   mkdir -p /path/to/wordpress/wp-content/plugins/mcp-image-alt/assets/css
   mkdir -p /path/to/wordpress/wp-content/plugins/mcp-image-alt/assets/js
   ```

3. Copy the CSS and JavaScript files:
   ```bash
   cp wordpress-plugin/assets/css/image-alt-admin.css /path/to/wordpress/wp-content/plugins/mcp-image-alt/assets/css/
   cp wordpress-plugin/assets/js/image-alt-admin.js /path/to/wordpress/wp-content/plugins/mcp-image-alt/assets/js/
   ```

4. Activate the plugin in WordPress admin panel

## Usage

### In Post/Page Editor

1. Open any post or page for editing
2. Look for the "AI Image Alt Text Generator" meta box in the sidebar
3. Click "Analyze Images" to scan all images
4. Review the analysis results
5. Click "Generate Alt Text" for individual images or "Generate All Alt Text" for batch processing
6. Click "Apply to Post" to update the image in your content

### Bulk Operations

1. Go to **Tools → Image Alt Text** in WordPress admin
2. Select content type (Posts, Pages, or All)
3. Set the maximum number of images to process
4. Click "Start Analysis"
5. Review results and apply changes

## API Endpoints

The MCP server provides three new tools:

### 1. generate_image_alt_text

Generate alt text for a single image.

**Parameters:**
- `imageUrl` (required): URL of the image
- `fileName` (optional): Original filename
- `context` (optional): Context description
- `pageTitle` (optional): Page/post title
- `surroundingText` (optional): Text near the image
- `maxLength` (optional): Max characters (default: 125)
- `includeKeywords` (optional): Keywords to include

**Example:**
```javascript
{
  "imageUrl": "https://example.com/wp-content/uploads/2024/image.jpg",
  "fileName": "product-showcase.jpg",
  "context": "product photo",
  "pageTitle": "New Product Launch",
  "maxLength": 125,
  "includeKeywords": ["wireless headphones", "audio"]
}
```

### 2. batch_generate_image_alt_text

Generate alt text for multiple images.

**Parameters:**
- `images` (required): Array of image objects
- `pageTitle` (optional): Page/post title
- `pageContent` (optional): Page content for context
- `maxLength` (optional): Max characters

**Example:**
```javascript
{
  "images": [
    {
      "id": "img-1",
      "imageUrl": "https://example.com/image1.jpg",
      "fileName": "hero-image.jpg"
    },
    {
      "id": "img-2",
      "imageUrl": "https://example.com/image2.jpg",
      "context": "infographic"
    }
  ],
  "pageTitle": "Ultimate Guide to Photography",
  "maxLength": 125
}
```

### 3. analyze_images_in_content

Analyze images in HTML content.

**Parameters:**
- `content` (required): HTML content with images
- `title` (required): Page/post title

**Example:**
```javascript
{
  "content": "<p>Here's an image: <img src='example.jpg' alt='old alt text'></p>",
  "title": "My Blog Post"
}
```

## Best Practices

### Alt Text Guidelines

1. **Be Descriptive**: Describe what's in the image, not just label it
   - ❌ "Image of product"
   - ✅ "Wireless over-ear headphones in matte black finish"

2. **Keep it Concise**: Aim for 30-125 characters
   - Short enough to be useful
   - Long enough to be descriptive

3. **Avoid Redundancy**: Don't use "image of" or "picture of"
   - Screen readers already announce it's an image

4. **Include Keywords**: When relevant and natural
   - Don't keyword stuff
   - Make it sound natural

5. **Context Matters**: Consider the image's purpose on the page
   - Decorative images: Use empty alt=""
   - Functional images: Describe the function
   - Informative images: Describe the information

## Troubleshooting

### MCP Server Connection Issues

1. Verify the server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check the server URL in WordPress settings

3. Review server logs for errors

### Images Not Updating

1. Clear WordPress cache
2. Check browser console for JavaScript errors
3. Verify AJAX permissions
4. Ensure images exist in the media library

### Poor Quality Alt Text

1. Provide more context (page title, surrounding text)
2. Add relevant keywords
3. Specify the image context (e.g., "product photo", "infographic")
4. Review and manually refine the generated text

## Configuration

### Server Configuration

Update `package.json` to use the new server:

```json
{
  "scripts": {
    "start": "node build/index.js",
    "build": "tsc"
  }
}
```

### WordPress Configuration

Set the MCP server URL in WordPress:

```php
add_option('mcp_server_url', 'http://localhost:3000');
```

## Development

### Adding Custom Context

You can extend the context extraction:

```php
// In your theme's functions.php
add_filter('mcp_image_context', function($context, $image_id) {
    // Add custom context based on image metadata
    $alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);
    $caption = wp_get_attachment_caption($image_id);
    
    return $context . ' ' . $alt . ' ' . $caption;
}, 10, 2);
```

### Custom Alt Text Validation

```php
add_filter('mcp_validate_alt_text', function($is_valid, $alt_text) {
    // Add custom validation rules
    if (strlen($alt_text) < 20) {
        return false;
    }
    return $is_valid;
}, 10, 2);
```

## Support

For issues and questions:
- GitHub Issues: [Repository URL]
- Documentation: [Docs URL]
- Email: [Support Email]

## License

MIT License - See LICENSE file for details
