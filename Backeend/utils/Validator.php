<?php
class Validator {
    public static function required($data, $fields){
        foreach($fields as $f){
            if(!isset($data[$f]) || empty($data[$f])){
                Response::json(["error"=>"$f requis"],400);
            }
        }
    }
}