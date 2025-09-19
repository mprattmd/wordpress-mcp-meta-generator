jQuery(document).ready(function($) {
    // Get post ID from URL or global
    var postId = $('#post_ID').val() || window.typenow === 'post' ? new URLSearchParams(window.location.search).get('post') : null;
    
    if (!postId) {
        console.warn('MCP Meta Generator: Could not determine post ID');
        return;
    }

    // Analyze Content button
    $('#mcp-analyze-content').on('click', function() {
        var $button = $(this);
        var originalText = $button.text();
        
        $button.text('Analyzing...').prop('disabled', true);
        
        $.ajax({
            url: mcpMeta.ajax_url,
            type: 'POST',
            data: {
                action: 'mcp_analyze_content',
                post_id: postId,
                nonce: mcpMeta.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayContentAnalysis(response.data);
                } else {
                    showError('Content analysis failed: ' + (response.data || 'Unknown error'));
                }
            },
            error: function(xhr, status, error) {
                showError('AJAX error: ' + error);
            },
            complete: function() {
                $button.text(originalText).prop('disabled', false);
            }
        });
    });

    // Generate Meta Description button
    $('#mcp-generate-meta').on('click', function() {
        var $button = $(this);
        var originalText = $button.text();
        var tone = $('#mcp-tone-select').val();
        
        $button.text('Generating...').prop('disabled', true);
        
        $.ajax({
            url: mcpMeta.ajax_url,
            type: 'POST',
            data: {
                action: 'mcp_generate_meta_description',
                post_id: postId,
                tone: tone,
                nonce: mcpMeta.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayGeneratedMeta(response.data);
                } else {
                    showError('Meta description generation failed: ' + (response.data || 'Unknown error'));
                }
            },
            error: function(xhr, status, error) {
                showError('AJAX error: ' + error);
            },
            complete: function() {
                $button.text(originalText).prop('disabled', false);
            }
        });
    });

    // Apply to Yoast button
    $(document).on('click', '#mcp-apply-meta', function() {
        var generatedMeta = $('#mcp-generated-meta').val();
        
        if (!generatedMeta) {
            showError('No meta description to apply');
            return;
        }
        
        // Try different Yoast SEO selectors (they change between versions)
        var yoastSelectors = [
            '#yoast_wpseo_metadesc',  // Classic editor
            '[name="yoast_wpseo_metadesc"]',  // Alternative
            '#snippet-editor-meta-description',  // Block editor
            '.yoast-field-group__inputfield[name*="metadesc"]',  // Gutenberg
            'textarea[name="yoast_wpseo_metadesc"]'  // Fallback
        ];
        
        var $yoastField = null;
        
        for (var i = 0; i < yoastSelectors.length; i++) {
            $yoastField = $(yoastSelectors[i]);
            if ($yoastField.length > 0) {
                break;
            }
        }
        
        if ($yoastField && $yoastField.length > 0) {
            $yoastField.val(generatedMeta).trigger('change');
            
            // For Gutenberg/Block editor, we might need to trigger additional events
            if (typeof wp !== 'undefined' && wp.data) {
                // Trigger Yoast update in block editor
                setTimeout(function() {
                    $yoastField.trigger('input').trigger('blur');
                }, 100);
            }
            
            showSuccess('Meta description applied to Yoast SEO field!');
        } else {
            showError('Could not find Yoast SEO meta description field. Please copy and paste manually.');
        }
    });

    // Auto-generate functionality if enabled
    if (mcpMeta.auto_generate) {
        // Trigger analysis when content changes (debounced)
        var contentChangeTimer;
        var $content = $('#content, .editor-post-title__input, .wp-block-post-title');
        
        $content.on('input keyup', function() {
            clearTimeout(contentChangeTimer);
            contentChangeTimer = setTimeout(function() {
                if ($('#mcp-content-analysis').text().includes('Click "Analyze Content"')) {
                    $('#mcp-analyze-content').trigger('click');
                }
            }, 2000);
        });
    }

    function displayContentAnalysis(data) {
        var html = '<div class="mcp-analysis-results">';
        html += '<p><strong>Word Count:</strong> ' + data.wordCount + '</p>';
        html += '<p><strong>Content Type:</strong> ' + data.contentType + '</p>';
        html += '<p><strong>Suggested Meta Length:</strong> ' + data.suggestedMetaLength + ' characters</p>';
        
        if (data.topKeywords && data.topKeywords.length > 0) {
            html += '<p><strong>Top Keywords:</strong> ' + data.topKeywords.slice(0, 5).join(', ') + '</p>';
        }
        
        if (data.readabilityScore) {
            html += '<p><strong>Readability Score:</strong> ' + data.readabilityScore + '/100</p>';
        }
        
        html += '</div>';
        
        $('#mcp-content-analysis').html(html);
    }

    function displayGeneratedMeta(data) {
        $('#mcp-generated-meta').val(data.metaDescription);
        $('#mcp-results').show();
        
        // Display character count with color coding
        var charCount = data.length;
        var charCountClass = '';
        if (charCount < 120) {
            charCountClass = 'under-limit';
        } else if (charCount > 155) {
            charCountClass = 'over-limit';
        } else {
            charCountClass = 'optimal';
        }
        
        // Display suggestions
        var suggestionsHtml = '';
        if (data.suggestions && data.suggestions.length > 0) {
            suggestionsHtml += '<h5>Optimization Suggestions:</h5><ul>';
            data.suggestions.forEach(function(suggestion) {
                suggestionsHtml += '<li>' + suggestion + '</li>';
            });
            suggestionsHtml += '</ul>';
        }
        
        // Display meta info
        suggestionsHtml += '<p><small>';
        suggestionsHtml += '<strong>Length:</strong> <span class="' + charCountClass + '">' + data.length + ' characters</span> | ';
        suggestionsHtml += '<strong>Tone:</strong> ' + data.tone;
        if (data.keywords && data.keywords.length > 0) {
            suggestionsHtml += ' | <strong>Keywords:</strong> ' + data.keywords.join(', ');
        }
        suggestionsHtml += '</small></p>';
        
        // Add content analysis info if available
        if (data.analysis) {
            suggestionsHtml += '<p><small>';
            suggestionsHtml += '<strong>Content Type:</strong> ' + data.analysis.contentType + ' | ';
            suggestionsHtml += '<strong>Word Count:</strong> ' + data.analysis.wordCount;
            suggestionsHtml += '</small></p>';
        }
        
        $('#mcp-suggestions').html(suggestionsHtml);
        
        // Add character counter to textarea
        updateCharacterCounter();
        $('#mcp-generated-meta').on('input', updateCharacterCounter);
        
        // Scroll to results
        $('html, body').animate({
            scrollTop: $('#mcp-results').offset().top - 100
        }, 500);
    }

    function updateCharacterCounter() {
        var text = $('#mcp-generated-meta').val();
        var length = text.length;
        var className = '';
        
        if (length < 120) {
            className = 'under-limit';
        } else if (length > 155) {
            className = 'over-limit';
        } else {
            className = 'optimal';
        }
        
        var $counter = $('#mcp-char-counter');
        if ($counter.length === 0) {
            $('#mcp-generated-meta').after('<div id="mcp-char-counter" class="mcp-char-counter"></div>');
            $counter = $('#mcp-char-counter');
        }
        
        $counter.removeClass('under-limit over-limit optimal').addClass(className);
        $counter.text(length + '/155 characters');
    }

    function showError(message) {
        var $notice = $('<div class="notice notice-error is-dismissible"><p>' + message + '</p></div>');
        $('#mcp-meta-generator').prepend($notice);
        
        // Auto-remove after 5 seconds
        setTimeout(function() {
            $notice.fadeOut();
        }, 5000);
    }

    function showSuccess(message) {
        var $notice = $('<div class="notice notice-success is-dismissible"><p>' + message + '</p></div>');
        $('#mcp-meta-generator').prepend($notice);
        
        // Auto-remove after 3 seconds
        setTimeout(function() {
            $notice.fadeOut();
        }, 3000);
    }

    // Gutenberg/Block Editor integration
    if (typeof wp !== 'undefined' && wp.data && wp.plugins) {
        // Register a sidebar plugin for Gutenberg
        wp.plugins.registerPlugin('mcp-meta-generator-sidebar', {
            render: function() {
                return wp.element.createElement(
                    wp.editPost.PluginSidebar,
                    {
                        name: 'mcp-meta-generator',
                        title: 'MCP Meta Generator',
                        icon: 'admin-generic'
                    },
                    wp.element.createElement('div', {
                        id: 'mcp-meta-generator-gutenberg',
                        dangerouslySetInnerHTML: {
                            __html: $('#mcp-meta-generator').html()
                        }
                    })
                );
            }
        });
    }

    // Handle classic editor vs Gutenberg differences
    function getPostContent() {
        // Try Gutenberg first
        if (typeof wp !== 'undefined' && wp.data) {
            var content = wp.data.select('core/editor').getEditedPostContent();
            if (content) {
                return content;
            }
        }
        
        // Fallback to classic editor
        if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
            return tinyMCE.activeEditor.getContent();
        }
        
        // Final fallback to textarea
        return $('#content').val() || '';
    }

    function getPostTitle() {
        // Try Gutenberg first
        if (typeof wp !== 'undefined' && wp.data) {
            var title = wp.data.select('core/editor').getEditedPostAttribute('title');
            if (title) {
                return title;
            }
        }
        
        // Fallback to classic editor
        return $('#title').val() || $('.editor-post-title__input').val() || '';
    }

    // Export functions for potential external use
    window.mcpMetaGenerator = {
        analyzeContent: function() {
            $('#mcp-analyze-content').trigger('click');
        },
        generateMeta: function(tone) {
            if (tone) {
                $('#mcp-tone-select').val(tone);
            }
            $('#mcp-generate-meta').trigger('click');
        },
        applyToYoast: function() {
            $('#mcp-apply-meta').trigger('click');
        }
    };
});