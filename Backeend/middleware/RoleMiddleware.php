<?php
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../utils/Response.php';
class RoleMiddleware {
    public static function check($user,$role){
        if($user->role !== $role){
            Response::json(["error"=>"Accès refusé"],403);
        }
    }
}