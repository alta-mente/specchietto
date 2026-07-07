# Specchietto

SaaS multi-tenant per prenotazioni di servizi alla persona (parrucchieri, centri estetici, nail artist).

Nato come fork selettivo dell'infrastruttura di [Ficodindia](../beautiful-franklin): stessa base di autenticazione, CRM clienti, notifiche email/WhatsApp/push, multi-tenant e shell Capacitor per l'app mobile. Il motore di prenotazione (risorse/operatori, servizi a durata variabile, disponibilità) è da progettare e scrivere da zero — non è un adattamento del modello "tavoli" di Ficodindia.

## Stato attuale

- Frontend: scheletro Vite + React, nessuna UI di prodotto ancora.
- Backend: `backend/server.js` contiene auth, tenant (`restaurants`), settings, CRM clienti, device push, leads, notifiche email — ripulito da tutta la logica ordini/tavoli/menu di Ficodindia. Cercare i commenti `// TODO` per i punti da completare.
- Mobile: piattaforma Android via Capacitor già inizializzata (`com.specchietto.app`).

## Prossimi passi

1. Disegnare il modello dati: risorse/operatori, servizi con durata, motore di disponibilità, tabella appuntamenti.
2. Costruire le schermate reali (oggi `App.jsx` è solo un placeholder).
3. Identità di brand (logo, palette, tono di voce) — deciso solo il nome.

## Sviluppo locale

```bash
npm install
npm run dev

cd backend && npm install && node server.js
```
