import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

const KEYS = [
  'auth_token',
  'auth_user',
  'auth_token_admin',
  'auth_user_admin',
  'auth_token_merchant',
  'auth_user_merchant',
  'customer_business_id',
  'merchant_business_id',
  'admin_business_id',
  'customer_name',
  'customer_phone',
  'customer_email',
  'backend_ip',
  'saas_theme',
  'explicit_logout_merchant_pc',
  'explicit_logout_merchant_mobile'
];

// Memory cache to allow synchronous access to values
const cache = {};

export const storageService = {
  async init() {
    // 1. Populate cache and localStorage first (for fast web synchronous loading)
    for (const key of KEYS) {
      cache[key] = localStorage.getItem(key) || '';
    }

    // 2. If running native, load and sync from Capacitor Preferences (never cleared by OS)
    if (isNative) {
      try {
        console.log('📱 storageService: Inizializzazione storage nativo...');
        for (const key of KEYS) {
          const { value } = await Preferences.get({ key });
          if (value !== null) {
            cache[key] = value;
            localStorage.setItem(key, value);
            console.log(`🔑 storageService: Caricato nativo per ${key}: ${key === 'auth_token' ? '[REDACTED]' : value}`);
          } else {
            // Migration: if it exists locally but not nativly, copy to native
            const localVal = localStorage.getItem(key);
            if (localVal !== null && localVal !== '') {
              cache[key] = localVal;
              await Preferences.set({ key, value: localVal });
              console.log(`💾 storageService: Migrato locale a nativo per ${key}`);
            }
          }
        }
      } catch (e) {
        console.error('⚠️ storageService: Errore durante caricamento Preferences nativo:', e);
      }
    }
  },

  getItem(key) {
    // Check cache, fallback to localStorage if cache doesn't have it
    if (cache[key] !== undefined) {
      return cache[key];
    }
    return localStorage.getItem(key) || '';
  },

  async setItem(key, value) {
    const valString = String(value);
    cache[key] = valString;
    localStorage.setItem(key, valString);
    
    if (isNative) {
      try {
        await Preferences.set({ key, value: valString });
      } catch (e) {
        console.error(`⚠️ storageService: Errore nel salvare ${key} in Preferences:`, e);
      }
    }
  },

  async removeItem(key) {
    cache[key] = '';
    localStorage.removeItem(key);
    
    if (isNative) {
      try {
        await Preferences.remove({ key });
      } catch (e) {
        console.error(`⚠️ storageService: Errore nella rimozione di ${key} da Preferences:`, e);
      }
    }
  }
};
