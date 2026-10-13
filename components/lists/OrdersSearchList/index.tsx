'use client';

import { useSearchParamValues } from "@/shared/hooks";
import { ErrorPage, Pagination } from "@/UI";
import searchEmpty from '@/public/search_state.gif';
import { LoadingOverlay, Title } from "@mantine/core";
import Image from "next/image";
import { useSearchOrdersQuery } from "@/lib/api/moderatorApi";
import { OrdersTable } from "@/components";
import { stringToPeriod } from "@/shared/helpers";
import commonClasses from '../styles.module.scss';


const OrdersSearchList = () => {
  const pageSize = 20;
  const params = useSearchParamValues(['page','order','sort', 'office', 'period']);
  const periodParam = stringToPeriod(params[4] ?? '');
  const { data, isFetching, error, refetch } = useSearchOrdersQuery({
    page: params[0] ? +params[0] : 1,
    pageSize,
    sortOrder: params[1],
    orderBy:params[2],
    deliveryDestinationId: params[3],
    periodStart: periodParam[0] ? periodParam[0] : undefined,
    periodEnd: periodParam[1] ? periodParam[1] : undefined
  });
  if(error){
    return (
      <ErrorPage 
        message={(error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }
  if(isFetching || data?.data.length===0){
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
    )
  }
  return (
    <>
      <OrdersTable items={data?.data ?? []}/>
      {data && <div className={commonClasses.pagination}><Pagination total={data.totalPages}/></div>}
    </>
  )
};

export default OrdersSearchList;