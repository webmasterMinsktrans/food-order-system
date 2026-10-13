'use client';

import { FunctionComponent, useEffect, useMemo } from 'react';
import { Flex, Stack } from '@mantine/core';
import { MenuFilterBar, MenuList } from '@/components';
import classes from './styles.module.scss';
import { ErrorPage, Pagination } from '@/UI';
import { useGetActualMenuQuery } from '@/lib/api/menuApi';
import { useAppDispatch, useSearchParamValue, useAppSelector } from '@/shared/hooks';
import { setMenu } from '@/lib/features/menu/menuSlice';
import { CookieService } from '@/shared/services';
import { selectDeliveryDestination } from '../../../../lib/features/cart/cartSlice';

const Menu : FunctionComponent = () => {
  const pageSize = CookieService.getDefaultMenuPageSize();
  
  const page = useSearchParamValue<number>('page');
  const type = useSearchParamValue<string>('type');
  const categoryId = useSearchParamValue<string>('category');
  const destination = useAppSelector(selectDeliveryDestination);

  // ✅ Жестко контролируем тип productType, пресекая передачу массивов или некорректных объектов
  const cleanType = useMemo(() => {
    if (!type) return undefined;
    if (Array.isArray(type)) return type[0]?.toString() || undefined;
    if (type === 'undefined' || type === '') return undefined;
    return type.toString();
  }, [type]);

  // Стабилизируем ссылку на queryParams
  const queryParams = useMemo(() => ({
    page: page ? +page : undefined,
    pageSize,
    dishCategoryId: categoryId?.toString() ?? undefined,
    productType: cleanType,
    destinationOfficeId: destination?.id ?? 0,
  }), [page, pageSize, categoryId, cleanType, destination?.id]);

  // Запрос на бэкенд блокируется во время SSR на сервере
  const { data, error, isFetching, refetch } = useGetActualMenuQuery(
    queryParams,
    { skip: destination === null || !destination?.id || typeof window === 'undefined' }
  );

  const dispatch = useAppDispatch();

  const menuItems = data?.items;
  
  // ✅ ИСПРАВЛЕНИЕ №1: Количество страниц берем НАПРЯМУЮ из ответа API.
  // Если данные еще в пути или произошел сброс фильтра — по умолчанию возвращаем 1.
  // Никаких sessionStorage и каскадных эффектов setPageCount, ломающих React 19!
  const pageCount = data?.totalPages ?? 1;

  useEffect(() => {
    if (menuItems) {
      dispatch(setMenu(menuItems));
    }
  }, [menuItems, dispatch]);

  const isMenuLoading = isFetching || !data || typeof window === 'undefined';

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем блок пагинации, жестко привязав его к примитиву pageCount.
  // Кнопки пагинации теперь обновляются строго атомарно, когда RTK Query полностью 
  // обновил кэш. Конфликт каскадных ререндеров с роутером полностью исчерпан.
  const memoizedPagination = useMemo(() => {
    return (
      <Flex w="100%" justify="flex-end" align="flex-end" flex="1 1 auto">
        <Pagination total={pageCount} boundaries={0} gap={4} size="sm" />
      </Flex>
    );
  }, [pageCount]);

  return (
    <Stack
      className={classes.menuContainer}
      gap={24}
      align="center"
      pb="md"
    >
      <MenuFilterBar />
      {
        error ? 
        <ErrorPage 
          message={(error as any)?.data?.message ?? 'Ошибка загрузки меню'} 
          onRetry={refetch} 
        />
        :
        <>
          <MenuList loading={isMenuLoading} />
          {memoizedPagination}
        </>
      }
    </Stack>
  );
};

export default Menu;
