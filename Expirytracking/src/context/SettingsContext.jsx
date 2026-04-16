import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const SettingsContext = createContext();

const defaultSettings = {
  storeName: 'My Store',
  contact: '',
  address: '',
  email: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // Fetch settings from API on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/store');
        if (data && data.storeName) {
          setSettings({
            storeName: data.storeName,
            contact: data.contact,
            address: data.address,
            email: data.email
          });
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      // Save directly to API
      await api.put('/store', newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error('Failed to save store settings:', err);
      // Still update local state so UI feels responsive
      setSettings(newSettings);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
