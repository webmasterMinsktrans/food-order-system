'use client';

import { FunctionComponent, useEffect, useMemo, useTransition } from 'react'; // 👈 Добавили useTransition
import { Flex, Stack, LoadingOverlay } from '@mantine/core';
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
  const [, startTransition] = useTransition(); // Инициализируем хук перехода для React 19
  
  const page = useSearchParamValue<number>('page');
  const type = useSearchParamValue<string>('type');
  const categoryId = useSearchParamValue<string>('category');
  const destination = useAppSelector(selectDeliveryDestination);

  // Контролируем тип productType, пресекая передачу некорректных объектов из URL
  const cleanType = useMemo(() => {
    if (!type) return undefined;
    if (Array.isArray(type)) return type?.toString() || undefined;
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
  const pageCount = data?.totalPages ?? 1;

  // Синхронизируем стейт Redux через плавный переход startTransition,
  // чтобы не вызывать ссылочных конфликтов в React 19 во время смены фильтров
  useEffect(() => {
    if (menuItems) {
      startTransition(() => {
        dispatch(setMenu(menuItems));
      });
    }
  }, [menuItems, dispatch]);

  const isMenuLoading = isFetching || !data || typeof window === 'undefined';

  // Мемоизируем блок пагинации, жестко привязав его к примитиву pageCount
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
      style={{ position: 'relative' }}
    >
      {/* Мягкий неблокирующий лоадер поверх контента при фильтрации */}
      <LoadingOverlay visible={isMenuLoading} overlayProps={{ blur: 1 }} />
      
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

