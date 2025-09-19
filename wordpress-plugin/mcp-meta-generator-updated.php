    private function call_mcp_server($tool, $args) {
        $server_url = $this->options['mcp_server_url'];
        if (empty($server_url)) {
            throw new Exception('MCP Server URL not configured');
        }
        
        // Ensure URL ends with /api/generate for the new HTTP API
        $api_url = rtrim($server_url, '/') . '/api/generate';
        
        $request_body = json_encode(array(
            'tool' => $tool,
            'args' => $args
        ));
        
        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress-MCP-Meta-Generator/1.0'
            ),
            'body' => $request_body,
            'timeout' => 30,
            'method' => 'POST'
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('MCP server request failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            $body = wp_remote_retrieve_body($response);
            throw new Exception("MCP server returned status {$status_code}: {$body}");
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from MCP server: ' . $body);
        }
        
        return $data;
    }