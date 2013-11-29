<?php
	$filename = "shared-frankly-data/path.ai";
	$handle = fopen($filename, "rb");
	$contents = fread($handle, filesize($filename));
	fclose($handle);
	
	$pathPart = explode("*u", $contents);
	$pathPart = "*u".$pathPart[1];

	$result = explode("\r", $pathPart);
	// $result = explode("\n", $pathPart);
	$count = 0;
	$totalCount = count($result);
	echo '{"path" :[';
	foreach($result as $line) {
		echo json_encode($line) . ((++$count < $totalCount) ? ',' : '');
		echo "\n";
	}
	echo "]}";
?>