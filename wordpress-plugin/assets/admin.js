jQuery(document).ready(function($) {
    // Get post ID from URL or global
    var postId = $('#post_ID').val() || window.typenow === 'post' ? new URLSearchParams(window.location.search).get('post') : null;
    
    if (!postId) {
        console.warn('MCP Meta Generator: Could not determine post ID');
        return;
    }

    // Test connection on page load
    testConnection();

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

    // Apply to Yoast button - Enhanced version
    $(document).on('click', '#mcp-apply-meta', function() {
        var generatedMeta = $('#mcp-generated-meta').val();
        
        if (!generatedMeta) {
            showError('No meta description to apply');
            return;
        }
        
        console.log('Attempting to apply meta description:', generatedMeta);
        
        // Comprehensive list of Yoast SEO selectors
        var yoastSelectors = [
            // Classic Editor selectors
            '#yoast_wpseo_metadesc',
            'textarea[name="yoast_wpseo_metadesc"]',
            '#snippet-editor-meta-description',
            
            // Block Editor (Gutenberg) selectors
            '.yoast-field-group__inputfield[name*="metadesc"]',
            '[data-id="metaDesc"]',
            'textarea[placeholder*="meta description"]',
            'textarea[placeholder*="Meta description"]',
            
            // Yoast Premium selectors
            '.yoast-metabox textarea[name*="metadesc"]',
            '#wpseo-meta-description-content',
            
            // React/Redux based selectors (newer Yoast versions)
            'textarea[aria-label*="Meta description"]',
            'textarea[aria-label*="meta description"]',
            
            // Fallback selectors
            'textarea[id*="metadesc"]',
            'textarea[name*="metadesc"]',
            'textarea[class*="metadesc"]'
        ];
        
        var $yoastField = null;
        var usedSelector = '';
        
        // Try each selector until we find one that works
        for (var i = 0; i < yoastSelectors.length; i++) {
            $yoastField = $(yoastSelectors[i]);
            if ($yoastField.length > 0 && $yoastField.is(':visible')) {
                usedSelector = yoastSelectors[i];
                console.log('Found Yoast field using selector:', usedSelector);
                break;
            }
        }
        
        if ($yoastField && $yoastField.length > 0) {
            // Apply the meta description
            $yoastField.val(generatedMeta);
            
            // Trigger various events to ensure Yoast recognizes the change
            $yoastField.trigger('input').trigger('change').trigger('keyup').trigger('blur');
            
            // For React-based components (newer Yoast versions)
            if (typeof Event !== 'undefined') {
                var inputEvent = new Event('input', { bubbles: true });
                var changeEvent = new Event('change', { bubbles: true });
                
                $yoastField[0].dispatchEvent(inputEvent);
                $yoastField[0].dispatchEvent(changeEvent);
            }
            
            // For Gutenberg/Block editor, try additional methods
            if (typeof wp !== 'undefined' && wp.data) {
                // Wait a bit then trigger additional events
                setTimeout(function() {
                    $yoastField.trigger('input').trigger('blur');
                    
                    // Try to trigger Yoast's own update functions
                    if (window.YoastSEO && window.YoastSEO.app) {
                        try {
                            window.YoastSEO.app.refresh();
                        } catch (e) {
                            console.log('Could not trigger Yoast refresh:', e);
                        }
                    }
                }, 100);
                
                // Another attempt after a longer delay
                setTimeout(function() {
                    $yoastField.trigger('change');
                }, 500);
            }
            
            showSuccess('Meta description applied to Yoast SEO field! (Used: ' + usedSelector + ')');
            
            // Highlight the field briefly to show it worked
            $yoastField.css('background-color', '#90EE90');
            setTimeout(function() {
                $yoastField.css('background-color', '');
            }, 2000);
            
        } else {
            // If we can't find the field, provide helpful debugging info
            console.log('Available textarea elements:');
            $('textarea').each(function(index) {
                console.log(index + ':', {
                    id: this.id,
                    name: this.name,
                    className: this.className,
                    placeholder: $(this).attr('placeholder'),
                    visible: $(this).is(':visible')
                });
            });
            
            showError('Could not find Yoast SEO meta description field. Please copy and paste manually.<br><small>Check browser console for debugging info.</small>');
            
            // Offer manual copy option
            $('#mcp-generated-meta').select();
            showSuccess('Text selected - you can copy it manually (Ctrl+C) and paste into the Yoast field.');
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

    function testConnection() {
        if (!mcpMeta.server_url) {
            updateConnectionStatus('error', 'No server URL configured');
            return;
        }
        
        updateConnectionStatus('checking', 'Testing connection...');
        
        $.ajax({
            url: mcpMeta.ajax_url,
            type: 'POST',
            data: {
                action: 'mcp_test_connection',
                nonce: mcpMeta.nonce
            },
            success: function(response) {
                if (response.success) {
                    updateConnectionStatus('connected', 'Connected to MCP server');
                } else {
                    updateConnectionStatus('error', 'Connection failed: ' + (response.data.message || 'Unknown error'));
                }
            },
            error: function() {
                updateConnectionStatus('error', 'Connection test failed');
            }
        });
    }

    function updateConnectionStatus(status, message) {
        var $statusDot = $('.mcp-status-dot');
        var $statusText = $('.mcp-status-text');
        
        $statusDot.removeClass('connected checking error').addClass(status);
        $statusText.text(message);
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

    // Debug function to find Yoast fields
    function findYoastFields() {
        console.log('=== Yoast Field Debug Info ===');
        console.log('All textarea elements:');
        $('textarea').each(function(index) {
            console.log(index + ':', {
                id: this.id,
                name: this.name,
                className: this.className,
                placeholder: $(this).attr('placeholder'),
                visible: $(this).is(':visible'),
                value: $(this).val().substring(0, 50) + '...'
            });
        });
        
        console.log('All input elements with "meta" in id/name/class:');
        $('input, textarea').filter(function() {
            return this.id.toLowerCase().includes('meta') || 
                   (this.name && this.name.toLowerCase().includes('meta')) ||
                   this.className.toLowerCase().includes('meta');
        }).each(function(index) {
            console.log('Meta field ' + index + ':', {
                tagName: this.tagName,
                id: this.id,
                name: this.name,
                className: this.className,
                visible: $(this).is(':visible')
            });
        });
    }

    // Add debug button (remove in production)
    if (window.location.href.includes('wp-admin')) {
        $('#mcp-meta-generator').append('<button type="button" onclick="window.mcpDebug()" style="margin-top:10px; font-size:11px;">Debug Yoast Fields</button>');
        window.mcpDebug = findYoastFields;
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
        },
        findYoastFields: findYoastFields
    };
});