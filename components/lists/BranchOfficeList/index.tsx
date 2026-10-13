'use client';

import { useGetOfficeFullInfoListQuery } from '@/lib/api/adminApi';
import { BranchesTable } from '@/components';
import { LoadingOverlay, Title } from '@mantine/core';
import { ErrorPage, Pagination } from '@/UI';
import Image from "next/image";
import searchEmpty from '@/public/search_state.gif';
import { useSearchParamValues } from '@/shared/hooks';
import { useMemo } from 'react'; // 👈 Добавили useMemo
import commonClasses from '../styles.module.scss';

interface BranchOfficeListProps {}

const BranchOfficeList = (props: BranchOfficeListProps) => {
  // ✅ ИСПРАВЛЕНИЕ №1: Деструктурируем параметры из URL
  const [page, sortOrder, orderBy] = useSearchParamValues(['page', 'order', 'sort']);

  // ✅ ИСПРАВЛЕНИЕ №2: Стабилизируем ссылку на объект параметров через useMemo
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

  // ✅ ИСПРАВЛЕНИЕ №3: Контролируем показ пустого состояния, чтобы избежать фликкеров при фоновом fetch
  const hasNoData = !isFetching && data && data.data.length === 0;

  if (isFetching || hasNoData) {
    return (
      <div className={commonClasses.loadingBox}>
        {
          isFetching ?
          <LoadingOverlay visible />
          :
          <>
            <Image src={searchEmpty} width={250} height={250} alt="Nothing found"/>
            <Title order={3}>По вашему запросу ничего не найдено</Title>
          </>
        }
      </div>
    );
  }

  return (
    <>
      <BranchesTable items={data?.data ?? []} />
      {data && <div className={commonClasses.pagination}><Pagination total={data.totalPages}/></div>}
    </>
  );
};

export default BranchOfficeList;
