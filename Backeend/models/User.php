<?php

class User {

    public static function findByEmail($db, $email) {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function create($db, $data) {

        $stmt = $db->prepare("
            INSERT INTO users (email, password, role)
            VALUES (?, ?, ?)
        ");

        return $stmt->execute([
            $data['email'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['role'] ?? 'agent'
        ]);
    }
}