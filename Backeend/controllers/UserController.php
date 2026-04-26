<?php
require_once __DIR__ . '/../config/database.php';

class UserController {
    public static function getAll() {
        $db   = (new Database())->connect();
        $stmt = $db->query("SELECT id, name, email, role FROM users ORDER BY name ASC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows);
    }
public static function update($id) {
    $db   = (new Database())->connect();
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $db->prepare("UPDATE users SET name=?, email=?, role=? WHERE id=?");
    $stmt->execute([$data['name'], $data['email'], $data['role'], $id]);
    echo json_encode(["success" => true]);
}

public static function delete($id) {
    $db   = (new Database())->connect();
    $stmt = $db->prepare("DELETE FROM users WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true]);
}
}