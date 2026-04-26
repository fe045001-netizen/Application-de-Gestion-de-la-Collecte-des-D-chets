<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/PointController.php';
require_once __DIR__ . '/../controllers/RouteController.php';
require_once __DIR__ . '/../controllers/LogController.php';
require_once __DIR__ . '/../controllers/TruckController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../controllers/PositionController.php';

/* ── CORS ─────────────────────────────────────────────────────────────────── */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

/* ── URI ──────────────────────────────────────────────────────────────────── */
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$uri    = str_replace("/PhpFinalProject/index.php", "", $uri);
$uri    = str_replace("/PhpFinalProject", "", $uri);
$uri    = '/' . trim($uri, '/');

/* ── AUTH ─────────────────────────────────────────────────────────────────── */
if ($uri === "/api/login"    && $method === "POST") { AuthController::login();    exit; }
if ($uri === "/api/register" && $method === "POST") { AuthController::register(); exit; }


/* ── USERS ────────────────────────────────────────────────────────────────── */
if ($uri === "/api/users" && $method === "GET") {
    AuthMiddleware::check();
    UserController::getAll();
    exit;
}
if (preg_match('#^/api/users/(\d+)$#', $uri, $m)) {
    AuthMiddleware::check();
    if ($method === "PUT")    { UserController::update($m[1]); exit; }
    if ($method === "DELETE") { UserController::delete($m[1]); exit; }
}
/* ── TRUCKS ───────────────────────────────────────────────────────────────── */
if ($uri === "/api/trucks") {
    AuthMiddleware::check();
    if ($method === "GET")  { TruckController::getAll();  exit; }
    if ($method === "POST") { TruckController::create();  exit; }
}
if (preg_match('#^/api/trucks/(\d+)$#', $uri, $m)) {
    AuthMiddleware::check();
    if ($method === "PUT")    { TruckController::update($m[1]); exit; }
    if ($method === "DELETE") { TruckController::delete($m[1]); exit; }
}

/* ── POINTS ───────────────────────────────────────────────────────────────── */
if ($uri === "/api/points") {
    AuthMiddleware::check();
    if ($method === "GET")  { PointController::getAll();  exit; }
    if ($method === "POST") { PointController::create();  exit; }
}
if (preg_match('#^/api/points/(\d+)$#', $uri, $m)) {
    AuthMiddleware::check();
    if ($method === "PUT")    { PointController::update($m[1]); exit; }
    if ($method === "DELETE") { PointController::delete($m[1]); exit; }
}

/* ── ROUTES ───────────────────────────────────────────────────────────────── */
if ($uri === "/api/routes") {
    AuthMiddleware::check();
    if ($method === "GET")  { RouteController::getAll();  exit; }
    if ($method === "POST") { RouteController::create();  exit; }
}
if (preg_match('#^/api/routes/(\d+)$#', $uri, $m)) {
    AuthMiddleware::check();
    if ($method === "PUT")    { RouteController::update($m[1]); exit; }
    if ($method === "DELETE") { RouteController::delete($m[1]); exit; }
}

/* ── LOGS ─────────────────────────────────────────────────────────────────── */
if ($uri === "/api/logs") {
    AuthMiddleware::check();
    if ($method === "GET")  { LogController::getAll();  exit; }
    if ($method === "POST") { LogController::create();  exit; }
}
if (preg_match('#^/api/logs/(\d+)$#', $uri, $m)) {
    AuthMiddleware::check();
    if ($method === "PUT")    { LogController::update($m[1]); exit; }
    if ($method === "DELETE") { LogController::delete($m[1]); exit; }
}
/* ── POSITIONS ───────────────────────────────────────────────────────────── */
if ($uri === "/api/positions") {
    if ($method === "GET")  { PositionController::getAll(); exit; }
    if ($method === "POST") { PositionController::save();   exit; }
}

/* ── 404 ──────────────────────────────────────────────────────────────────── */
http_response_code(404);
echo json_encode(["error" => "Route introuvable", "uri" => $uri, "method" => $method]);