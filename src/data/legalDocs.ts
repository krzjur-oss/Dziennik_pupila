export interface LegalDocumentConfig {
  appName: string;
  version: string;
  effectiveDate: string;
  year: string;
  author: string;
  email: string;
  github: string;
  licenseName: string;
  appUrl: string;
}

export const APP_LEGAL: LegalDocumentConfig = {
  appName: 'Dziennik Pupila',
  version: '1.2.1',
  effectiveDate: 'wrzesień 2026 r.',
  year: '2026',
  author: 'mgr Krzysztof Jureczek',
  email: 'kjureczek@proton.me',
  github: 'github.com/krzjur-oss',
  licenseName: 'Wolna Licencja Użytku Prywatnego (Zastrzeżona) — WLUP',
  appUrl: typeof window !== 'undefined' ? window.location.origin : ''
};

export const PERMISSIONS_EXPLANATION = {
  title: 'Dlaczego program korzysta z modułów Aparatu i Mikrofonu?',
  subtitle: 'Wyjaśnienie celów działania modułów przy korzystaniu z aplikacji',
  badge: '100% Prywatności i Offline-First',
  intro: 'Aplikacja została zaprojektowana w architekturze Offline-First. Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW. Moduły sprzętowe są wykorzystywane wyłącznie na Twoje wyraźne żądanie w celach prywatnej opieki nad pupilem:',
  items: [
    {
      id: 'camera',
      name: 'Aparat fotograficzny (Camera)',
      icon: '📷',
      badge: 'Lokalne',
      purpose: 'Robienie zdjęć pupila na żywo, fotografowanie karmy, leków, etykiet, postępów gojenia ran, zaleceń weterynarza oraz ustawianie zdjęcia profilowego.',
      details: 'Aparat uruchamia się wyłącznie po bezpośrednim kliknięciu ikony aparatu przez użytkownika. Zdjęcia są optymalizowane i zapisywane wyłącznie w pamięci Twojego urządzenia.'
    },
    {
      id: 'microphone',
      name: 'Mikrofon (Web Speech API)',
      icon: '🎙️',
      badge: 'Opcjonalne',
      purpose: 'Wygodne dyktowanie głosowe wpisów pamiętnika w języku polskim bez dotykania klawiatury.',
      details: 'Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.'
    },
    {
      id: 'notifications',
      name: 'Przypomnienia lokalne (Notification API)',
      icon: '🔔',
      badge: 'Opcjonalne',
      purpose: 'Przypomnienia o lekach, szczepieniach, odrobaczaniu, ważeniu i obowiązkach z terminarza.',
      details: 'Aplikacja pokaże przypomnienie po jej otwarciu lub powrocie do niej — działa tylko wtedy, gdy przeglądarka jest uruchomiona. Prośba o zgodę pojawia się dopiero po włączeniu przypomnień w terminarzu.'
    },
    {
      id: 'storage',
      name: 'Pamięć lokalna urządzenia (IndexedDB Storage)',
      icon: '💾',
      badge: 'Baza danych',
      purpose: 'Trwałe i bezpieczne przechowywanie profili pupili, notatek, zdjęć, szkiców i historii wagi.',
      details: 'Program nie posiada centralnego serwera zbierającego dane. Ty jesteś jedynym właścicielem i administratorem wprowadzonych informacji.'
    }
  ],
  footer: '💡 Uprawnieniami możesz w dowolnym momencie zarządzać w ustawieniach przeglądarki (klikając ikonę kłódki 🔒 lub suwaków obok paska adresu).'
};

export const TERMS_AND_CONDITIONS = `
# Regulamin i Polityka Prywatności aplikacji „Dziennik Pupila”

**Wersja 1.2.1 · obowiązuje od września 2026 r.**

---

## § 1. Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji **„Dziennik Pupila”** (dalej: „Aplikacja”), dostępnej pod adresem internetowym wdrożenia oraz jako instalowana aplikacja PWA w pamięci urządzenia.
2. Właścicielem, twórcą i jedynym autorem Aplikacji jest **mgr Krzysztof Jureczek** (dalej: „Autor”).
3. Aplikacja dystrybuowana jest na warunkach **Wolnej Licencji Użytku Prywatnego (Zastrzeżonej) — WLUP** (pełna treść w pliku LICENSE). Regulamin i Licencja stanowią całość i obowiązują łącznie.
4. Korzystanie z Aplikacji oznacza pełną akceptację niniejszego Regulaminu oraz Licencji.

---

## § 2. Przeznaczenie Aplikacji

Aplikacja przeznaczona jest **wyłącznie do Użytku prywatnego / osobistego**:
1. Korzystanie przez osoby fizyczne w celach ściśle własnych i rodzinnych, w tym do prowadzenia osobistego dziennika zdrowia, pomiarów wagi, pielęgnacji, terminarza szczepień i leków oraz opieki nad własnymi zwierzętami domowymi.
2. Wszelkie inne zastosowania — w tym komercyjne, gospodarcze, zarobkowe, instytucjonalne lub publiczne — są zabronione i wymagają uprzedniej, odrębnej pisemnej zgody Autora.

---

## § 3. Zasady korzystania

1. Aplikacja jest całkowicie bezpłatna dla zakresu prywatnego wskazanego w § 2.
2. Aplikacja nie zawiera reklam, ukrytych opłat, mikropłatności ani płatnych subskrypcji.
3. Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem oraz obowiązującym prawem.
4. Zabronione jest podejmowanie działań mogących zakłócić działanie Aplikacji lub narazić innych użytkowników na szkodę.

---

## § 4. Prawa autorskie i licencja

Wszelkie prawa do Aplikacji — kod źródłowy, interfejs graficzny, projekt wizualny, moduły interaktywne, szablony opieki, treści i dokumentacja — należą wyłącznie do Autora i są chronione prawem autorskim.

* ❌ **Zabronione:** Kopiowanie, modyfikowanie, dekompilowanie, rozpowszechnianie, sprzedaż lub komercjalizacja Aplikacji bądź jej części bez pisemnej zgody Autora.
* ✅ **Dozwolone:** Korzystanie z Aplikacji zgodnie z jej przeznaczeniem wyłącznie prywatnym (§ 2), instalowanie na urządzeniach własnych oraz udostępnianie linku do Aplikacji innym osobom fizycznym do ich użytku prywatnego.

Szczegółowe warunki licencyjne określa plik LICENSE.

---

## § 5. Dane i prywatność (RODO/GDPR)

1. Aplikacja **nie wymaga rejestracji, zakładania konta ani logowania** i nie zbiera żadnych danych osobowych na zewnętrznych serwerach.
2. Dane wprowadzane do Aplikacji (profile pupili, imiona, historia wpisów pamiętnika, pomiary wagi, odręczne szkice i rysunki medyczne, zdjęcia oraz zaplanowane zadania zdrowotne i terminarz) przechowywane są **wyłącznie lokalnie w pamięci urządzenia użytkownika** (\`IndexedDB\` oraz \`localStorage\`) i nigdy nie opuszczają jego urządzenia. Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW.
3. Administratorem danych wprowadzanych do programu jest wyłącznie Użytkownik końcowy (opiekun zwierzęcia) — Autor nie ma jakiegokolwiek dostępu do tych danych.
4. Aplikacja nie używa profilujących plików cookie, narzędzi śledzących telemetrycznych ani komercyjnych sieci analitycznych.
5. Użytkownik może w każdej chwili usunąć swoje dane, czyszcząc pamięć podręczną przeglądarki lub korzystając z funkcji eksportu kopii zapasowej w formacie JSON.

---

## § 6. Wyjaśnienie modułów sprzętowych (Aparat, Mikrofon, Przypomnienia)

1. **Aparat fotograficzny:** Służy wyłącznie do bezpośredniego uwieczniania zdjęć pupila, karmy, postępów leczenia oraz wyboru awatara na wyraźne żądanie użytkownika.
2. **Mikrofon:** Używany jest opcjonalnie do zamiany mowy na tekst (dyktowanie głosowe w języku polskim) w celu ułatwienia sporządzania prywatnych notatek w trakcie opieki. Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.
3. **Powiadomienia i przypomnienia:** Służą do wyświetlania lokalnych alertów o zaplanowanych lekach, badaniach i obowiązkach pielęgnacyjnych po otwarciu lub powrocie do aplikacji.

---

## § 7. Odpowiedzialność i charakter pomocniczy

1. Aplikacja udostępniana jest w stanie „takim, jakim jest” (*as is*), bez jakichkolwiek gwarancji.
2. Funkcje terminarza, checklisty pielęgnacyjnej oraz wykresów wagi mają charakter wyłącznie informacyjny i pomocniczy. **Nie stanowią one porady medyczno-weterynaryjnej i nie zastępują badania ani diagnozy wykwalifikowanego lekarza weterynarii.**
3. Autor nie ponosi odpowiedzialności za utratę danych, błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności korzystania z Aplikacji. Zaleca się regularne tworzenie kopii zapasowych (plik .json z menu ustawień).

---

## § 8. Zmiany Regulaminu i postanowienia końcowe

1. Autor zastrzega sobie prawo do aktualizacji Aplikacji oraz Regulaminu. Dalsze korzystanie z Aplikacji po opublikowaniu zmian oznacza ich akceptację.
2. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawie autorskim i prawach pokrewnych.

**Kontakt z Autorem:**
mgr Krzysztof Jureczek · E-mail: kjureczek@proton.me · GitHub: github.com/krzjur-oss
`;

export const SOFTWARE_LICENSE = `
# LICENCJA UŻYTKOWANIA OPROGRAMOWANIA
## Wolna Licencja Użytku Prywatnego (Zastrzeżona) — WLUP

### Projekt: Dziennik Pupila (wersja 1.2.1 i wyższe)

**Właściciel praw autorskich i twórca:**
mgr Krzysztof Jureczek (kontakt: kjureczek@proton.me, GitHub: github.com/krzjur-oss)

---

### § 1. CHARAKTER I CEL LICENCJI

Niniejsza Wolna Licencja Użytku Prywatnego (Zastrzeżona) („WLUP”) reguluje zasady nieodpłatnego korzystania z oprogramowania **Dziennik Pupila** („Oprogramowanie”). 
Celem licencji jest udostępnienie osobom fizycznym bezpiecznego, pozbawionego reklam i trackerów narzędzia do opieki nad własnymi zwierzętami domowymi, przy jednoczesnym **bezwzględnym zastrzeżeniu zakazu jakiejkolwiek komercjalizacji, redystrybucji oraz czerpania korzyści majątkowych przez podmioty trzecie**.

---

### § 2. DOZWOLONY UŻYTEK (BEZPŁATNY)

Licencjodawca udziela Użytkownikowi niewyłącznej, nieprzenoszalnej, nieodpłatnej licencji na korzystanie z Oprogramowania z zastrzeżeniem następujących warunków:

1. **Wyłącznie użytek prywatny / osobisty** – Oprogramowanie może być używane wyłącznie przez osoby fizyczne do celów prywatnych, osobistych lub w kręgu domowym (np. monitorowanie wagi psa, terminy szczepień kota, pielęgnacja gryzonia).
2. **Brak ograniczeń czasowych w użyciu prywatnym** – Użytkownik prywatny może korzystać z zainstalowanej wersji bez ograniczeń czasowych.
3. **Instalacja lokalna** – Dozwolone jest instalowanie Oprogramowania jako Progressive Web App (PWA) na własnych urządzeniach osobistych (smartfon, tablet, komputer).

---

### § 3. ZAKAZY I OGRANICZENIA

Wszelkie działania wykraczające poza użytek prywatny określony w § 2 wymagają uprzedniej, pisemnej zgody Autora. W szczególności **surowo zabrania się**:

1. **Kopiowania kodu** – kopiowania, powielania, pobierania w celu redystrybucji, dekompilacji lub inżynierii wstecznej kodu źródłowego lub skompilowanych plików Oprogramowania.
2. **Modyfikacji** – wprowadzania zmian w kodzie źródłowym, interfejsie, grafice, logotypach, treściach lub innych zasobach Oprogramowania z zamiarem ich dalszej redystrybucji.
3. **Rozpowszechniania** – dystrybuowania, udostępniania, sublicencjonowania, wynajmu, publikowania kopii lub „forków” Oprogramowania osobom trzecim, w tym poprzez repozytoria, sklepy z aplikacjami lub serwery pobierania.
4. **Sprzedaży i komercjalizacji** – sprzedaży, pobierania jakichkolwiek opłat (bezpośrednich lub pośrednich) za dostęp, instalację lub użytkowanie Oprogramowania, umieszczania go w płatnych pakietach, za bramkami płatniczymi, w serwisach z reklamami czerpiącymi zysk z ruchu użytkowników, ani wykorzystywania go do świadczenia odpłatnych usług komercyjnych.
5. **Usuwania oznaczeń autorskich** – usuwania, ukrywania lub modyfikowania informacji o Autorze, prawach autorskich, logotypach oraz odnośników do niniejszej licencji.

---

### § 4. WŁASNOŚĆ INTELEKTUALNA I INTEGRALNOŚĆ

1. Oprogramowanie oraz wszelkie związane z nim prawa autorskie i prawa własności intelektualnej stanowią wyłączną własność Autora (mgr Krzysztof Jureczek).
2. Niniejsza licencja nie przenosi na Użytkownika żadnych praw własności do Oprogramowania — udziela wyłącznie prawa do bezpłatnego korzystania zgodnie z § 2.
3. Użytkownik zobowiązuje się zachować w niezmienionym stanie wszystkie oznaczenia praw autorskich i informacje o Autorze zawarte w Oprogramowaniu.

---

### § 5. WYŁĄCZENIE ODPOWIEDZIALNOŚCI (AS IS)

1. Oprogramowanie dostarczane jest w stanie, w jakim się znajduje („AS IS”), bez jakichkolwiek gwarancji, wyraźnych lub dorozumianych, w tym gwarancji przydatności do określonego celu czy nieprzerwanego, bezbłędnego działania.
2. Autor nie ponosi odpowiedzialności za jakiekolwiek szkody bezpośrednie, pośrednie lub następcze wynikłe z użytkowania lub niemożności użytkowania Oprogramowania, w tym za utratę danych.

---

### § 6. ROZWIĄZANIE LICENCJI

Naruszenie któregokolwiek z warunków niniejszej licencji skutkuje jej natychmiastowym i automatycznym wygaśnięciem. Użytkownik zobowiązany jest wówczas do trwałego usunięcia wszystkich kopii Oprogramowania ze swoich nośników i systemów.

---

### § 7. POSTANOWIENIA KOŃCOWE

W sprawach nieuregulowanych niniejszą licencją zastosowanie mają przepisy ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz Kodeksu cywilnego RP. Wszelkie spory rozstrzyga sąd właściwy dla miejsca zamieszkania Licencjodawcy.

---
*Miejscowość i data sporządzenia: Polska, wrzesień 2026 r.*
`;
