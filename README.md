# Places Frontend

Aceasta este interfața web a proiectului Places, o aplicație dezvoltată pentru a facilita gestionarea rezervărilor de birouri și săli de ședință. Proiectul este construit folosind tehnologii moderne precum Next.js, React și Material UI, oferind o experiență de utilizare fluidă și receptivă.

## Setup și Rulare

Pentru a porni aplicația pe un mediu local de dezvoltare, urmează pașii descriși mai jos.

### Cerințe preliminare
Înainte de a începe, asigură-te că ai instalate următoarele:
- Node.js (versiunea 18 sau mai recentă)
- Un manager de pachete precum npm sau yarn
- Optional: utilitarul [just](https://github.com/casey/just) pentru a rula comenzile de automatizare definite în proiect.

### Instalare
1. Navighează în folderul dedicat frontend-ului:
   ```bash
   cd Places-frontend
   ```
2. Instalează pachetele necesare:
   ```bash
   npm install
   ```

### Rulare
Există două moduri principale prin care poți porni aplicația:

#### Varianta 1: Folosind just (metoda recomandată)
Din directorul principal al proiectului, poți rula comanda:
```bash
just frontend
```
Aceasta va lansa serverul de dezvoltare și va încerca să deschidă automat browserul la adresa [http://localhost:3000](http://localhost:3000).

#### Varianta 2: Folosind npm direct
Dacă preferi să rulezi comanda standard, mergi în `Places-frontend` și execută:
```bash
npm run dev
```
Aplicația va fi disponibilă la [http://localhost:3000](http://localhost:3000).

---

## Conturi de Utilizator Predefinite

Baza de date a proiectului este deja populată cu câteva conturi de test pentru a facilita verificarea funcționalităților. Parola pentru toate conturile de mai jos este `ChangeMe123!`.

| Rol | Utilizator | Email |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin@places.local` |
| **Manager** | `elena` | `elena@places.local` |
| **Employee** | `alex.smith.8` | `alex.smith.8@places.local` |

---

## Detalii Tehnice

Aplicația folosește următoarele tehnologii și biblioteci principale:

- **Framework**: Next.js 14 (folosind structura App Router)
- **Limbaj**: TypeScript pentru siguranța tipurilor
- **Styling**: Material UI (MUI) completat de Tailwind CSS pentru layout-uri rapide
- **Icoane**: Setul oficial Material Icons
- **Servicii Externe**: @dicebear/core pentru generarea dinamică a avatarelor
- **Comunicare API**: Fetch API și WebSockets pentru funcționalitatea de chat în timp real

---

## Integrarea cu Backend-ul

Frontend-ul este configurat să comunice cu microserviciile din backend prin variabile de mediu. În configurația standard, se presupune că API-ul este accesibil la `http://localhost:8000`.

Dacă vrei să pornești întreaga suită de servicii (atât backend-ul în Docker, cât și frontend-ul), poți folosi comanda:
```bash
just both
```
Aceasta va ridica infrastructura necesară și va porni aplicația web.

---

## Organizarea Codului

Structura principală a directoarelor în `src` este următoarea:

- `app`: Conține paginile aplicației și definirea rutelor.
- `components`: Componente React reutilizabile folosite în pagini.
- `services`: Logica de comunicare cu serverul, în principal fișierul `api.ts`.
- `types`: Interfețe și tipuri TypeScript globale.
- `public`: Resurse statice, cum ar fi imagini sau fonturi.
