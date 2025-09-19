jQuery(document).ready(function($) {
    // Get post ID from URL or global
    var postId = $('#post_ID').val() || window.typenow === 'post' ? new URLSearchParams(window.location.search).get('post') : null;
    
    if (!postId) {
        console.warn('MCP Meta Generator: Could not determine post ID');
        return;
    }

    console.log('MCP Meta Generator loaded, Post ID:', postId);

    // Test connection on page load
    setTimeout(testConnection, 1000);

    // Add debug button
    addDebugButton();

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
        
        // First, run debug to see what's available
        var availableFields = findAllFields();
        console.log('Available fields when applying:', availableFields);
        
        // Try to find and fill the field
        var success = tryFillYoastField(generatedMeta);
        
        if (!success) {
            // If automatic failed, show manual copy option
            showManualCopyOption(generatedMeta);
        }
    });

    function addDebugButton() {
        // Add debug button to the meta box
        if ($('#mcp-debug-button').length === 0) {
            $('#mcp-meta-generator').append(
                '<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">' +
                '<button type="button" id="mcp-debug-button" class="button" style="font-size: 11px;">🔍 Debug Yoast Fields</button>' +
                '<button type="button" id="mcp-manual-copy" class="button" style="font-size: 11px; margin-left: 5px;">📋 Manual Copy Mode</button>' +
                '</div>'
            );
        }
        
        // Debug button handler
        $(document).on('click', '#mcp-debug-button', function() {
            debugYoastFields();
        });
        
        // Manual copy button handler
        $(document).on('click', '#mcp-manual-copy', function() {
            var generatedMeta = $('#mcp-generated-meta').val();
            if (generatedMeta) {
                showManualCopyOption(generatedMeta);
            } else {
                showError('Generate a meta description first!');
            }
        });
    }

    function testConnection() {
        if (!mcpMeta.server_url) {
            updateConnectionStatus('error', 'No server URL configured');
            return;
        }
        
        updateConnectionStatus('checking', 'Testing connection...');
        
        // Test by making a simple request
        $.ajax({
            url: mcpMeta.ajax_url,
            type: 'POST',
            data: {
                action: 'mcp_test_connection',
                nonce: mcpMeta.nonce
            },
            timeout: 10000,
            success: function(response) {
                console.log('Connection test response:', response);
                if (response.success) {
                    updateConnectionStatus('connected', 'Connected to MCP server');
                } else {
                    updateConnectionStatus('error', 'Connection failed: ' + (response.data ? response.data.message : 'Unknown error'));
                }
            },
            error: function(xhr, status, error) {
                console.log('Connection test error:', status, error);
                updateConnectionStatus('error', 'Connection test failed: ' + error);
            }
        });
    }

    function updateConnectionStatus(status, message) {
        var $statusDot = $('.mcp-status-dot');
        var $statusText = $('.mcp-status-text');
        
        if ($statusDot.length && $statusText.length) {
            $statusDot.removeClass('connected checking error').addClass(status);
            $statusText.text(message);
            console.log('Updated connection status:', status, message);
        } else {
            console.log('Status elements not found');
        }
    }

    function debugYoastFields() {
        console.log('=== YOAST FIELD DEBUG INFO ===');
        
        var allFields = findAllFields();
        
        // Show results in a modal-like div
        var debugHtml = '<div id="mcp-debug-results" style="position: fixed; top: 50px; right: 20px; width: 400px; max-height: 500px; overflow-y: auto; background: white; border: 2px solid #0073aa; border-radius: 5px; padding: 15px; z-index: 999999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">';
        debugHtml += '<h3 style="margin-top: 0;">🔍 Field Debug Results</h3>';
        debugHtml += '<button onclick="$(\'#mcp-debug-results\').remove()" style="float: right; margin-top: -30px;">✕</button>';
        
        if (allFields.yoastFields.length > 0) {
            debugHtml += '<h4>Found Yoast Fields:</h4>';
            allFields.yoastFields.forEach(function(field, i) {
                debugHtml += '<div style="background: #f0f8f0; padding: 8px; margin: 5px 0; border-radius: 3px; font-size: 11px;">';
                debugHtml += '<strong>Field ' + i + ':</strong><br>';
                debugHtml += 'Tag: ' + field.tag + '<br>';
                debugHtml += 'ID: ' + field.id + '<br>';
                debugHtml += 'Name: ' + field.name + '<br>';
                debugHtml += 'Visible: ' + field.visible + '<br>';
                debugHtml += '</div>';
            });
        }
        
        if (allFields.metaFields.length > 0) {
            debugHtml += '<h4>Meta Fields:</h4>';
            allFields.metaFields.forEach(function(field, i) {
                debugHtml += '<div style="background: #fff8e1; padding: 8px; margin: 5px 0; border-radius: 3px; font-size: 11px;">';
                debugHtml += '<strong>Meta ' + i + ':</strong> ' + field.tag + '#' + field.id;
                debugHtml += '</div>';
            });
        }
        
        debugHtml += '<h4>All Textareas (' + allFields.textareas.length + '):</h4>';
        allFields.textareas.forEach(function(field, i) {
            debugHtml += '<div style="background: #f8f9fa; padding: 5px; margin: 2px 0; border-radius: 3px; font-size: 10px;">';
            debugHtml += field.tag + ' - ID: ' + field.id + ' - Name: ' + field.name + ' - Visible: ' + field.visible;
            debugHtml += '</div>';
        });
        
        debugHtml += '<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px;">';
        debugHtml += '<strong>Next Steps:</strong><br>';
        debugHtml += '1. Look for Yoast fields above<br>';
        debugHtml += '2. Try Manual Copy Mode<br>';
        debugHtml += '3. Check browser console for more details';
        debugHtml += '</div>';
        
        debugHtml += '</div>';
        
        // Remove existing debug results
        $('#mcp-debug-results').remove();
        
        // Add new debug results
        $('body').append(debugHtml);
        
        // Also log to console
        console.log('All fields found:', allFields);
        
        showSuccess('Debug info displayed! Check the popup and browser console.');
    }

    function findAllFields() {
        var yoastFields = [];
        var metaFields = [];
        var textareas = [];
        
        // Search for Yoast fields
        $('*[id*="yoast"], *[name*="yoast"], *[class*="yoast"]').each(function() {
            if (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT') {
                yoastFields.push({
                    element: this,
                    tag: this.tagName,
                    id: this.id,
                    name: this.name,
                    className: this.className,
                    visible: $(this).is(':visible'),
                    placeholder: $(this).attr('placeholder')
                });
            }
        });
        
        // Search for meta fields
        $('*[id*="meta"], *[name*="meta"], *[class*="meta"]').each(function() {
            if (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT') {
                metaFields.push({
                    element: this,
                    tag: this.tagName,
                    id: this.id,
                    name: this.name,
                    className: this.className,
                    visible: $(this).is(':visible')
                });
            }
        });
        
        // Get all textareas
        $('textarea').each(function() {
            textareas.push({
                element: this,
                tag: this.tagName,
                id: this.id,
                name: this.name,
                className: this.className,
                visible: $(this).is(':visible'),
                placeholder: $(this).attr('placeholder')
            });
        });
        
        return {
            yoastFields: yoastFields,
            metaFields: metaFields,
            textareas: textareas
        };
    }

    function tryFillYoastField(metaDescription) {
        // Comprehensive list of Yoast SEO selectors
        var yoastSelectors = [
            '#yoast_wpseo_metadesc',
            'textarea[name="yoast_wpseo_metadesc"]',
            'input[name="yoast_wpseo_metadesc"]',
            '#snippet-editor-meta-description',
            '.yoast-field-group__inputfield[name*="metadesc"]',
            '[data-id="metaDesc"]',
            'textarea[placeholder*="meta description"]',
            'textarea[placeholder*="Meta description"]',
            '.yoast-metabox textarea[name*="metadesc"]',
            '#wpseo-meta-description-content',
            'textarea[aria-label*="Meta description"]',
            'textarea[aria-label*="meta description"]',
            'textarea[id*="metadesc"]',
            'textarea[name*="metadesc"]',
            'textarea[class*="metadesc"]',
            'input[id*="metadesc"]',
            'input[name*="metadesc"]',
            'input[class*="metadesc"]'
        ];
        
        for (var i = 0; i < yoastSelectors.length; i++) {
            var $field = $(yoastSelectors[i]);
            if ($field.length > 0 && $field.is(':visible')) {
                console.log('Found Yoast field with selector:', yoastSelectors[i]);
                
                // Fill the field
                $field.val(metaDescription);
                
                // Trigger events
                $field.trigger('input').trigger('change').trigger('keyup').trigger('blur');
                
                // Additional React events
                if (typeof Event !== 'undefined') {
                    var inputEvent = new Event('input', { bubbles: true });
                    var changeEvent = new Event('change', { bubbles: true });
                    $field[0].dispatchEvent(inputEvent);
                    $field[0].dispatchEvent(changeEvent);
                }
                
                // Visual feedback
                $field.css('background-color', '#90EE90');
                setTimeout(function() {
                    $field.css('background-color', '');
                }, 2000);
                
                showSuccess('Meta description applied to Yoast SEO field! (Selector: ' + yoastSelectors[i] + ')');
                return true;
            }
        }
        
        console.log('No Yoast field found with any selector');
        return false;
    }

    function showManualCopyOption(metaDescription) {
        // Select the text for easy copying
        $('#mcp-generated-meta').select();
        
        // Show copy instructions
        var copyHtml = '<div id="mcp-copy-instructions" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">';
        copyHtml += '<h4 style="margin-top: 0;">📋 Manual Copy Mode</h4>';
        copyHtml += '<p><strong>The text above is selected.</strong> Follow these steps:</p>';
        copyHtml += '<ol>';
        copyHtml += '<li><strong>Copy:</strong> Press Ctrl+C (or Cmd+C on Mac)</li>';
        copyHtml += '<li><strong>Find:</strong> Locate the Yoast SEO meta description field on this page</li>';
        copyHtml += '<li><strong>Paste:</strong> Click in the Yoast field and press Ctrl+V (or Cmd+V)</li>';
        copyHtml += '</ol>';
        copyHtml += '<button onclick="$(\'#mcp-copy-instructions\').remove()" class="button">Got it!</button>';
        copyHtml += '</div>';
        
        // Remove existing instructions
        $('#mcp-copy-instructions').remove();
        
        // Add new instructions
        $('#mcp-results').append(copyHtml);
        
        showSuccess('Text selected for manual copying! See instructions below.');
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

    // Auto-generate functionality if enabled
    if (mcpMeta.auto_generate) {
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

    // Export functions for external use
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
        debugFields: function() {
            debugYoastFields();
        },
        testConnection: function() {
            testConnection();
        }
    };
});