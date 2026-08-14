<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPCACHE RESET SUCCESSFUL\n";
} else {
    echo "NO OPCACHE ACTIVE\n";
}
