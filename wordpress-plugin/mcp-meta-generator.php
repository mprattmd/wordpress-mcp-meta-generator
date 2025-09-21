<?php
/**
 * Plugin Name: MCP Meta Description Generator
 * Plugin URI: https://github.com/mprattmd/wordpress-mcp-meta-generator
 * Description: Generates meta descriptions using MCP server integration for Yoast SEO
 * Version: 1.0.1
 * Author: mprattmd
 * License: GPL v2 or later
 * Text Domain: mcp-meta-generator
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MCP_META_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MCP_META_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MCP_META_VERSION', '1.0.1');

class MCPMetaDescriptionGenerator {
    
    private $options;
    
    public function __construct() {
        $this->options = get_option('mcp_meta_options', $this->get_default_options());
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Yoast SEO integration hooks
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_mcp_generate_meta_description', array($this, 'ajax_generate_meta_description'));
        add_action('wp_ajax_mcp_analyze_content', array($this, 'ajax_analyze_content'));
        add_action('wp_ajax_mcp_batch_generate', array($this, 'ajax_batch_generate'));
        add_action('wp_ajax_mcp_test_connection', array($this, 'ajax_test_connection'));
        
        // Add meta box for manual generation
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('save_post', array($this, 'save_meta_box'));
    }
    
    public function init() {
        // Check if Yoast SEO is active
        if (!class_exists('WPSEO_Options')) {
            add_action('admin_notices', array($this, 'yoast_missing_notice'));
        }
    }
    
    public function add_admin_menu() {
        add_options_page(
            'MCP Meta Generator Settings',
            'MCP Meta Generator', 
            'manage_options',
            'mcp-meta-generator',
            array($this, 'admin_page')
        );
    }
    
    public function admin_init() {
        register_setting('mcp_meta_options', 'mcp_meta_options', array($this, 'sanitize_options'));
        
        add_settings_section(
            'mcp_meta_main',
            'MCP Server Configuration',
            array($this, 'settings_section_callback'),
            'mcp-meta-generator'
        );
        
        add_settings_field(
            'mcp_server_url',
            'MCP Server URL',
            array($this, 'server_url_callback'),
            'mcp-meta-generator',
            'mcp_meta_main'
        );
        
        add_settings_field(
            'mcp_api_key',
            'API Key',
            array($this, 'api_key_callback'),
            'mcp-meta-generator',
            'mcp_meta_main'
        );
        
        add_settings_field(
            'default_tone',
            'Default Tone',
            array($this, 'default_tone_callback'),
            'mcp-meta-generator',
            'mcp_meta_main'
        );
        
        add_settings_field(
            'auto_generate',
            'Auto Generate',
            array($this, 'auto_generate_callback'),
            'mcp-meta-generator',
            'mcp_meta_main'
        );
    }
    
    public function enqueue_admin_scripts($hook) {
        if ('post.php' !== $hook && 'post-new.php' !== $hook && 'settings_page_mcp-meta-generator' !== $hook) {
            return;
        }
        
        wp_enqueue_script(
            'mcp-meta-generator',
            MCP_META_PLUGIN_URL . 'assets/admin.js',
            array('jquery'),
            MCP_META_VERSION,
            true
        );
        
        wp_localize_script('mcp-meta-generator', 'mcpMeta', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcp_meta_nonce'),
            'auto_generate' => $this->options['auto_generate'],
            'server_url' => $this->options['mcp_server_url']
        ));
        
        wp_enqueue_style(
            'mcp-meta-generator',
            MCP_META_PLUGIN_URL . 'assets/admin.css',
            array(),
            MCP_META_VERSION
        );
    }
    
    public function add_meta_box() {
        add_meta_box(
            'mcp-meta-generator-box',
            'MCP Meta Description Generator',
            array($this, 'meta_box_callback'),
            array('post', 'page'),
            'side',
            'high'
        );
    }
    
    public function meta_box_callback($post) {
        wp_nonce_field('mcp_meta_box', 'mcp_meta_nonce');
        
        $current_meta = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        
        echo '<div id="mcp-meta-generator">';
        
        // Connection status
        echo '<div id="mcp-connection-status" class="mcp-status-indicator">';
        echo '<span class="mcp-status-dot"></span>';
        echo '<span class="mcp-status-text">Checking connection...</span>';
        echo '</div>';
        
        echo '<p><strong>Current Meta Description:</strong></p>';
        echo '<textarea readonly style="width:100%; height:60px;">' . esc_textarea($current_meta) . '</textarea>';
        
        echo '<p><strong>Content Analysis:</strong></p>';
        echo '<div id="mcp-content-analysis">Click "Analyze Content" to get suggestions</div>';
        
        echo '<p><strong>Generate Options:</strong></p>';
        echo '<select id="mcp-tone-select">';
        foreach (array('professional', 'casual', 'technical', 'marketing') as $tone) {
            $selected = ($tone === $this->options['default_tone']) ? 'selected' : '';
            echo "<option value='{$tone}' {$selected}>" . ucfirst($tone) . "</option>";
        }
        echo '</select>';
        
        echo '<p>';
        echo '<button type="button" class="button" id="mcp-analyze-content">Analyze Content</button> ';
        echo '<button type="button" class="button button-primary" id="mcp-generate-meta">Generate Meta Description</button>';
        echo '</p>';
        
        echo '<div id="mcp-results" style="display:none;">';
        echo '<h4>Generated Meta Description:</h4>';
        echo '<textarea id="mcp-generated-meta" style="width:100%; height:60px;"></textarea>';
        echo '<p><button type="button" class="button button-primary" id="mcp-apply-meta">Apply to Yoast</button></p>';
        echo '<div id="mcp-suggestions"></div>';
        echo '</div>';
        
        echo '</div>';
    }
    
    public function ajax_test_connection() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) {
            wp_die('Security check failed');
        }
        
        try {
            $health_check = $this->test_server_connection();
            wp_send_json_success($health_check);
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => $e->getMessage(),
                'server_url' => $this->options['mcp_server_url']
            ));
        }
    }
    
    public function ajax_generate_meta_description() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) {
            wp_die('Security check failed');
        }
        
        $post_id = intval($_POST['post_id']);
        $tone = sanitize_text_field($_POST['tone']);
        
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error('Post not found');
        }
        
        $content = $post->post_content;
        $title = $post->post_title;
        $keywords = $this->extract_keywords_from_post($post);
        
        try {
            $result = $this->call_mcp_server('generate_meta_description', array(
                'title' => $title,
                'content' => $content,
                'keywords' => $keywords,
                'maxLength' => 155,
                'tone' => $tone
            ));
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Failed to generate meta description: ' . $e->getMessage());
        }
    }
    
    public function ajax_analyze_content() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) {
            wp_die('Security check failed');
        }
        
        $post_id = intval($_POST['post_id']);
        $post = get_post($post_id);
        
        if (!$post) {
            wp_send_json_error('Post not found');
        }
        
        try {
            $result = $this->call_mcp_server('analyze_content', array(
                'content' => $post->post_content,
                'title' => $post->post_title
            ));
            
            // Store suggested keywords for later use
            if (isset($result['topKeywords'])) {
                update_post_meta($post_id, '_mcp_suggested_keywords', $result['topKeywords']);
            }
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Failed to analyze content: ' . $e->getMessage());
        }
    }
    
    public function ajax_batch_generate() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) {
            wp_die('Security check failed');
        }
        
        $post_ids = array_map('intval', $_POST['post_ids']);
        $tone = sanitize_text_field($_POST['tone']);
        
        $posts_data = array();
        foreach ($post_ids as $post_id) {
            $post = get_post($post_id);
            if ($post) {
                $posts_data[] = array(
                    'id' => strval($post_id),
                    'title' => $post->post_title,
                    'content' => $post->post_content,
                    'keywords' => $this->extract_keywords_from_post($post)
                );
            }
        }
        
        try {
            $result = $this->call_mcp_server('batch_generate', array(
                'posts' => $posts_data,
                'tone' => $tone
            ));
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Failed to batch generate: ' . $e->getMessage());
        }
    }
    
    private function test_server_connection() {
        $server_url = $this->options['mcp_server_url'];
        if (empty($server_url)) {
            throw new Exception('MCP Server URL not configured');
        }
        
        // Test health check endpoint
        $health_url = rtrim($server_url, '/') . '/';
        
        $response = wp_remote_get($health_url, array(
            'timeout' => 10,
            'headers' => array(
                'User-Agent' => 'WordPress-MCP-Meta-Generator/1.0.1'
            )
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('Connection failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            throw new Exception("Server returned status {$status_code}");
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from server');
        }
        
        return $data;
    }
    
    private function call_mcp_server($tool, $args) {
        $server_url = $this->options['mcp_server_url'];
        if (empty($server_url)) {
            throw new Exception('MCP Server URL not configured');
        }
        
        $api_key = $this->options['mcp_api_key'];
        if (empty($api_key)) {
            throw new Exception('MCP API Key not configured');
        }
        
        // Ensure URL ends with /api/generate for the HTTP API
        $api_url = rtrim($server_url, '/') . '/api/generate';
        
        $request_body = json_encode(array(
            'tool' => $tool,
            'args' => $args
        ));
        
        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress-MCP-Meta-Generator/1.0.1',
                'X-API-Key' => $api_key
            ),
            'body' => $request_body,
            'timeout' => 30,
            'method' => 'POST',
            'sslverify' => !defined('WP_DEBUG') || !WP_DEBUG // Allow self-signed certs in debug mode
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('MCP server request failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            $body = wp_remote_retrieve_body($response);
            throw new Exception("MCP server returned status {$status_code}: {$body}");
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from MCP server: ' . $body);
        }
        
        return $data;
    }
    
    private function extract_keywords_from_post($post) {
        $keywords = array();
        
        // Get Yoast focus keyword if available
        $focus_keyword = get_post_meta($post->ID, '_yoast_wpseo_focuskw', true);
        if ($focus_keyword) {
            $keywords[] = $focus_keyword;
        }
        
        // Get categories and tags
        $categories = get_the_category($post->ID);
        foreach ($categories as $category) {
            $keywords[] = $category->name;
        }
        
        $tags = get_the_tags($post->ID);
        if ($tags) {
            foreach ($tags as $tag) {
                $keywords[] = $tag->name;
            }
        }
        
        return array_unique($keywords);
    }
    
    private function get_default_options() {
        return array(
            'mcp_server_url' => '',
            'mcp_api_key' => '',
            'default_tone' => 'professional',
            'auto_generate' => false
        );
    }
    
    public function sanitize_options($input) {
        $sanitized = array();
        $sanitized['mcp_server_url'] = esc_url_raw($input['mcp_server_url']);
        $sanitized['mcp_api_key'] = sanitize_text_field($input['mcp_api_key']);
        $sanitized['default_tone'] = in_array($input['default_tone'], array('professional', 'casual', 'technical', 'marketing')) 
            ? $input['default_tone'] : 'professional';
        $sanitized['auto_generate'] = !empty($input['auto_generate']);
        
        return $sanitized;
    }
    
    public function settings_section_callback() {
        echo '<p>Configure your MCP server connection and default settings.</p>';
        echo '<div id="mcp-connection-test">';
        echo '<button type="button" class="button" id="test-connection">Test Connection</button>';
        echo '<span id="connection-result"></span>';
        echo '</div>';
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MCP Meta Description Generator Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('mcp_meta_options');
                do_settings_sections('mcp-meta-generator');
                submit_button();
                ?>
            </form>
            
            <h2>Usage Instructions</h2>
            <div class="mcp-instructions">
                <ol>
                    <li><strong>Deploy MCP Server:</strong> Use GitHub Codespaces, Railway, or Vercel</li>
                    <li><strong>Enter Server URL:</strong> Add your server URL above (must include https:// or http://)</li>
                    <li><strong>Enter API Key:</strong> Copy the API key from your server startup logs</li>
                    <li><strong>Test Connection:</strong> Click "Test Connection" to verify setup</li>
                    <li><strong>Edit Posts:</strong> Look for "MCP Meta Description Generator" box when editing</li>
                </ol>
                
                <h3>Server URL Examples:</h3>
                <ul>
                    <li><code>https://abc123-3000.app.github.dev</code> (GitHub Codespaces)</li>
                    <li><code>https://your-app.up.railway.app</code> (Railway)</li>
                    <li><code>https://your-app.vercel.app</code> (Vercel)</li>
                </ul>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#test-connection').on('click', function() {
                var $button = $(this);
                var $result = $('#connection-result');
                
                $button.prop('disabled', true).text('Testing...');
                $result.html('');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'mcp_test_connection',
                        nonce: '<?php echo wp_create_nonce('mcp_meta_nonce'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            $result.html('<span style="color: green;">✅ Connected! Server: ' + 
                                        (response.data.message || 'OK') + '</span>');
                        } else {
                            $result.html('<span style="color: red;">❌ Failed: ' + 
                                        (response.data.message || 'Unknown error') + '</span>');
                        }
                    },
                    error: function() {
                        $result.html('<span style="color: red;">❌ Connection test failed</span>');
                    },
                    complete: function() {
                        $button.prop('disabled', false).text('Test Connection');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    public function server_url_callback() {
        printf(
            '<input type="url" id="mcp_server_url" name="mcp_meta_options[mcp_server_url]" value="%s" class="regular-text" placeholder="https://your-server.com" />',
            isset($this->options['mcp_server_url']) ? esc_attr($this->options['mcp_server_url']) : ''
        );
        echo '<p class="description">URL of your MCP server (include https:// or http://)</p>';
    }
    
    public function api_key_callback() {
        printf(
            '<input type="password" id="mcp_api_key" name="mcp_meta_options[mcp_api_key]" value="%s" class="regular-text" placeholder="Your API key from server startup" />',
            isset($this->options['mcp_api_key']) ? esc_attr($this->options['mcp_api_key']) : ''
        );
        echo '<p class="description">API key from your MCP server (shown when server starts)</p>';
    }
    
    public function default_tone_callback() {
        $tones = array('professional', 'casual', 'technical', 'marketing');
        echo '<select id="default_tone" name="mcp_meta_options[default_tone]">';
        foreach ($tones as $tone) {
            $selected = ($this->options['default_tone'] === $tone) ? 'selected' : '';
            echo "<option value='{$tone}' {$selected}>" . ucfirst($tone) . "</option>";
        }
        echo '</select>';
        echo '<p class="description">Default writing style for meta descriptions</p>';
    }
    
    public function auto_generate_callback() {
        printf(
            '<input type="checkbox" id="auto_generate" name="mcp_meta_options[auto_generate]" value="1" %s />',
            checked(1, $this->options['auto_generate'], false)
        );
        echo '<label for="auto_generate">Automatically suggest meta descriptions when editing posts</label>';
    }
    
    public function save_meta_box($post_id) {
        // Auto-save functionality could go here
    }
    
    public function yoast_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p><strong>MCP Meta Description Generator:</strong> This plugin requires Yoast SEO to be installed and activated.</p>
        </div>
        <?php
    }
}

// Initialize the plugin
new MCPMetaDescriptionGenerator();