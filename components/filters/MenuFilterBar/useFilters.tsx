'use client';

import { useMemo, useTransition } from 'react'; // Убрали useEffect и useState
import { ComboboxItem } from '@mantine/core';
import { useGetMenuCategoriesQuery } from '@/lib/api/menuApi';
import { useArraySearchParamValue, useUpdatePageURL } from '@/shared/hooks';
import { NotificationService } from '@/shared/services';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export function useFilters() {
  const { data, error } = useGetMenuCategoriesQuery(undefined);
  
  // ✅ Единственный источник правды — URL-параметры. Никакого дублирования в локальный useState!
  const urlType = useArraySearchParamValue<string>('type');
  const urlCategory = useArraySearchParamValue<string>('category');
  
  const { updateURL } = useUpdatePageURL();
  const [, startTransition] = useTransition();

  // ✅ Стабилизируем массивы значений для пропсов value Mantine MultiSelect.
  // useMemo гарантирует, что ссылки в памяти будут неизменны при рендерах, если URL не менялся.
  const typeValue = useMemo(() => urlType ?? [], [urlType]);
  const categoryValue = useMemo(() => urlCategory ?? [], [urlCategory]);

  // Мемоизируем опции категорий с сервера
  const categoryOptions = useMemo(() => {
    if (!data) return [];
    return data.map(({ id, name }) => ({
      value: id.toString(),
      label: name,
    }));
  }, [data]);

  // Вывод ошибок сервера (безопасный вызов без влияния на рендеринг полей)
  if (error) {
    NotificationService.showErrorNotification({
      title: 'Ошибка получения категорий',
      message: `${(error as FetchBaseQueryError)?.status} ${(error as any)?.message || ''}`,
    });
  }

  // Расчет активности фильтров «на лету» без каскадных эффектов
  const isFiltersActive = categoryValue.length > 0 || typeValue.length > 0;

  // Контролируемое, неблокирующее обновление адресной строки URL строго по клику пользователя
  const changeCategory = (arg?: string[]) => {
    const newValue = arg ?? [];
    startTransition(() => {
      updateURL(['category', 'type', 'page'], [newValue.toString(), typeValue.toString(), '']);
    });
  };

  const changeType = (arg?: string[]) => {
    const newValue = arg ?? [];
    startTransition(() => {
      updateURL(['category', 'type', 'page'], [categoryValue.toString(), newValue.toString(), '']);
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      updateURL(['category', 'type', 'page'], ['', '', '']);
    });
  };

  return {
    data,
    categoryOptions,
    categoryValue,
    changeCategory,
    typeOptions,
    typeValue,
    changeType,
    resetFilters,
    isFiltersActive,
  };
}

const typeOptions: Array<ComboboxItem> = [
  { value: 'ownProduct', label: 'Блюда собственного производства' },
  { value: 'alien', label: 'Готовая продукция' },
];

