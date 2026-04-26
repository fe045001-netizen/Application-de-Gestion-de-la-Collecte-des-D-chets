<?php
class Database {
    public function connect() {
        $host   = "localhost";
        $port   = "3307";
        $dbname = "cleanup";
        $user   = "root";
        $pass   = "";
        return new PDO(
            "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
            $user,
            $pass
        );
    }
}