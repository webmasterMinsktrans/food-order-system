'use client';

import { useEffect, useRef, useState, useMemo, useTransition } from 'react'; // ✅ ИСПРАВЛЕНИЕ №1: Импортируем useTransition
import { ComboboxItem } from '@mantine/core';
import { useGetMenuCategoriesQuery } from '@/lib/api/menuApi';
import { useArraySearchParamValue, useUpdatePageURL } from '@/shared/hooks';
import { NotificationService } from '@/shared/services';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export function useFilters() {
  const { data, error } = useGetMenuCategoriesQuery(undefined);
  
  const type = useArraySearchParamValue<string>('type');
  const categoryParam = useArraySearchParamValue<string>('category');
  
  const [categoryValue, setCategoryState] = useState<string[]>([]);
  const [typeValue, setTypeState] = useState<string[]>([]);
  
  const { updateURL } = useUpdatePageURL();

  // ✅ ИСПРАВЛЕНИЕ №2: Инициализируем хук переходаuseTransition для React 19.
  // Он прикажет браузеру сначала дать отработать анимации выпадающих списков Mantine MultiSelect,
  // а изменение URL в адресной строке выполнить в фоне с низким приоритетом, предотвращая краш гидратации.
  const [, startTransition] = useTransition();

  const categoryOptions = useMemo(() => {
    if (!data) return [];
    return data.map(({ id, name }) => ({
      value: id.toString(),
      label: name,
    }));
  }, [data]);

  useEffect(() => {
    if (categoryParam) {
      setCategoryState(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    if (type) {
      setTypeState(type);
    }
  }, [type]);

  useEffect(() => {
    if (error) {
      NotificationService.showErrorNotification({
        title: 'Ошибка получения категорий',
        message: `${(error as FetchBaseQueryError)?.status} ${(error as any)?.message || ''}`,
      });
    }
  }, [error]);

  const isFiltersActive = categoryValue.length > 0 || typeValue.length > 0;

  // ✅ ИСПРАВЛЕНИЕ №3: Оборачиваем вызовы утилиты updateURL роутера Next.js 15 в startTransition.
  // Это полностью устраняет падение "Application error: a client-side exception has occurred" 
  // при выборе фильтров типов блюд и категорий продукции.

  const changeCategory = (arg?: string[]) => {
    const newValue = arg ?? [];
    setCategoryState(newValue);
    
    startTransition(() => {
      updateURL(['category', 'type', 'page'], [newValue.toString(), typeValue.toString(), '']);
    });
  };

  const changeType = (arg?: string[]) => {
    const newValue = arg ?? [];
    setTypeState(newValue);
    
    startTransition(() => {
      updateURL(['category', 'type', 'page'], [categoryValue.toString(), newValue.toString(), '']);
    });
  };

  const resetFilters = () => {
    setCategoryState([]);
    setTypeState([]);
    
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
