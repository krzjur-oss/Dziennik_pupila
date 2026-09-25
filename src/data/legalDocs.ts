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
  version: '1.2.0',
  effectiveDate: 'wrzesień 2026 r.',
  year: '2026',
  author: 'mgr Krzysztof Jureczek',
  email: 'kjureczek@proton.me',
  github: 'github.com/krzjur-oss',
  licenseName: 'Wolna Licencja Użytku Prywatnego (Zastrzeżona) — WLUP',
  appUrl: typeof window !== 'undefined' ? window.location.origin : ''
};

export const PERMISSIONS_EXPLANATION = {
  title: 'Dlaczego program prosi o dostęp do Aparatu i Mikrofonu?',
  subtitle: 'Wyjaśnienie celów uprawnień przy pierwszym uruchomieniu aplikacji',
  badge: '100% Prywatności i Offline-First',
  intro: 'Przy uruchomieniu przeglądarka wyświetla zapytanie o dostęp do aparatu (camera) oraz mikrofonu (microphone). Aplikacja została stworzona zgodnie z filozofią Offline-First i wykorzystuje te moduły wyłącznie lokalnie na Twoim urządzeniu w celach prywatnych:',
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
      badge: 'Lokalne',
      purpose: 'Wygodne dyktowanie głosowe wpisów pamiętnika w języku polskim bez dotykania klawiatury.',
      details: 'Niezwykle przydatne, gdy trzymasz zwierzę obiema rękami na stole zabiegowym lub podczas pielęgnacji. Mowa jest konwertowana na tekst w locie – dźwięk NIE jest nagrywany, zapisywany ani wysyłany na żadne serwery zewnętrzne.'
    },
    {
      id: 'notifications',
      name: 'Powiadomienia Push (Notification API)',
      icon: '🔔',
      badge: 'Opcjonalne',
      purpose: 'Przypomnienia o lekach, szczepieniach, odrobaczaniu, ważeniu i obowiązkach z terminarza.',
      details: 'Działa lokalnie w przeglądarce. Prośba o zgodę pojawia się dopiero po świadomym kliknięciu przycisku włączenia powiadomień w module terminarza.'
    },
    {
      id: 'storage',
      name: 'Pamięć lokalna urządzenia (IndexedDB & localStorage)',
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

**Wersja 1.2.0 · obowiązuje od września 2026 r.**

---

## § 1. Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji **„Dziennik Pupila”** (dalej: „Aplikacja”), dostępnej pod adresem internetowym wdrożenia oraz jako instalowana aplikacja PWA w pamięci urządzenia.
2. Właścicielem, twórcą i jedynym autorem Aplikacji jest **mgr Krzysztof Jureczek** (dalej: „Autor”).
3. Aplikacja dystrybuowana jest na warunkach **Wolnej Licencji Użytku Prywatnego (Zastrzeżonej) — WLUP**. Regulamin i Licencja stanowią całość i obowiązują łącznie.
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

---

## § 5. Dane i prywatność (RODO/GDPR)

1. Aplikacja **nie wymaga rejestracji, zakładania konta ani logowania** i nie zbiera żadnych danych osobowych na zewnętrznych serwerach.
2. Dane wprowadzane do Aplikacji (profile pupili, imiona, historia wpisów pamiętnika, pomiary wagi, odręczne szkice i rysunki medyczne, zdjęcia oraz zaplanowane zadania zdrowotne i terminarz) przechowywane są **wyłącznie lokalnie w pamięci urządzenia użytkownika** (\`IndexedDB\` oraz \`localStorage\`) i nigdy nie opuszczają jego urządzenia.
3. Administratorem danych wprowadzanych do programu jest wyłącznie Użytkownik końcowy (opiekun zwierzęcia) — Autor nie ma jakiegokolwiek dostępu do tych danych.
4. Aplikacja nie używa profilujących plików cookie, narzędzi śledzących telemetrycznych ani komercyjnych sieci analitycznych.
5. Użytkownik może w każdej chwili usunąć swoje dane, czyszcząc pamięć podręczną przeglądarki lub korzystając z funkcji eksportu kopii zapasowej w formacie JSON.

---

## § 6. Wyjaśnienie uprawnień sprzętowych (Aparat, Mikrofon, Powiadomienia)

1. **Aparat fotograficzny:** Służy wyłącznie do bezpośredniego uwieczniania zdjęć pupila, karmy, postępów leczenia oraz wyboru awatara.
2. **Mikrofon:** Używany jest opcjonalnie do zamiany mowy na tekst (dyktowanie głosowe w języku polskim) w celu ułatwienia sporządzania prywatnych notatek w trakcie opieki. Aplikacja nie nagrywa głosu w tle i nie wysyła nagrań na serwery.
3. **Powiadomienia:** Służą do wyświetlania lokalnych alertów o zaplanowanych lekach, badaniach i obowiązkach pielęgnacyjnych.

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

### Projekt: Dziennik Pupila (wersja 1.2.0 i wyższe)

**Właściciel praw autorskich i twórca:**
**mgr Krzysztof Jureczek**
*Copyright © 2026 Krzysztof Jureczek. Wszelkie prawa zastrzeżone.*

Kontakt: kjureczek@proton.me · GitHub: github.com/krzjur-oss

---

### PREAMBUŁA

Niniejsza licencja ma na celu zabezpieczenie niekomercyjnego charakteru projektu **„Dziennik Pupila”**. Intencją Autora jest bezpłatne udostępnienie aplikacji do wyłącznego użytku prywatnego (osobistego i rodzinnego), przy jednoczesnym pełnym zachowaniu praw autorskich, integralności kodu źródłowego oraz kategorycznym zakazie jakiejkolwiek komercjalizacji, odsprzedaży, kopiowania, modyfikacji w celach dystrybucyjnych i wykorzystania komercyjnego bez pisemnej zgody Autora.

---

### § 1. DEFINICJE

1. **Oprogramowanie** – aplikacja „Dziennik Pupila” wraz z całym kodem źródłowym, plikami wykonywalnymi, interfejsem graficznym, szablonami opieki, zasobami multimedialnymi oraz dokumentacją.
2. **Autor / Licencjodawca** – mgr Krzysztof Jureczek, jedyny twórca i wyłączny dysponent autorskich praw majątkowych i osobistych do Oprogramowania.
3. **Użytkownik / Licencjobiorca** – każda osoba fizyczna korzystająca z Oprogramowania wyłącznie w celach prywatnych, osobistych lub rodzinnych.

---

### § 2. DOZWOLONY UŻYTEK (BEZPŁATNY)

Autor udziela Użytkownikowi bezpłatnej, niewyłącznej, nieprzenoszalnej i ściśle ograniczonej licencji na korzystanie z Oprogramowania wyłącznie w następującym celu:

1. **Użytek prywatny / osobisty** – instalowanie i uruchamianie Oprogramowania przez osoby fizyczne na własny, prywatny, niekomercyjny użytek do prowadzenia pamiętnika, monitorowania zdrowia, pielęgnacji i wagi własnych zwierząt domowych.
2. **Instalacja lokalna** – uruchamianie i przechowywanie Oprogramowania w trybie offline/PWA na urządzeniach własnych Użytkownika.

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
