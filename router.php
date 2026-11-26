<?php
// router.php - Tells PHP how to handle URLs

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// 1. If the request is for /api/..., serve the PHP file
if (str_starts_with($path, '/api/')) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
            require $file;
            return true;
        }
        return false; // serve static files like .json
    }
    http_response_code(404);
    echo json_encode(["error" => "API endpoint not found"]);
    return true;
}

// 2. Otherwise, serve the React SPA index.html
$index = __DIR__ . '/index.html';
if (file_exists($index)) {
    readfile($index);
} else {
    http_response_code(404);
    echo "Frontend not found. Did the build run?";
}