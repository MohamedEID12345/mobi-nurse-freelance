'use client';
import { Field } from './ui';

export interface Gov { id: string; nameAr: string; active: boolean; bookingsEnabled?: boolean; travelFee?: number; cities: Array<{ id: string; nameAr: string }> }

export function GeoSelect({ governorates, governorateId, cityId, onChange, onlyActive }: {
  governorates: Gov[]; governorateId: string; cityId: string; onlyActive: boolean;
  onChange: (v: { governorateId: string; cityId: string }) => void;
}) {
  const gov = governorates.find((g) => g.id === governorateId);
  return (
    <div className="grid2">
      <Field label="المحافظة">
        <select value={governorateId} onChange={(e) => onChange({ governorateId: e.target.value, cityId: '' })} required>
          <option value="">اختر</option>
          {governorates.filter((g) => !onlyActive || g.active).map((g) => (
            <option key={g.id} value={g.id}>{g.nameAr}{!g.active ? ' (قريباً)' : ''}</option>
          ))}
        </select>
      </Field>
      <Field label="المدينة / المركز">
        <select value={cityId} onChange={(e) => onChange({ governorateId, cityId: e.target.value })} required disabled={!gov}>
          <option value="">اختر</option>
          {(gov?.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
        </select>
      </Field>
    </div>
  );
}
