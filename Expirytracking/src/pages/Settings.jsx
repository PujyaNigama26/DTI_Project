import { useState, useEffect } from 'react';
import { Save, MapPin } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function LocationMarker({ position, setPosition, setForm }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setForm(prev => ({ ...prev, storeLocation: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  
  // Default to London, or parse existing location
  const [mapPosition, setMapPosition] = useState([51.505, -0.09]);

  useEffect(() => {
    if (form.storeLocation && form.storeLocation.includes(',')) {
      const parts = form.storeLocation.split(',');
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapPosition([lat, lng]);
      }
    }
  }, [form.storeLocation]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDetectLocation = (e) => {
    e.preventDefault();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapPosition([lat, lng]);
          setForm(prev => ({ ...prev, storeLocation: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
        },
        () => alert("Could not get your location. Please check browser permissions.")
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage your store information and precision location</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-5 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'storeName', label: 'Store Name' },
            { name: 'contact', label: 'Contact Number' },
            { name: 'email', label: 'Email Address' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
          ))}
          
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>

        {/* Dynamic Location Map */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-800">Precise Store Location</label>
            <button 
              onClick={handleDetectLocation}
              type="button" 
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition"
            >
              <MapPin size={14} /> Detect Current Location
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Click anywhere on the map to drop a pin, or use the detect button.</p>
          
          <div className="h-64 rounded-lg overflow-hidden border border-slate-200 mb-3 z-0 relative">
            <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <LocationMarker position={mapPosition} setPosition={setMapPosition} setForm={setForm} />
            </MapContainer>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">GPS Coordinates (Auto-filled)</label>
            <input
              type="text"
              name="storeLocation"
              value={form.storeLocation}
              onChange={handleChange}
              placeholder="e.g. 40.7128, -74.0060"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 read-only outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save size={16} />
            Save Store Settings
          </button>
          
          {saved && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
              ✓ Saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
