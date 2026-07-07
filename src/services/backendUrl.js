import { Capacitor } from '@capacitor/core';
import { storageService } from './storageService';

export const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (Capacitor.isNativePlatform()) {
    const savedIp = storageService.getItem('backend_ip');
    if (savedIp) {
      return /^https?:\/\//i.test(savedIp) ? savedIp : `http://${savedIp}:3001`;
    }
    return 'http://192.168.1.100:3001';
  }

  // Same-origin on Vercel: relative paths, rewritten to the backend service per vercel.json
  if (window.location.hostname.includes('vercel.app')) {
    return '';
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // Other web hosts: assume the backend runs on the same host, port 3001
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};
