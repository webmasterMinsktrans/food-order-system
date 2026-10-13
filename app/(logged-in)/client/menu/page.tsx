'use client';

import { FunctionComponent, useEffect, useMemo } from 'react'; // 👈 Добавили useMemo
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
  const [pageCount, setPageCount] = useSessionStorage({
    key: 'menu-total-pages',
    defaultValue: 1,
    getInitialValueInEffect: false,
  });
  
  const page = useSearchParamValue<number>('page');
  const type = useSearchParamValue<string>('type');
  const categoryId = useSearchParamValue<string>('category');
  const destination = useAppSelector(selectDeliveryDestination);

  // ✅ ИСПРАВЛЕНИЕ №1: Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : undefined,
    pageSize,
    dishCategoryId: categoryId?.toString() ?? undefined,
    productType: type ?? undefined,
    destinationOfficeId: destination?.id ?? 0,
  }), [page, pageSize, categoryId, type, destination?.id]);

  // Передаем мемоизированный queryParams вместо создания объекта "на лету"
  const { data, error, isFetching, refetch } = useGetActualMenuQuery(
    queryParams,
    { skip: destination === null || !destination?.id }
  );

  const dispatch = useAppDispatch();

  // ✅ ИСПРАВЛЕНИЕ №2: Извлекаем массив элементов и тотал страниц для атомарного отслеживания в useEffect
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
          <MenuList loading={isFetching || typeof window === 'undefined'} />
          <Flex w="100%" justify="flex-end" align="flex-end" flex="1 1 auto">
            <Pagination total={pageCount} boundaries={0} gap={4} size="sm" />
          </Flex>
        </>
      }
    </Stack>
  );
};

export default Menu;
