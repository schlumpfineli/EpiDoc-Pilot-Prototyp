# Test-Benutzer für E2E-Tests

## 📋 Verfügbare Test-Benutzer

### 1. Test User (für E2E-Tests)
- **E-Mail**: `test@example.com`
- **Passwort**: `Password123`
- **Rolle**: `patient`
- **Name**: Test User

### 2. Test Patient
- **E-Mail**: `patient@test.de`
- **Passwort**: `Password123`
- **Rolle**: `patient`
- **Name**: Test Patient

### 3. Test Angehöriger
- **E-Mail**: `angehoeriger@test.de`
- **Passwort**: `Password123`
- **Rolle**: `relative`
- **Name**: Test Angehöriger

## 🔧 Test-Benutzer erstellen/aktualisieren

### Mit Seeder
```bash
php artisan db:seed --class=DatabaseSeeder
```

### Manuell mit Tinker
```bash
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::updateOrCreate(
    ['email' => 'test@example.com'],
    [
        'name' => 'Test User',
        'role' => 'patient',
        'password' => Hash::make('Password123'),
        'email_verified_at' => now(),
    ]
);
```

## ⚠️ Wichtige Hinweise

1. **Passwort-Stärke**: Alle Passwörter müssen die starken Passwort-Anforderungen erfüllen:
   - Mindestens 8 Zeichen
   - Mindestens 1 Großbuchstabe
   - Mindestens 1 Kleinbuchstabe
   - Mindestens 1 Zahl

2. **Passwort zurücksetzen**: Falls das Passwort nicht funktioniert:
   ```bash
   php artisan tinker
   ```
   ```php
   $user = User::where('email', 'test@example.com')->first();
   $user->password = Hash::make('Password123');
   $user->save();
   ```

3. **Benutzer prüfen**: 
   ```bash
   php artisan tinker --execute="echo App\Models\User::where('email', 'test@example.com')->exists() ? 'User existiert' : 'User existiert NICHT';"
   ```

## 🧪 Für E2E-Tests

Die E2E-Tests verwenden standardmäßig:
- **E-Mail**: `test@example.com`
- **Passwort**: `Password123`

Diese Credentials sind in `frontend/e2e/helpers/auth.ts` definiert.

---

**Stand**: Januar 2025

