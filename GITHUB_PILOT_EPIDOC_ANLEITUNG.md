# GitHub-Projekt "Pilot-EpiDoc" anlegen

## 1. Repository auf GitHub erstellen

1. Öffne **https://github.com/new**
2. **Repository name:** `Pilot-EpiDoc`
3. **Description** (optional): z.B. "EpiDoc Pilot – Tagebuch, Befinden, Analyse, Profil"
4. **Public** oder **Private** wählen
5. **Nicht** "Add a README" oder .gitignore hinzufügen (das Projekt existiert schon lokal)
6. Auf **Create repository** klicken

## 2. Lokales Projekt mit GitHub verbinden

Im Projektordner (EpiDoc-Pilot) im Terminal ausführen:

```bash
# Neues Git-Repo initialisieren
git init

# Alle Dateien zur Staging-Area hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Pilot EpiDoc: Registration, Login, Tagebuch, Befinden, Analyse, Profil, Kontakt"

# Remote-Repository hinzufügen (ersetzt YOUR_USERNAME durch deinen GitHub-Benutzernamen)
git remote add origin https://github.com/YOUR_USERNAME/Pilot-EpiDoc.git

# Branch auf main setzen und zum Remote pushen
git branch -M main
git push -u origin main
```

**Hinweis:** Wenn du SSH nutzt, verwende statt der HTTPS-URL:
`git@github.com:YOUR_USERNAME/Pilot-EpiDoc.git`

## 3. Optional: GitHub CLI installieren (für später)

Mit der GitHub CLI kannst du Repos künftig per Befehl anlegen:

```bash
# Mit Homebrew (macOS)
brew install gh
gh auth login
```

Dann z.B.: `gh repo create Pilot-EpiDoc --private --source=. --remote=origin --push`
