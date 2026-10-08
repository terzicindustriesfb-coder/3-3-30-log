# 3-3-30 Log als eigen website (zonder Claude-account)

De app draait op **GitHub Pages**. De gedeelde opslag en het inloggen lopen via **Firebase**
(gratis, met je Google-account). Je trainingsmaatje heeft alleen de link, een Google-account
(of e-mail + wachtwoord) en jullie **groepscode** nodig.

## 1. GitHub Pages aanzetten

1. Op een gratis GitHub-account werkt Pages alleen voor een **openbare** repo. In de repo staat
   alleen de code van de app, geen trainingen. Ga naar **Settings → General → Danger Zone →
   Change visibility → Public**.
2. Ga naar **Settings → Pages**. Kies bij *Build and deployment*: **Deploy from a branch**,
   branch **`ccr-32294d77-3xyile`**, map **`/docs`** → **Save**.
3. Na een minuut staat de site op **https://terzicindustriesfb-coder.github.io/TestSite/**.
   Tot stap 2 en 3 hieronder klaar zijn, zegt de site "Not connected yet".

## 2. Firebase-project maken

1. Ga naar **https://console.firebase.google.com** en log in met je Google-account.
2. **Create a project**. Kies een naam (bijv. `333-log`). Google Analytics mag uit.
3. Klik op de projectpagina op het **web-icoon `</>`**. Geef de app een naam en klik **Register app**.
4. Kopieer het blokje **`firebaseConfig`** (apiKey, authDomain, projectId, appId, …).
   Zet het in **`docs/firebase-config.js`** (of stuur het naar Claude, dan zet hij het erin).
   Deze waarden zijn niet geheim: inloggen en de regels uit stap 3 beschermen de gegevens.

## 3. Inloggen en database aanzetten

1. **Build → Authentication → Get started → Sign-in method**:
   - zet **Google** aan (kies een support-e-mail) en
   - zet **Email/Password** aan.
2. **Authentication → Settings → Authorized domains → Add domain**:
   `terzicindustriesfb-coder.github.io`
3. **Build → Firestore Database → Create database**: kies een locatie in Europa (bijv. `eur3`)
   en **production mode**.
4. Open het tabblad **Rules**. Plak de inhoud van **`docs/firestore.rules`** en vervang
   **`CHANGE-ME`** door jullie eigen groepscode (bijv. `bankdrukken2026`). Klik **Publish**.
   Die code staat alleen in Firebase, niet in de repo.

## 4. Gebruiken

- Open de site, log in, typ één keer de groepscode en tik **Let’s go**.
- Je training uit de Claude-versie meenemen: in de Claude-versie **⚙ → Save backup**, op de
  website **⚙ → Restore**.
- Je maatje: stuur de link en de groepscode. Na het inloggen zien jullie elkaar onder
  **Progress** (Me | naam).
- Op de telefoon: **Deel → Zet op beginscherm** maakt er een app-icoon van.
- Zonder bereik in de sportschool slaat de app op de telefoon op en synchroniseert later.

## Bijwerken

De website wordt gebouwd uit `3-3-30/index.html` (de Claude-versie):

    python3 3-3-30/build_web.py

Iedereen die inlogt en de juiste groepscode typt, kan alle trainingen van de groep zien, en
alleen zijn eigen trainingen wijzigen. Iemand verwijderen kan in Firebase bij
**Firestore → Data → crew**.
