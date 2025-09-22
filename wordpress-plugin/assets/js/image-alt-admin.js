jQuery(document).ready(function($) {
    'use strict';

    // Analyze images in current post
    $('.mcp-analyze-images').on('click', function() {
        const button = $(this);
        const postId = button.data('post-id');
        const resultsContainer = $('.mcp-image-analysis');

        button.prop('disabled', true).text('Analyzing...');
        resultsContainer.html('<p>Analyzing images...</p>');

        $.ajax({
            url: mcpImageAlt.ajaxUrl,
            method: 'POST',
            data: {
                action: 'mcp_analyze_images',
                nonce: mcpImageAlt.nonce,
                post_id: postId
            },
            success: function(response) {
                if (response.success) {
                    displayImageAnalysis(response.data, resultsContainer);
                } else {
                    resultsContainer.html('<p class="error">Error: ' + response.data.message + '</p>');
                }
            },
            error: function() {
                resultsContainer.html('<p class="error">Failed to analyze images</p>');
            },
            complete: function() {
                button.prop('disabled', false).text('Analyze Images');
            }
        });
    });

    // Display analysis results
    function displayImageAnalysis(data, container) {
        let html = '<div class="mcp-analysis-results">';
        html += '<h4>Analysis Results</h4>';
        html += '<p><strong>Total Images:</strong> ' + data.totalImages + '</p>';
        html += '<p><strong>Missing Alt Text:</strong> ' + data.imagesNeedingAltText + '</p>';
        html += '<p><strong>Needs Improvement:</strong> ' + data.imagesNeedingImprovement + '</p>';

        if (data.images && data.images.length > 0) {
            html += '<div class="image-list" style="max-height: 300px; overflow-y: auto; margin-top: 10px;">';
            
            data.images.forEach(function(img) {
                html += '<div class="image-item" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">';
                html += '<img src="' + img.src + '" style="max-width: 100px; height: auto;" />';
                html += '<p><strong>Current Alt:</strong> ' + (img.currentAlt || '<em>None</em>') + '</p>';
                
                if (img.issues.length > 0) {
                    html += '<p class="issues"><strong>Issues:</strong></p><ul>';
                    img.issues.forEach(function(issue) {
                        html += '<li>' + issue + '</li>';
                    });
                    html += '</ul>';
                    html += '<button class="button button-small generate-alt" data-image-id="' + img.id + '" data-image-src="' + img.src + '">Generate Alt Text</button>';
                }
                
                html += '</div>';
            });
            
            html += '</div>';
            
            if (data.imagesNeedingImprovement > 0) {
                html += '<button class="button button-primary" id="generate-all-alt" style="margin-top: 10px;">Generate All Alt Text</button>';
            }
        }

        html += '</div>';
        container.html(html);
    }

    // Generate alt text for single image
    $(document).on('click', '.generate-alt', function() {
        const button = $(this);
        const imageSrc = button.data('image-src');
        const imageItem = button.closest('.image-item');

        button.prop('disabled', true).text('Generating...');

        // Get post context
        const postTitle = $('#title').val() || '';
        const postContent = getPostContent();

        $.ajax({
            url: mcpImageAlt.ajaxUrl,
            method: 'POST',
            data: {
                action: 'mcp_generate_image_alt',
                nonce: mcpImageAlt.nonce,
                image_url: imageSrc,
                file_name: imageSrc.split('/').pop(),
                page_title: postTitle,
                surrounding_text: postContent.substring(0, 500)
            },
            success: function(response) {
                if (response.success && response.data.altText) {
                    const altText = response.data.altText;
                    imageItem.find('p:first').html('<strong>New Alt Text:</strong> ' + altText);
                    
                    // Add apply button
                    if (!imageItem.find('.apply-alt').length) {
                        imageItem.append('<button class="button button-small apply-alt" data-image-src="' + imageSrc + '" data-alt-text="' + altText + '">Apply to Post</button>');
                    }
                } else {
                    alert('Error generating alt text');
                }
            },
            error: function() {
                alert('Failed to generate alt text');
            },
            complete: function() {
                button.prop('disabled', false).text('Generate Alt Text');
            }
        });
    });

    // Apply alt text to post content
    $(document).on('click', '.apply-alt', function() {
        const button = $(this);
        const imageSrc = button.data('image-src');
        const altText = button.data('alt-text');

        // Update the image in the editor
        const content = getPostContent();
        const imgRegex = new RegExp('<img([^>]*?)src=["\']' + imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']([^>]*?)>', 'gi');
        
        const updatedContent = content.replace(imgRegex, function(match, before, after) {
            // Remove existing alt attribute if present
            let updated = match.replace(/alt=["'][^"']*["']/gi, '');
            // Add new alt attribute
            updated = updated.replace('<img', '<img alt="' + altText + '"');
            return updated;
        });

        setPostContent(updatedContent);
        button.text('Applied!').prop('disabled', true);
    });

    // Bulk generation
    $('#mcp-bulk-analyze').on('click', function() {
        const button = $(this);
        const postType = $('#post-type-select').val();
        const limit = parseInt($('#image-limit').val());
        const resultsContainer = $('#mcp-bulk-results');

        button.prop('disabled', true).text('Processing...');
        resultsContainer.html('<p>Analyzing posts...</p>');

        // This would need additional AJAX endpoint to fetch posts and process
        // Simplified version shown here
        alert('Bulk processing feature - implementation depends on your specific needs');
        button.prop('disabled', false).text('Start Analysis');
    });

    // Helper functions
    function getPostContent() {
        if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
            return tinymce.get('content').getContent();
        } else if ($('#content').length) {
            return $('#content').val();
        }
        return '';
    }

    function setPostContent(content) {
        if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
            tinymce.get('content').setContent(content);
        } else if ($('#content').length) {
            $('#content').val(content);
        }
    }
});
