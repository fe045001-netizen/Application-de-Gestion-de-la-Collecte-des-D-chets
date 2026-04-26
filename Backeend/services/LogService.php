<?php
require_once __DIR__ . '/../models/CollectionLog.php';
class LogService {
    public static function create($db,$data){
        CollectionLog::create($db,$data);
    }
}