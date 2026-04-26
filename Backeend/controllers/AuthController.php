<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../models/User.php';

class AuthController {

    public static function login() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || empty($data['email']) || empty($data['password'])) {
            Response::json(["error" => "Email et mot de passe requis"], 400);
            return;
        }

        //  AuthService retourne maintenant ["token" => ..., "user" => ...]
        $result = AuthService::login($db, $data);

        if ($result) {
            Response::json($result); // { token, user }
        } else {
            Response::json(["error" => "Email ou mot de passe incorrect"], 401);
        }
    }

    public static function register() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || empty($data['email']) || empty($data['password'])) {
            Response::json(["error" => "Données invalides"], 400);
            return;
        }

        // Vérifier que l'email n'existe pas déjà
        $existing = User::findByEmail($db, $data['email']);
        if ($existing) {
            Response::json(["error" => "Cet email est déjà utilisé"], 409);
            return;
        }

        User::create($db, $data);

        // Retourner token + user directement après inscription
        $result = AuthService::login($db, $data);
        if ($result) {
            http_response_code(201);
            Response::json($result);
        } else {
            Response::json(["message" => "Compte créé, veuillez vous connecter"]);
        }
    }
}