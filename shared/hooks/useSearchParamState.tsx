'use client';

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks';

export function useDebouncedSearchParamState(
  key: string,
  debounceTime: number,
  resetParams?: [string, string][]
) : [string, Dispatch<SetStateAction<string>>, string] {
  const searchQueryParam = useSearchParamValue<string>(key);
  const [searchString, setSearchString] = useState(searchQueryParam ?? '');
  const [debouncedValue] = useDebouncedValue(searchString, debounceTime);
  const { updateURL } = useUpdatePageURL();

  useEffect(() => {
    // ✅ ИСПРАВЛЕНИЕ №1: Если в URL пусто (null) и локальное состояние тоже пустое (''), 
    // принудительно блокируем холостой вызов updateURL, чтобы не ломать стартовый кэш страниц!
    const currentParam = searchQueryParam ?? '';
    const targetValue = debouncedValue ?? '';

    if (currentParam !== targetValue) {
      if (!resetParams || resetParams.length === 0)
        updateURL(key, targetValue);
      else
        updateURL(
          [key, ...resetParams.map((item) => item[0])], 
          [targetValue, ...resetParams.map((item) => item[1])]
        );
    }
  }, [debouncedValue]);

  return [searchString, setSearchString, debouncedValue];
}

export function useSearchParamState(
  key: string, 
  resetParams?: [string, string][]
): [string, Dispatch<SetStateAction<string>>] {
  const searchQueryParam = useSearchParamValue<string>(key);
  const [searchString, setSearchString] = useState(searchQueryParam ?? '');
  const { updateURL } = useUpdatePageURL();

  useEffect(() => {
    // ✅ ИСПРАВЛЕНИЕ №2: Приводим null к пустой строке перед сравнением.
    // Теперь условие '' !== '' превратится в false, холостой редирект роутера Next.js 15 заблокируется,
    // и все списки админки автоматически и без зависаний выведут данные сразу при входе!
    const currentParam = searchQueryParam ?? '';
    const targetValue = searchString ?? '';

    if (currentParam !== targetValue) {
      if (!resetParams || resetParams.length === 0)
        updateURL(key, targetValue);
      else
        updateURL(
          [key, ...resetParams.map((item) => item[0])], 
          [targetValue, ...resetParams.map((item) => item[1])]
        );
    }
  }, [searchString]);

  return [searchString, setSearchString];
}
