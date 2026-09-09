import { Employee, LocationItem } from '../types';
import { toPersianDigits } from './shamsi';

/**
 * Formats an employee's location according to the standard pattern:
 * ساختمان [نام] - واحد [شماره] - طبقه [شماره] - اتاق [شماره]
 * 
 * Rules:
 * - Omits any component that is empty, null, or undefined.
 * - Does not duplicate prefixes (e.g. "ساختمان", "واحد", "طبقه", "اتاق").
 * - Converts numerals to Persian digits.
 * - If subsequent fields are empty, removes them and their separators.
 */
export function formatEmployeeLocation(
  emp: Partial<Employee> | undefined | null,
  locations?: LocationItem[] | Map<string, LocationItem>
): string {
  if (!emp) return '';

  let loc: LocationItem | undefined;
  if (locations) {
    if (locations instanceof Map) {
      loc = emp.location_id ? locations.get(emp.location_id) : undefined;
    } else if (Array.isArray(locations)) {
      loc = locations.find((l) => l.id === emp.location_id);
    }
  }

  // 1. Raw values resolution
  let rawBuilding = (loc?.building || (emp as any).building || '').trim();
  let rawUnit = (loc?.unit || (emp as any).unit || '').trim();
  let rawFloor = (loc?.floor || (emp as any).floor || '').trim();
  
  // Room: employee-specific room takes precedence over general location room
  let rawRoom = (emp.room || (emp as any).room_number || loc?.room || '').trim();

  // If loc has a composite name but individual fields were blank
  if (!rawBuilding && !rawUnit && !rawFloor && loc?.name) {
    const parts = loc.name.split(' - ').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (!rawBuilding && /^(ساختمان|سوله|مجتمع|برج|مرکز|ستاد|سازمان)\b/u.test(part)) {
        rawBuilding = part;
      } else if (!rawUnit && /^واحد\b/u.test(part)) {
        rawUnit = part.replace(/^واحد\s*/u, '');
      } else if (!rawFloor && /^(طبقه|ط)\b/u.test(part)) {
        rawFloor = part.replace(/^(طبقه|ط)\s*/u, '');
      } else if (!rawRoom && /^اتاق\b/u.test(part)) {
        rawRoom = part.replace(/^اتاق\s*/u, '');
      } else if (!rawBuilding) {
        rawBuilding = part;
      }
    }
    if (!rawBuilding && !rawUnit && !rawFloor && !rawRoom) {
      return loc.name;
    }
  }

  // 2. Building formatting
  let buildingPart = '';
  if (rawBuilding) {
    const trimmed = rawBuilding.trim();
    if (/^(ساختمان|سوله|مجتمع|برج|مرکز|ستاد|سازمان)\b/u.test(trimmed)) {
      buildingPart = toPersianDigits(trimmed);
    } else {
      buildingPart = `ساختمان ${toPersianDigits(trimmed)}`;
    }
  }

  // 3. Unit formatting
  let unitPart = '';
  if (rawUnit) {
    const cleanUnit = rawUnit.replace(/^واحد\s*/u, '').trim();
    if (cleanUnit) {
      unitPart = `واحد ${toPersianDigits(cleanUnit)}`;
    }
  }

  // 4. Floor formatting
  let floorPart = '';
  if (rawFloor) {
    let cleanFloor = rawFloor.replace(/^(ط\.?|طبقه)\s*/u, '').trim();
    if (cleanFloor === 'همکف' || cleanFloor === 'زیرزمین') {
      floorPart = `طبقه ${cleanFloor}`;
    } else if (cleanFloor) {
      floorPart = `طبقه ${toPersianDigits(cleanFloor)}`;
    }
  }

  // 5. Room formatting
  let roomPart = '';
  if (rawRoom) {
    let cleanRoom = rawRoom.trim();
    if (/^اتاق\b/u.test(cleanRoom)) {
      const rest = cleanRoom.replace(/^اتاق\s*/u, '').trim();
      roomPart = `اتاق ${toPersianDigits(rest)}`;
    } else if (/^(دفتر|لابراتوار|سالن|آزمایشگاه|بخش|کارگاه|انبار)\b/u.test(cleanRoom)) {
      roomPart = toPersianDigits(cleanRoom);
    } else {
      roomPart = `اتاق ${toPersianDigits(cleanRoom)}`;
    }
  }

  // 6. Assemble and omit empty fields
  const parts = [buildingPart, unitPart, floorPart, roomPart].filter(Boolean);
  return parts.join(' - ');
}
