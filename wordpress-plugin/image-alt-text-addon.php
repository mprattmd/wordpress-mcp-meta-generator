<?php
/**
 * Plugin Name: MCP Meta Generator - Image Alt Text Addon
 * Description: Adds AI-powered image alt text generation capabilities to WordPress posts and pages
 * Version: 1.0.0
 * Author: Your Name
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

class MCP_Image_Alt_Text_Generator {
    private $mcp_server_url;

    public function __construct() {
        $this->mcp_server_url = get_option('mcp_server_url', 'http://localhost:3000');
        
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('wp_ajax_mcp_generate_image_alt', [$this, 'ajax_generate_image_alt']);
        add_action('wp_ajax_mcp_analyze_images', [$this, 'ajax_analyze_images']);
        add_action('wp_ajax_mcp_batch_generate_alt', [$this, 'ajax_batch_generate_alt']);
        add_action('add_meta_boxes', [$this, 'add_image_alt_meta_box']);
    }

    public function add_admin_menu() {
        add_submenu_page(
            'tools.php',
            'Image Alt Text Generator',
            'Image Alt Text',
            'edit_posts',
            'mcp-image-alt-text',
            [$this, 'render_admin_page']
        );
    }

    public function add_image_alt_meta_box() {
        $screens = ['post', 'page'];
        foreach ($screens as $screen) {
            add_meta_box(
                'mcp-image-alt-generator',
                'AI Image Alt Text Generator',
                [$this, 'render_meta_box'],
                $screen,
                'side',
                'high'
            );
        }
    }

    public function render_meta_box($post) {
        ?>
        <div class="mcp-image-alt-box">
            <p>Generate SEO-friendly alt text for all images in this post.</p>
            <button type="button" class="button button-primary mcp-analyze-images" data-post-id="<?php echo esc_attr($post->ID); ?>">
                Analyze Images
            </button>
            <div class="mcp-image-analysis" style="margin-top: 15px;"></div>
        </div>
        <?php
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'tools_page_mcp-image-alt-text' && !in_array($hook, ['post.php', 'post-new.php'])) {
            return;
        }

        wp_enqueue_style(
            'mcp-image-alt-admin',
            plugins_url('assets/css/image-alt-admin.css', __FILE__),
            [],
            '1.0.0'
        );

        wp_enqueue_script(
            'mcp-image-alt-admin',
            plugins_url('assets/js/image-alt-admin.js', __FILE__),
            ['jquery'],
            '1.0.0',
            true
        );

        wp_localize_script('mcp-image-alt-admin', 'mcpImageAlt', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcp_image_alt_nonce')
        ]);
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>AI Image Alt Text Generator</h1>
            
            <div class="mcp-image-alt-admin">
                <div class="card">
                    <h2>Bulk Image Alt Text Generation</h2>
                    <p>Generate SEO-friendly alt text for images across your site.</p>
                    
                    <div class="mcp-settings">
                        <label for="post-type-select">
                            <strong>Content Type:</strong>
                        </label>
                        <select id="post-type-select">
                            <option value="post">Posts</option>
                            <option value="page">Pages</option>
                            <option value="all">All Content</option>
                        </select>
                        
                        <label for="image-limit">
                            <strong>Maximum Images:</strong>
                        </label>
                        <input type="number" id="image-limit" value="50" min="1" max="100" />
                    </div>
                    
                    <button type="button" class="button button-primary" id="mcp-bulk-analyze">
                        Start Analysis
                    </button>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <h2>Results</h2>
                    <div id="mcp-bulk-results">
                        <p class="description">Results will appear here after analysis.</p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function ajax_generate_image_alt() {
        check_ajax_referer('mcp_image_alt_nonce', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
        }

        $image_url = sanitize_text_field($_POST['image_url'] ?? '');
        $file_name = sanitize_text_field($_POST['file_name'] ?? '');
        $context = sanitize_text_field($_POST['context'] ?? '');
        $page_title = sanitize_text_field($_POST['page_title'] ?? '');
        $surrounding_text = sanitize_textarea_field($_POST['surrounding_text'] ?? '');
        $keywords = isset($_POST['keywords']) ? array_map('sanitize_text_field', $_POST['keywords']) : [];

        $response = $this->call_mcp_server('generate_image_alt_text', [
            'imageUrl' => $image_url,
            'fileName' => $file_name,
            'context' => $context,
            'pageTitle' => $page_title,
            'surroundingText' => $surrounding_text,
            'includeKeywords' => $keywords,
            'maxLength' => 125
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        wp_send_json_success($response);
    }

    public function ajax_analyze_images() {
        check_ajax_referer('mcp_image_alt_nonce', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
        }

        $post_id = intval($_POST['post_id'] ?? 0);
        if (!$post_id) {
            wp_send_json_error(['message' => 'Invalid post ID']);
        }

        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'Post not found']);
        }

        $response = $this->call_mcp_server('analyze_images_in_content', [
            'content' => $post->post_content,
            'title' => $post->post_title
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        wp_send_json_success($response);
    }

    public function ajax_batch_generate_alt() {
        check_ajax_referer('mcp_image_alt_nonce', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
        }

        $images = isset($_POST['images']) ? $_POST['images'] : [];
        $page_title = sanitize_text_field($_POST['page_title'] ?? '');
        $page_content = sanitize_textarea_field($_POST['page_content'] ?? '');

        // Sanitize images array
        $sanitized_images = [];
        foreach ($images as $image) {
            $sanitized_images[] = [
                'id' => sanitize_text_field($image['id']),
                'imageUrl' => esc_url_raw($image['imageUrl']),
                'fileName' => sanitize_text_field($image['fileName'] ?? ''),
                'context' => sanitize_text_field($image['context'] ?? '')
            ];
        }

        $response = $this->call_mcp_server('batch_generate_image_alt_text', [
            'images' => $sanitized_images,
            'pageTitle' => $page_title,
            'pageContent' => $page_content,
            'maxLength' => 125
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        wp_send_json_success($response);
    }

    private function call_mcp_server($tool_name, $arguments) {
        $response = wp_remote_post($this->mcp_server_url . '/api/tools', [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'tool' => $tool_name,
                'arguments' => $arguments
            ]),
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_error', 'Invalid JSON response from MCP server');
        }

        return $data;
    }
}

// Initialize the plugin
new MCP_Image_Alt_Text_Generator();
