    public function meta_box_callback($post) {
        wp_nonce_field('mcp_meta_box', 'mcp_meta_nonce');
        
        $current_meta = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        
        echo '<div id="mcp-meta-generator">';
        
        // Connection status - simplified
        echo '<div id="mcp-connection-status" class="mcp-status-indicator">';
        echo '<span class="mcp-status-dot checking"></span>';
        echo '<span class="mcp-status-text">Testing connection...</span>';
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
        echo '<p>';
        echo '<button type="button" class="button button-primary" id="mcp-apply-meta">Apply to Yoast</button> ';
        echo '<button type="button" class="button" id="mcp-manual-copy">Manual Copy</button>';
        echo '</p>';
        echo '<div id="mcp-suggestions"></div>';
        echo '</div>';
        
        // Debug section - always visible
        echo '<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">';
        echo '<p><strong>Debug Tools:</strong></p>';
        echo '<button type="button" class="button" id="mcp-debug-fields" style="margin-right: 5px;">🔍 Find Yoast Fields</button>';
        echo '<button type="button" class="button" id="mcp-test-connection">🔗 Test Connection</button>';
        echo '<div id="mcp-debug-output" style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; display: none;"></div>';
        echo '</div>';
        
        echo '</div>';
        
        // Inline JavaScript to ensure it loads
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            console.log('MCP Meta Generator: Script loaded');
            
            // Test connection immediately
            $('#mcp-test-connection').on('click', function() {
                testMCPConnection();
            });
            
            // Debug fields
            $('#mcp-debug-fields').on('click', function() {
                findYoastFields();
            });
            
            // Manual copy functionality
            $('#mcp-manual-copy').on('click', function() {
                var metaText = $('#mcp-generated-meta').val();
                if (metaText) {
                    $('#mcp-generated-meta').select();
                    document.execCommand('copy');
                    alert('Meta description copied to clipboard!\n\nNow find the Yoast SEO meta description field on this page and paste it there (Ctrl+V).');
                } else {
                    alert('Please generate a meta description first!');
                }
            });
            
            // Enhanced Apply to Yoast
            $('#mcp-apply-meta').on('click', function() {
                var metaText = $('#mcp-generated-meta').val();
                if (!metaText) {
                    alert('Please generate a meta description first!');
                    return;
                }
                
                console.log('Trying to apply meta description:', metaText);
                
                // Comprehensive list of selectors
                var selectors = [
                    '#yoast_wpseo_metadesc',
                    'textarea[name="yoast_wpseo_metadesc"]',
                    'input[name="yoast_wpseo_metadesc"]',
                    '#snippet-editor-meta-description',
                    '.yoast-field-group__inputfield[name*="metadesc"]',
                    '[data-id="metaDesc"]',
                    'textarea[placeholder*="meta description"]',
                    'textarea[placeholder*="Meta description"]',
                    'textarea[aria-label*="Meta description"]',
                    'textarea[aria-label*="meta description"]',
                    'textarea[id*="metadesc"]',
                    'textarea[name*="metadesc"]',
                    'input[id*="metadesc"]',
                    'input[name*="metadesc"]'
                ];
                
                var found = false;
                for (var i = 0; i < selectors.length; i++) {
                    var $field = $(selectors[i]);
                    if ($field.length > 0 && $field.is(':visible')) {
                        console.log('Found field with selector:', selectors[i]);
                        $field.val(metaText);
                        $field.trigger('input').trigger('change').trigger('keyup');
                        
                        // Visual feedback
                        $field.css('background-color', '#90EE90');
                        setTimeout(function() { $field.css('background-color', ''); }, 2000);
                        
                        alert('✅ Successfully applied to Yoast SEO field!\nUsed selector: ' + selectors[i]);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    console.log('No Yoast field found. Available textareas:');
                    $('textarea').each(function(i) {
                        console.log(i + ':', {
                            id: this.id,
                            name: this.name,
                            className: this.className,
                            visible: $(this).is(':visible')
                        });
                    });
                    
                    // Auto-select text for manual copy
                    $('#mcp-generated-meta').select();
                    alert('❌ Could not find Yoast SEO field automatically.\n\n📋 The text is now selected - copy it (Ctrl+C) and paste into the Yoast field manually.\n\n🔍 Click "Find Yoast Fields" to see what fields are available.');
                }
            });
            
            function testMCPConnection() {
                $('.mcp-status-dot').removeClass('connected error').addClass('checking');
                $('.mcp-status-text').text('Testing connection...');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'mcp_test_connection',
                        nonce: '<?php echo wp_create_nonce('mcp_meta_nonce'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            $('.mcp-status-dot').removeClass('checking error').addClass('connected');
                            $('.mcp-status-text').text('✅ Connected to MCP server');
                            $('#mcp-debug-output').html('<div style="color: green;">✅ Connection successful!</div>').show();
                        } else {
                            $('.mcp-status-dot').removeClass('checking connected').addClass('error');
                            $('.mcp-status-text').text('❌ Connection failed');
                            $('#mcp-debug-output').html('<div style="color: red;">❌ Error: ' + (response.data ? response.data.message : 'Unknown error') + '</div>').show();
                        }
                    },
                    error: function(xhr, status, error) {
                        $('.mcp-status-dot').removeClass('checking connected').addClass('error');
                        $('.mcp-status-text').text('❌ Connection failed');
                        $('#mcp-debug-output').html('<div style="color: red;">❌ AJAX Error: ' + error + '</div>').show();
                    }
                });
            }
            
            function findYoastFields() {
                var output = '<h4>🔍 Field Search Results:</h4>';
                
                // Find Yoast fields
                var yoastFields = $('*[id*="yoast"], *[name*="yoast"], *[class*="yoast"]').filter('input, textarea');
                output += '<p><strong>Yoast Fields Found: ' + yoastFields.length + '</strong></p>';
                yoastFields.each(function(i) {
                    output += '<div style="background: #f0f8f0; padding: 5px; margin: 2px 0; font-size: 11px;">';
                    output += i + '. ' + this.tagName + ' - ID: "' + this.id + '" - Name: "' + this.name + '" - Visible: ' + $(this).is(':visible');
                    output += '</div>';
                });
                
                // Find meta fields
                var metaFields = $('*[id*="meta"], *[name*="meta"], *[class*="meta"]').filter('input, textarea');
                output += '<p><strong>Meta Fields Found: ' + metaFields.length + '</strong></p>';
                metaFields.each(function(i) {
                    if (i < 5) { // Show only first 5
                        output += '<div style="background: #fff8e1; padding: 5px; margin: 2px 0; font-size: 11px;">';
                        output += i + '. ' + this.tagName + ' - ID: "' + this.id + '" - Name: "' + this.name + '"';
                        output += '</div>';
                    }
                });
                
                // All textareas
                var textareas = $('textarea');
                output += '<p><strong>All Textareas: ' + textareas.length + '</strong></p>';
                textareas.each(function(i) {
                    if (i < 10) { // Show only first 10
                        output += '<div style="background: #f8f9fa; padding: 3px; margin: 1px 0; font-size: 10px;">';
                        output += i + '. ID: "' + this.id + '" Name: "' + this.name + '" Visible: ' + $(this).is(':visible');
                        output += '</div>';
                    }
                });
                
                if (textareas.length > 10) {
                    output += '<p><em>... and ' + (textareas.length - 10) + ' more textareas (check browser console for full list)</em></p>';
                }
                
                // Log to console too
                console.log('=== YOAST FIELD DEBUG ===');
                console.log('Yoast fields:', yoastFields);
                console.log('Meta fields:', metaFields);
                console.log('All textareas:', textareas);
                
                $('#mcp-debug-output').html(output).show();
            }
            
            // Test connection on load
            setTimeout(testMCPConnection, 1000);
        });
        </script>
        <?php
    }