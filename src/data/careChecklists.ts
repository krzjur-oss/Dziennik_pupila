import { HealthEventType, SpeciesType } from '../types';

export interface ChecklistTaskItem {
  id: string;
  title: string;
  type: HealthEventType;
  time?: string;
  notes?: string;
  warning?: string;
  icon: string;
  frequency?: string; // e.g., 'Codziennie rano', 'Co 3-4 tygodnie'
}

export interface ChecklistSection {
  id: 'morning' | 'day' | 'evening' | 'cleaning' | 'periodic';
  title: string;
  subtitle: string;
  icon: string;
  items: ChecklistTaskItem[];
}

export interface SpeciesCarePlan {
  speciesKey: SpeciesType;
  speciesName: string;
  emoji: string;
  intro: string;
  goldenRule?: string;
  quickPresets: { title: string; type: HealthEventType; time?: string; notes?: string }[];
  sections: ChecklistSection[];
}

export const CARE_CHECKLISTS: Record<string, SpeciesCarePlan> = {
  swinka_morska: {
    speciesKey: 'swinka_morska',
    speciesName: 'Świnka morska (Kawia domowa)',
    emoji: '🐹',
    intro: 'Checklista codziennych i cyklicznych obowiązków — dbajmy o nasze świnki razem!',
    goldenRule: '🌾 Siano musi być dostępne 24/7 bez ograniczeń. Świnki nie syntetyzują witaminy C – codzienna suplementacja jest niezbędna!',
    quickPresets: [
      { title: 'Sprawdź i wymień wodę', type: 'pielegnacja', time: '08:00', notes: 'Wymień wodę na świeżą i chłodną' },
      { title: 'Uzupełnij siano (24/7)', type: 'pielegnacja', time: '08:00', notes: 'Siano stanowi 80% diety świnki morskiej' },
      { title: 'Porcja warzyw i zieleniny', type: 'pielegnacja', time: '08:30', notes: 'np. papryka, ogórek, nać pietruszki (uwaga na sałatę lodową)' },
      { title: 'Szybkie oględziny świnki', type: 'wizyta', time: '09:00', notes: 'Czy świnka je, porusza się normalnie, nie ma wydzieliny z oczu/nosa' },
      { title: 'Kontakt i zabawa na wybiegu (15-30 min)', type: 'pielegnacja', time: '15:00', notes: 'Min. 15-30 minut w bezpiecznym miejscu poza klatką' },
      { title: 'Sprzątanie punktowe klatki', type: 'pielegnacja', time: '19:30', notes: 'Usuń mokre i zabrudzone miejsca ściółki/mat' },
      { title: 'Podaj witaminę C', type: 'leki', time: '20:00', notes: 'Tabletka lub warzywo bogate w wit. C (np. czerwona papryka)' },
      { title: 'Pełne sprzątanie klatki', type: 'pielegnacja', notes: 'Wymiana całego podłoża i mycie kuwety' },
      { title: 'Przycinanie pazurków (co 3-4 tyg.)', type: 'pielegnacja', notes: 'Uważaj na rdzeń naczyniowy w jasnych pazurkach' },
      { title: 'Kontrola wagi (raz w tygodniu)', type: 'wizyta', notes: 'Spadek wagi o 50g+ to pierwszy sygnał infekcji lub problemu z zębami!' },
      { title: 'Wizyta u weterynarza (okulista/zęby/kontrola)', type: 'wizyta', notes: 'Rutynowa kontrola u weterynarza specjalizującego się w małych ssakach' },
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Poranny start i świeże posiłki',
        icon: '☀️',
        items: [
          {
            id: 'gp-water-am',
            title: 'Sprawdź wodę — wymień, jeśli mętna lub jej mało',
            type: 'pielegnacja',
            time: '08:00',
            icon: '💧',
            frequency: 'Codziennie rano',
            notes: 'Sprawdź, czy kulka w poidełku nie zacięła się lub umyj miseczkę z osadu.'
          },
          {
            id: 'gp-hay-am',
            title: 'Uzupełnij siano (dostępne przez cały dzień, bez ograniczeń)',
            type: 'pielegnacja',
            time: '08:00',
            icon: '🌾',
            frequency: 'Codziennie rano',
            notes: 'Siano to podstawa pracy układu pokarmowego i ścierania zębów trzonowych.'
          },
          {
            id: 'gp-veggies-am',
            title: 'Podaj porcję warzyw / świeżej zieleniny',
            type: 'pielegnacja',
            time: '08:30',
            icon: '🥬',
            frequency: 'Codziennie rano',
            warning: 'np. papryka, ogórek, cykoria — uwaga: unikaj sałaty lodowej!',
            notes: 'Umyj i osusz warzywa przed podaniem. Nie podawaj prosto z lodówki.'
          },
          {
            id: 'gp-check-am',
            title: 'Szybkie oględziny: czy świnka je, porusza się normalnie, brak wydzielin',
            type: 'wizyta',
            time: '09:00',
            icon: '🩺',
            frequency: 'Codziennie rano',
            notes: 'Sprawdź czy nie ma wycieku z nosa, sklejonych oczu, wzdętego brzuszka lub apatii.'
          }
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Ruch, węszenie i interakcja',
        icon: '🌤️',
        items: [
          {
            id: 'gp-playtime',
            title: 'Kontakt i zabawa — min. 15–30 minut poza klatką, w bezpiecznym miejscu',
            type: 'pielegnacja',
            time: '14:30',
            icon: '🏃',
            frequency: 'Codziennie po południu',
            notes: 'Zabezpiecz kable i szpary pod meblami. Rozłóż matę lub tunel do chowania.'
          },
          {
            id: 'gp-behavior',
            title: 'Obserwacja zachowania — piszczenie, apetyt, aktywność',
            type: 'wizyta',
            time: '16:00',
            icon: '👁️',
            frequency: 'W ciągu dnia',
            notes: 'Radosne popcorningowanie i głośne kwiczenie na widok opiekuna to znak zdrowia!'
          }
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Przygotowanie do nocy i kluczowe witaminy',
        icon: '🌙',
        items: [
          {
            id: 'gp-water-hay-pm',
            title: 'Uzupełnij wodę i siano ponownie',
            type: 'pielegnacja',
            time: '19:00',
            icon: '🌾',
            frequency: 'Codziennie wieczorem',
            notes: 'W nocy świnki chętnie żerują – paśnik nie może być pusty.'
          },
          {
            id: 'gp-spot-clean',
            title: 'Sprawdź klatkę i usuń mokre / zabrudzone miejsca (sprzątanie punktowe)',
            type: 'pielegnacja',
            time: '19:30',
            icon: '🧹',
            frequency: 'Codziennie wieczorem',
            notes: 'Usuń bobki i wymień wilgotne podkłady w ulubionych kątach, aby chronić łapki przed odparzeniami (pododermatitis).'
          },
          {
            id: 'gp-vit-c',
            title: 'Podaj witaminę C (tabletka lub warzywo bogate w wit. C, np. papryka)',
            type: 'leki',
            time: '20:00',
            icon: '💊',
            frequency: 'Codziennie wieczorem',
            notes: 'Zapotrzebowanie to ok. 10-30 mg/dobę. Najlepiej przyswajalna jest z żółtej lub czerwonej papryki bądź specjalnych kropli/tabletek weterynaryjnych.'
          }
        ]
      },
      {
        id: 'cleaning',
        title: 'Pełne sprzątanie klatki',
        subtitle: 'Higiena podłoża i otoczenia (zaznacz wybrane dni tygodnia)',
        icon: '🧹',
        items: [
          {
            id: 'gp-cage-full',
            title: 'Pełne sprzątanie klatki — wymiana podłoża i mycie kuwety',
            type: 'pielegnacja',
            icon: '🧼',
            frequency: '1–2 razy w tygodniu (np. Śr / Sob)',
            notes: 'Wymień całą ściółkę/maty, umyj kuwetę wodą z octem (usuwa kamień z moczu) i wypłucz.'
          }
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Pazurki i kontrola zdrowia',
        icon: '📅',
        items: [
          {
            id: 'gp-nails',
            title: 'Przycinanie pazurków — co 3–4 tygodnie',
            type: 'pielegnacja',
            icon: '✂️',
            frequency: 'Co 3–4 tygodnie',
            notes: 'Świnki na miękkich podłożach nie ścierają pazurów. Przycinaj cążkami, unikając różowego rdzenia naczyniowego.'
          },
          {
            id: 'gp-weight',
            title: 'Kontrola wagi — raz w tygodniu',
            type: 'wizyta',
            icon: '⚖️',
            frequency: 'Raz w tygodniu (stały dzień)',
            notes: 'Waż świnkę na wadze kuchennej zawsze o podobnej porze. Utrata 50g to sygnał ostrzegawczy, utrata 100g wymaga pilnej wizyty u weta!'
          }
        ]
      }
    ]
  },

  pies: {
    speciesKey: 'pies',
    speciesName: 'Pies',
    emoji: '🐶',
    intro: 'Codzienny plan aktywności, higieny i profilaktyki zdrowotnej Twojego psa.',
    goldenRule: '🐾 Regularne spacery, zbilansowana karma i profilaktyka p/kleszczom to fundament długiego życia.',
    quickPresets: [
      { title: 'Spacer poranny i toaleta', type: 'pielegnacja', time: '07:30', notes: 'Poranny spacer min. 20-30 minut' },
      { title: 'Spacer główny (węszenie i ruch)', type: 'pielegnacja', time: '14:30', notes: 'Dłuższy spacer min. 45-60 min z węszeniem i zabawą' },
      { title: 'Spacer wieczorny', type: 'pielegnacja', time: '20:30', notes: 'Krótki spacer wyciszający przed snem' },
      { title: 'Mycie zębów / gryzak stomatologiczny', type: 'pielegnacja', time: '21:00', notes: 'Higiena jamy ustnej zapobiega kamieniowi nazębnemu' },
      { title: 'Czesanie i przegląd sierści', type: 'pielegnacja', notes: 'Szczotkowanie i kontrola podszerstka oraz kleszczy' },
      { title: 'Obcięcie pazurów i kontrola łap', type: 'pielegnacja', notes: 'Skrócenie pazurów i kontrola opuszek' },
      { title: 'Zabezpieczenie p/kleszczom i pchłom', type: 'odrobaczanie', notes: 'Tabletka, obroża lub krople spot-on' },
      { title: 'Odrobaczanie profilaktyczne', type: 'odrobaczanie', notes: 'Rutynowe odrobaczanie co 3-6 miesięcy' },
      { title: 'Szczepienie p/wściekliźnie i zakaźnym', type: 'szczepienie', notes: 'Obowiązkowe coroczne szczepienie p/wściekliźnie' },
      { title: 'Kontrola wagi psa', type: 'wizyta', notes: 'Ważenie w gabinecie lub w domu' },
      { title: 'Kąpiel i pielęgnacja sierści', type: 'pielegnacja', notes: 'Kąpiel w szamponie dla psów i dokładne suszenie' },
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Poranny spacer i śniadanie',
        icon: '☀️',
        items: [
          { id: 'dog-walk-am', title: 'Spacer poranny i toaleta (20-30 min)', type: 'pielegnacja', time: '07:30', icon: '🦮', frequency: 'Codziennie rano' },
          { id: 'dog-water-am', title: 'Świeża woda w misce i śniadanie', type: 'pielegnacja', time: '08:00', icon: '🥣', frequency: 'Codziennie rano' },
          { id: 'dog-check-am', title: 'Szybki przegląd: samopoczucie, oczy, łapki', type: 'wizyta', time: '08:15', icon: '🩺', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Główny ruch i stymulacja',
        icon: '🌤️',
        items: [
          { id: 'dog-walk-day', title: 'Główny spacer, węszenie i zabawa / trening (45-60 min)', type: 'pielegnacja', time: '14:30', icon: '🎾', frequency: 'Codziennie' },
          { id: 'dog-brush', title: 'Czesanie sierści i sprawdzenie podszerstka', type: 'pielegnacja', time: '16:00', icon: '🪮', frequency: '2-3 razy w tyg.' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Kolacja, toaleta i wyciszenie',
        icon: '🌙',
        items: [
          { id: 'dog-dinner', title: 'Kolacja i uzupełnienie świeżej wody', type: 'pielegnacja', time: '19:00', icon: '🍲', frequency: 'Codziennie wieczorem' },
          { id: 'dog-walk-pm', title: 'Spacer wieczorny fizjologiczny (15-20 min)', type: 'pielegnacja', time: '21:00', icon: '🌙', frequency: 'Codziennie wieczorem' },
          { id: 'dog-teeth', title: 'Mycie zębów / podanie gryzaka dentystycznego', type: 'pielegnacja', time: '21:30', icon: '🦷', frequency: 'Codziennie lub co 2 dni' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Profilaktyka weterynaryjna i higiena',
        icon: '📅',
        items: [
          { id: 'dog-ticks', title: 'Zabezpieczenie p/kleszczom i pchłom (comiesięczne)', type: 'odrobaczanie', icon: '🦟', frequency: 'Co 4-5 tygodni (sezon wiosna-jesień)' },
          { id: 'dog-deworm', title: 'Profilaktyczne odrobaczanie', type: 'odrobaczanie', icon: '💊', frequency: 'Co 3-6 miesięcy' },
          { id: 'dog-nails', title: 'Obcięcie pazurów i pielęgnacja opuszek', type: 'pielegnacja', icon: '✂️', frequency: 'Co 3–4 tygodnie' },
          { id: 'dog-ears', title: 'Kontrola czystości uszu i oczu', type: 'pielegnacja', icon: '👂', frequency: 'Raz w tygodniu' },
          { id: 'dog-weight', title: 'Kontrola wagi psa', type: 'wizyta', icon: '⚖️', frequency: 'Raz w miesiącu' },
          { id: 'dog-vaccine', title: 'Coroczne szczepienie p/wściekliźnie i wirusom', type: 'szczepienie', icon: '💉', frequency: 'Raz w roku' },
        ]
      }
    ]
  },

  kot: {
    speciesKey: 'kot',
    speciesName: 'Kot',
    emoji: '🐱',
    intro: 'Kocia checklista dobrostanu: higiena kuwety, stymulacja łowiecka i profilaktyka.',
    goldenRule: '🐈 Czysta kuweta to szczęśliwy kot. Mokra karma i świeża woda wspierają delikatne kocie nerki.',
    quickPresets: [
      { title: 'Czyszczenie kuwety z bryłek', type: 'pielegnacja', time: '07:30', notes: 'Poranny przegląd i usunięcie nieczystości' },
      { title: 'Świeża woda / kontrola fontanny', type: 'pielegnacja', time: '08:00', notes: 'Koty wolą wodę bieżącą z dala od miski z karmą' },
      { title: 'Sesja aktywnej zabawy w polowanie (15 min)', type: 'pielegnacja', time: '17:00', notes: 'Zabawa wędką zakończona przysmakiem' },
      { title: 'Czesanie futra (odkłaczanie)', type: 'pielegnacja', time: '18:00', notes: 'Usuwanie martwego włosa zapobiega kulom włosowym' },
      { title: 'Podanie pasty odkłaczającej / smaczków dentystycznych', type: 'leki', time: '20:00', notes: 'Wspomaga pasaż treści pokarmowej' },
      { title: 'Drugie wieczorne sprzątanie kuwety', type: 'pielegnacja', time: '21:00', notes: 'Czysta kuweta na noc' },
      { title: 'Pełna wymiana żwirku i mycie kuwety', type: 'pielegnacja', notes: 'Mycie ciepłą wodą i neutralnym mydłem' },
      { title: 'Przycięcie ostrych końcówek pazurków', type: 'pielegnacja', notes: 'Skrócenie samych przezroczystych czubków' },
      { title: 'Zabezpieczenie p/pasożytom (krople spot-on)', type: 'odrobaczanie', notes: 'Zabezpieczenie przed pchłami, kleszczami i robakami' },
      { title: 'Kontrola wagi kota', type: 'wizyta', notes: 'Sprawdzanie masy ciała co miesiąc' },
      { title: 'Szczepienie okresowe kota', type: 'szczepienie', notes: 'Szczepienie przeciw panleukopenii, katarowi kociemu' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Czysta kuweta i świeży posiłek',
        icon: '☀️',
        items: [
          { id: 'cat-litter-am', title: 'Czyszczenie kuwety z bryłek (poranny przegląd)', type: 'pielegnacja', time: '07:30', icon: '🧹', frequency: 'Codziennie rano' },
          { id: 'cat-water-am', title: 'Wymiana wody na świeżą (lub sprawdzenie fontanny)', type: 'pielegnacja', time: '08:00', icon: '💧', frequency: 'Codziennie rano' },
          { id: 'cat-food-am', title: 'Śniadanie — porcja mokrej karmy', type: 'pielegnacja', time: '08:15', icon: '🥩', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Łowy, ruch i relaks',
        icon: '🌤️',
        items: [
          { id: 'cat-play', title: 'Sesja zabawy w polowanie (np. wędka, piórka, min. 15 min)', type: 'pielegnacja', time: '17:00', icon: '🎣', frequency: 'Codziennie' },
          { id: 'cat-brush', title: 'Szczotkowanie futerka (zapobieganie bezoarom / kłaczkom)', type: 'pielegnacja', time: '18:00', icon: '🪮', frequency: '2-3 razy w tyg.' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Kuweta na noc i kolacja',
        icon: '🌙',
        items: [
          { id: 'cat-dinner', title: 'Kolacja (mokra karma) i uzupełnienie wody', type: 'pielegnacja', time: '19:30', icon: '🍲', frequency: 'Codziennie wieczorem' },
          { id: 'cat-paste', title: 'Podanie pasty odkłaczającej / pielęgnacja zębów', type: 'leki', time: '20:30', icon: '💊', frequency: 'Co 2-3 dni' },
          { id: 'cat-litter-pm', title: 'Drugie wieczorne sprzątanie kuwety', type: 'pielegnacja', time: '21:30', icon: '🧹', frequency: 'Codziennie wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Higiena i profilaktyka',
        icon: '📅',
        items: [
          { id: 'cat-litter-full', title: 'Pełna wymiana żwirku i dezynfekcja kuwety', type: 'pielegnacja', icon: '🧼', frequency: 'Co 1–2 tygodnie' },
          { id: 'cat-claws', title: 'Przycięcie końcówek pazurków', type: 'pielegnacja', icon: '✂️', frequency: 'Co 2–3 tygodnie' },
          { id: 'cat-parasites', title: 'Zabezpieczenie p/pasożytom zewnętrznym i wewnętrznym', type: 'odrobaczanie', icon: '🦟', frequency: 'Co 3 miesiące' },
          { id: 'cat-weight', title: 'Kontrola wagi kota (waga łazienkowa/kuchenna)', type: 'wizyta', icon: '⚖️', frequency: 'Raz w miesiącu' },
          { id: 'cat-vet', title: 'Coroczne szczepienie i przegląd stomatologiczny', type: 'szczepienie', icon: '💉', frequency: 'Raz w roku' },
        ]
      }
    ]
  },

  krolik: {
    speciesKey: 'krolik',
    speciesName: 'Królik',
    emoji: '🐰',
    intro: 'Harmonogram diety opartej na sianie, wybiegu i wczesnym wychwytywaniu apatii.',
    goldenRule: '🌿 Siano to 80-90% diety! Zastój pokarmowy (brak bobków/apetytu > 8h) jest stanem zagrożenia życia.',
    quickPresets: [
      { title: 'Świeże pachnące siano (paśnik do pełna)', type: 'pielegnacja', time: '08:00', notes: 'Siano stanowi podstawę diety królika' },
      { title: 'Wymiana wody w miseczce', type: 'pielegnacja', time: '08:00', notes: 'Króliki chętniej piją z ceramicznej miski niż poidełka' },
      { title: 'Świeże zioła i zielenina', type: 'pielegnacja', time: '08:30', notes: 'np. babka lancetowata, mniszek, koperek, nać marchwi' },
      { title: 'Kontrola bobków i apetytu (brak bobków = alarm!)', type: 'wizyta', time: '09:00', notes: 'Oceń ilość, wielkość i kształt bobków w kuwecie' },
      { title: 'Bezpieczny wybieg po pokoju (min. 3-4h)', type: 'pielegnacja', time: '14:00', notes: 'Zabezpiecz kable, rośliny i listwy przypodłogowe' },
      { title: 'Punktowe czyszczenie kuwety z siuśków', type: 'pielegnacja', time: '19:30', notes: 'Utrzymuj kuwetę w suchości' },
      { title: 'Uzupełnienie siana i gałązek na noc', type: 'pielegnacja', time: '20:30', notes: 'Gałązki jabłoni, leszczyny do ścierania siekaczy' },
      { title: 'Przycinanie pazurków (co 4-6 tyg.)', type: 'pielegnacja', notes: 'Uważaj na naczynia krwionośne' },
      { title: 'Wyczesywanie podszerstka (w okresie linienia)', type: 'pielegnacja', notes: 'Zapobiega zlizywaniu kłaków i zatorom jelitowym' },
      { title: 'Cotygodniowa kontrola wagi królika', type: 'wizyta', notes: 'Ważenie raz w tygodniu o stałej porze' },
      { title: 'Szczepienie p/myksomatozie i pomorowi (RHD1/RHD2)', type: 'szczepienie', notes: 'Kluczowe szczepienie przeciw śmiertelnym wirusom' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Siano, zielenina i kontrola bobków',
        icon: '☀️',
        items: [
          { id: 'rab-hay-am', title: 'Uzupełnienie świeżego siana (podstawa diety - 85% objętości!)', type: 'pielegnacja', time: '08:00', icon: '🌾', frequency: 'Codziennie rano' },
          { id: 'rab-water-am', title: 'Wymiana wody w miseczce / poidełku', type: 'pielegnacja', time: '08:00', icon: '💧', frequency: 'Codziennie rano' },
          { id: 'rab-herbs-am', title: 'Świeża porcja ziół i zieleniny (np. babka, mniszek, koper)', type: 'pielegnacja', time: '08:30', icon: '🌿', frequency: 'Codziennie rano' },
          { id: 'rab-check-am', title: 'Kontrola bobków i apetytu (brak bobków wymaga natychmiastowej reakcji!)', type: 'wizyta', time: '09:00', icon: '🩺', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Aktywny wybieg i eksploracja',
        icon: '🌤️',
        items: [
          { id: 'rab-roam', title: 'Wybieg poza klatką / kojcem (min. 3-4 godziny bezpiecznego hasania)', type: 'pielegnacja', time: '14:00', icon: '🐰', frequency: 'Codziennie' },
          { id: 'rab-groom', title: 'Wyczesywanie podszerstka (zwłaszcza w okresie linienia)', type: 'pielegnacja', time: '17:00', icon: '🪮', frequency: '2-3 razy w tyg.' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Nocne siano i czysta kuweta',
        icon: '🌙',
        items: [
          { id: 'rab-hay-pm', title: 'Kolejna porcja siana na noc (nie może go zabraknąć!)', type: 'pielegnacja', time: '19:30', icon: '🌾', frequency: 'Codziennie wieczorem' },
          { id: 'rab-litter-pm', title: 'Punktowe czyszczenie kuwety z siuśków i bobków', type: 'pielegnacja', time: '20:00', icon: '🧹', frequency: 'Codziennie wieczorem' },
          { id: 'rab-twigs', title: 'Gałązki do ścierania zębów (np. jabłoń, wierzba, leszczyna)', type: 'pielegnacja', time: '20:30', icon: '🪵', frequency: 'Wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Pazury, waga i szczepienia',
        icon: '📅',
        items: [
          { id: 'rab-claws', title: 'Przycinanie pazurków', type: 'pielegnacja', icon: '✂️', frequency: 'Co 4–6 tygodni' },
          { id: 'rab-weight', title: 'Ważenie królika (raz w tygodniu na wadze kuchennej)', type: 'wizyta', icon: '⚖️', frequency: 'Raz w tygodniu' },
          { id: 'rab-clean-full', title: 'Pełne mycie kuwety i kojca roztworem octu', type: 'pielegnacja', icon: '🧼', frequency: 'Co tydzień' },
          { id: 'rab-vaccine', title: 'Szczepienie p/myksomatozie i pomorowi (RHD1/RHD2)', type: 'szczepienie', icon: '💉', frequency: 'Co 6-12 miesięcy' },
        ]
      }
    ]
  },

  chomik: {
    speciesKey: 'chomik',
    speciesName: 'Chomik / Mały gryzoń',
    emoji: '🐹',
    intro: 'Specyfika nocnego trybu życia: bezstresowa opieka i bezpieczna głęboka ściółka.',
    goldenRule: '🌙 Chomik to zwierzę nocne – nie budź go za dnia! Sprzątaj ściółkę strefowo, by nie niszczyć jego zapachów.',
    quickPresets: [
      { title: 'Sprawdzenie wody i miseczki', type: 'pielegnacja', time: '09:00', notes: 'Sprawdź czy poidełko nie cieknie' },
      { title: 'Usunięcie niezjedzonych świeżych warzyw', type: 'pielegnacja', time: '09:30', notes: 'Usuń resztki z klatki/domku aby nie pleśniały' },
      { title: 'Podanie karmy ziarnistej, ziół i suszków', type: 'pielegnacja', time: '20:00', notes: 'Chomiki uwielbiają zbierać ziarna do torebek policzkowych' },
      { title: 'Sprzątanie kąta toaletowego / piaskownicy', type: 'pielegnacja', time: '20:30', notes: 'Przesiej piasek w kąpielisku pyłowym' },
      { title: 'Wybieg / interakcja i smaczek z ręki', type: 'pielegnacja', time: '21:30', notes: 'Budowanie zaufania w godzinach nocnej aktywności' },
      { title: 'Częściowe sprzątanie ściółki (strefowe)', type: 'pielegnacja', notes: 'Wymieniaj tylko 1/3 ściółki na raz, aby nie stresować chomika' },
      { title: 'Kontrola długości ząbków i pazurków', type: 'wizyta', notes: 'Siekacze gryzonia rosną przez całe życie' },
      { title: 'Kontrola wagi na wadze kuchennej', type: 'wizyta', notes: 'Ważenie raz w tygodniu' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Szybki bezgłośny przegląd (chomik śpi)',
        icon: '☀️',
        items: [
          { id: 'ham-water-am', title: 'Sprawdzenie poidełka / miseczki z wodą', type: 'pielegnacja', time: '09:00', icon: '💧', frequency: 'Codziennie rano' },
          { id: 'ham-spoil-am', title: 'Szybkie usunięcie niezjedzonych świeżych warzyw', type: 'pielegnacja', time: '09:30', icon: '🥒', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem (Aktywność nocna)',
        subtitle: 'Główne karmienie, toaleta i ruch',
        icon: '🌙',
        items: [
          { id: 'ham-food-pm', title: 'Uzupełnienie karmy ziarnistej, ziół i suszków', type: 'pielegnacja', time: '20:00', icon: '🌾', frequency: 'Codziennie wieczorem' },
          { id: 'ham-toilet-pm', title: 'Sprzątanie narożnika toaletowego / piaskownicy', type: 'pielegnacja', time: '20:30', icon: '🧹', frequency: 'Codziennie wieczorem' },
          { id: 'ham-play-pm', title: 'Czas na wybiegu / interakcja i smaczek z ręki', type: 'pielegnacja', time: '21:30', icon: '🐹', frequency: 'W porze aktywności' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Ściółka, waga i zęby',
        icon: '📅',
        items: [
          { id: 'ham-litter-part', title: 'Częściowe (strefowe) sprzątanie ściółki (nigdy całości!)', type: 'pielegnacja', icon: '🧼', frequency: 'Co 2–4 tygodnie' },
          { id: 'ham-weight', title: 'Kontrola wagi na wadze kuchennej (raz w tygodniu)', type: 'wizyta', icon: '⚖️', frequency: 'Raz w tygodniu' },
          { id: 'ham-teeth', title: 'Sprawdzenie długości siekaczy i pazurków', type: 'wizyta', icon: '🦷', frequency: 'Co 2 tygodnie' },
        ]
      }
    ]
  },

  papuga: {
    speciesKey: 'papuga',
    speciesName: 'Papuga / Ptak',
    emoji: '🦜',
    intro: 'Świeża woda, bezpieczny swobodny lot i odpowiedni rytm dobowy (10-12h snu).',
    goldenRule: '🦜 Zapewnij min. 10-12 godzin nieprzerwanego snu w ciemności. Ptasie drogi oddechowe są skrajnie wrażliwe na teflon i chemię.',
    quickPresets: [
      { title: 'Mycie poidła i świeża woda', type: 'pielegnacja', time: '08:00', notes: 'Ptaki często moczą jedzenie w wodzie' },
      { title: 'Świeża mieszanka ziaren, warzyw i zieleniny', type: 'pielegnacja', time: '08:30', notes: 'np. brokuł, marchew, natka, papryka (bez awokado!)' },
      { title: 'Swobodny bezpieczny lot po pokoju', type: 'pielegnacja', time: '12:00', notes: 'Zamknięte okna, zasłonięte firanki i brak drapieżników' },
      { title: 'Kąpiel lub delikatne zraszanie piór', type: 'pielegnacja', time: '14:00', notes: 'Czysta woda w zraszaczu pomaga utrzymać pióra w czystości' },
      { title: 'Wymiana papieru na dnie klatki', type: 'pielegnacja', time: '19:30', notes: 'Czyste dno klatki ułatwia ocenę odchodów ptaka' },
      { title: 'Przykrycie klatki na sen (10-12h ciemności)', type: 'pielegnacja', time: '20:30', notes: 'Zapewnia stabilny zegar biologiczny i spokój' },
      { title: 'Mycie żerdek i zabawek', type: 'pielegnacja', notes: 'Gorąca woda z mydłem lub parownica' },
      { title: 'Wymiana świeżych gałązek do dziobania', type: 'pielegnacja', notes: 'np. wierzba, jabłoń, brzoza' },
      { title: 'Kontrola wagi ptaka na wadze z żerdką', type: 'wizyta', notes: 'Utrata wagi u ptaka to pierwszy sygnał infekcji' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Pobudka, świeża woda i śniadanie',
        icon: '☀️',
        items: [
          { id: 'bird-uncover', title: 'Odsłonięcie klatki po nocy i powitanie', type: 'pielegnacja', time: '08:00', icon: '☀️', frequency: 'Codziennie rano' },
          { id: 'bird-water-am', title: 'Wymiana wody w poidle i staranne umycie naczynia', type: 'pielegnacja', time: '08:15', icon: '💧', frequency: 'Codziennie rano' },
          { id: 'bird-food-am', title: 'Świeża porcja ziaren, warzywa i zielenina (uwaga: NIE podawać awokado!)', type: 'pielegnacja', time: '08:30', icon: '🥗', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Loty, kąpiel i socjalizacja',
        icon: '🌤️',
        items: [
          { id: 'bird-flight', title: 'Wypuszczenie na bezpieczny lot po pokoju (okna zamknięte!)', type: 'pielegnacja', time: '13:00', icon: '🦜', frequency: 'Codziennie' },
          { id: 'bird-bath', title: 'Basenik do kąpieli lub delikatne zraszanie piór', type: 'pielegnacja', time: '15:00', icon: '🚿', frequency: 'Co 2-3 dni' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Czystość dna i sen w ciemności',
        icon: '🌙',
        items: [
          { id: 'bird-bottom-pm', title: 'Wymiana podkładu papierowego na dnie klatki', type: 'pielegnacja', time: '19:30', icon: '🧹', frequency: 'Codziennie wieczorem' },
          { id: 'bird-cover-pm', title: 'Zasłonięcie klatki na 10-12 godzin spokojnego snu', type: 'pielegnacja', time: '20:30', icon: '🌙', frequency: 'Codziennie wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Higiena żerdek i waga',
        icon: '📅',
        items: [
          { id: 'bird-perches', title: 'Mycie żerdek, misek i zabawek', type: 'pielegnacja', icon: '🧼', frequency: 'Co tydzień' },
          { id: 'bird-twigs', title: 'Dostarczenie świeżych gałązek do obgryzania (wierzba, brzoza)', type: 'pielegnacja', icon: '🪵', frequency: 'Co 1–2 tygodnie' },
          { id: 'bird-weight', title: 'Kontrola wagi ptaka na wadze z żerdką', type: 'wizyta', icon: '⚖️', frequency: 'Raz w tygodniu' },
          { id: 'bird-beak', title: 'Kontrola stanu dzioba i pazurków', type: 'wizyta', icon: '✂️', frequency: 'Co miesiąc' },
        ]
      }
    ]
  },

  jaszczurka: {
    speciesKey: 'jaszczurka',
    speciesName: 'Jaszczurka / Gad',
    emoji: '🦎',
    intro: 'Światło, cykl cieplny, suplementacja wapnia i odpowiednia wilgotność.',
    goldenRule: '☀️ Gady są zmiennocieplne – sprawdzaj wyspę ciepła i wymieniaj lampę UVB co 6-12 miesięcy!',
    quickPresets: [
      { title: 'Włączenie oświetlenia i wyspy ciepła/UVB', type: 'pielegnacja', time: '08:00', notes: 'Zapewnij gradient temperatur w terrarium' },
      { title: 'Kontrola termometru i higrometru', type: 'wizyta', time: '08:30', notes: 'Sprawdź strefę ciepłą i strefę chłodną' },
      { title: 'Karmienie owadami z wapniem (bez D3)', type: 'pielegnacja', time: '12:00', notes: 'Owady posypane czystym węglanem wapnia' },
      { title: 'Zroszenie terrarium / świeża woda w baseniku', type: 'pielegnacja', time: '14:00', notes: 'Utrzymanie wilgotności zgodnej z gatunkiem' },
      { title: 'Usunięcie odchodów i resztek owadów', type: 'pielegnacja', time: '19:30', notes: 'Czystość w terrarium zapobiega bakteriom' },
      { title: 'Wyłączenie oświetlenia dziennego (spadek nocny)', type: 'pielegnacja', time: '20:30', notes: 'Nocny spadek temperatury jest naturalny' },
      { title: 'Podanie witamin z D3 (wg harmonogramu)', type: 'leki', notes: 'Zgodnie z dawkowaniem dla danego gatunku' },
      { title: 'Kontrola wylinki (paluszki i ogon)', type: 'wizyta', notes: 'Niedoszła wylinka na palcach grozi martwicą' },
      { title: 'Kontrola wagi gada', type: 'wizyta', notes: 'Ważenie co 2-4 tygodnie' },
      { title: 'Wymiana żarówki / świetlówki UVB (co 6-12 mies.)', type: 'pielegnacja', notes: 'Promieniowanie UVB zanika mimo że lampa nadal świeci!' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Cykl dzienny i weryfikacja parametrów',
        icon: '☀️',
        items: [
          { id: 'rep-lights-am', title: 'Włączenie oświetlenia dziennego, wyspy ciepła i lampy UVB', type: 'pielegnacja', time: '08:00', icon: '💡', frequency: 'Codziennie rano' },
          { id: 'rep-temp-am', title: 'Kontrola termometru i higrometru (strefa ciepła i chłodna)', type: 'wizyta', time: '08:30', icon: '🌡️', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Karmienie, woda i wilgotność',
        icon: '🌤️',
        items: [
          { id: 'rep-feed', title: 'Podanie pokarmu (owady posypane wapniem lub zielenina)', type: 'pielegnacja', time: '12:00', icon: '🦗', frequency: 'Wg harmonogramu gatunku' },
          { id: 'rep-water-mist', title: 'Zroszenie terrarium / wymiana wody w baseniku', type: 'pielegnacja', time: '14:00', icon: '💧', frequency: 'Codziennie' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Higiena i nocny spadek temperatury',
        icon: '🌙',
        items: [
          { id: 'rep-spot-clean', title: 'Usunięcie odchodów i niezjedzonych owadów karmowych', type: 'pielegnacja', time: '19:30', icon: '🧹', frequency: 'Codziennie wieczorem' },
          { id: 'rep-lights-off', title: 'Wyłączenie oświetlenia dziennego (nocny spadek temperatury)', type: 'pielegnacja', time: '20:30', icon: '🌙', frequency: 'Codziennie wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Suplementy, wylinka i sprzęt UVB',
        icon: '📅',
        items: [
          { id: 'rep-vit-d3', title: 'Podanie witamin z D3 (1 raz w tygodniu lub co 2 tyg.)', type: 'leki', icon: '💊', frequency: 'Wg zaleceń dla gatunku' },
          { id: 'rep-shedding', title: 'Kontrola wylinki (paluszki, czubek ogona)', type: 'wizyta', icon: '🦎', frequency: 'Przy każdej wylince' },
          { id: 'rep-weight', title: 'Kontrola wagi gada', type: 'wizyta', icon: '⚖️', frequency: 'Co 2–4 tygodnie' },
          { id: 'rep-uvb-change', title: 'Wymiana świetlówki / lampy UVB (co 6–12 miesięcy)', type: 'pielegnacja', icon: '💡', frequency: 'Co 6–12 miesięcy' },
          { id: 'rep-full-clean', title: 'Generalne czyszczenie i dezynfekcja terrarium', type: 'pielegnacja', icon: '🧼', frequency: 'Co 2–3 miesiące' },
        ]
      }
    ]
  },

  rybki: {
    speciesKey: 'rybki',
    speciesName: 'Rybki / Akwarium',
    emoji: '🐠',
    intro: 'Biologia wody: regularne podmiany, czyszczenie filtrów i umiarkowane karmienie.',
    goldenRule: '🌊 Przekarmianie to wróg numer jeden. Płucz wkłady filtra wyłącznie w spuszczonej wodzie z akwarium, nigdy pod kranem!',
    quickPresets: [
      { title: 'Karmienie poranne (niewielka porcja)', type: 'pielegnacja', time: '08:30', notes: 'Tyle ile rybki zjedzą w 2-3 minuty' },
      { title: 'Kontrola temperatury wody i pracy filtra', type: 'wizyta', time: '09:00', notes: 'Sprawdź grzałkę, termometr i przepływ wody' },
      { title: 'Włączenie / kontrola oświetlenia akwarium', type: 'pielegnacja', time: '10:00', notes: 'Zalecany czas świecenia 7-9 godzin' },
      { title: 'Obserwacja zachowania ryb (płetwy, skóra, ruch)', type: 'wizyta', time: '18:00', notes: 'Czy rybki nie ocierają się o dekoracje lub nie łapią powietrza' },
      { title: 'Częściowa podmiana wody (20-30%) z odmulaniem', type: 'pielegnacja', notes: 'Cotygodniowa wymiana części wody na odstaną' },
      { title: 'Czyszczenie szyb z glonów (czyścik)', type: 'pielegnacja', notes: 'Usuń nalot z wewnętrznej strony szyb' },
      { title: 'Płukanie wkładów filtra w wodzie z akwarium', type: 'pielegnacja', notes: 'Chroni pożyteczne bakterie nitryfikacyjne' },
      { title: 'Test parametrów wody (pH, NO2, NO3, GH)', type: 'wizyta', notes: 'Kontrola cyklu azotowego' },
      { title: 'Nawożenie roślin i przycinanie', type: 'pielegnacja', notes: 'Pielęgnacja roślinności podwodnej' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Karmienie i kontrola sprzętu',
        icon: '☀️',
        items: [
          { id: 'fish-feed-am', title: 'Karmienie poranne (niewielka porcja zjadana w 2-3 min)', type: 'pielegnacja', time: '08:30', icon: '🐟', frequency: 'Codziennie rano' },
          { id: 'fish-check-am', title: 'Sprawdzenie temperatury wody i pracy filtra / napowietrzacza', type: 'wizyta', time: '09:00', icon: '🌡️', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Obserwacja i wyłączenie światła',
        icon: '🌙',
        items: [
          { id: 'fish-observe-pm', title: 'Obserwacja zachowania ryb (skóra, płetwy, sposób pływania)', type: 'wizyta', time: '18:00', icon: '👁️', frequency: 'Codziennie wieczorem' },
          { id: 'fish-light-off', title: 'Wyłączenie oświetlenia akwarium (max 8-10h świecenia)', type: 'pielegnacja', time: '20:00', icon: '🌙', frequency: 'Codziennie wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Podmiana wody, filtr i testy chemiczne',
        icon: '📅',
        items: [
          { id: 'fish-water-change', title: 'Częściowa podmiana wody (20-30%) z odmulaniem dna', type: 'pielegnacja', icon: '💧', frequency: 'Raz w tygodniu' },
          { id: 'fish-glass-clean', title: 'Czyszczenie szyb z nalotu glonowego (czyścik magnetyczny)', type: 'pielegnacja', icon: '🧽', frequency: 'Raz w tygodniu' },
          { id: 'fish-filter-rinse', title: 'Płukanie wkładów filtra (UWAGA: tylko w wodzie z podmiany!)', type: 'pielegnacja', icon: '🧼', frequency: 'Co 2–4 tygodnie' },
          { id: 'fish-water-test', title: 'Test parametrów wody kropelkowy (NO2, NO3, pH, GH/KH)', type: 'wizyta', icon: '🧪', frequency: 'Co 1–2 tygodnie' },
          { id: 'fish-plants', title: 'Przycinanie roślin i podanie nawozu mikro/makro', type: 'pielegnacja', icon: '🌿', frequency: 'Co 1–2 tygodnie' },
        ]
      }
    ]
  },

  inne: {
    speciesKey: 'inne',
    speciesName: 'Inne zwierzę domowe',
    emoji: '🐾',
    intro: 'Uniwersalny harmonogram troski o pupila: woda, pożywienie, ruch i profilaktyka.',
    goldenRule: '❤️ Systematyczność, czystość i uważna obserwacja samopoczucia to klucz do zdrowia każdego zwierzaka.',
    quickPresets: [
      { title: 'Wymiana wody na świeżą', type: 'pielegnacja', time: '08:00', notes: 'Zapewnij stały dostęp do czystej wody' },
      { title: 'Poranne karmienie', type: 'pielegnacja', time: '08:30', notes: 'Zgodnie z zapotrzebowaniem gatunku' },
      { title: 'Szybka kontrola samopoczucia', type: 'wizyta', time: '09:00', notes: 'Apetyt, zachowanie i wygląd' },
      { title: 'Zabawa, ruch lub wybieg', type: 'pielegnacja', time: '16:00', notes: 'Czas aktywności poza klatką/miejscem snu' },
      { title: 'Wieczorne sprzątanie toalety / klatki', type: 'pielegnacja', time: '19:30', notes: 'Usunięcie zabrudzeń i resztek' },
      { title: 'Pielęgnacja sierści / pancerza / łapek', type: 'pielegnacja', notes: 'Czesanie lub higiena' },
      { title: 'Kontrola wagi pupila', type: 'wizyta', notes: 'Okresowe ważenie' },
      { title: 'Wizyta kontrolna u weterynarza', type: 'wizyta', notes: 'Przegląd okresowy u lekarza weterynarii' },
      { title: 'Podanie suplementów lub leków', type: 'leki', notes: 'Zgodnie z zaleceniem lekarskim' }
    ],
    sections: [
      {
        id: 'morning',
        title: 'Rano',
        subtitle: 'Woda i poranny posiłek',
        icon: '☀️',
        items: [
          { id: 'other-water-am', title: 'Wymiana wody na świeżą i czystą', type: 'pielegnacja', time: '08:00', icon: '💧', frequency: 'Codziennie rano' },
          { id: 'other-food-am', title: 'Poranne karmienie pupila', type: 'pielegnacja', time: '08:30', icon: '🥣', frequency: 'Codziennie rano' },
          { id: 'other-check-am', title: 'Szybkie sprawdzenie samopoczucia i apetytu', type: 'wizyta', time: '09:00', icon: '🩺', frequency: 'Codziennie rano' },
        ]
      },
      {
        id: 'day',
        title: 'W ciągu dnia',
        subtitle: 'Aktywność, ruch i uwaga',
        icon: '🌤️',
        items: [
          { id: 'other-play', title: 'Kontakt, zabawa, wybieg lub spacer', type: 'pielegnacja', time: '15:30', icon: '🎾', frequency: 'Codziennie' },
        ]
      },
      {
        id: 'evening',
        title: 'Wieczorem',
        subtitle: 'Kolacja i czyste otoczenie',
        icon: '🌙',
        items: [
          { id: 'other-dinner', title: 'Wieczorny posiłek i uzupełnienie wody', type: 'pielegnacja', time: '19:00', icon: '🍲', frequency: 'Codziennie wieczorem' },
          { id: 'other-spot-clean', title: 'Punktowe sprzątanie miejsca pobytu / toalety', type: 'pielegnacja', time: '19:30', icon: '🧹', frequency: 'Codziennie wieczorem' },
        ]
      },
      {
        id: 'periodic',
        title: 'Zadania cykliczne (nie codziennie)',
        subtitle: 'Higiena generalna i profilaktyka',
        icon: '📅',
        items: [
          { id: 'other-clean-full', title: 'Generalne sprzątanie i mycie klatki / legowiska / akwarium', type: 'pielegnacja', icon: '🧼', frequency: 'Co 1–2 tygodnie' },
          { id: 'other-weight', title: 'Kontrola wagi pupila', type: 'wizyta', icon: '⚖️', frequency: 'Co 1–4 tygodnie' },
          { id: 'other-vet', title: 'Wizyta profilaktyczna u weterynarza', type: 'wizyta', icon: '🩺', frequency: 'Raz w roku' },
        ]
      }
    ]
  }
};

// Resolver function that detects species plan gracefully
export function getCarePlanForPet(species: SpeciesType, customSpecies?: string, petNotes?: string): SpeciesCarePlan {
  // Check if custom species or notes mention guinea pig / kawia
  const textToCheck = `${species} ${customSpecies || ''} ${petNotes || ''}`.toLowerCase();
  
  if (
    species === 'swinka_morska' ||
    textToCheck.includes('śwink') ||
    textToCheck.includes('swink') ||
    textToCheck.includes('kawi') ||
    textToCheck.includes('cavy') ||
    textToCheck.includes('guinea')
  ) {
    return CARE_CHECKLISTS.swinka_morska;
  }

  if (CARE_CHECKLISTS[species]) {
    return CARE_CHECKLISTS[species];
  }

  // Fallback checks
  if (textToCheck.includes('pies') || textToCheck.includes('dog')) return CARE_CHECKLISTS.pies;
  if (textToCheck.includes('kot') || textToCheck.includes('cat')) return CARE_CHECKLISTS.kot;
  if (textToCheck.includes('królik') || textToCheck.includes('krolik') || textToCheck.includes('rabbit')) return CARE_CHECKLISTS.krolik;
  if (textToCheck.includes('chomik') || textToCheck.includes('mysz') || textToCheck.includes('szczur')) return CARE_CHECKLISTS.chomik;
  if (textToCheck.includes('papug') || textToCheck.includes('kanar') || textToCheck.includes('ptak')) return CARE_CHECKLISTS.papuga;
  if (textToCheck.includes('jaszczurk') || textToCheck.includes('gekon') || textToCheck.includes('agama') || textToCheck.includes('gad') || textToCheck.includes('wąż')) return CARE_CHECKLISTS.jaszczurka;
  if (textToCheck.includes('rybk') || textToCheck.includes('akwari')) return CARE_CHECKLISTS.rybki;

  return CARE_CHECKLISTS.inne;
}
