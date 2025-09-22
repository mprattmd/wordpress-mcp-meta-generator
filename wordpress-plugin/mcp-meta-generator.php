<?php
/**
 * Plugin Name: MCP Meta & Image Alt Text Generator
 * Description: AI-powered meta descriptions and image alt text for WordPress
 * Version: 2.0.1
 * Author: mprattmd
 */

if (!defined('ABSPATH')) exit;

class MCP_Complete_Generator {
    private $options;
    
    public function __construct() {
        $this->options = get_option('mcp_meta_options', [
            'mcp_server_url' => '',
            'mcp_api_key' => '',
            'default_tone' => 'professional'
        ]);
        
        // Admin hooks
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        
        // AJAX handlers
        add_action('wp_ajax_mcp_test_connection', [$this, 'ajax_test_connection']);
        add_action('wp_ajax_mcp_generate_meta', [$this, 'ajax_generate_meta']);
        add_action('wp_ajax_mcp_analyze_images', [$this, 'ajax_analyze_images']);
        add_action('wp_ajax_mcp_generate_alt', [$this, 'ajax_generate_alt']);
        
        // Scripts
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
    }
    
    public function add_menu() {
        add_options_page('MCP Generator', 'MCP Generator', 'manage_options', 'mcp-generator', [$this, 'settings_page']);
    }
    
    public function register_settings() {
        register_setting('mcp_options', 'mcp_meta_options');
    }
    
    public function add_meta_boxes() {
        add_meta_box('mcp-meta-box', 'Meta Description Generator', [$this, 'meta_box'], ['post', 'page'], 'side', 'high');
        add_meta_box('mcp-alt-box', 'Image Alt Text Generator', [$this, 'alt_box'], ['post', 'page'], 'side', 'high');
    }
    
    public function enqueue_scripts($hook) {
        if (!in_array($hook, ['post.php', 'post-new.php', 'settings_page_mcp-generator'])) return;
        
        wp_enqueue_script('mcp-admin', plugin_dir_url(__FILE__) . 'mcp-admin.js', ['jquery'], '2.0', true);
        wp_localize_script('mcp-admin', 'mcpData', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcp_nonce')
        ]);
    }
    
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>MCP Meta & Image Alt Text Generator</h1>
            <form method="post" action="options.php">
                <?php settings_fields('mcp_options'); ?>
                <table class="form-table">
                    <tr>
                        <th>Server URL</th>
                        <td>
                            <input type="url" name="mcp_meta_options[mcp_server_url]" value="<?php echo esc_attr($this->options['mcp_server_url']); ?>" class="regular-text" placeholder="https://your-server.com" />
                        </td>
                    </tr>
                    <tr>
                        <th>API Key</th>
                        <td>
                            <input type="password" name="mcp_meta_options[mcp_api_key]" value="<?php echo esc_attr($this->options['mcp_api_key']); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th>Default Tone</th>
                        <td>
                            <select name="mcp_meta_options[default_tone]">
                                <?php foreach (['professional', 'casual', 'technical', 'marketing'] as $tone): ?>
                                    <option value="<?php echo $tone; ?>" <?php selected($this->options['default_tone'], $tone); ?>>
                                        <?php echo ucfirst($tone); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2>Test Connection</h2>
            <button type="button" class="button" id="test-connection">Test Connection</button>
            <span id="test-result"></span>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#test-connection').on('click', function() {
                var btn = $(this);
                btn.prop('disabled', true).text('Testing...');
                
                $.post(ajaxurl, {
                    action: 'mcp_test_connection',
                    nonce: '<?php echo wp_create_nonce('mcp_nonce'); ?>'
                }, function(response) {
                    $('#test-result').html(response.success ? 
                        '<span style="color:green">✅ Connected!</span>' : 
                        '<span style="color:red">❌ ' + response.data + '</span>'
                    );
                }).always(function() {
                    btn.prop('disabled', false).text('Test Connection');
                });
            });
        });
        </script>
        <?php
    }
    
    public function meta_box($post) {
        wp_nonce_field('mcp_meta_box', 'mcp_nonce');
        $current = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        ?>
        <div class="mcp-meta-gen">
            <p><strong>Current:</strong></p>
            <textarea readonly style="width:100%;height:50px;"><?php echo esc_textarea($current); ?></textarea>
            
            <p><strong>Tone:</strong>
                <select id="meta-tone">
                    <?php foreach (['professional', 'casual', 'technical', 'marketing'] as $tone): ?>
                        <option value="<?php echo $tone; ?>" <?php selected($this->options['default_tone'], $tone); ?>>
                            <?php echo ucfirst($tone); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </p>
            
            <button type="button" class="button button-primary" id="generate-meta" data-post="<?php echo $post->ID; ?>">Generate Meta</button>
            
            <div id="meta-result" style="display:none;margin-top:10px;">
                <p><strong>Generated:</strong></p>
                <textarea id="meta-text" style="width:100%;height:50px;"></textarea>
                <button type="button" class="button button-primary" id="apply-meta">Apply to Yoast</button>
            </div>
        </div>
        <?php
    }
    
    public function alt_box($post) {
        ?>
        <div class="mcp-alt-gen">
            <p>Generate alt text for images in this post.</p>
            <button type="button" class="button button-primary" id="analyze-images" data-post="<?php echo $post->ID; ?>">Analyze Images</button>
            <div id="image-results" style="margin-top:10px;"></div>
        </div>
        <?php
    }
    
    // AJAX Handlers
    
    public function ajax_test_connection() {
        check_ajax_referer('mcp_nonce', 'nonce');
        
        try {
            // Use the health check endpoint instead of calling a tool
            $url = rtrim($this->options['mcp_server_url'], '/') . '/';
            
            $response = wp_remote_get($url, [
                'timeout' => 10,
                'sslverify' => false
            ]);
            
            if (is_wp_error($response)) {
                throw new Exception('Connection failed: ' . $response->get_error_message());
            }
            
            $code = wp_remote_retrieve_response_code($response);
            if ($code !== 200) {
                throw new Exception('Server returned error code: ' . $code);
            }
            
            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!isset($body['status']) || $body['status'] !== 'ok') {
                throw new Exception('Invalid server response');
            }
            
            wp_send_json_success('Connected to MCP server v' . ($body['version'] ?? '1.0.0'));
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    public function ajax_generate_meta() {
        check_ajax_referer('mcp_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $tone = sanitize_text_field($_POST['tone']);
        $post = get_post($post_id);
        
        if (!$post) {
            wp_send_json_error('Post not found');
        }
        
        try {
            $result = $this->call_server('generate_meta_description', [
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'tone' => $tone,
                'maxLength' => 155
            ]);
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    public function ajax_analyze_images() {
        check_ajax_referer('mcp_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $post = get_post($post_id);
        
        if (!$post) {
            wp_send_json_error('Post not found');
        }
        
        try {
            $result = $this->call_server('analyze_images_in_content', [
                'content' => $post->post_content,
                'title' => $post->post_title
            ]);
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    public function ajax_generate_alt() {
        check_ajax_referer('mcp_nonce', 'nonce');
        
        $image_url = esc_url_raw($_POST['image_url']);
        $page_title = sanitize_text_field($_POST['page_title']);
        
        try {
            $result = $this->call_server('generate_image_alt_text', [
                'imageUrl' => $image_url,
                'fileName' => basename($image_url),
                'pageTitle' => $page_title,
                'maxLength' => 125
            ]);
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    // Helper Methods
    
    private function call_server($tool, $args) {
        $url = rtrim($this->options['mcp_server_url'], '/') . '/api/generate';
        $api_key = $this->options['mcp_api_key'];
        
        if (empty($url) || empty($api_key)) {
            throw new Exception('MCP server not configured');
        }
        
        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-API-Key' => $api_key
            ],
            'body' => json_encode(['tool' => $tool, 'args' => $args]),
            'timeout' => 30,
            'sslverify' => false
        ]);
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            throw new Exception('Server error: ' . ($body['error'] ?? 'Unknown error'));
        }
        
        return $body;
    }
}

new MCP_Complete_Generator();
