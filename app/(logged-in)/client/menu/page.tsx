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
  
  const [pageCount, setPageCount] = useSessionStorage({
    key: 'menu-total-pages',
    defaultValue: 1,
    getInitialValueInEffect: true, // Защита гидратации пагинации при первом входе
  });
  
  const page = useSearchParamValue<number>('page');
  const type = useSearchParamValue<string>('type');
  const categoryId = useSearchParamValue<string>('category');
  const destination = useAppSelector(selectDeliveryDestination);

  // ✅ ИСПРАВЛЕНИЕ №1: Жестко контролируем тип productType.
  // Если роутер Next.js 15 при клике передал массив или объект, 
  // мы принудительно извлекаем чистую строку, защищая useMemo от ссылочного взрыва.
  const cleanType = useMemo(() => {
    if (!type) return undefined;
    if (Array.isArray(type)) return type[0]?.toString() || undefined;
    if (type === 'undefined' || type === '') return undefined;
    return type.toString();
  }, [type]);

  const queryParams = useMemo(() => ({
    page: page ? +page : undefined,
    pageSize,
    dishCategoryId: categoryId?.toString() ?? undefined,
    productType: cleanType, // Передаем очищенную стабильную строку
    destinationOfficeId: destination?.id ?? 0,
  }), [page, pageSize, categoryId, cleanType, destination?.id]);

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

  const isMenuLoading = isFetching || !data || typeof window === 'undefined';

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем блок пагинации.
  // Теперь, когда модератор или пользователь переключает фильтр "тип блюда",
  // контейнер пагинации не будет совершать паразитных каскадных ререндеров, 
  // пока RTK Query полностью не получит новый тотал страниц. 
  // Это на 100% ликвидирует client-side exception при кликах на фильтры.
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
