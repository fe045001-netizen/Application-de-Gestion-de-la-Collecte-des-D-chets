<?php
class CollectionLog {
    public static function create($db,$data){
        $stmt=$db->prepare("
            INSERT INTO collection_logs(point_id,route_id,status,note)
            VALUES(?,?,?,?)
        ");
        $stmt->execute([
            $data['point_id'],$data['route_id'],
            $data['status'],$data['note']
        ]);
    }
}