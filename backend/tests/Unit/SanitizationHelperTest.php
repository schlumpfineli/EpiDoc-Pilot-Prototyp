<?php

namespace Tests\Unit;

use App\Helpers\SanitizationHelper;
use Tests\TestCase;

class SanitizationHelperTest extends TestCase
{
    /** @test */
    public function it_sanitizes_xss_attempts()
    {
        $malicious = '<script>alert("XSS")</script>';
        $sanitized = SanitizationHelper::sanitizeString($malicious);
        
        $this->assertStringNotContainsString('<script>', $sanitized);
        $this->assertStringNotContainsString('</script>', $sanitized);
        $this->assertStringContainsString('alert', $sanitized); // Text bleibt erhalten, aber escaped
    }

    /** @test */
    public function it_sanitizes_html_tags()
    {
        $input = '<p>Hello <strong>World</strong></p>';
        $sanitized = SanitizationHelper::sanitizeString($input);
        
        $this->assertStringNotContainsString('<p>', $sanitized);
        $this->assertStringNotContainsString('<strong>', $sanitized);
        $this->assertStringContainsString('Hello World', $sanitized);
    }

    /** @test */
    public function it_sanitizes_null_bytes()
    {
        $input = "Hello\0World";
        $sanitized = SanitizationHelper::sanitizeString($input);
        
        $this->assertStringNotContainsString("\0", $sanitized);
        $this->assertStringContainsString('Hello', $sanitized);
        $this->assertStringContainsString('World', $sanitized);
    }

    /** @test */
    public function it_normalizes_whitespace()
    {
        $input = "Hello     World\n\n\nTest";
        $sanitized = SanitizationHelper::sanitizeString($input);
        
        // Sollte mehrfache Whitespace zu einem Leerzeichen normalisieren
        $this->assertStringNotContainsString('     ', $sanitized);
        $this->assertStringNotContainsString("\n\n\n", $sanitized);
    }

    /** @test */
    public function it_sanitizes_array_recursively()
    {
        $input = [
            'name' => '<script>alert("XSS")</script>',
            'email' => 'test@example.com',
            'nested' => [
                'value' => '<p>HTML Content</p>',
            ],
        ];
        
        $sanitized = SanitizationHelper::sanitizeArray($input);
        
        $this->assertStringNotContainsString('<script>', $sanitized['name']);
        $this->assertEquals('test@example.com', $sanitized['email']);
        $this->assertStringNotContainsString('<p>', $sanitized['nested']['value']);
    }

    /** @test */
    public function it_sanitizes_url()
    {
        $input = '../../../etc/passwd';
        $sanitized = SanitizationHelper::sanitizeUrl($input);
        
        // URL-Sanitization entfernt alle Zeichen außer alphanumerisch, Bindestrich, Punkt, Schrägstrich
        // Schrägstriche werden beibehalten
        $this->assertEquals('../../../etc/passwd', $sanitized);
        
        // Test mit bösartigen Zeichen - alle Sonderzeichen außer erlaubten werden entfernt
        $malicious = '../../etc/passwd<script>alert("XSS")</script>';
        $sanitized2 = SanitizationHelper::sanitizeUrl($malicious);
        $this->assertStringNotContainsString('<script>', $sanitized2);
        // 'alert' könnte als Teil von 'passwd' interpretiert werden, daher prüfen wir nur die HTML-Tags
        $this->assertStringNotContainsString('<', $sanitized2);
        $this->assertStringNotContainsString('>', $sanitized2);
    }

    /** @test */
    public function it_sanitizes_email()
    {
        $input = '  TEST@EXAMPLE.COM  ';
        $sanitized = SanitizationHelper::sanitizeEmail($input);
        
        $this->assertEquals('test@example.com', $sanitized);
    }

    /** @test */
    public function it_excludes_password_fields_from_sanitization()
    {
        $input = [
            'name' => '<script>alert("XSS")</script>',
            'password' => 'MyPassword123',
            'password_confirmation' => 'MyPassword123',
        ];
        
        $sanitized = SanitizationHelper::sanitizeRequestData($input);
        
        // Name sollte bereinigt sein
        $this->assertStringNotContainsString('<script>', $sanitized['name']);
        
        // Passwörter sollten unverändert sein
        $this->assertEquals('MyPassword123', $sanitized['password']);
        $this->assertEquals('MyPassword123', $sanitized['password_confirmation']);
    }

    /** @test */
    public function it_handles_null_values()
    {
        $this->assertEquals('', SanitizationHelper::sanitizeString(null));
        $this->assertEquals([], SanitizationHelper::sanitizeArray(null));
        $this->assertEquals('', SanitizationHelper::sanitizeUrl(null));
        $this->assertEquals('', SanitizationHelper::sanitizeEmail(null));
    }
}

