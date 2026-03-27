<?php
/**
 * Puente de autenticacin robusto para validacin interna
 */
define('WP_USE_THEMES', false);
require_once('wp-load.php');

// Si no est logueado automticamente, intentamos validar la cookie manualmente
if (!is_user_logged_in() && !empty($_COOKIE)) {
    foreach ($_COOKIE as $name => $value) {
        if (strpos($name, 'wordpress_logged_in_') === 0) {
            $user_id = wp_validate_auth_cookie($value, 'logged_in');
            if ($user_id) {
                wp_set_current_user($user_id);
                break;
            }
        }
    }
}

$user = wp_get_current_user();
$authenticated = ($user && $user->ID > 0);
$is_admin = $authenticated && (current_user_can('manage_options') || current_user_can('manage_woocommerce') || current_user_can('administrator'));

header('Content-Type: application/json');
echo json_encode([
    'authenticated' => $authenticated,
    'is_privileged' => $is_admin,
    'id' => $user->ID,
    'user_login' => $user->user_login,
    'roles' => $user->roles,
    'debug' => [
        'cookies_count' => count($_COOKIE),
        'method' => $_SERVER['REQUEST_METHOD'],
        'host' => $_SERVER['HTTP_HOST']
    ]
]);
