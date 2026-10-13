'use client';

import { FunctionComponent, useEffect, useMemo } from 'react';
import { Flex, Stack } from '@mantine/core';
import { MenuFilterBar, MenuList } from '@/components';
import classes from './styles.module.scss';
import { ErrorPage, Pagination } from '@/UI';
import { useGetActualMenuQuery } from '@/lib/api/menuApi';
import { useAppDispatch, useSearchParamValue, useAppSelector } from '@/shared/hooks';
import { MenuPositionDto } from '@/shared/types';
import { setMenu } from '@/lib/features/menu/menuSlice';
import { CookieService } from '@/shared/services';
import { selectDeliveryDestination } from '../../../../lib/features/cart/cartSlice';
import { useSessionStorage } from '@mantine/hooks';

const Menu : FunctionComponent = () => {
  const pageSize = CookieService.getDefaultMenuPageSize();
  
  // ✅ ИСПРАВЛЕНИЕ №1: Выставляем getInitialValueInEffect: true.
  // Это принудительно заставляет хук брать дефолтное значение 1 во время SSR на сервере,
  // а реальные данные из sessionStorage подгружать только на клиенте в useEffect.
  // Это полностью страхует компонент пагинации от Hydration Mismatch.
  const [pageCount, setPageCount] = useSessionStorage({
    key: 'menu-total-pages',
    defaultValue: 1,
    getInitialValueInEffect: true, 
  });
  
  const page = useSearchParamValue<number>('page');
  const type = useSearchParamValue<string>('type');
  const categoryId = useSearchParamValue<string>('category');
  const destination = useAppSelector(selectDeliveryDestination);

  // Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : undefined,
    pageSize,
    dishCategoryId: categoryId?.toString() ?? undefined,
    productType: type ?? undefined,
    destinationOfficeId: destination?.id ?? 0,
  }), [page, pageSize, categoryId, type, destination?.id]);

  // ✅ ИСПРАВЛЕНИЕ №2: Добавляем strict-проверку среды выполнения в skip.
  // Запрос блокируется на сервере, пока Next.js 15 не инициализирует сессию в браузере.
  const { data, error, isFetching, refetch } = useGetActualMenuQuery(
    queryParams,
    { skip: destination === null || !destination?.id || typeof window === 'undefined' }
  );

  const dispatch = useAppDispatch();

  const menuItems = data?.items;
  const totalPages = data?.totalPages;

  useEffect(() => {
    if (menuItems) {
      dispatch(setMenu(menuItems));
    }
    if (typeof totalPages === 'number') {
      setPageCount(totalPages);
    }
  }, [menuItems, totalPages, dispatch, setPageCount]);

  // ✅ ИСПРАВЛЕНИЕ №3: Безопасный расчет флага загрузки, предотвращающий Hydration Mismatch
  const isMenuLoading = isFetching || !data || typeof window === 'undefined';

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
          {/* Передаем строго синхронизированный флаг загрузки */}
          <MenuList loading={isMenuLoading} />
          
          <Flex w="100%" justify="flex-end" align="flex-end" flex="1 1 auto">
            <Pagination total={pageCount} boundaries={0} gap={4} size="sm" />
          </Flex>
        </>
      }
    </Stack>
  );
};

export default Menu;

