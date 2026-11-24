#!/usr/bin/env python3
"""Count availability of mobile.de energy fields without exposing credentials or ad text."""
from collections import Counter, defaultdict
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import os

spec = spec_from_file_location('mobile_sync', Path(__file__).with_name('sync-mobile-inventory.py'))
sync = module_from_spec(spec)
spec.loader.exec_module(sync)

FIELDS = {
    'wltpValues.co2EmissionCombined': ('wltpValues', 'co2EmissionCombined'),
    'wltpValues.co2EmissionCombinedWeighted': ('wltpValues', 'co2EmissionCombinedWeighted'),
    'wltpValues.consumptionPowerCombined': ('wltpValues', 'consumptionPowerCombined'),
    'wltpValues.consumptionPowerCombinedWeighted': ('wltpValues', 'consumptionPowerCombinedWeighted'),
    'wltpValues.consumptionFuelCombined': ('wltpValues', 'consumptionFuelCombined'),
    'wltpValues.consumptionFuelCombinedWeighted': ('wltpValues', 'consumptionFuelCombinedWeighted'),
    'wltpValues.electricRange': ('wltpValues', 'electricRange'),
    'emissions.combined.co2': ('emissions', 'combined', 'co2'),
    'emissions.combined.co2Class': ('emissions', 'combined', 'co2Class'),
    'emissions.discharged.co2': ('emissions', 'discharged', 'co2'),
    'emissions.discharged.co2Class': ('emissions', 'discharged', 'co2Class'),
    'consumptions.fuel.combined': ('consumptions', 'fuel', 'combined'),
    'consumptions.power.combined': ('consumptions', 'power', 'combined'),
    'consumptions.weightedCombinedFuel': ('consumptions', 'weightedCombinedFuel'),
    'consumptions.weightedCombinedPower': ('consumptions', 'weightedCombinedPower'),
    'range': ('range',),
    'equivalentAllElectricRange': ('equivalentAllElectricRange',),
    'costModel': ('costModel',),
}


def present(ad, keys):
    value = ad
    for key in keys:
        if not isinstance(value, dict) or key not in value:
            return False
        value = value[key]
    return value is not None and value != '' and value != {} and value != []


def main():
    username = os.environ.get('MOBILE_API_USERNAME', '').strip()
    password = os.environ.get('MOBILE_API_PASSWORD', '')
    if not username or not password:
        raise SystemExit('mobile.de credentials unavailable in GitHub Actions secrets')
    first = sync.fetch_page(username, password, 1)
    pages = int(first.get('maxPages') or 1)
    ads = list(first['ads'])
    for page in range(2, pages + 1):
        ads.extend(sync.fetch_page(username, password, page)['ads'])
    if len(ads) < int(first.get('total') or 0):
        raise RuntimeError('Incomplete result set; no availability report produced')
    groups = defaultdict(Counter)
    missing_detail = 0
    for ad in ads:
        ad_id = str(ad.get('mobileAdId') or '')
        detail = sync.fetch_ad_detail(username, password, ad_id) if ad_id else None
        if detail is None:
            missing_detail += 1
            continue
        ad = {**ad, **detail}
        condition = str(ad.get('condition') or 'UNKNOWN')
        vehicle_class = str(ad.get('vehicleClass') or 'UNKNOWN')
        fuel = str(ad.get('fuel') or 'UNKNOWN')
        # Values are API enums; do not print free text or contact data.
        safe = lambda text: text if text.replace('_', '').isalnum() and len(text) <= 40 else 'OTHER'
        key = (safe(condition), safe(vehicle_class), safe(fuel))
        groups[key]['total'] += 1
        for label, path in FIELDS.items():
            if present(ad, path):
                groups[key][label] += 1
    print(f'API reports {first.get("total", "unknown")} ads; processed {len(ads)}; unavailable details: {missing_detail}')
    print('Only counts of field presence are shown; zero is a valid present value.')
    for key in sorted(groups):
        counts = groups[key]
        print(f'\nGROUP condition={key[0]} vehicleClass={key[1]} fuel={key[2]} count={counts["total"]}')
        for label in FIELDS:
            print(f'  {label}: {counts[label]}/{counts["total"]}')
    if missing_detail:
        raise SystemExit('Incomplete audit: some detail records were unavailable')


if __name__ == '__main__':
    main()
