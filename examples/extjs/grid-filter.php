<?php
require( 'ssp.class.php' );

// collect request parameters
$start  = isset($_REQUEST['start'])  ? $_REQUEST['start']  :  0;
$count  = isset($_REQUEST['limit'])  ? $_REQUEST['limit']  : 50;
$sort   = isset($_REQUEST['sort'])   ? json_decode($_REQUEST['sort'])   : null;
$filters = isset($_REQUEST['filter']) ? $_REQUEST['filter'] : null;

$sortProperty = isset($sort) ? $sort[0]->property : 'id';
$sortDirection = isset($sort) ? $sort[0]->direction : 'ASC';

// GridFilters sends filters as an Array if not json encoded
if (is_array($filters)) {
    $encoded = false;
} else {
    $encoded = true;
    $filters = json_decode($filters);
}

$where = ' 0 = 0 ';
$qs = '';

// loop through filters sent by client
if (is_array($filters)) {
    for ($i=0;$i<count($filters);$i++){
        $filter = $filters[$i];

        // assign filter data (location depends if encoded or not)
        if ($encoded) {
            $field = $filter->field;
            $value = $filter->value;
            $compare = isset($filter->comparison) ? $filter->comparison : null;
            $filterType = $filter->type;
        } else {
            $field = $filter['field'];
            $value = $filter['data']['value'];
            $compare = isset($filter['data']['comparison']) ? $filter['data']['comparison'] : null;
            $filterType = $filter['data']['type'];
        }

        switch($filterType){
            case 'string' : $qs .= " AND `".$field."` LIKE '%".$value."%'"; Break;
            case 'list' :
                if (strstr($value,',')){
                    $fi = explode(',',$value);
                    for ($q=0;$q<count($fi);$q++){
                        $fi[$q] = "'".$fi[$q]."'";
                    }
                    $value = implode(',',$fi);
                    $qs .= " AND `".$field."` IN (".$value.")";
                }else{
                    $qs .= " AND `".$field."` = '".$value."'";
                }
            Break;
            case 'boolean' : $qs .= " AND `".$field."` = ".($value); Break;
            case 'numeric' :
                switch ($compare) {
                    case 'eq' : $qs .= " AND `".$field."` = ".$value; Break;
                    case 'lt' : $qs .= " AND `".$field."` < ".$value; Break;
                    case 'gt' : $qs .= " AND `".$field."` > ".$value; Break;
                }
            Break;
            case 'date' :
                switch ($compare) {
                    case 'eq' : $qs .= " AND `".$field."` = '".date('Y-m-d',strtotime($value))."'"; Break;
                    case 'lt' : $qs .= " AND `".$field."` < '".date('Y-m-d',strtotime($value))."'"; Break;
                    case 'gt' : $qs .= " AND `".$field."` > '".date('Y-m-d',strtotime($value))."'"; Break;
                }
            Break;
        }
    }
    $where .= $qs;
}

// DB table to use
$table = 'sp500';
// SQL server connection information
$sql_details = array(
    'user' => 'sortabletable',
    'pass' => '',
    'db'   => 'sortabletable',
    'host' => 'localhost'
);

$query = "SELECT * FROM `".$table."` WHERE ".$where;
$query .= " ORDER BY `".$sortProperty."` ".$sortDirection;
$query .= " LIMIT ".$start.",".$count.";";

$db = SSP::sql_connect($sql_details);
$bindings = array();
$rows = SSP::sql_exec($db,$bindings,$query);
$resTotalLength = SSP::sql_exec($db,$bindings,"SELECT COUNT(`id`) FROM `".$table."` WHERE ".$where.";");
$count = $resTotalLength[0][0];
$result = SSP::sql_exec($db,$bindings,$query);

echo json_encode(Array(
    "total"=>$count,
    "data"=>$rows
));

?>