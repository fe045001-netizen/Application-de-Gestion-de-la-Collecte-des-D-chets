<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$key = "SECRET123";

function generateJWT($user) {
    global $key;
    return JWT::encode([
        "id"=>$user['id'],
        "role"=>$user['role'],
        "exp"=>time()+86400
    ], $key, 'HS256');
}

function verifyJWT($token) {
    global $key;
    return JWT::decode($token, new Key($key,'HS256'));
}