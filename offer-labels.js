window.RosenkranzOfferLabels = {
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
