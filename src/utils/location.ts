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
    const cleanLocName = loc.name.replace(/ساختمان\s+ساختمان/gu, 'ساختمان');
    const parts = cleanLocName.split(' - ').map((s) => s.trim()).filter(Boolean);
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
      return cleanLocName;
    }
  }

  // 2. Building formatting
  let buildingPart = '';
  if (rawBuilding) {
    let cleanBuilding = rawBuilding.trim().replace(/^(ساختمان\s*)+/u, '').trim();
    if (/^(سوله|مجتمع|برج|مرکز|ستاد|سازمان)\b/u.test(cleanBuilding)) {
      buildingPart = toPersianDigits(cleanBuilding);
    } else if (cleanBuilding) {
      buildingPart = `ساختمان ${toPersianDigits(cleanBuilding)}`;
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

/**
 * Returns clean, individual unit and floor strings for an employee,
 * formatted with Persian digits or special names (e.g. همکف).
 */
export function getEmployeeUnitAndFloor(
  emp: Partial<Employee> | undefined | null,
  locations?: LocationItem[] | Map<string, LocationItem>
): { unit: string; floor: string } {
  if (!emp) return { unit: '', floor: '' };

  let loc: LocationItem | undefined;
  if (locations) {
    if (locations instanceof Map) {
      loc = emp.location_id ? locations.get(emp.location_id) : undefined;
    } else if (Array.isArray(locations)) {
      loc = locations.find((l) => l.id === emp.location_id);
    }
  }

  // 1. Raw values
  let rawUnit = (emp.unit || (emp as any).unit || loc?.unit || (emp.custom_fields?.unit as string) || '').trim();
  let rawFloor = (emp.floor || (emp as any).floor || loc?.floor || (emp.custom_fields?.floor as string) || '').trim();

  // 2. Parse from composite location name if direct values are absent
  if ((!rawUnit || !rawFloor) && loc?.name) {
    const cleanLocName = loc.name.replace(/ساختمان\s+ساختمان/gu, 'ساختمان');
    const parts = cleanLocName.split(' - ').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (!rawUnit && /^واحد\b/u.test(part)) {
        rawUnit = part.replace(/^واحد\s*/u, '');
      } else if (!rawFloor && /^(طبقه|ط)\b/u.test(part)) {
        rawFloor = part.replace(/^(طبقه|ط)\s*/u, '');
      }
    }
  }

  // 3. Format Unit
  let unit = '';
  if (rawUnit) {
    const cleanUnit = rawUnit.replace(/^واحد\s*/u, '').trim();
    unit = toPersianDigits(cleanUnit || rawUnit);
  }

  // 4. Format Floor
  let floor = '';
  if (rawFloor) {
    const cleanFloor = rawFloor.replace(/^(ط\.?|طبقه)\s*/u, '').trim();
    if (cleanFloor === 'همکف' || cleanFloor === 'زیرزمین') {
      floor = cleanFloor;
    } else if (cleanFloor) {
      floor = toPersianDigits(cleanFloor);
    } else {
      floor = toPersianDigits(rawFloor);
    }
  }

  return { unit, floor };
}
