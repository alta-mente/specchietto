# Specchietto

SaaS multi-tenant per prenotazioni di servizi alla persona (parrucchieri, centri estetici, nail artist).

Nato come fork selettivo dell'infrastruttura di [Ficodindia](../beautiful-franklin): stessa base di autenticazione, CRM clienti, notifiche email/WhatsApp/push, multi-tenant e shell Capacitor per l'app mobile. Il motore di prenotazione (risorse/operatori, servizi a durata variabile, disponibilità) è stato progettato e scritto da zero — non è un adattamento del modello "tavoli" di Ficodindia.

## Stato attuale

- Frontend: scheletro Vite + React, nessuna UI di prodotto ancora.
- Backend: `backend/server.js` contiene auth, tenant (`restaurants`), settings, CRM clienti, device push, leads, notifiche email, oltre al nuovo modello di prenotazione:
  - `resources` — operatori/postazioni prenotabili, ognuno con orario proprio
  - `services` — catalogo servizi con durata variabile e prezzo
  - `resource_services` — quali servizi può eseguire ogni operatore
  - `resource_hours` / `resource_exceptions` — orario settimanale ricorrente + eccezioni (ferie, chiusure straordinarie, orari speciali)
  - `appointments` — prenotazioni, stessa macchina a stati di Ficodindia (pending/accepted/arrived/completed/noshow/declined/cancelled)
  - motore di disponibilità (`GET /api/resources/:id/availability`) che calcola gli slot liberi per singola risorsa in base alla durata del servizio scelto
  - `sendSurveyEmail` e `sendPushNotificationToAll` sono pronte ma non ancora agganciate (vedi `// TODO` nel codice) — andranno richiamate dalla creazione/completamento di un appuntamento
- Mobile: piattaforma Android via Capacitor già inizializzata (`com.specchietto.app`).

## Prossimi passi

1. Costruire le schermate reali (oggi `App.jsx` è solo un placeholder): calendario/agenda per operatore, gestione servizi, booking cliente.
2. Agganciare le notifiche (survey email, push) alla creazione/completamento appuntamento.
3. Identità di brand (logo, palette, tono di voce) — deciso solo il nome.

## Sviluppo locale

```bash
npm install
npm run dev

cd backend && npm install && node server.js
```
