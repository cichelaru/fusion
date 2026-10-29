# Fusion (Angular, fără backend)

Asistent intern care găsește informația în documentele HR/IT/politici și îndrumă colegii către persoana sau formularul potrivit.
Toate datele sunt locale (fișiere JSON + localStorage). Nu există server de aplicație.

## Rulare

```bash
npm install
npm start          # http://localhost:4200
npm run build      # rezultat în dist/fusion/browser (se poate servi de orice server static)
```

Cere Node 20+ și Angular 19. Rutele folosesc `#` (ex. `/#/asistent`), deci nu e nevoie de redirecturi pe server.

## Structură

```
public/
  data/lib.json       index al celor 1312 documente [nume, folder, fragment, dată]
  data/cost.json      cubul de cost OPEX (din dashboardul „Cost mediu / comandă unică”)
  data/users.json     utilizatori demo + rol (angajat / owner / admin)
  data/systems.json   harta de integrare (Conexiuni sisteme)
  logo.jpg
src/app/
  core/               servicii (fără UI)
    data.service      încarcă fișierele JSON
    auth.service      login simulat (sessionStorage), rol, profil
    guards.ts         authGuard + roleGuard (rutele owner / admin)
    state.service     contoare, cereri, goluri, intrări adăugate (localStorage)
    kb.data.ts        baza de cunoștințe (TypeScript, intrările citesc profilul)
    kb.service        baza de cunoștințe + intrările adăugate de owner
    search.service    căutare în index
    cost.service      interogări de cost + răspunsuri pentru chat
    assistant.service potrivire intenție, răspunsuri, formulare, interacțiuni din chat
  features/           login, assistant, personal, dashboards (owner, admin), flow, shared
```

## Roluri

| Secțiune | Angajat | Owner | Admin |
|---|---|---|---|
| Asistent, Dashboardul meu, Cum funcționează | da | da | da |
| Întrebări de cost în asistent | nu | da | da |
| Dashboard owner | nu | da | nu |
| Dashboard admin (activitate, cost, conexiuni, utilizatori, bază de cunoștințe) | nu | nu | da |

Pragul pentru costuri: `COST_MIN_RANK` în `core/cost.service.ts` (0 = toți, 1 = owner, 2 = doar admin).

## Date salvate local

`localStorage`: `fusion.requests`, `fusion.kbExtra`, `fusion.roles`. `sessionStorage`: `fusion.user`.
Din Dashboard admin există butonul „Resetează datele salvate local”.

## Trecerea la un backend mai târziu

Doar `DataService` (citire) și `StateService` / `AuthService` (scriere, login) ating datele. Se înlocuiesc apelurile la `data/*.json` cu API-uri, iar login-ul simulat cu MSAL (Microsoft Entra ID). Componentele rămân neschimbate.

## Notă

Proiectul a fost scris fără acces la npm, deci nu a fost compilat cu Angular. Codul TypeScript din `core/` a fost verificat cu `tsc`, iar logica asistentului a fost rulată local. Dacă `ng build` dă erori de șabloane, creează un proiect nou (`ng new fusion --style=scss --routing=false`) și copiază în el `src/` și `public/`, plus secțiunea `assets`/`styles` din `angular.json`.
