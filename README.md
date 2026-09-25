# Dziennik Pupila PWA 🐾

Kompleksowa, bezpieczna i nowoczesna aplikacja webowa do prowadzenia pamiętnika i monitorowania zdrowia Twoich zwierząt domowych, stworzona w architekturze **PWA (Progressive Web App)** zgodnej z najwyższymi standardami interakcji oraz pełnej ochrony prywatności.

Aplikacja dba o to, by wszystkie dane pozostały na Twoim komputerze lub telefonie — działa całkowicie lokalnie (**Offline-First**) za pośrednictwem szybkiej przeglądarkowej bazy danych **IndexedDB**. Żadne notatki, zdjęcia ani rysunki **nigdy nie są przesyłane do chmury**.

---

## 🌟 Główne Funkcje i Możliwości

1. **Zarządzanie Wieloma Profilami Zwierząt**
   * Wybór gatunku (Pies, Kot, Świnka morska, Królik, Chomik, Papuga, Jaszczurka, Rybki, Inne).
   * Spersonalizowany avatar/zdjęcie z aparatu, data urodzenia oraz automatyczne obliczanie wieku zwierzaka.

2. **Dziennik z Kategoriami Wpisów**
   * Predefiniowane kategorie: Weterynarz, Jedzenie, Pomiary, Aktywność, Pielęgnacja, Zdrowie, Notatka.
   * Dołączanie zdjęć (z aparatu fotograficznego lub pamięci urządzenia) optymalizowanych w locie na urządzeniu.
   * Interaktywny tryb **Pełnego Ekranu** do wygodnego czytania i przeglądania załączonych mediów.

3. **Odręczny Szkicownik i Adnotacje (Canvas Sketchboard)**
   * Dedykowana plansza do szkicowania za pomocą palca, myszy lub rysika.
   * Narzędzie do oznaczania na schematach anatomicznych, ranach, uzębieniu lub tworzenia szybkich notatek graficznych.

4. **Web Speech API — Dyktowanie Głosowe 🎤**
   * Asystent tekstowy umożliwiający głosowe wprowadzanie treści w języku polskim w locie.
   * Pomocne, gdy trzymasz zwierzę obiema rękami na stole zabiegowym lub podczas zabiegów pielęgnacyjnych.

5. **Przypomnienia Lokalne i Kalendarz Zdrowia 🔔**
   * Tworzenie planowanych wydarzeń w „Kalendarzu Zdrowia” (odrobaczenia, szczepionki, wizyty kontrolne, podawanie leków).
   * Lokalne przypomnienia po otwarciu aplikacji oraz powiadomienia przeglądarkowe.

6. **Weryfikacja Wag i Trendy (Recharts)**
   * Dedykowane pole wagi we wpisach w kategorii „Pomiary” i „Weterynarz”.
   * Generowanie dynamicznego wykresu wagi przy użyciu biblioteki Recharts do śledzenia rozwoju i stanu zdrowia zwierzęcia.

7. **System Kopii Zapasowych i Przenoszenia Danych**
   * Bezpieczny eksport bazy danych IndexedDB do jednego pliku `.json`.
   * Import pliku kopii w trybie scalania (merge) lub zastąpienia (replace) z automatyczną kopią ratunkową.

---

## ⚖️ Licencja i Regulamin Użytkowania

Aplikacja podlega **Wolnej Licencji Użytku Prywatnego (Zastrzeżonej) — WLUP**:

* **Właściciel praw autorskich i twórca:** **mgr Krzysztof Jureczek** (`kjureczek@proton.me`, [github.com/krzjur-oss](https://github.com/krzjur-oss)).
* **Dozwolony użytek (bezpłatny):** Wyłącznie do **użytku prywatnego / osobistego** przez osoby fizyczne do opieki nad własnymi zwierzętami domowymi.
* **Kategoryczne zakazy:** Surowy zakaz jakiejkolwiek odsprzedaży, komercjalizacji, pobierania opłat, kopiowania kodu w celach redystrybucji, tworzenia płatnych pakietów lub oferowania odpłatnych usług na bazie niniejszego oprogramowania bez uprzedniej pisemnej zgody Autora.
* **Pierwsze uruchomienie:** Przy pierwszym otwarciu aplikacji wyświetlane jest okno z dokładnym wyjaśnieniem uprawnień sprzętowych oraz wymogiem akceptacji Regulaminu i Licencji WLUP.

Pełna treść dokumentów prawnych znajduje się w plikach:
* [`LICENSE`](./LICENSE) — Wolna Licencja Użytku Prywatnego (WLUP).
* [`TERMS.md`](./TERMS.md) — Regulamin i Polityka Prywatności.

---

## 🛠️ Stos Technologiczny

* **Framework:** React 19 z Vite 6 (TypeScript)
* **Styling:** Tailwind CSS 4 (nowoczesny motyw *Natural Sand & Sage*)
* **Ikony:** Lucide React
* **Wykresy:** Recharts
* **Przechowywanie danych:** IndexedDB (baza lokalna w przeglądarce)

---
*© 2026 mgr Krzysztof Jureczek · Wszelkie prawa zastrzeżone*
