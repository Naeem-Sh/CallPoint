import { Employee, LocationItem } from '../types.ts';

export interface FieldCompletenessItem {
  id: string;
  label: string;
  filled: boolean;
  value?: string;
}

export interface ProfileCompleteness {
  percentage: number;
  filledCount: number;
  totalCount: number;
  isComplete: boolean;
  items: FieldCompletenessItem[];
}

/**
 * Calculates employee profile completeness based on the 11 key fields specified:
 * 1. نام (First Name)
 * 2. نام خانوادگی (Last Name)
 * 3. شماره پرسنلی (Personnel Code)
 * 4. واحد (Department)
 * 5. سمت (Position)
 * 6. حداقل یک شماره داخلی (At least one internal extension)
 * 7. حداقل یک شماره مستقیم (At least one direct phone)
 * 8. ساختمان (Building)
 * 9. واحد (Location Unit)
 * 10. طبقه (Floor)
 * 11. اتاق (Room)
 */
export function calculateProfileCompleteness(
  emp: Partial<Employee> | Record<string, any>,
  locations: LocationItem[] = []
): ProfileCompleteness {
  if (!emp) {
    return {
      percentage: 0,
      filledCount: 0,
      totalCount: 11,
      isComplete: false,
      items: [],
    };
  }

  // Linked location item if location_id is present
  const loc = emp.location_id ? locations.find((l) => l.id === emp.location_id) : undefined;

  // 1. First Name (نام)
  const firstName = String(emp.first_name || '').trim();
  const hasFirstName = firstName.length > 0;

  // 2. Last Name (نام خانوادگی)
  const lastName = String(emp.last_name || '').trim();
  const hasLastName = lastName.length > 0;

  // 3. Personnel Code (شماره پرسنلی)
  const personnelCode = String(emp.personnel_code || '').trim();
  const hasPersonnelCode = personnelCode.length > 0;

  // 4. Department (واحد سازمانی)
  const departmentId = String(emp.department_id || '').trim();
  const hasDepartment = departmentId.length > 0;

  // 5. Position (سمت سازمانی)
  const positionId = String(emp.position_id || '').trim();
  const hasPosition = positionId.length > 0;

  // 6. Extension (داخلی - حداقل یک شماره)
  const extFromDirect = String(emp.extension || '').trim();
  const extFromPhones = Array.isArray(emp.phones)
    ? emp.phones.find(
        (p: any) =>
          (p.type === 'extension' || p.label?.includes('داخلی')) &&
          String(p.number || '').trim().length > 0
      )?.number
    : undefined;
  const extensionVal = extFromDirect || extFromPhones || '';
  const hasExtension = extensionVal.trim().length > 0;

  // 7. Direct Phone (تلفن مستقیم - حداقل یک شماره)
  const dirFromDirect = String(emp.direct_phone || '').trim();
  const dirFromPhones = Array.isArray(emp.phones)
    ? emp.phones.find(
        (p: any) =>
          (p.type === 'direct' ||
            p.type === 'office' ||
            p.type === 'phone' ||
            p.label?.includes('مستقیم') ||
            p.label?.includes('مستقیم کار')) &&
          String(p.number || '').trim().length > 0
      )?.number
    : undefined;
  const directPhoneVal = dirFromDirect || dirFromPhones || '';
  const hasDirectPhone = directPhoneVal.trim().length > 0;

  // 8. Building (ساختمان)
  const buildingVal =
    String(emp.building || '').trim() ||
    String(loc?.building || '').trim() ||
    String(loc?.name || '').trim();
  const hasBuilding = buildingVal.length > 0 && Boolean(emp.location_id || emp.building);

  // 9. Unit (واحد محل استقرار)
  const unitVal = String(emp.unit || '').trim();
  const hasUnit = unitVal.length > 0;

  // 10. Floor (طبقه)
  const floorVal = String(emp.floor || '').trim();
  const hasFloor = floorVal.length > 0;

  // 11. Room (اتاق)
  const roomVal = String(emp.room || '').trim();
  const hasRoom = roomVal.length > 0;

  const items: FieldCompletenessItem[] = [
    { id: 'first_name', label: 'نام', filled: hasFirstName, value: firstName },
    { id: 'last_name', label: 'نام خانوادگی', filled: hasLastName, value: lastName },
    { id: 'personnel_code', label: 'شماره پرسنلی', filled: hasPersonnelCode, value: personnelCode },
    { id: 'department', label: 'واحد سازمانی', filled: hasDepartment, value: departmentId },
    { id: 'position', label: 'سمت سازمانی', filled: hasPosition, value: positionId },
    { id: 'extension', label: 'حداقل یک شماره داخلی', filled: hasExtension, value: extensionVal },
    { id: 'direct_phone', label: 'حداقل یک شماره مستقیم', filled: hasDirectPhone, value: directPhoneVal },
    { id: 'building', label: 'ساختمان', filled: hasBuilding, value: buildingVal },
    { id: 'unit', label: 'واحد محل استقرار', filled: hasUnit, value: unitVal },
    { id: 'floor', label: 'طبقه', filled: hasFloor, value: floorVal },
    { id: 'room', label: 'اتاق', filled: hasRoom, value: roomVal },
  ];

  const totalCount = items.length; // 11
  const filledCount = items.filter((it) => it.filled).length;
  const percentage = Math.round((filledCount / totalCount) * 100);
  const isComplete = filledCount === totalCount;

  return {
    percentage,
    filledCount,
    totalCount,
    isComplete,
    items,
  };
}

export interface FieldMissingStat {
  id: string;
  label: string;
  missingCount: number;
  missingPercentage: number;
  filledCount: number;
}

export interface EmployeesCompletenessStats {
  totalEmployees: number;
  averagePercentage: number;
  completeCount: number; // 100%
  completePercent: number;
  partialCount: number; // 50% to 99%
  partialPercent: number;
  incompleteCount: number; // < 50%
  incompletePercent: number;
  fieldStats: FieldMissingStat[];
}

export function calculateEmployeesCompletenessStats(
  employees: Employee[],
  locations: LocationItem[] = []
): EmployeesCompletenessStats {
  const totalEmployees = employees.length;
  if (totalEmployees === 0) {
    return {
      totalEmployees: 0,
      averagePercentage: 0,
      completeCount: 0,
      completePercent: 0,
      partialCount: 0,
      partialPercent: 0,
      incompleteCount: 0,
      incompletePercent: 0,
      fieldStats: [],
    };
  }

  let totalPercentages = 0;
  let completeCount = 0;
  let partialCount = 0;
  let incompleteCount = 0;

  // Track field misses
  const fieldTracker: Record<string, { label: string; missing: number; filled: number }> = {};

  employees.forEach((emp) => {
    const comp = calculateProfileCompleteness(emp, locations);
    totalPercentages += comp.percentage;

    if (comp.isComplete) {
      completeCount += 1;
    } else if (comp.percentage >= 50) {
      partialCount += 1;
    } else {
      incompleteCount += 1;
    }

    comp.items.forEach((item) => {
      if (!fieldTracker[item.id]) {
        fieldTracker[item.id] = { label: item.label, missing: 0, filled: 0 };
      }
      if (item.filled) {
        fieldTracker[item.id].filled += 1;
      } else {
        fieldTracker[item.id].missing += 1;
      }
    });
  });

  const averagePercentage = Math.round(totalPercentages / totalEmployees);
  const completePercent = Math.round((completeCount / totalEmployees) * 100);
  const partialPercent = Math.round((partialCount / totalEmployees) * 100);
  const incompletePercent = Math.round((incompleteCount / totalEmployees) * 100);

  const fieldStats: FieldMissingStat[] = Object.entries(fieldTracker)
    .map(([id, data]) => ({
      id,
      label: data.label,
      missingCount: data.missing,
      missingPercentage: Math.round((data.missing / totalEmployees) * 100),
      filledCount: data.filled,
    }))
    .sort((a, b) => b.missingCount - a.missingCount);

  return {
    totalEmployees,
    averagePercentage,
    completeCount,
    completePercent,
    partialCount,
    partialPercent,
    incompleteCount,
    incompletePercent,
    fieldStats,
  };
}

