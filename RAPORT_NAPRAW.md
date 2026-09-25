# Raport z wykonania promptu naprawczego (Audyt nr 2) — Dziennik Pupila PWA

Data wykonania: 25.09.2026 r.  
Wersja aplikacji: `1.2.1`  
Autor projektu: mgr Krzysztof Jureczek

---

## 1. Tabela realizacji ustaleń z audytu

| Identyfikator / Ustalenie | Zakres | Status | Opis wdrożonego rozwiązania |
|---|---|---|---|
| **W2 (Recurrence "forever")** | `lib/recurrence.ts`, `HealthCalendar.tsx`, `App.tsx` | ✅ Wykonano | Zastąpiono jednorazowy sztywny limit modelem reguły serii + okno przesuwne (≥90 dni w przód). Dodano funkcję `extendForeverSeries()`. Walidacja `endCount > 366` z polskim komunikatem błędu. Odświeżanie przy starcie i na `document.visibilitychange`. Zmiana etykiety UI na „Bezterminowo (kalendarz uzupełnia się automatycznie)”. |
| **B.1 (Ikony PWA)** | `public/`, `manifest.json`, `index.html` | ✅ Wykonano | Poprawiono maskowanie i formaty: wygenerowano rzeczywiste pliki PNG: `pwa-192.png` (192×192), `pwa-512.png` (512×512), `pwa-maskable-512.png` (512×512 z marginesem bezpieczeństwa 80%), `apple-touch-icon.png` (180×180), `favicon.ico`, `favicon.svg`. Usunięto JPEG udający PNG `public/app_icon.png`. Zaktualizowano `manifest.json`. |
| **B.2 (Service Worker & PWA)** | `vite.config.ts`, `main.tsx` | ✅ Wykonano | Usunięto ręczny `public/sw.js`. Wdrożono `vite-plugin-pwa` z konfiguracją `registerType: 'prompt'`, `navigateFallback: 'index.html'`, precache wszystkich zasobów (`.js, .css, .html, .png, .svg, .woff2, .ico`). Dodano w UI powiadomienie z przyciskiem „Odśwież” przy nowej wersji. |
| **B.3 (Lokalne fonty)** | `src/index.css`, `main.tsx`, `package.json` | ✅ Wykonano | Usunięto `@import url(https://fonts.googleapis.com...)` z `src/index.css`. Zainstalowano i zaimportowano pakiety `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/lora`, `@fontsource-variable/jetbrains-mono`. `dist/` zawiera 0 odwołań do Google APIs/Gstatic. |
| **B.4 (Uprawnienia)** | `permissionUtils.ts`, `LegalModal.tsx`, `App.tsx` | ✅ Wykonano | Usunięto funkcję `requestAllPermissions` oraz agresywny przycisk „Nadaj uprawnienia (Aparat, Mikrofon, Alert)” z okna pierwszego uruchomienia i ustawień. Pozostawiono pasywny odczyt `checkPermissionsStatus()` bez wymuszania zapytań. |
| **B.5 (Dyktowanie mowy)** | `NoteEditor.tsx`, `legalDocs.ts`, `App.tsx` | ✅ Wykonano | Dodano flagę `processLocally: true` (jeśli wspierana). Poprawiono opisy prawne i w pomocy wyjaśniające, że w przeglądarkach takich jak Chrome przetwarzanie audio może zachodzić w chmurze dostawcy przeglądarki. |
| **B.6 (Przypomnienia lokalne)** | `App.tsx`, `HealthCalendar.tsx` | ✅ Wykonano | Zastąpiono `new Notification` wywołaniem `navigator.serviceWorker.ready.then(reg => reg.showNotification(...))`. Wyzwalanie przy starcie i powrocie do aplikacji (`visibilitychange`) dla zadań dzisiejszych/zaległych z deduplikacją (jedno powiadomienie na zdarzenie na dzień). |
| **C (Teksty prawne i spójność)** | `App.tsx`, `legalDocs.ts`, `TERMS.md` | ✅ Wykonano | Zastąpiono 1:1 wszystkie zakwestionowane teksty (szczegóły w sekcji 4 poniżej). Podbito wersję do `1.2.1`. Uregulowano wersjonowanie zgody użytkownika w `localStorage`. |
| **D.1 (Dostępność / a11y)** | Modale, `PetManager.tsx`, `App.tsx` | ✅ Wykonano | Dodano atrybuty `role="dialog"`, `aria-modal="true"`, `aria-labelledby` do modali `LegalModal`, `ImportConfirmModal`, `PetManager`, `NoteEditor` oraz okna Pomocy. Dodano obsługę klawisza Esc zamykającego modale. Karty zwierząt w `PetManager` zamieniono na `<button type="button">`. Dodano `aria-label` do przycisków bez tekstu. |
| **D.2 (CI / GitHub Actions)** | `.github/workflows/deploy.yml` | ✅ Wykonano | Wdrożono oficjalny mechanizm wdrożenia (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`; uprawnienia `contents: read`, `pages: write`, `id-token: write`). Dodano kroki `npm run lint` i `npm test` przed `npm run build`. Podniesiono Node.js do wersji 22. Usunięto pakiet `gh-pages` i skrypty deploy z `package.json`. |
| **D.3 (Code splitting)** | `App.tsx`, `NoteEditor.tsx`, `vite.config.ts` | ✅ Wykonano | Zastosowano `React.lazy` + `Suspense` dla `HealthCalendar`, `WeightChart`, `LegalModal`, `PhotoGallery`, `DrawingBoard`, `ImportConfirmModal`. Skonfigurowano `manualChunks` w Rollup. Główny chunk aplikacji zmniejszono z ~798 kB do ~193 kB (brak jakichkolwiek ostrzeżeń Rollupa). |
| **D.4 (TypeScript Strict)** | `tsconfig.json` | ✅ Wykonano | Włączono `"strict": true` w `tsconfig.json`. Poprawiono wszystkie wynikające błędy typów (brakujące właściwości w interfejsach). `tsc --noEmit` kończy się kodem 0. |
| **D.5 (Szkicownik)** | `DrawingBoard.tsx` | ✅ Wykonano | Dodano skalowanie bufora canvas z uwzględnieniem `window.devicePixelRatio` (`canvas.width = cssWidth * dpr`, `ctx.scale(dpr, dpr)`). Zaimplementowano `setPointerCapture` w `pointerdown` oraz zwolnienie w `pointerup`/`pointercancel`, z zachowaniem `onPointerLeave` jako fallback. |
| **D.6 (Drobne błędy UI)** | `PetManager.tsx`, `PhotoGallery.tsx` | ✅ Wykonano | `PetManager.tsx`: użyto `getSpeciesLabel(pet.species, pet.customSpecies)` zamiast surowego klucza. `PhotoGallery.tsx`: pobieranie plików z poprawnym rozszerzeniem (`.jpg` dla zdjęć skompresowanych, `.png` dla szkiców). |
| **D.7 (Porządek repozytorium)** | `/metadata.json` | ✅ Wykonano | Usunięto nieużywany plik `metadata.json` zawierający mylące deklaracje backendu/Gemini API, sprzeczne z aplikacją 100% offline. |

---

## 2. Pomiary wielkości paczki (Rollup / Vite Build)

| Zasób | Przed poprawkami | Po wykonaniu promptu | Różnica |
|---|---|---|---|
| **Główny chunk aplikacji (`dist/assets/index-*.js`)** | **798 kB** (227 kB gzip) | **193.86 kB** (40.09 kB gzip) | **-75.7% (spadek o >600 kB)** |
| Ostrzeżenia Rollupa o chunku > 500 kB | ⚠️ Występowały | ✅ **0 ostrzeżeń** | Rozbicie na dedykowane chunki lazy & vendor |
| `react-dom-vendor` | scalony w głównym pliku | 359.43 kB (107.53 kB gzip) | Wydzielony stabilny vendor |
| `recharts-vendor` | scalony w głównym pliku | 213.73 kB (56.31 kB gzip) | Ładowany tylko przy otwarciu wykresu |
| `HealthCalendar` | scalony w głównym pliku | 100.12 kB (20.40 kB gzip) | Dynamicznie lazy-loadowany |
| `LegalModal` | scalony w głównym pliku | 21.96 kB (4.20 kB gzip) | Ładowany na żądanie |
| `PhotoGallery` | scalony w głównym pliku | 21.27 kB (4.03 kB gzip) | Ładowany po przełączeniu widoku |
| `DrawingBoard` | scalony w głównym pliku | 10.12 kB (2.64 kB gzip) | Ładowany po otwarciu szkicownika |

---

## 3. Zgodność PWA (Lighthouse / Web App Standards)

- **Manifest PWA:** Zgodny ze standardami W3C (`id`, `name`, `short_name`, `start_url: './'`, `scope: './'`, `display: 'standalone'`, `theme_color`, `background_color`).
- **Ikony:** Kompletne formaty PNG: 192×192 (`purpose: any`), 512×512 (`purpose: any`), 512×512 (`purpose: maskable` z bezpieczną strefą centralną 80%), `apple-touch-icon.png` (180×180), `favicon.ico`, `favicon.svg`.
- **Offline & Cache:** Service Worker generowany przez `vite-plugin-pwa` precache'uje 35 plików (kod, style, ikony, lokalne czcionki woff2).
- **Zewnętrzne żądania sieciowe w runtime:** `0` (zweryfikowano: `NO_EXTERNAL_REQUESTS_FOUND` dla `googleapis`/`gstatic`).

---

## 4. Wykaz zamian tekstowych (Etap 5 / Sekcja C)

| Plik i lokalizacja | Tekst przed zmianą | Nowy tekst zgodny z audytem |
|---|---|---|
| `src/App.tsx:736` | `IDB Storage: Bez limitu` | Wywołanie `getStorageEstimate()`: `IDB Storage: {used} MB z ~{quota} MB` (lub `dostępne` w przypadku braku wsparcia w przeglądarce) |
| `src/App.tsx:868` | `Nielimitowane` | Wywołanie `getStorageEstimate()`: `{used} MB z ~{quota} MB` (lub `Dostępne`) |
| `src/App.tsx:858` | `system wyśle natywne powiadomienie push bezpośrednio na Twój pulpit` | `aplikacja pokaże przypomnienie po jej otwarciu lub powrocie do niej — działa tylko wtedy, gdy przeglądarka jest uruchomiona` |
| `src/App.tsx:937` | `Dane zostaną bezstratnie scalone` | `Dane zostaną scalone (tryb domyślny) lub zastąpione (jeśli wybierzesz tę opcję) — wybór trybu pojawi się w oknie importu` |
| `src/App.tsx:504`, `App.tsx:955`, `legalDocs.ts:45`, `legalDocs.ts:122` | `Dźwięk NIE jest nagrywany, zapisywany ani wysyłany na żadne serwery zewnętrzne.` | `Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.` |
| `src/App.tsx:401`, `App.tsx:808` | `100% lokalnie`, `nigdy nie są transferowane na serwery zewnętrzne` | Dodano klauzulę techniczną: `Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW.` |
| `src/App.tsx:780` | `Wersja 1.4 premium` | `Dziennik Pupila PWA • Wersja 1.2.1 (Offline-First)` (ujednolicone źródło z `package.json`) |
| `TERMS.md:11`, `TERMS.md:42` | Odnośniki do nieistniejącego pliku `LICENSE.md` | Poprawione odnośniki do pliku `LICENSE` |
| `src/App.tsx:999` | Komentarz o `licencji WLDE` | Poprawiono na `licencji WLUP` |
| `src/data/legalDocs.ts` | Wersja `1.2.0` | Podbito do `1.2.1`, wdrożono wersjonowaną akceptację `{version, acceptedAt}` w `localStorage` |

---

## 5. Podsumowanie testów i weryfikacji jakości

- **`tsc --noEmit` (z `"strict": true`):** ✅ 0 błędów
- **Vitest (`npm test`):** ✅ 5 plików testowych, **38/38 testów zakończonych sukcesem**
- **`npm run build`:** ✅ Zbudowano pomyślnie, 0 ostrzeżeń Rollupa, pełny code-splitting
- **`npm audit --omit=dev`:** ✅ 0 podatności
- **Weryfikacja żądań do zewnętrznych serwerów:** ✅ Brak żądań zewnętrznych, 100% zasobów serwowanych lokalnie i cachowanych w Service Workerze.
