<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, \Illuminate\Translation\PotentiallyTranslatedString): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        $password = (string) $value;

        // Mindestens 8 Zeichen
        if (strlen($password) < 8) {
            $fail('Das Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        // Mindestens ein Großbuchstabe
        if (!preg_match('/[A-Z]/', $password)) {
            $fail('Das Passwort muss mindestens einen Großbuchstaben enthalten.');
            return;
        }

        // Mindestens ein Kleinbuchstabe
        if (!preg_match('/[a-z]/', $password)) {
            $fail('Das Passwort muss mindestens einen Kleinbuchstaben enthalten.');
            return;
        }

        // Mindestens eine Zahl
        if (!preg_match('/[0-9]/', $password)) {
            $fail('Das Passwort muss mindestens eine Zahl enthalten.');
            return;
        }

        // Optional: Mindestens ein Sonderzeichen (kann zu streng sein, daher optional)
        // Entfernt für Prototyp, kann später aktiviert werden
        // if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        //     $fail('Das Passwort muss mindestens ein Sonderzeichen enthalten.');
        //     return;
        // }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Das Passwort erfüllt nicht die Mindestanforderungen.';
    }
}

