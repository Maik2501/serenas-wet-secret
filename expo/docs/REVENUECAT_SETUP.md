# RevenueCat Setup Guide für Tear Track Journal

Eine Schritt-für-Schritt Anleitung um In-App Käufe (Donations) in deiner App zu aktivieren.

---

## 📋 Voraussetzungen

Bevor du beginnst, brauchst du:
- [ ] Einen **Apple Developer Account** ($99/Jahr) für iOS
- [ ] Einen **Google Play Developer Account** ($25 einmalig) für Android
- [ ] Die App muss mindestens einmal gebaut werden (EAS Build)

---

## 🚀 Schritt 1: RevenueCat Account erstellen

1. Gehe zu [revenuecat.com](https://www.revenuecat.com/)
2. Klicke auf **"Start for Free"**
3. Erstelle einen Account (Email oder GitHub)
4. Nach dem Login landest du im Dashboard

---

## 📱 Schritt 2: Projekt in RevenueCat erstellen

1. Klicke auf **"+ New Project"**
2. Gib deinem Projekt einen Namen: `Tear Track Journal`
3. Klicke auf **"Create Project"**

---

## 🍎 Schritt 3: iOS App hinzufügen

### 3.1 In App Store Connect vorbereiten

1. Logge dich bei [appstoreconnect.apple.com](https://appstoreconnect.apple.com) ein
2. Gehe zu **"Apps"** → **"+"** → **"New App"**
3. Fülle die Grunddaten aus:
   - **Name:** Tear Track Journal
   - **Bundle ID:** com.serena.teartrackjournal
   - **Primary Language:** English (US)
4. Speichern

### 3.2 In-App Purchase erstellen

1. In deiner App → **"Monetization"** → **"In-App Purchases"**
2. Klicke auf **"+"** → **"Consumable"** (für einmalige Spende)
3. Fülle aus:
   - **Reference Name:** Tip 199
   - **Product ID:** `tip_199`
   - **Price:** $1.99 (Tier 2)
   - **Display Name:** Buy me a coffee ☕
   - **Description:** Support the developer with a small tip
4. Speichern

### 3.3 Shared Secret generieren

1. In App Store Connect → **"Users and Access"** → **"Integrations"**
2. Klicke auf **"App-Specific Shared Secrets"** → **"Generate"**
3. **Kopiere den Schlüssel** (brauchst du für RevenueCat)

### 3.4 In RevenueCat verbinden

1. Zurück zu RevenueCat Dashboard
2. Klicke auf **"+ App"** in deinem Projekt
3. Wähle **"Apple App Store"**
4. Fülle aus:
   - **App Name:** Tear Track Journal iOS
   - **Bundle ID:** com.serena.teartrackjournal
   - **App Store Shared Secret:** [der kopierte Schlüssel]
5. Speichern

---

## 🤖 Schritt 4: Android App hinzufügen (optional)

### 4.1 In Google Play Console vorbereiten

1. Gehe zu [play.google.com/console](https://play.google.com/console)
2. **"Create app"** → Fülle Grunddaten aus
3. Gehe zu **"Monetization"** → **"Products"** → **"In-app products"**
4. Erstelle ein neues Produkt:
   - **Product ID:** `tip_199`
   - **Name:** Buy me a coffee
   - **Price:** $1.99

### 4.2 Service Account erstellen

1. Google Cloud Console → [console.cloud.google.com](https://console.cloud.google.com)
2. **"IAM & Admin"** → **"Service Accounts"**
3. **"Create Service Account"**
4. Erstelle JSON Key und lade herunter

### 4.3 In RevenueCat verbinden

1. RevenueCat → **"+ App"** → **"Google Play Store"**
2. Lade Service Account JSON hoch
3. Speichern

---

## 📦 Schritt 5: Offering erstellen

1. In RevenueCat → **"Products"** → **"Entitlements"**
2. Klicke **"+ New"**:
   - **Identifier:** `premium` oder `tip`
   - Füge das Produkt `tip_199` hinzu
3. Gehe zu **"Offerings"** → **"+ New"**
4. Erstelle ein Offering:
   - **Identifier:** `default`
   - Füge das Entitlement hinzu
5. Markiere als **"Current Offering"**

---

## 🔑 Schritt 6: API Keys holen

1. In RevenueCat → **"API Keys"** (linke Sidebar)
2. Du siehst:
   - **iOS Public API Key:** `appl_xxxxxxxxxxxx`
   - **Android Public API Key:** `goog_xxxxxxxxxxxx`
3. **Kopiere beide Keys**

---

## 💻 Schritt 7: In der App eintragen

Öffne `components/DonationCard.tsx` und ersetze die Platzhalter:

```typescript
// Zeile 15-17
const REVENUECAT_API_KEY_IOS = 'appl_dein_echter_key_hier';
const REVENUECAT_API_KEY_ANDROID = 'goog_dein_echter_key_hier';
const PRODUCT_ID = 'tip_199';
```

---

## ✅ Schritt 8: Testen

### Sandbox Testing (iOS)

1. In App Store Connect → **"Users and Access"** → **"Sandbox"**
2. Erstelle einen Sandbox Tester Account
3. Auf deinem iPhone: Einstellungen → App Store → Sandbox Account
4. Teste den Kauf in der App

### Testing (Android)

1. In Google Play Console → **"Setup"** → **"License testers"**
2. Füge deine Email hinzu
3. Teste auf einem Android Gerät

---

## 📊 Zusätzliche Features

### Dashboard nutzen

- Sieh alle Käufe in Echtzeit
- Analysiere Revenue
- Verwalte Entitlements

### Webhooks (optional)

Du kannst Webhooks einrichten um bei Käufen benachrichtigt zu werden.

---

## ❓ Häufige Fragen

### Muss ich sofort bezahlen?
Nein! RevenueCat ist **kostenlos** bis $2,500 monatlichem Umsatz (MTR). Perfekt für den Start.

### Kann ich ohne Apple Developer Account testen?
Nur im Web-Modus. Für echtes iOS Testing brauchst du den Account.

### Was passiert wenn noch keine Keys eingetragen sind?
Die App zeigt "Coming Soon" - so wie jetzt konfiguriert. Nutzer können trotzdem die App verwenden.

---

## 🔗 Nützliche Links

- [RevenueCat Docs](https://www.revenuecat.com/docs)
- [RevenueCat + Expo Guide](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
