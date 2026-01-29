<?php

namespace App\Helpers;

class SanitizationHelper
{
    /**
     * Bereinigt einen String von potenziell gefährlichem HTML/JavaScript.
     * Entfernt HTML-Tags, escaped Sonderzeichen und normalisiert Whitespace.
     *
     * @param string|null $input
     * @return string
     */
    public static function sanitizeString(?string $input): string
    {
        if ($input === null) {
            return '';
        }

        // Entferne Null-Bytes
        $input = str_replace("\0", '', $input);
        
        // Trim Whitespace
        $input = trim($input);
        
        // Entferne HTML-Tags (nur Text erlauben)
        $input = strip_tags($input);
        
        // Escaped HTML-Sonderzeichen
        $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        
        // Normalisiere Whitespace (mehrere Leerzeichen/Tabs/Zeilenumbrüche zu einem Leerzeichen)
        $input = preg_replace('/\s+/', ' ', $input);
        
        return trim($input);
    }

    /**
     * Bereinigt ein Array von Strings rekursiv.
     *
     * @param array|null $input
     * @return array
     */
    public static function sanitizeArray(?array $input): array
    {
        if ($input === null) {
            return [];
        }

        $sanitized = [];
        
        foreach ($input as $key => $value) {
            $sanitizedKey = is_string($key) ? self::sanitizeString($key) : $key;
            
            if (is_string($value)) {
                $sanitized[$sanitizedKey] = self::sanitizeString($value);
            } elseif (is_array($value)) {
                $sanitized[$sanitizedKey] = self::sanitizeArray($value);
            } else {
                $sanitized[$sanitizedKey] = $value;
            }
        }
        
        return $sanitized;
    }

    /**
     * Bereinigt einen String, der für URLs verwendet wird.
     *
     * @param string|null $input
     * @return string
     */
    public static function sanitizeUrl(?string $input): string
    {
        if ($input === null) {
            return '';
        }

        // Entferne alle Zeichen außer alphanumerisch, Bindestrich, Punkt, Schrägstrich
        $input = preg_replace('/[^a-zA-Z0-9\-._\/]/', '', $input);
        
        return trim($input);
    }

    /**
     * Bereinigt eine E-Mail-Adresse.
     *
     * @param string|null $input
     * @return string
     */
    public static function sanitizeEmail(?string $input): string
    {
        if ($input === null) {
            return '';
        }

        // Trim und lowercase
        $input = trim(strtolower($input));
        
        // Filter ungültige Zeichen (Laravel validiert bereits die E-Mail-Format)
        $input = filter_var($input, FILTER_SANITIZE_EMAIL);
        
        return $input;
    }

    /**
     * Bereinigt Request-Daten rekursiv.
     * Sollte für alle Benutzereingaben verwendet werden, bevor sie gespeichert werden.
     *
     * @param array $data
     * @param array $excludeFields Felder, die nicht bereinigt werden sollen (z.B. Passwörter)
     * @return array
     */
    public static function sanitizeRequestData(array $data, array $excludeFields = ['password', 'password_confirmation', 'current_password', 'new_password', 'new_password_confirmation', 'token']): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            // Überspringe Felder, die nicht bereinigt werden sollen
            if (in_array($key, $excludeFields)) {
                $sanitized[$key] = $value;
                continue;
            }
            
            if (is_string($value)) {
                $sanitized[$key] = self::sanitizeString($value);
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitizeRequestData($value, $excludeFields);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
}

