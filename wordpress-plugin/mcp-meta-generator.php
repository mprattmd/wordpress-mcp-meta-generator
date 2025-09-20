<?php
/**
 * Plugin Name: MCP Meta Generator
 * Description: Simple and reliable meta description generator using MCP server
 * Version: 1.2.0
 * Author: mprattmd
 * 
 * This is the cleaned up, working version without Yoast auto-fill issues.
 * Features:
 * - Connect to MCP server for AI-generated meta descriptions
 * - Manual copy/paste workflow (reliable)
 * - Content analysis tools
 * - Multiple tone options
 * - Connection testing
 */

if (!defined('ABSPATH')) exit;

class SimpleMCPMetaGenerator {
    private $options;
    
    public function __construct() {
        $this->options = get_option('mcp_meta_options', array(
            'mcp_server_url' => '',
            'default_tone' => 'professional',
            'auto_generate' => false
        ));
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('admin_head', array($this, 'inline_styles'));
        add_action('admin_footer', array($this, 'inline_scripts'));
        
        // AJAX
        add_action('wp_ajax_mcp_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_mcp_generate_meta_description', array($this, 'ajax_generate_meta'));
        add_action('wp_ajax_mcp_analyze_content', array($this, 'ajax_analyze_content'));
    }
    
    public function add_admin_menu() {
        add_options_page('MCP Meta Generator', 'MCP Meta Generator', 'manage_options', 'mcp-meta-generator', array($this, 'admin_page'));
    }
    
    public function admin_init() {
        register_setting('mcp_meta_options', 'mcp_meta_options', array($this, 'sanitize_options'));
        add_settings_section('main', 'Configuration', null, 'mcp-meta-generator');
        add_settings_field('server_url', 'Server URL', array($this, 'server_url_field'), 'mcp-meta-generator', 'main');
        add_settings_field('default_tone', 'Default Tone', array($this, 'tone_field'), 'mcp-meta-generator', 'main');
    }
    
    public function enqueue_scripts($hook) {
        if ('post.php' !== $hook && 'post-new.php' !== $hook) return;
        wp_enqueue_script('jquery');
        wp_localize_script('jquery', 'mcpMeta', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcp_meta_nonce'),
            'server_url' => $this->options['mcp_server_url']
        ));
    }
    
    public function inline_styles() {
        $screen = get_current_screen();
        if (!in_array($screen->id, array('post', 'page'))) return;
        ?>
        <style>
        #mcp-meta-generator { padding: 12px; background: #fff; border: 1px solid #ddd; border-radius: 4px; }
        .mcp-status { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; }
        .mcp-dot { width: 8px; height: 8px; border-radius: 50%; background: #999; }
        .mcp-dot.connected { background: #00a32a; }
        .mcp-dot.error { background: #d63638; }
        .mcp-analysis { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 12px; }
        #mcp-results { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
        .mcp-char-counter { font-size: 11px; text-align: right; margin-top: 5px; }
        .mcp-char-counter.optimal { color: #00a32a; }
        .mcp-char-counter.over-limit { color: #d63638; }
        .mcp-copy-button { margin-top: 10px; }
        .mcp-success-message { color: #00a32a; font-weight: bold; margin-top: 5px; }
        </style>
        <?php
    }
    
    public function inline_scripts() {
        $screen = get_current_screen();
        if (!in_array($screen->id, array('post', 'page'))) return;
        ?>
        <script>
        jQuery(document).ready(function($) {
            var postId = $('#post_ID').val();
            if (!postId) return;
            
            setTimeout(testConnection, 1000);
            
            $('#mcp-analyze').on('click', function() {
                var $btn = $(this);
                $btn.text('Analyzing...').prop('disabled', true);
                $.post(mcpMeta.ajax_url, {
                    action: 'mcp_analyze_content',
                    post_id: postId,
                    nonce: mcpMeta.nonce
                }, function(resp) {
                    if (resp.success) {
                        $('#mcp-analysis').html('<p><strong>Word Count:</strong> ' + resp.data.wordCount + '</p><p><strong>Content Type:</strong> ' + resp.data.contentType + '</p>');
                    }
                }).always(function() {
                    $btn.text('Analyze Content').prop('disabled', false);
                });
            });
            
            $('#mcp-generate').on('click', function() {
                var $btn = $(this);
                $btn.text('Generating...').prop('disabled', true);
                $.post(mcpMeta.ajax_url, {
                    action: 'mcp_generate_meta_description',
                    post_id: postId,
                    tone: $('#mcp-tone').val(),
                    nonce: mcpMeta.nonce
                }, function(resp) {
                    if (resp.success) {
                        $('#mcp-generated').val(resp.data.metaDescription);
                        $('#mcp-results').show();
                        updateCounter();
                    } else {
                        alert('Error: ' + (resp.data || 'Unknown error'));
                    }
                }).always(function() {
                    $btn.text('Generate').prop('disabled', false);
                });
            });
            
            $('#mcp-copy').on('click', function() {
                var $textarea = $('#mcp-generated');
                $textarea.select();
                document.execCommand('copy');
                
                // Show success message
                var $msg = $('<div class="mcp-success-message">✓ Copied to clipboard! Paste into Yoast meta description field.</div>');
                $(this).after($msg);
                setTimeout(function() {
                    $msg.fadeOut(function() { $(this).remove(); });
                }, 3000);
            });
            
            function testConnection() {
                $.post(mcpMeta.ajax_url, {
                    action: 'mcp_test_connection',
                    nonce: mcpMeta.nonce
                }, function(resp) {
                    $('.mcp-dot').removeClass('connected error').addClass(resp.success ? 'connected' : 'error');
                    $('.mcp-status-text').text(resp.success ? 'Connected to MCP Server' : 'Connection failed - check settings');
                });
            }
            
            function updateCounter() {
                var len = $('#mcp-generated').val().length;
                var cls = len > 155 ? 'over-limit' : 'optimal';
                $('#mcp-counter').removeClass('optimal over-limit').addClass(cls).text(len + '/155 characters');
            }
            
            $('#mcp-generated').on('input', updateCounter);
        });
        </script>
        <?php
    }
    
    public function add_meta_box() {
        add_meta_box('mcp-meta-box', '🤖 MCP Meta Generator', array($this, 'meta_box_content'), array('post', 'page'), 'side', 'high');
    }
    
    public function meta_box_content($post) {
        wp_nonce_field('mcp_meta_box', 'mcp_meta_nonce');
        $current = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        ?>
        <div id="mcp-meta-generator">
            <div class="mcp-status">
                <span class="mcp-dot"></span>
                <span class="mcp-status-text">Checking connection...</span>
            </div>
            
            <?php if ($current): ?>
            <p><strong>Current Meta Description:</strong></p>
            <textarea readonly style="width:100%;height:50px;font-size:12px;"><?php echo esc_textarea($current); ?></textarea>
            <?php endif; ?>
            
            <p><strong>Content Analysis:</strong></p>
            <div id="mcp-analysis" class="mcp-analysis">Click "Analyze" for content insights</div>
            
            <p><strong>Tone:</strong></p>
            <select id="mcp-tone" style="width:100%;">
                <?php foreach (array('professional', 'casual', 'technical', 'marketing') as $tone): ?>
                    <option value="<?php echo $tone; ?>" <?php selected($this->options['default_tone'], $tone); ?>><?php echo ucfirst($tone); ?></option>
                <?php endforeach; ?>
            </select>
            
            <p style="margin-top: 15px;">
                <button type="button" id="mcp-analyze" class="button">Analyze Content</button>
                <button type="button" id="mcp-generate" class="button button-primary">Generate Description</button>
            </p>
            
            <div id="mcp-results" style="display:none;">
                <h4>Generated Meta Description:</h4>
                <textarea id="mcp-generated" style="width:100%;height:60px;font-size:12px;" readonly></textarea>
                <div id="mcp-counter" class="mcp-char-counter"></div>
                <div class="mcp-copy-button">
                    <button type="button" id="mcp-copy" class="button button-primary">📋 Copy to Clipboard</button>
                </div>
                <p style="font-size: 11px; color: #666; margin-top: 10px;">
                    💡 <strong>Tip:</strong> Copy the description above and paste it into the Yoast SEO meta description field below.
                </p>
            </div>
        </div>
        <?php
    }
    
    // AJAX Handlers
    public function ajax_test_connection() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        try {
            $url = $this->options['mcp_server_url'];
            if (empty($url)) throw new Exception('No server URL configured');
            $response = wp_remote_get($url, array('timeout' => 10));
            if (is_wp_error($response)) throw new Exception($response->get_error_message());
            wp_send_json_success();
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    public function ajax_generate_meta() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        $post = get_post(intval($_POST['post_id']));
        if (!$post) wp_send_json_error('Post not found');
        
        try {
            $result = $this->call_mcp_server('generate_meta_description', array(
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'tone' => sanitize_text_field($_POST['tone']),
                'maxLength' => 155
            ));
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    public function ajax_analyze_content() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        $post = get_post(intval($_POST['post_id']));
        if (!$post) wp_send_json_error('Post not found');
        
        try {
            $result = $this->call_mcp_server('analyze_content', array(
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content)
            ));
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    private function call_mcp_server($tool, $args) {
        $url = $this->options['mcp_server_url'];
        if (empty($url)) throw new Exception('MCP Server URL not configured');
        
        $response = wp_remote_post(rtrim($url, '/') . '/api/generate', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array('tool' => $tool, 'args' => $args)),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) throw new Exception($response->get_error_message());
        if (wp_remote_retrieve_response_code($response) !== 200) throw new Exception('Server error');
        
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$data) throw new Exception('Invalid server response');
        
        return $data;
    }
    
    // Admin page
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>🤖 MCP Meta Generator Settings</h1>
            <p>Configure your MCP server connection for AI-powered meta description generation.</p>
            
            <form method="post" action="options.php">
                <?php settings_fields('mcp_meta_options'); do_settings_sections('mcp-meta-generator'); submit_button(); ?>
            </form>
            
            <div class="card" style="margin-top: 20px;">
                <h2>How to Use</h2>
                <ol>
                    <li>Enter your MCP server URL above and save settings</li>
                    <li>When editing posts/pages, look for the "MCP Meta Generator" box in the sidebar</li>
                    <li>Click "Generate Description" to create AI-powered meta descriptions</li>
                    <li>Copy the generated description and paste it into Yoast's meta description field</li>
                </ol>
                
                <h3>Features</h3>
                <ul>
                    <li>✅ Reliable copy/paste workflow (no auto-fill issues)</li>
                    <li>✅ Multiple tone options (Professional, Casual, Technical, Marketing)</li>
                    <li>✅ Content analysis tools</li>
                    <li>✅ Character count validation</li>
                    <li>✅ Connection status monitoring</li>
                </ul>
            </div>
        </div>
        <?php
    }
    
    public function server_url_field() {
        printf(
            '<input type="url" name="mcp_meta_options[mcp_server_url]" value="%s" class="regular-text" placeholder="https://your-mcp-server.com" /><p class="description">URL of your MCP server endpoint</p>', 
            esc_attr($this->options['mcp_server_url'])
        );
    }
    
    public function tone_field() {
        echo '<select name="mcp_meta_options[default_tone]">';
        foreach (array('professional', 'casual', 'technical', 'marketing') as $tone) {
            printf('<option value="%s" %s>%s</option>', $tone, selected($this->options['default_tone'], $tone, false), ucfirst($tone));
        }
        echo '</select><p class="description">Default tone for generated descriptions</p>';
    }
    
    public function sanitize_options($input) {
        return array(
            'mcp_server_url' => esc_url_raw($input['mcp_server_url']),
            'default_tone' => in_array($input['default_tone'], array('professional', 'casual', 'technical', 'marketing')) ? $input['default_tone'] : 'professional',
            'auto_generate' => !empty($input['auto_generate'])
        );
    }
}

// Initialize the plugin
new SimpleMCPMetaGenerator();

// Add activation hook
register_activation_hook(__FILE__, function() {
    // Set default options on activation
    add_option('mcp_meta_options', array(
        'mcp_server_url' => '',
        'default_tone' => 'professional',
        'auto_generate' => false
    ));
});