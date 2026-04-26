<?php
require_once __DIR__ . '/../models/User.php';

class AuthService {
    public static function login($db, $data) {
        $email    = $data['email']    ?? '';
        $password = $data['password'] ?? '';

        $user = User::findByEmail($db, $email);
        if (!$user) return false;

        // CAS 1 : password hashé (bcrypt)
        $ok = password_verify($password, $user['password']);
        // CAS 2 : password en clair (anciens comptes 5,6,7)
        if (!$ok) $ok = ($user['password'] === $password);

        if (!$ok) return false;

        // Token simple sans Firebase
        $token = base64_encode($user['id'] . ':' . time());

        return [
            "token" => $token,
            "user"  => [
                "id"    => (int)$user['id'],
                "email" => $user['email'],
                "role"  => $user['role'],
                "name"  => $user['name'] ?? $user['email'],
            ]
        ];
    }
}