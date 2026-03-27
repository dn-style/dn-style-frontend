<?php
/**
 * Plugin Name: DN Shop Internal Security
 * Description: Bypass de Nonce para validacin interna del Backend.
 */

add_filter('rest_authentication_errors', function($result) {
    if (isset($_SERVER['HTTP_X_INTERNAL_SECRET']) && $_SERVER['HTTP_X_INTERNAL_SECRET'] === 'dn_style_2026_secret') {
        if (!$result && is_user_logged_in()) {
            return true;
        }
    }
    return $result;
}, 100);
