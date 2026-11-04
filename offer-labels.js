window.RosenkranzOfferLabels = {
  unique(vehicles) {
    const seen = new Set();
    return vehicles.filter(vehicle => {
      const id = String(vehicle.id || '').trim();
      const url = String(vehicle.url || '').trim();
      const key = id ? `id:${id}` : url ? `url:${url}` : '';
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  meta(vehicle) {
    const condition = String(vehicle.condition || '').toUpperCase();
    const conditionLabel = ({ USED: 'Gebrauchtwagen', NEW: 'Neuwagen', PRE_REGISTERED: 'Tageszulassung', DEMONSTRATION: 'Vorführwagen' })[condition]
      || (/van|commercial/i.test(String(vehicle.vehicleClass || '')) ? 'Nutzfahrzeug' : 'PKW');
    const categoryKey = String(vehicle.category || '').toLowerCase().replace(/[^a-z]/g, '');
    const categoryLabel = ({ offroad: 'SUV', smallcar: 'Kleinwagen', estatecar: 'Kombi', van: 'Van', limousine: 'Limousine', stakebodyvan: 'Pritschenwagen' })[categoryKey]
      || (vehicle.category && !/^[A-Z_]+$/.test(vehicle.category) ? vehicle.category : '');
    return [conditionLabel, categoryLabel, vehicle.firstRegistration ? `EZ ${vehicle.firstRegistration}` : '', vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString('de-DE')} km` : '']
      .filter(Boolean).join(' · ');
  }
};
