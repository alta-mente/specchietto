import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { getBackendUrl } from '../services/backendUrl';

const backendUrl = getBackendUrl();

export const useSpecchiettoSync = () => {
  const [token, setToken] = useState(() => storageService.getItem('auth_token_admin') || '');
  const [user, setUser] = useState(() => {
    const raw = storageService.getItem('auth_user_admin');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [restaurantId, setRestaurantId] = useState(() => storageService.getItem('admin_business_id') || '');

  const [restaurants, setRestaurants] = useState([]);
  const [resources, setResources] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [coupons, setCoupons] = useState([]);

  const authHeaders = useCallback(() => (
    token ? { 'Authorization': `Bearer ${token}` } : {}
  ), [token]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      setToken(data.token);
      setUser(data.user);
      storageService.setItem('auth_token_admin', data.token);
      storageService.setItem('auth_user_admin', JSON.stringify(data.user));

      if (data.user.restaurant_id) {
        setRestaurantId(data.user.restaurant_id);
        storageService.setItem('admin_business_id', data.user.restaurant_id);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Errore di connessione col server.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    storageService.removeItem('auth_token_admin');
    storageService.removeItem('auth_user_admin');
  }, []);

  const switchRestaurant = useCallback((id) => {
    setRestaurantId(id);
    storageService.setItem('admin_business_id', id);
  }, []);

  const refreshRestaurantsList = useCallback(async () => {
    const res = await fetch(`${backendUrl}/api/restaurants`);
    if (res.ok) setRestaurants(await res.json());
  }, []);

  const createRestaurant = useCallback(async (name, slug, category) => {
    const res = await fetch(`${backendUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, slug, category })
    });
    const data = await res.json();
    if (res.ok) {
      await refreshRestaurantsList();
      switchRestaurant(data.id);
    }
    return { success: res.ok, error: data.error, restaurant: data };
  }, [authHeaders, refreshRestaurantsList, switchRestaurant]);

  const refreshResources = useCallback(async () => {
    if (!restaurantId) return;
    const res = await fetch(`${backendUrl}/api/resources?restaurant_id=${restaurantId}`);
    setResources(await res.json());
  }, [restaurantId]);

  const refreshServices = useCallback(async () => {
    if (!restaurantId) return;
    const res = await fetch(`${backendUrl}/api/services?restaurant_id=${restaurantId}`);
    setServices(await res.json());
  }, [restaurantId]);

  const refreshAppointments = useCallback(async () => {
    if (!restaurantId || !token) return;
    const res = await fetch(`${backendUrl}/api/appointments?restaurant_id=${restaurantId}`, {
      headers: authHeaders()
    });
    if (res.ok) setAppointments(await res.json());
  }, [restaurantId, token, authHeaders]);

  useEffect(() => {
    if (token && user?.role === 'super_admin') {
      refreshRestaurantsList();
    }
  }, [token, user, refreshRestaurantsList]);

  const refreshCustomers = useCallback(async () => {
    if (!restaurantId || !token) return;
    const res = await fetch(`${backendUrl}/api/customers?restaurant_id=${restaurantId}`, {
      headers: authHeaders()
    });
    if (res.ok) setCustomers(await res.json());
  }, [restaurantId, token, authHeaders]);

  const refreshSettings = useCallback(async () => {
    if (!restaurantId) return;
    const res = await fetch(`${backendUrl}/api/settings?restaurant_id=${restaurantId}`);
    if (res.ok) setSettings(await res.json());
  }, [restaurantId]);

  const refreshCoupons = useCallback(async () => {
    if (!restaurantId) return;
    const res = await fetch(`${backendUrl}/api/coupons?restaurant_id=${restaurantId}`);
    if (res.ok) setCoupons(await res.json());
  }, [restaurantId]);

  useEffect(() => {
    if (token && restaurantId) {
      refreshResources();
      refreshServices();
      refreshAppointments();
      refreshCustomers();
      refreshSettings();
      refreshCoupons();
    }
  }, [token, restaurantId, refreshResources, refreshServices, refreshAppointments, refreshCustomers, refreshSettings, refreshCoupons]);

  const createResource = useCallback(async (name, type = 'operator') => {
    const res = await fetch(`${backendUrl}/api/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, name, type })
    });
    if (res.ok) await refreshResources();
    return res.ok;
  }, [restaurantId, authHeaders, refreshResources]);

  const deleteResource = useCallback(async (id) => {
    await fetch(`${backendUrl}/api/resources/${id}`, { method: 'DELETE', headers: authHeaders() });
    await refreshResources();
  }, [authHeaders, refreshResources]);

  const createService = useCallback(async (name, category, durationMinutes, price, isAddon = false) => {
    const res = await fetch(`${backendUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, name, category, duration_minutes: durationMinutes, price, is_addon: isAddon })
    });
    if (res.ok) await refreshServices();
    return res.ok;
  }, [restaurantId, authHeaders, refreshServices]);

  const deleteService = useCallback(async (id) => {
    await fetch(`${backendUrl}/api/services/${id}`, { method: 'DELETE', headers: authHeaders() });
    await refreshServices();
  }, [authHeaders, refreshServices]);

  const setResourceHours = useCallback(async (resourceId, hours) => {
    const res = await fetch(`${backendUrl}/api/resources/${resourceId}/hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ hours })
    });
    return res.ok;
  }, [authHeaders]);

  const setResourceServices = useCallback(async (resourceId, serviceIds) => {
    const res = await fetch(`${backendUrl}/api/resources/${resourceId}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ service_ids: serviceIds })
    });
    return res.ok;
  }, [authHeaders]);

  const fetchAvailability = useCallback(async (resourceId, date, serviceId) => {
    const res = await fetch(`${backendUrl}/api/resources/${resourceId}/availability?date=${date}&service_id=${serviceId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.slots || [];
  }, []);

  const createAppointment = useCallback(async ({ resourceId, serviceId, customerName, customerPhone, date, time, notes }) => {
    const res = await fetch(`${backendUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        resource_id: resourceId,
        service_id: serviceId,
        customer_name: customerName,
        customer_phone: customerPhone,
        date,
        time,
        notes
      })
    });
    const data = await res.json();
    if (res.ok) await refreshAppointments();
    return { success: res.ok, error: data.error, appointment: data };
  }, [restaurantId, refreshAppointments]);

  const updateAppointmentStatus = useCallback(async (id, status, reason = '') => {
    const res = await fetch(`${backendUrl}/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status, reason })
    });
    if (res.ok) await refreshAppointments();
    return res.ok;
  }, [authHeaders, refreshAppointments]);

  const saveCustomer = useCallback(async ({ phone, name, email, notes, noShowCount, blocked }) => {
    const res = await fetch(`${backendUrl}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        restaurant_id: restaurantId, phone, name, email, notes,
        no_show_count: noShowCount, blocked: blocked ? 1 : 0
      })
    });
    const data = await res.json();
    if (res.ok) await refreshCustomers();
    return { success: res.ok, error: data.error, customer: data };
  }, [restaurantId, authHeaders, refreshCustomers]);

  const deleteCustomer = useCallback(async (phone) => {
    await fetch(`${backendUrl}/api/customers/${encodeURIComponent(phone)}?restaurant_id=${restaurantId}`, {
      method: 'DELETE', headers: authHeaders()
    });
    await refreshCustomers();
  }, [restaurantId, authHeaders, refreshCustomers]);

  const updateBranding = useCallback(async (logo, primaryColor, accentColor) => {
    const res = await fetch(`${backendUrl}/api/restaurants/${restaurantId}/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ logo, primary_color: primaryColor, accent_color: accentColor })
    });
    if (res.ok) {
      await refreshRestaurantsList();
    }
    return res.ok;
  }, [restaurantId, authHeaders, refreshRestaurantsList]);

  const saveSettings = useCallback(async (settingsObj) => {
    const res = await fetch(`${backendUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, settings: settingsObj })
    });
    if (res.ok) {
      await refreshSettings();
    }
    return res.ok;
  }, [restaurantId, authHeaders, refreshSettings]);

  const createCoupon = useCallback(async (code, discount_type, discount_value) => {
    const res = await fetch(`${backendUrl}/api/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, code, discount_type, discount_value })
    });
    if (res.ok) await refreshCoupons();
    return res.ok;
  }, [restaurantId, authHeaders, refreshCoupons]);

  const deleteCoupon = useCallback(async (id) => {
    await fetch(`${backendUrl}/api/coupons/${id}?restaurant_id=${restaurantId}`, { method: 'DELETE', headers: authHeaders() });
    await refreshCoupons();
  }, [restaurantId, authHeaders, refreshCoupons]);

  const redeemPoints = useCallback(async (phone, points) => {
    const res = await fetch(`${backendUrl}/api/customers/${encodeURIComponent(phone)}/redeem_points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, points })
    });
    if (res.ok) await refreshCustomers();
    return res.ok;
  }, [restaurantId, authHeaders, refreshCustomers]);

  const updateRestaurantLoyalty = useCallback(async (loyalty_enabled, loyalty_points_per_euro, loyalty_reward_threshold, loyalty_reward_value) => {
    const res = await fetch(`${backendUrl}/api/restaurants/${restaurantId}/loyalty`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ loyalty_enabled, loyalty_points_per_euro, loyalty_reward_threshold, loyalty_reward_value })
    });
    if (res.ok) await refreshRestaurantsList();
    return res.ok;
  }, [restaurantId, authHeaders, refreshRestaurantsList]);

  const saveBranding = useCallback(async (brandingObj) => {
    const res = await fetch(`${backendUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restaurant_id: restaurantId, settings: brandingObj })
    });
    if (res.ok) {
      await refreshSettings();
    }
    return res.ok;
  }, [restaurantId, authHeaders, refreshSettings]);

  return {
    backendUrl,
    token,
    user,
    restaurantId,
    restaurants,
    resources,
    services,
    appointments,
    customers,
    settings,
    login,
    logout,
    switchRestaurant,
    createRestaurant,
    refreshRestaurantsList,
    createResource,
    deleteResource,
    createService,
    deleteService,
    setResourceHours,
    setResourceServices,
    fetchAvailability,
    createAppointment,
    updateAppointmentStatus,
    saveCustomer,
    deleteCustomer,
    redeemPoints,
    updateRestaurantLoyalty,
    saveBranding,
    refreshResources,
    refreshServices,
    refreshAppointments,
    refreshCustomers,
    refreshSettings,
    updateBranding,
    saveSettings,
    coupons,
    refreshCoupons,
    createCoupon,
    deleteCoupon
  };
};
