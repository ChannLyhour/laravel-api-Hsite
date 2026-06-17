<?php
require __DIR__ . '/vendor/autoload.php';

$generator = new SimpleSoftwareIO\QrCode\Generator;
$svg = $generator->format('svg')->size(100)->generate('test');
echo $svg;
