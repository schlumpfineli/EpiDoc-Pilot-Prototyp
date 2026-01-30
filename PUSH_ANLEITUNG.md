# Daten zu pilot-epidoc pushen

**Repo-Name:** `pilot-epidoc`

Der erste Commit ist lokal erstellt. Der Push schlägt fehl, solange das Repo auf GitHub nicht existiert oder ein anderer Benutzername verwendet wird.

**Option A – Repo auf GitHub anlegen**
1. Gehe zu https://github.com/new
2. **Repository name:** `pilot-epidoc` (genau so)
3. Public oder Private wählen
4. **Kein** README, .gitignore oder Lizenz hinzufügen
5. Auf **Create repository** klicken
6. Im Projektordner:

```bash
cd /Users/schindlerselina/Documents/EpiDoc-Pilot
git remote remove origin
git remote add origin https://github.com/DEIN_GITHUB_USERNAME/pilot-epidoc.git
git push -u origin main
```
(Ersetze `DEIN_GITHUB_USERNAME` durch deinen GitHub-Benutzernamen.)

**Option B – Repo existiert schon**
Falls du einen anderen GitHub-Account nutzt, Remote anpassen und pushen:

```bash
cd /Users/schindlerselina/Documents/EpiDoc-Pilot
git remote set-url origin https://github.com/DEIN_GITHUB_USERNAME/pilot-epidoc.git
git push -u origin main
```
