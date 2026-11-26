<?php
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// 1. API requests
if (str_starts_with($path, '/api/')) {
    // When deployed, the api folder is copied into dist/api.
    // So we check dist first, then fallback to root (for local Mac testing)
    $file = __DIR__ . '/dist' . $path;
    if (!file_exists($file)) {
        $file = __DIR__ . $path; 
    }
    
    if (file_exists($file)) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
            require $file;
            return true;
        }
        return false;
    }
    http_response_code(404);
    echo json_encode(["error" => "API endpoint not found"]);
    return true;
}

// 2. Serve the React App (from dist folder)
$index = __DIR__ . '/dist/index.html';
if (file_exists($index)) {
    readfile($index);
} else {
    // Fallback if dist/index.html doesn't exist
    http_response_code(404);
    echo "Frontend not found. Did the build run?";
}