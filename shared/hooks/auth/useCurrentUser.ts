'use client';

import { useGetOwnInfoQuery } from '../../../lib/api/userApi';
import { UserOwnInfoDto } from '../../types/user';

export const useCurrentUser = (): UserOwnInfoDto | null => {
  // ✅ ИСПРАВЛЕНИЕ: Читаем данные напрямую из кэша RTK Query без дублирования в useState.
  // Это убирает лишние ререндеры по всему проекту и полностью защищает от Hydration Error.
  const { data } = useGetOwnInfoQuery(undefined);
  
  return data ?? null;
};
