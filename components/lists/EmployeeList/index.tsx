'use client';

import { useSearchEmployeesQuery } from "@/lib/api/adminApi";
import { useSearchParamValues } from "@/shared/hooks";
import { ErrorPage, Pagination } from "@/UI";
import searchEmpty from '@/public/search_state.gif';
import { LoadingOverlay, Title } from "@mantine/core";
import Image from "next/image";
import { useMemo } from "react"; // 👈 Добавили useMemo
import EmployeesTable from "../../tables/EmployeesTable";
import commonClasses from '../styles.module.scss';

interface EmployeeListProps {}

const EmployeeList = (props: EmployeeListProps) => {
  const pageSize = 20;
  
  // ✅ ИСПРАВЛЕНИЕ №1: Деструктурируем параметры из URL для удобного отслеживания в useMemo
  const [page, s, sortOrder, orderBy, office, active] = useSearchParamValues([
    'page', 's', 'order', 'sort', 'office', 'active'
  ]);

  // ✅ ИСПРАВЛЕНИЕ №2: Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize,
    s: s || undefined,
    sortOrder: sortOrder || undefined,
    orderBy: orderBy || undefined,
    active: active ? active === 'true' : undefined,
    destinationOfficeId: office ? +office : undefined,
  }), [page, s, sortOrder, orderBy, office, active]);

  // Передаем мемоизированный queryParams вместо создания объекта "на лету"
  const { data, isFetching, error, refetch } = useSearchEmployeesQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Контролируем показ пустого состояния, чтобы избежать мерцания (фликкеров) интерфейса при фоновом fetch
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
      <EmployeesTable items={data?.data ?? []}/>
      {data && <div className={commonClasses.pagination}><Pagination total={data.totalPages}/></div>}
    </>
  );
};

export default EmployeeList;
