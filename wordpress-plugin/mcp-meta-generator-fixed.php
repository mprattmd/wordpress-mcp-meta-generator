<?php
/**
 * Plugin Name: MCP Meta Description Generator (Fixed)
 * Plugin URI: https://github.com/mprattmd/wordpress-mcp-meta-generator
 * Description: Generates meta descriptions using MCP server integration for Yoast SEO - Fixed version
 * Version: 1.1.1
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
define('MCP_META_VERSION', '1.1.1');

class MCPMetaDescriptionGeneratorFixed {
    
    private $options;
    
    public function __construct() {
        $this->options = get_option('mcp_meta_options', $this->get_default_options());
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // AJAX handlers
        add_action('wp_ajax_mcp_generate_meta_description', array($this, 'ajax_generate_meta_description'));
        add_action('wp_ajax_mcp_analyze_content', array($this, 'ajax_analyze_content'));
        add_action('wp_ajax_mcp_test_connection', array($this, 'ajax_test_connection'));
        
        // Meta box
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        
        // Inline assets
        add_action('admin_head', array($this, 'admin_inline_styles'));
        add_action('admin_footer', array($this, 'admin_inline_scripts'));
    }
    
    public function init() {
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
        
        add_settings_section('mcp_meta_main', 'MCP Server Configuration', array($this, 'settings_section_callback'), 'mcp-meta-generator');
        add_settings_field('mcp_server_url', 'MCP Server URL', array($this, 'server_url_callback'), 'mcp-meta-generator', 'mcp_meta_main');
        add_settings_field('default_tone', 'Default Tone', array($this, 'default_tone_callback'), 'mcp-meta-generator', 'mcp_meta_main');
        add_settings_field('auto_generate', 'Auto Generate', array($this, 'auto_generate_callback'), 'mcp-meta-generator', 'mcp_meta_main');
    }
    
    public function enqueue_admin_scripts($hook) {
        if ('post.php' !== $hook && 'post-new.php' !== $hook && 'settings_page_mcp-meta-generator' !== $hook) {
            return;
        }
        
        wp_enqueue_script('jquery');
        wp_localize_script('jquery', 'mcpMeta', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcp_meta_nonce'),
            'auto_generate' => $this->options['auto_generate'],
            'server_url' => $this->options['mcp_server_url']
        ));
    }
    
    public function admin_inline_styles() {
        $screen = get_current_screen();
        if (!in_array($screen->id, array('post', 'page', 'settings_page_mcp-meta-generator'))) {
            return;
        }
        ?>
        <style type="text/css">
        .mcp-status-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #ddd; }
        .mcp-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #999; animation: pulse-checking 1.5s infinite; }
        .mcp-status-dot.checking { background: #ffb900; animation: pulse-checking 1.5s infinite; }
        .mcp-status-dot.connected { background: #00a32a; animation: none; }
        .mcp-status-dot.error { background: #d63638; animation: pulse-error 1.5s infinite; }
        @keyframes pulse-checking { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes pulse-error { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .mcp-status-text { font-size: 12px; color: #555; font-weight: 500; }
        #mcp-meta-generator { background: #fff; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
        #mcp-meta-generator h4 { margin-top: 0; color: #0073aa; }
        #mcp-meta-generator textarea { resize: vertical; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; line-height: 1.4; }
        #mcp-meta-generator select { width: 100%; margin-bottom: 10px; }
        #mcp-meta-generator .button { margin-right: 5px; margin-bottom: 5px; }
        #mcp-content-analysis { background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #e1e1e1; margin-bottom: 10px; font-size: 12px; }
        #mcp-results { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
        #mcp-generated-meta { margin-bottom: 10px; }
        .mcp-char-counter { font-size: 11px; text-align: right; margin-top: 5px; font-weight: 500; }
        .mcp-char-counter.under-limit { color: #d63638; }
        .mcp-char-counter.optimal { color: #00a32a; }
        .mcp-char-counter.over-limit { color: #ffb900; }
        #mcp-suggestions { background: #f0f6fc; padding: 10px; border-radius: 4px; border: 1px solid #c3dafe; margin-top: 10px; font-size: 12px; }
        #mcp-suggestions h5 { margin-top: 0; margin-bottom: 8px; color: #0969da; }
        .mcp-instructions { background: #f8f9fa; padding: 20px; border-radius: 4px; border: 1px solid #ddd; margin-top: 20px; }
        .mcp-instructions h3 { margin-top: 20px; margin-bottom: 10px; color: #0073aa; }
        .mcp-instructions code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: Consolas, Monaco, monospace; font-size: 12px; }
        #mcp-connection-test { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
        #connection-result { margin-left: 10px; font-weight: 500; }
        .mcp-copy-success { background: #d1edff; border: 1px solid #b8daff; border-radius: 4px; padding: 8px; margin-top: 10px; font-size: 12px; color: #0969da; }
        </style>
        <?php
    }
    
    public function admin_inline_scripts() {
        $screen = get_current_screen();
        if (!in_array($screen->id, array('post', 'page'))) {
            return;
        }
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            var postId = $('#post_ID').val() || new URLSearchParams(window.location.search).get('post');
            if (!postId) return;
            
            setTimeout(testConnection, 1000);
            
            $('#mcp-analyze-content').on('click', function() {
                var $btn = $(this), orig = $btn.text();
                $btn.text('Analyzing...').prop('disabled', true);
                $.post(mcpMeta.ajax_url, {
                    action: 'mcp_analyze_content',
                    post_id: postId,
                    nonce: mcpMeta.nonce
                }, function(resp) {
                    if (resp.success) displayContentAnalysis(resp.data);
                    else showError('Analysis failed: ' + (resp.data || 'Unknown error'));
                }).always(function() { $btn.text(orig).prop('disabled', false); });
            });
            
            $('#mcp-generate-meta').on('click', function() {
                var $btn = $(this), orig = $btn.text(), tone = $('#mcp-tone-select').val();
                $btn.text('Generating...').prop('disabled', true);
                $.post(mcpMeta.ajax_url, {
                    action: 'mcp_generate_meta_description',
                    post_id: postId,
                    tone: tone,
                    nonce: mcpMeta.nonce
                }, function(resp) {
                    if (resp.success) displayGeneratedMeta(resp.data);
                    else showError('Generation failed: ' + (resp.data || 'Unknown error'));
                }).always(function() { $btn.text(orig).prop('disabled', false); });
            });
            
            $(document).on('click', '#mcp-copy-meta', function() {
                var meta = $('#mcp-generated-meta').val();
                if (!meta) { showError('No meta description to copy'); return; }
                $('#mcp-generated-meta').select();
                try {
                    document.execCommand('copy');
                    showCopySuccess();
                } catch (err) {
                    showError('Please copy the selected text manually (Ctrl+C or Cmd+C)');
                }
            });
            
            function testConnection() {
                if (!mcpMeta.server_url) { updateConnectionStatus('error', 'No server URL configured'); return; }
                updateConnectionStatus('checking', 'Testing connection...');
                $.post(mcpMeta.ajax_url, { action: 'mcp_test_connection', nonce: mcpMeta.nonce }, function(resp) {
                    updateConnectionStatus(resp.success ? 'connected' : 'error', resp.success ? 'Connected to MCP server' : 'Connection failed: ' + (resp.data ? resp.data.message : 'Unknown error'));
                }).fail(function() { updateConnectionStatus('error', 'Connection test failed'); });
            }
            
            function updateConnectionStatus(status, message) {
                $('.mcp-status-dot').removeClass('connected checking error').addClass(status);
                $('.mcp-status-text').text(message);
            }
            
            function displayContentAnalysis(data) {
                var html = '<div class="mcp-analysis-results"><p><strong>Word Count:</strong> ' + data.wordCount + '</p><p><strong>Content Type:</strong> ' + data.contentType + '</p><p><strong>Suggested Meta Length:</strong> ' + data.suggestedMetaLength + ' characters</p>';
                if (data.topKeywords && data.topKeywords.length > 0) {
                    html += '<p><strong>Top Keywords:</strong> ' + data.topKeywords.slice(0, 5).join(', ') + '</p>';
                }
                html += '</div>';
                $('#mcp-content-analysis').html(html);
            }
            
            function displayGeneratedMeta(data) {
                $('#mcp-generated-meta').val(data.metaDescription);
                $('#mcp-results').show();
                var charClass = data.length < 120 ? 'under-limit' : data.length > 155 ? 'over-limit' : 'optimal';
                var html = '';
                if (data.suggestions && data.suggestions.length > 0) {
                    html += '<h5>Optimization Suggestions:</h5><ul>';
                    data.suggestions.forEach(function(s) { html += '<li>' + s + '</li>'; });
                    html += '</ul>';
                }
                html += '<p><small><strong>Length:</strong> <span class="' + charClass + '">' + data.length + ' characters</span> | <strong>Tone:</strong> ' + data.tone + '</small></p>';
                $('#mcp-suggestions').html(html);
                updateCharacterCounter();
                $('#mcp-generated-meta').on('input', updateCharacterCounter);
                $('html, body').animate({ scrollTop: $('#mcp-results').offset().top - 100 }, 500);
            }
            
            function updateCharacterCounter() {
                var text = $('#mcp-generated-meta').val(), len = text.length;
                var cls = len < 120 ? 'under-limit' : len > 155 ? 'over-limit' : 'optimal';
                var $counter = $('#mcp-char-counter');
                if ($counter.length === 0) {
                    $('#mcp-generated-meta').after('<div id="mcp-char-counter" class="mcp-char-counter"></div>');
                    $counter = $('#mcp-char-counter');
                }
                $counter.removeClass('under-limit over-limit optimal').addClass(cls).text(len + '/155 characters');
            }
            
            function showCopySuccess() {
                $('.mcp-copy-success').remove();
                var $success = $('<div class="mcp-copy-success">✅ Meta description copied to clipboard! You can now paste it into the Yoast SEO meta description field.</div>');
                $('#mcp-results').append($success);
                setTimeout(function() { $success.fadeOut(function() { $success.remove(); }); }, 5000);
            }
            
            function showError(msg) {
                var $notice = $('<div class="notice notice-error is-dismissible"><p>' + msg + '</p></div>');
                $('#mcp-meta-generator').prepend($notice);
                setTimeout(function() { $notice.fadeOut(); }, 5000);
            }
        });
        </script>
        <?php
    }
    
    public function add_meta_box() {
        add_meta_box('mcp-meta-generator-box', 'MCP Meta Description Generator', array($this, 'meta_box_callback'), array('post', 'page'), 'side', 'high');
    }
    
    public function meta_box_callback($post) {
        wp_nonce_field('mcp_meta_box', 'mcp_meta_nonce');
        $current_meta = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        
        echo '<div id="mcp-meta-generator">';
        echo '<div id="mcp-connection-status" class="mcp-status-indicator"><span class="mcp-status-dot"></span><span class="mcp-status-text">Checking connection...</span></div>';
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
        echo '<p><button type="button" class="button" id="mcp-analyze-content">Analyze Content</button> <button type="button" class="button button-primary" id="mcp-generate-meta">Generate Meta Description</button></p>';
        echo '<div id="mcp-results" style="display:none;"><h4>Generated Meta Description:</h4><textarea id="mcp-generated-meta" style="width:100%; height:60px;"></textarea><p><button type="button" class="button" id="mcp-copy-meta">Copy to Clipboard</button></p><div id="mcp-suggestions"></div></div>';
        echo '</div>';
    }
    
    // AJAX Handlers - USING EXACT ORIGINAL WORKING FORMAT
    public function ajax_test_connection() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        try {
            wp_send_json_success($this->test_server_connection());
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    public function ajax_generate_meta_description() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        $post_id = intval($_POST['post_id']);
        $tone = sanitize_text_field($_POST['tone']);
        $post = get_post($post_id);
        if (!$post) wp_send_json_error('Post not found');
        
        try {
            $result = $this->call_mcp_server('generate_meta_description', array(
                'title' => $post->post_title,
                'content' => $post->post_content,
                'keywords' => $this->extract_keywords_from_post($post),
                'maxLength' => 155,
                'tone' => $tone
            ));
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Failed to generate: ' . $e->getMessage());
        }
    }
    
    public function ajax_analyze_content() {
        if (!wp_verify_nonce($_POST['nonce'], 'mcp_meta_nonce')) wp_die('Security check failed');
        $post_id = intval($_POST['post_id']);
        $post = get_post($post_id);
        if (!$post) wp_send_json_error('Post not found');
        
        try {
            $result = $this->call_mcp_server('analyze_content', array('content' => $post->post_content, 'title' => $post->post_title));
            if (isset($result['topKeywords'])) update_post_meta($post_id, '_mcp_suggested_keywords', $result['topKeywords']);
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Failed to analyze: ' . $e->getMessage());
        }
    }
    
    // CRITICAL: Using exact original working request format
    private function test_server_connection() {
        if (empty($this->options['mcp_server_url'])) throw new Exception('MCP Server URL not configured');
        $response = wp_remote_get(rtrim($this->options['mcp_server_url'], '/') . '/', array(
            'timeout' => 10,
            'headers' => array('User-Agent' => 'WordPress-MCP-Meta-Generator/1.0')
        ));
        if (is_wp_error($response)) throw new Exception('Connection failed: ' . $response->get_error_message());
        if (wp_remote_retrieve_response_code($response) !== 200) throw new Exception('Server returned error status');
        return json_decode(wp_remote_retrieve_body($response), true) ?: array('status' => 'ok');
    }
    
    private function call_mcp_server($tool, $args) {
        if (empty($this->options['mcp_server_url'])) throw new Exception('MCP Server URL not configured');
        
        // EXACT format from original working version
        $api_url = rtrim($this->options['mcp_server_url'], '/') . '/api/generate';
        $request_body = json_encode(array('tool' => $tool, 'args' => $args));
        
        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress-MCP-Meta-Generator/1.0'
            ),
            'body' => $request_body,
            'timeout' => 30,
            'method' => 'POST',
            'sslverify' => !defined('WP_DEBUG') || !WP_DEBUG // Same SSL setting as original
        ));
        
        if (is_wp_error($response)) throw new Exception('MCP server request failed: ' . $response->get_error_message());
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $body = wp_remote_retrieve_body($response);
            throw new Exception("MCP server returned status " . wp_remote_retrieve_response_code($response) . ": " . $body);
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Invalid JSON response from MCP server: ' . $body);
        
        return $data;
    }
    
    private function extract_keywords_from_post($post) {
        $keywords = array();
        $focus_keyword = get_post_meta($post->ID, '_yoast_wpseo_focuskw', true);
        if ($focus_keyword) $keywords[] = $focus_keyword;
        $categories = get_the_category($post->ID);
        foreach ($categories as $cat) $keywords[] = $cat->name;
        $tags = get_the_tags($post->ID);
        if ($tags) foreach ($tags as $tag) $keywords[] = $tag->name;
        return array_unique($keywords);
    }
    
    private function get_default_options() {
        return array('mcp_server_url' => '', 'default_tone' => 'professional', 'auto_generate' => false);
    }
    
    public function sanitize_options($input) {
        return array(
            'mcp_server_url' => esc_url_raw($input['mcp_server_url']),
            'default_tone' => in_array($input['default_tone'], array('professional', 'casual', 'technical', 'marketing')) ? $input['default_tone'] : 'professional',
            'auto_generate' => !empty($input['auto_generate'])
        );
    }
    
    // Admin Page Methods
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MCP Meta Description Generator Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('mcp_meta_options'); do_settings_sections('mcp-meta-generator'); submit_button(); ?>
            </form>
            <div class="mcp-instructions">
                <h2>Usage Instructions</h2>
                <ol>
                    <li><strong>Deploy MCP Server:</strong> Use GitHub Codespaces, Railway, or Vercel</li>
                    <li><strong>Enter Server URL:</strong> Add your server URL above (must include https://)</li>
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
                var $button = $(this), $result = $('#connection-result');
                $button.prop('disabled', true).text('Testing...');
                $result.html('');
                $.post(ajaxurl, {
                    action: 'mcp_test_connection',
                    nonce: '<?php echo wp_create_nonce('mcp_meta_nonce'); ?>'
                }, function(response) {
                    $result.html(response.success ? 
                        '<span style="color: green;">✅ Connected! Server: ' + (response.data.message || 'OK') + '</span>' :
                        '<span style="color: red;">❌ Failed: ' + (response.data.message || 'Unknown error') + '</span>'
                    );
                }).fail(function() {
                    $result.html('<span style="color: red;">❌ Connection test failed</span>');
                }).always(function() {
                    $button.prop('disabled', false).text('Test Connection');
                });
            });
        });
        </script>
        <?php
    }
    
    public function settings_section_callback() {
        echo '<p>Configure your MCP server connection and default settings.</p>';
        echo '<div id="mcp-connection-test">';
        echo '<button type="button" class="button" id="test-connection">Test Connection</button>';
        echo '<span id="connection-result"></span>';
        echo '</div>';
    }
    
    public function server_url_callback() {
        printf('<input type="url" id="mcp_server_url" name="mcp_meta_options[mcp_server_url]" value="%s" class="regular-text" placeholder="https://your-server.com" />',
            isset($this->options['mcp_server_url']) ? esc_attr($this->options['mcp_server_url']) : '');
        echo '<p class="description">URL of your MCP server (include https:// or http://)</p>';
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
        printf('<input type="checkbox" id="auto_generate" name="mcp_meta_options[auto_generate]" value="1" %s />',
            checked(1, $this->options['auto_generate'], false));
        echo '<label for="auto_generate">Automatically suggest meta descriptions when editing posts</label>';
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
new MCPMetaDescriptionGeneratorFixed();