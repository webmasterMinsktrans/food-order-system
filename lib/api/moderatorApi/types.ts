import { OfficeDto } from "../../../shared/types";

export type CreateMenuFromDocxDto = {
  file: Blob,
  providingCanteenId: string,
  servedOffices: string[],
  name?: string,
  // ✅ ИСПРАВЛЕНИЕ №1: Заменено на string / null. 
  // На сервере Next.js 15 типы dayjs вызывают конфликты при передаче FormData
  relevantFrom?: string | null,
  expire?: string | null,
}

export type SearchImageTagDto = {
  searchString?: string,
  page?: number,
  pageSize?: number,
}

export type GetMenuListParams = {
  page?: number,
  pageSize?: number,
  destinationOfficeId: number;
}

export type UploadImagesDto = {
  files: File[],
  tags: CreateImageTagDto[],
  name?: string,
}

export type ExportOrdersDocxDto = {
  periodStart: string,
  periodEnd: string,
  deliveryDestinationId: string,
}

export type SearchOrdersParams = {
  // ✅ ИСПРАВЛЕНИЕ №2: Изменено на string, так как в роутинге Next.js 15
  // параметры из URL (searchParams) прилетают в виде строк, которые мы форматируем перед запросом
  periodStart?: string;
  periodEnd?: string;
  deliveryDestinationId?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: string;
  orderBy?: string;
}

export type SearchOrderItemDto = {
  id: number;
  number: number;
  issued: string;
  fullPrice: number;
  status: string;
  canCancel: boolean;
  updated: Date;
  created: Date;
  deliveryDestination: OfficeDto;
  orderPositionsCount: number;
  clientName: string;
  clientPersonnelNumber: string;
}

export type CreateImageTagDto = {
  tagName: string;
  officeId?: number;
}

export type UpdateMenuParams = {
  id: number,
  body: {
    expire?: Date,
    relevantFrom?: Date,
  }
}

export type SearchImageParams = {
  canteenId?: number;
  s?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: string;
  orderBy?: string;
}

export type UpdateImageTagsParams = {
  id: number,
  body: {
    tags: Array<{
      id: string;
      tagName: string;
      canteenId: string;
      type: string;
      action: string;
    }>
  }
}

export type DeleteImagesParams = {
  body: {
    ids: number[],
  }
}
