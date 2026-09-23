# Dziennik Pupila PWA 🐾

Kompleksowa, bezpieczna i nowoczesna aplikacja webowa do prowadzenia pamiętnika i monitorowania zdrowia Twoich zwierząt domowych, stworzona w architekturze **PWA (Progressive Web App)** zgodnej z najwyższymi standardami interakcji oraz pełnej ochrony prywatności.

Aplikacja dba o to, by wszystkie dane pozostały na Twoim komputerze lub telefonie — działa całkowicie lokalnie (**Offline-First**) za pośrednictwem bezpiecznej i szybkiej przeglądarkowej bazy danych **IndexedDB**. Żadne notatki, zdjęcia, rysunki ani nagrania mowy **nigdy nie są przesyłane do chmury**.

---

## 🌟 Główne Funkcje i Możliwości

1. **Zarządzanie Wieloma Profilami Zwierząt**
   * Wybór gatunku (Pies, Kot, Gryzoń, Ptak, Jaszczurka, Ryba, Inne).
   * Spersonalizowany avatar/zdjęcie z aparatu, data urodzenia oraz automatyczne obliczanie wieku zwierzaka.

2. **Dziennik z Kategoriami Wpisów**
   * Predefiniowane kategorie: Weterynarz, Jedzenie, Pomiary, Aktywność, Leki/Szczepienia, Inne.
   * Dołączanie zdjęć (z aparatu fotograficznego lub pamięci urządzenia) optymalizowanych w locie na urządzeniu.
   * Interaktywny tryb **Pełnego Ekranu** do wygodnego czytania i przeglądania załączonych mediów.

3. **Odręczny Szkicownik i Adnotacje (Canvas Sketchboard)**
   * Dedykowana plansza do szkicowania za pomocą palca, myszy lub rysika.
   * Narzędzie do oznaczania na schematach anatomicznych, ranach, uzębieniu lub tworzenia szybkich notatek graficznych.

4. **Web Speech API — Dyktowanie Głosowe 🎤**
   * Zaawansowany asystent tekstowy umożliwiający głosowe wprowadzanie treści w języku polskim w locie.
   * Niezastąpione udogodnienie, gdy trzymasz zwierzę obiema rękami na stole zabiegowym lub podczas zabiegów pielęgnacyjnych.
   * Dźwięk przetwarzany jest na bieżąco lokalnie i nie jest nigdzie zapisywany.

5. **Notification API — Powiadomienia Systemowe 🔔**
   * Tworzenie planowanych wydarzeń w „Kalendarzu Zdrowia” (odrobaczenia, szczepionki, wizyty kontrolne, podawanie leków).
   * Generowanie natywnych powiadomień systemowych bezpośrednio na pulpicie komputera lub ekranie smartfona.
   * Dedykowane centrum zarządzania uprawnieniami wraz z funkcją powiadomienia testowego.

6. **Weryfikacja Wag i Trendy Żywieniowe (Auto-Parser & Recharts)**
   * Silnik automatycznie ekstrahuje wartość wagi z treści wpisów w kategorii „Pomiary” (np. *"Dziś waga 6.5kg"*).
   * Generowanie dynamicznego wykresu wagi przy użyciu biblioteki Recharts do śledzenia rozwoju i stanu zdrowia zwierzęcia.

7. **System Kopii Zapasowych i Przenoszenia Danych**
   * Bezpieczny eksport bazy danych IndexedDB do jednego pliku `.json`.
   * Bezstratny import pliku kopii na innych urządzeniach w celu pełnej synchronizacji offline.

---

## 🔒 Uprawnienia Urządzenia i Bezpieczeństwo

Aplikacja przy uruchomieniu lub wywołaniu konkretnych funkcji może poprosić o uprawnienia:
* 📷 **Aparat (Camera):** Robienie zdjęć pupila na żywo, fotografowanie postępów gojenia, karmy, leków, zaleceń lekarskich oraz wyboru awatara.
* 🎙️ **Mikrofon (Microphone):** Dyktowanie mowy na tekst w języku polskim. Mowa jest konwertowana natychmiast, bez rejestracji i bez wysyłania do Internetu.
* 🔔 **Powiadomienia (Notifications):** Lokalne powiadomienia o zaplanowanych lekach i wizytach z terminarza zdrowia.
* 💾 **Pamięć lokalna (IndexedDB / localStorage):** Trwały, szyfrowany profil bazy w przeglądarce bez konieczności rejestracji konta ani logowania.

---

## ⚖️ Licencja i Regulamin Użytkowania

Aplikacja podlega **Wolnej Licencji Użytku Prywatnego (Zastrzeżonej) — WLUP**:

* **Właściciel praw autorskich i twórca:** **mgr Krzysztof Jureczek** (`kjureczek@proton.me`, [github.com/krzjur-oss](https://github.com/krzjur-oss)).
* **Dozwolony użytek (bezpłatny):** Wyłącznie do **użytku prywatnego / osobistego** przez osoby fizyczne do opieki nad własnymi zwierzętami domowymi.
* **Kategoryczne zakazy:** Surowy zakaz jakiejkolwiek odsprzedaży, komercjalizacji, pobierania opłat, kopiowania kodu w celach redystrybucji, tworzenia płatnych pakietów lub oferowania odpłatnych usług na bazie niniejszego oprogramowania bez uprzedniej pisemnej zgody Autora.
* **Pierwsze uruchomienie:** Przy pierwszym otwarciu aplikacji wyświetlane jest okno z dokładnym wyjaśnieniem uprawnień sprzętowych oraz wymogiem akceptacji Regulaminu i Licencji WLUP.

Pełna treść dokumentów prawnych znajduje się w plikach:
* [`LICENSE.md`](./LICENSE.md) / [`LICENSE`](./LICENSE) — Wolna Licencja Użytku Prywatnego (WLUP).
* [`TERMS.md`](./TERMS.md) — Regulamin i Polityka Prywatności.

---

## 🛠️ Stos Technologiczny

* **Framework:** React 18 z Vite (TypeScript)
* **Styling:** Tailwind CSS (nowoczesny motyw *Natural Sand & Sage*)
* **Ikony:** Lucide React
* **Wykresy:** Recharts & D3
* **Przechowywanie danych:** IndexedDB (baza lokalna w przeglądarce)

---

## 🚀 Publikacja w serwisie GitHub Pages

Aplikacja została w pełni skonfigurowana do natychmiastowej publikacji na **GitHub Pages**! Dzięki użyciu względnych ścieżek (`base: './'` w konfiguracji Vite) projekt uruchomi się bezproblemowo pod dowolnym adresem (np. w podkatalogu `https://twój-login.github.io/nazwa-repozytorium/`).

### Szybka metoda automatyczna:

1. Zainicjalizuj repozytorium gita na swoim komputerze i wypchnij kod na GitHub:
   ```bash
   git init
   git add .
   git commit -m "Init Dziennik Pupila - Licencja WLUP"
   git remote add origin https://github.com/TWÓJ-LOGIN/NAZWA-REPOZYTORIUM.git
   git branch -M main
   git push -u origin main
   ```

2. Uruchom dedykowany skrypt służący do automatycznej kompilacji i deploju na gałąź `gh-pages`:
   ```bash
   npm run deploy
   ```

Po kilku minutach Twoja osobista wersja PWA będzie dostępna pod adresem:  
`https://TWÓJ-LOGIN.github.io/NAZWA-REPOZYTORIUM/`

---
*© 2026 mgr Krzysztof Jureczek · Wszelkie prawa zastrzeżone*
