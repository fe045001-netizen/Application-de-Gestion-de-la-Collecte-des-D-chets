<?php

require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {

    public static function check() {

        $headers = function_exists('getallheaders')
            ? getallheaders()
            : [];

        $auth = $headers['Authorization']
            ?? $headers['authorization']
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? null;

        if (!$auth) {
            http_response_code(401);
            header("Content-Type: application/json");
            echo json_encode(["error" => "Token manquant"]);
            exit;
        }

        if (!str_starts_with($auth, "Bearer ")) {
            http_response_code(401);
            header("Content-Type: application/json");
            echo json_encode(["error" => "Format token invalide"]);
            exit;
        }

        return str_replace("Bearer ", "", $auth);
    }
}