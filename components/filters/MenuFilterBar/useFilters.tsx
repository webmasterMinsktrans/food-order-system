'use client';

import { useEffect, useRef, useState, useMemo } from 'react'; // 👈 Добавили useMemo
import { ComboboxItem } from '@mantine/core';
import { useGetMenuCategoriesQuery } from '@/lib/api/menuApi';
import { useArraySearchParamValue, useUpdatePageURL } from '@/shared/hooks';
import { NotificationService } from '@/shared/services';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export function useFilters() {
  // ✅ ИСПРАВЛЕНИЕ №1: Передаем undefined вместо пустого объекта {}, чтобы не ломать сборку типов RTK Query
  const { data, error } = useGetMenuCategoriesQuery(undefined);
  
  const type = useArraySearchParamValue<string>('type');
  const categoryParam = useArraySearchParamValue<string>('category');
  
  const [categoryValue, setCategoryState] = useState<string[]>([]);
  const [typeValue, setTypeState] = useState<string[]>([]);
  
  const { updateURL } = useUpdatePageURL();

  // ✅ ИСПРАВЛЕНИЕ №2: Полностью убираем useState для опций.
  // Рассчитываем и мемоизируем их на основе данных сервера. Ссылка в памяти стабильна.
  const categoryOptions = useMemo(() => {
    if (!data) return [];
    return data.map(({ id, name }) => ({
      value: id.toString(),
      label: name,
    }));
  }, [data]);

  // Синхронизируем начальные параметры из URL при первой загрузке
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

  // Вывод ошибок сервера
  useEffect(() => {
    if (error) {
      NotificationService.showErrorNotification({
        title: 'Ошибка получения категорий',
        message: `${(error as FetchBaseQueryError)?.status} ${(error as any)?.message || ''}`,
      });
    }
  }, [error]);

  // ✅ ИСПРАВЛЕНИЕ №3: Флаг активности фильтров теперь рассчитывается «на лету» без лишних useEffect и стейтов
  const isFiltersActive = categoryValue.length > 0 || typeValue.length > 0;

  // ✅ ИСПРАВЛЕНИЕ №4: Прямая, контролируемая функция обновления URL.
  // Вызывается СТРОГО по клику пользователя, что полностью исключает бесконечные циклы роутера.
  const handleUrlUpdate = (updatedCategory: string[], updatedType: string[]) => {
    const updatedFields = ['category', 'type', 'page']; // Сброс страницы при смене фильтров обязателен всегда
    updateURL(updatedFields, [
      updatedCategory.toString(),
      updatedType.toString(),
      '' // Сбрасываем страницу на 1-ю (пустая строка в утилите updateURL)
    ]);
  };

  const changeCategory = (arg?: string[]) => {
    const newValue = arg ?? [];
    setCategoryState(newValue);
    handleUrlUpdate(newValue, typeValue);
  };

  const changeType = (arg?: string[]) => {
    const newValue = arg ?? [];
    setTypeState(newValue);
    handleUrlUpdate(categoryValue, newValue);
  };

  const resetFilters = () => {
    setCategoryState([]);
    setTypeState([]);
    updateURL(['category', 'type', 'page'], ['', '', '']);
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
