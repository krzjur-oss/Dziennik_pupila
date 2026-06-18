# Dziennik Pupila PWA 🐾

Kompleksowa, bezpieczna i nowoczesna aplikacja webowa do prowadzenia pamiętnika i monitorowania zdrowia Twoich zwierząt domowych, stworzona w technologii **PWA (Progressive Web App)** zgodnej z najwyższymi standardami interakcji oraz prywatności.

Aplikacja dba o to, by wszystkie dane pozostały na Twoim komputerze lub telefonie — działa całkowicie lokalnie (**Offline-First**) za pośrednictwem bezpiecznej i szybkiej przeglądarkowej bazy danych **IndexedDB**.

---

## 🌟 Główne Funkcje i Możliwości

1. **Zarządzanie Wieloma Profilami Zwierząt**
   * Wybór gatunku (Pies, Kot, Gryzoń, Ptak, Jaszczurka, Ryba, Inne).
   * Spersonalizowany avatar, data urodzenia oraz automatyczne obliczanie wieku zwierzaka.

2. **Dziennik z Kategoriami Wpisów**
   * Predefiniowane kategorie: Weterynarz, Jedzenie, Pomiary, Aktywność, Leki/Szczepienia, Inne.
   * Dołączanie zdjęć (z aparatu lub galerii) kompresowanych w locie na urządzeniu.
   * Interaktywny tryb **Pełnego Ekranu** do wygodnego czytania i przeglądania załączonych mediów.

3. **Odręczny Szkicownik i Adnotacje (Canvas Sketchboard)**
   * Dedykowana plansza do szkicowania za pomocą palca, myszy lub rysika.
   * Idealne rozwiązanie do oznaczania na schematach weterynaryjnych lub rysowania szybkich notatek graficznych.

4. **Web Speech API — Dyktowanie Głosowe 🎤**
   * Zaawansowany asystent tekstowy umożliwiający głosowe wprowadzanie treści w języku polskim.
   * Filtrowanie błędów oraz interaktywny interfejs informujący o statusie nasłuchiwania w czasie rzeczywistym.

5. **Notification API — Powiadomienia Systemowe 🔔**
   * Tworzenie planowanych wydarzeń w „Kalendarzu Zdrowia” (odrobaczenia, szczepionki, wizyty kontrolne).
   * Generowanie natywnych powiadomień systemowych bezpośrednio na pulpicie komputera lub ekranie smartfona.
   * Dedykowane centrum zarządzania uprawnieniami wraz z funkcją powiadomienia testowego.

6. **Weryfikacja Wag i Trendy Żywieniowe (Auto-Parser)**
   * Silnik automatycznie ekstrahuje wartość wagi z treści wpisów w kategorii „Pomiary” (np. *"Dziś waga 6.5kg"*).
   * Generowanie dynamicznego wykresu wagi przy użyciu biblioteki Recharts do śledzenia rozwoju i stanu zdrowia zwierzęcia.

7. **System Kopii Zapasowych i Przenoszenia Danych**
   * Eksport bazy danych IndexedDB do jednego pliku `.json`.
   * Bezstratny import pliku kopii na innych urządzeniach w celu pełnej synchronizacji offline.

---

## 🛠️ Stos Technologiczny

* **Framework:** React 18 z Vite (TypeScript)
* **Styling:** Tailwind CSS (nowoczesny motyw *Natural Sand & Sage*)
* **Ikony:** Lucide React
* **Wykresy:** Recharts & D3
* **Przechowywanie danych:** IndexedDB (baza lokalna w przeglądarce)

---

## ⚖️ Warunki Licencyjne & Regulamin

Aplikacja podlega licencji **Wyłącznie do Użytku Osobistego i Niekomercyjnego**. 

*   **Dozwolony użytek:** Wolno instalować i używać aplikację na własnych urządzeniach do zapisywania informacji o własnych zwierzętach.
*   **Kategoryczny zakaz sprzedaży:** Zabrania się kopiowania, modyfikowania w celu dalszej dystrybucji, sprzedaży, licencjonowania oraz czerpania korzyści majątkowych z niniejszej aplikacji bez jednoznacznej pisemnej zgody właściciela praw autorskich pod rygorem odpowiedzialności cywilnej i karnej.
*   **Pierwsze uruchomienie:** Przy pierwszym otwarciu aplikacji wymagana jest jednorazowa akceptacja Regulaminu Korzystania w celu aktywowania dostępu do bazy danych.

Szczegółowe warunki prawne znajdują się w załączonym pliku **`LICENSE`**.

---

## 🚀 Publikacja w serwisie GitHub Pages

Aplikacja została w pełni skonfigurowana do natychmiastowej publikacji na **GitHub Pages**! Dzięki użyciu względnych ścieżek (`base: './'` w konfiguracji Vite) projekt uruchomi się bezproblemowo pod dowolnym adresem (np. w podkatalogu `https://twój-login.github.io/nazwa-repozytorium/`).

### Szybka metoda automatyczna (rekomendowana):

1. Zainicjalizuj repozytorium gita na swoim komputerze i wypchnij kod na GitHub:
   ```bash
   git init
   git add .
   git commit -m "Init Dziennik Pupila"
   git remote add origin https://github.com/TWÓJ-LOGIN/NAZWA-REPOZYTORIUM.git
   git branch -M main
   git push -u origin main
   ```

2. Uruchom dedykowany skrypt służący do automatycznej kompilacji i deploju na gałąź `gh-pages`:
   ```bash
   npm run deploy
   ```

To wszystko! Po kilku minutach Twoja osobista wersja PWA będzie dostępna pod adresem:  
`https://TWÓJ-LOGIN.github.io/NAZWA-REPOZYTORIUM/`

