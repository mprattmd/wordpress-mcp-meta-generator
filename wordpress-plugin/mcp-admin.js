jQuery(document).ready(function($) {
    'use strict';
    
    // Meta Description Generation
    $('#generate-meta').on('click', function() {
        const btn = $(this);
        const postId = btn.data('post');
        const tone = $('#meta-tone').val();
        
        btn.prop('disabled', true).text('Generating...');
        
        $.post(mcpData.ajax_url, {
            action: 'mcp_generate_meta',
            nonce: mcpData.nonce,
            post_id: postId,
            tone: tone
        }, function(response) {
            if (response.success && response.data.metaDescription) {
                $('#meta-text').val(response.data.metaDescription);
                $('#meta-result').slideDown();
            } else {
                alert('Error: ' + (response.data || 'Unknown error'));
            }
        }).always(function() {
            btn.prop('disabled', false).text('Generate Meta');
        });
    });
    
    // Apply to Yoast
    $('#apply-meta').on('click', function() {
        const metaText = $('#meta-text').val();
        
        // Try Yoast SEO (newer versions)
        if (typeof wp !== 'undefined' && wp.data && wp.data.select('yoast-seo/editor')) {
            wp.data.dispatch('yoast-seo/editor').setMetaDescription(metaText);
            alert('Applied to Yoast SEO!');
        }
        // Try classic Yoast
        else if ($('#yoast_wpseo_metadesc').length) {
            $('#yoast_wpseo_metadesc').val(metaText).trigger('input');
            alert('Applied to Yoast SEO!');
        }
        else {
            alert('Yoast SEO field not found. Copy the text manually.');
        }
    });
    
    // Image Analysis
    $('#analyze-images').on('click', function() {
        const btn = $(this);
        const postId = btn.data('post');
        const container = $('#image-results');
        
        btn.prop('disabled', true).text('Analyzing...');
        container.html('<p>Scanning images...</p>');
        
        $.post(mcpData.ajax_url, {
            action: 'mcp_analyze_images',
            nonce: mcpData.nonce,
            post_id: postId
        }, function(response) {
            if (response.success) {
                displayImages(response.data, container);
            } else {
                container.html('<p style="color:red;">Error: ' + (response.data || 'Unknown error') + '</p>');
            }
        }).always(function() {
            btn.prop('disabled', false).text('Analyze Images');
        });
    });
    
    function displayImages(data, container) {
        let html = '<div style="max-height:300px;overflow-y:auto;">';
        html += '<p><strong>Total:</strong> ' + data.totalImages + ' | ';
        html += '<strong>Missing:</strong> ' + data.imagesNeedingAltText + ' | ';
        html += '<strong>Needs work:</strong> ' + data.imagesNeedingImprovement + '</p>';
        
        if (data.images && data.images.length > 0) {
            data.images.forEach(function(img) {
                html += '<div style="border:1px solid #ddd;padding:8px;margin:8px 0;background:#f9f9f9;">';
                html += '<img src="' + img.src + '" style="max-width:80px;height:auto;" />';
                html += '<p style="margin:5px 0;"><small><strong>Current:</strong> ' + (img.currentAlt || '<em>None</em>') + '</small></p>';
                
                if (img.issues.length > 0) {
                    html += '<p style="color:#d63638;margin:5px 0;"><small>' + img.issues.join(', ') + '</small></p>';
                    html += '<button class="button button-small gen-alt" data-src="' + img.src + '">Generate</button>';
                }
                
                html += '</div>';
            });
        }
        
        html += '</div>';
        container.html(html);
    }
    
    // Generate Alt Text
    $(document).on('click', '.gen-alt', function() {
        const btn = $(this);
        const imgSrc = btn.data('src');
        const pageTitle = $('#title').val() || '';
        
        btn.prop('disabled', true).text('...');
        
        $.post(mcpData.ajax_url, {
            action: 'mcp_generate_alt',
            nonce: mcpData.nonce,
            image_url: imgSrc,
            page_title: pageTitle
        }, function(response) {
            if (response.success && response.data.altText) {
                btn.parent().find('p:first').after(
                    '<p style="color:#2ea02e;margin:5px 0;"><strong>Generated:</strong> ' + 
                    response.data.altText + '</p>'
                );
                btn.text('✓').css('background', '#2ea02e');
            } else {
                alert('Error: ' + (response.data || 'Unknown error'));
                btn.prop('disabled', false).text('Generate');
            }
        });
    });
});
