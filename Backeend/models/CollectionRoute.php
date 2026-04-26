<?php
class CollectionRoute {
    public static function all($db){
        return $db->query("SELECT * FROM collection_routes")
                  ->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function create($db,$data){
        $stmt=$db->prepare("
            INSERT INTO collection_routes(name,date,truck_name)
            VALUES(?,?,?)
        ");
        $stmt->execute([
            $data['name'],$data['date'],$data['truck_name']
        ]);
    }
}