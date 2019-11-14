<?php

// Receive the RAW post data via the php://input IO stream.
$clientData = file_get_contents("php://input");

// Decode the json data
$data = json_decode($clientData);

// Prevent memory leaks for large json.
unset($clientData);


// Create the filenames based on current time
$dateT = date('Y-m-d_H-i-s');
$file = $dateT.".json";

// Save the file in JSON format
file_put_contents("../results/$file",json_encode($data));

// Release memory
unset($data);

?>
