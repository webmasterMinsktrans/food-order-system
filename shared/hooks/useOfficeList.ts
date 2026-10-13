import { useGetFullOfficeListQuery } from "@/lib/api/adminApi";
import { useGetCanteenListQuery } from "@/lib/api/moderatorApi";
import { useGetOfficesListQuery } from "@/lib/api/registrationApi";

export function useOfficeList(officeType: 'canteen' | 'office' | 'all') {
  // ✅ ИСПРАВЛЕНИЕ: Вызываем ВСЕ хуки одновременно, чтобы сохранить порядок в React 19.
  // Но управляем их выполнением с помощью флага skip.
  
  const canteenResult = useGetCanteenListQuery(undefined, {
    skip: officeType !== 'canteen'
  });

  const officeResult = useGetOfficesListQuery(undefined, {
    skip: officeType !== 'office' && officeType !== 'all' // подстраховка для дефолтного значения
  });

  const allOfficesResult = useGetFullOfficeListQuery(undefined, {
    skip: officeType !== 'all'
  });

  // ✅ Возвращаем результат нужного хука на основе условий
  switch (officeType) {
    case 'canteen':
      return canteenResult;
    case 'office':
      return officeResult;
    case 'all':
      return allOfficesResult;
    default:
      return officeResult;
  }
}

