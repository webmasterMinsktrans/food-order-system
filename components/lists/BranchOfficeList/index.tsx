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
  const [page, sortOrder, orderBy] = useSearchParamValues(['page', 'order', 'sort']);

  // Очищаем параметры от "грязи" асинхронной гидратации Next.js 15
  const cleanOrderBy = useMemo(() => {
    if (!orderBy || orderBy === 'undefined' || orderBy === 'null') return 'id';
    return String(orderBy); // Жестко приводим к строке
  }, [orderBy]);

  const cleanSortOrder = useMemo(() => {
    if (!sortOrder || sortOrder === 'undefined' || sortOrder === 'null') return 'desc';
    return String(sortOrder);
  }, [sortOrder]);

  const cleanPage = useMemo(() => {
    if (!page || page === 'undefined' || page === 'null') return 1;
    return +page;
  }, [page]);

  const queryParams = useMemo(() => ({
    page: cleanPage,
    pageSize: 30,
    orderBy: cleanOrderBy,
    sortOrder: cleanSortOrder
  }), [cleanPage, cleanOrderBy, cleanSortOrder]);


  const { data, error, isFetching, refetch } = useGetOfficeFullInfoListQuery(queryParams, {
    refetchOnMountOrArgChange: true, // 👈 ГАРАНТИЯ СБРОСА ЗАВИСАНИЯ
  });

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  const officeItems = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;

  const hasLoadedData = data && officeItems.length > 0;
  const hasNoData = !isFetching && data && officeItems.length === 0;

  return (
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={isFetching || !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={commonClasses.loadingBox}>
            <Image src={searchEmpty} width={250} height={250} alt="Nothing found" priority />
            <Title order={3} style={{ marginTop: '16px' }}>По вашему запросу ничего не найдено</Title>
          </div>
        ) : (
          <>
            {hasLoadedData && <BranchesTable items={officeItems} />}
            
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
