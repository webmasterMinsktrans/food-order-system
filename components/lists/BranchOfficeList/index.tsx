'use client';

import { useGetOfficeFullInfoListQuery } from '@/lib/api/adminApi';
import { BranchesTable } from '@/components';
import { LoadingOverlay, Title } from '@mantine/core';
import { ErrorPage, Pagination } from '@/UI';
import Image from "next/image";
import searchEmpty from '@/public/search_state.gif';
import { useSearchParamValues } from '@/shared/hooks';
import { useMemo } from 'react';
import commonClasses from '../styles.module.scss';

interface BranchOfficeListProps {}

const BranchOfficeList = (props: BranchOfficeListProps) => {
  // Деструктурируем параметры из URL
  const [page, sortOrder, orderBy] = useSearchParamValues(['page', 'order', 'sort']);

  // Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize: 30,
    orderBy: orderBy ?? 'id',
    sortOrder: sortOrder ?? 'desc'
  }), [page, sortOrder, orderBy]);

  // Передаем мемоизированный объект параметров в хук
  const { data, error, isFetching, refetch } = useGetOfficeFullInfoListQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №1: Безопасное извлечение массива данных с защитой от undefined
  const officeItems = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №2: Вычисляем реальное наличие данных в памяти браузера
  const hasLoadedData = data && officeItems.length > 0;
  const hasNoData = !isFetching && data && officeItems.length === 0;

  return (
    // ✅ ИСПРАВЛЕНИЕ №3: Оборачиваем весь рендер в контейнер с относительным позиционированием.
    // Мы полностью вырезали старый блокирующий "if (isFetching || hasNoData) return ...".
    // Теперь разметка стабильна, а LoadingOverlay мягко перекрывает контейнер, не разрушая связи Virtual DOM!
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      {/* Главный спиннер перекрывает список только во время активного сетевого запроса */}
      <LoadingOverlay visible={isFetching || !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={commonClasses.loadingBox}>
            <Image src={searchEmpty} width={250} height={250} alt="Nothing found" priority />
            <Title order={3} style={{ marginTop: '16px' }}>По вашему запросу ничего не найдено</Title>
          </div>
        ) : (
          // Отрисовываем контент, передавая безопасный массив officeItems в таблицу
          <>
            <BranchesTable items={officeItems} />
            
            {hasLoadedData && (
              <div className={commonClasses.pagination}>
                <Pagination total={totalPagesCount}/>
              </div>
            )}
          </>
        )
      }
    </div>
  );
};

export default BranchOfficeList;
