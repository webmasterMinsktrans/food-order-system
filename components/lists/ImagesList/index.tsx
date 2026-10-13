'use client';

import { useDeleteImagesMutation, useDeleteImagesTagsMutation, useGetImageListQuery } from "@/lib/api/moderatorApi";
import ImageCard from "../../cards/ImageCard";
import { Flex, LoadingOverlay, Skeleton, Title } from "@mantine/core"; // Добавили Title
import classes from './styles.module.scss';
import { Pagination } from "@/UI";
import { useSearchParamValues } from "@/shared/hooks";
import { useEffect, useState, useMemo } from "react";
import DropdownMenu from "./DropdownMenu";
import ImageEditCard from "../../cards/ImageEditCard";
import { ImageFullInfoDto } from "@/shared/types";
import { NotificationService } from "@/shared/services";
import searchEmpty from '@/public/search_state.gif';
import NoContentPage from "../../NoContentPage/NoContentPage";

interface ImageListProps {}

const ImageList = (props: ImageListProps) => {
  const [page, s, sortOrder, orderBy, office] = useSearchParamValues(['page', 's', 'order', 'sort', 'office']);

  // Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: +(page ?? 1), 
    pageSize: 20,
    s,
    orderBy,
    sortOrder,
    canteenId: office ? +office : undefined,
  }), [page, s, orderBy, sortOrder, office]);

  // ✅ ИСПРАВЛЕНИЕ №1: Проверяем, пуст ли параметр выбранной столовой в URL
  const isCanteenNotSelected = !office || office === '' || office === 'undefined';

  // Передаем мемоизированный queryParams и блокируем холостой спам запросами к API,
  // пока модератор не выбрал конкретную столовую в фильтре
  const { data, isLoading, isFetching, error } = useGetImageListQuery(queryParams, {
    skip: isCanteenNotSelected
  });
  
  const images = data?.data;
  const [picked, setPicked] = useState<number[]>([]);
  
  const togglePicked = (id: number) => {
    if(picked.includes(id)) setPicked(picked.filter((pickedId) => pickedId !== id ))
    else setPicked([...picked, id])
  }
  
  const [{opened, coordinates}, toggleOpened] = useState({opened: false, coordinates: {x:0, y:0}});
  
  useEffect(() => setPicked([]), [s, orderBy, sortOrder, office]);

  const [{editModalOpened, img}, setEditModalState] = useState({
    editModalOpened: false, 
    img: null as ImageFullInfoDto | null
  });
  
  const [deleteImages, deleteImagesResult] = useDeleteImagesMutation();
  const [deleteImagesTags, deleteImagesTagsResult] = useDeleteImagesTagsMutation();
  
  const closeEditModal = () => setEditModalState({editModalOpened: false, img: null});
  const openEditModal = (img: ImageFullInfoDto) => setEditModalState({editModalOpened: true, img });
  
  const openEdit = () => {
    if(picked.length === 0) NotificationService.showForbiddenNotification({message:'Не выбрано ни одного изображения'})
    if(images) {
      const selectedImg = images.find((image) => image.id === picked[0]);
      if(selectedImg) openEditModal(selectedImg);
    }
  }
  
  const deleteItems = () => {
    const ids = picked;
    deleteImages({body:{ids}})
    .then(res => {
      if ('error' in res || res.error) {
        NotificationService.showErrorNotification({
          title: 'Ошибка удаления выбранных картинок',
          message: (res.error as any)?.data?.message ?? (res.error as any)?.message ?? ''
        })
      } else {
         NotificationService.showSuccessNotification({
          title: `Удалено ${res.data?.count ?? 0}`,
          message:''
        })
        setPicked([]);
      }
    })
  };

  const deleteTags = () => {
    const ids = picked;
    deleteImagesTags({body:{ids}})
    .then(res => {
      if ('error' in res || res.error) {
        NotificationService.showErrorNotification({
          title: 'Ошибка удаления выбранных тегов',
          message: (res.error as any)?.data?.message ?? (res.error as any)?.message ?? ''
        })
      } else {
         NotificationService.showSuccessNotification({
          title: `Теги выбранных картинок очищены`,
          message:''
        })
        setPicked([]);
      }
    })
  };

  // Безопасный расчет смещения выпадающего меню без падения на сервере
  const menuOffset = useMemo(() => {
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
    return {
      'mainAxis': coordinates.y - 35, 
      'crossAxis': coordinates.x - screenWidth / 2 + 95
    };
  }, [coordinates.x, coordinates.y]);

  // ✅ ИСПРАВЛЕНИЕ №2: Если столовая ещё не выбрана в фильтре — показываем аккуратное приглашение к действию
  if (isCanteenNotSelected) {
    return (
      <div className={classes.loadingBox} style={{ paddingTop: '60px' }}>
        <Title order={4} c="dimmed" ta="center" style={{ fontWeight: 500 }}>
          Для просмотра галереи блюд выберите столовую в фильтре выше
        </Title>
      </div>
    );
  }

  // Контролируем обработку ошибок сервера
  if (error) {
    return (
      <div className={classes.loadingBox} style={{ paddingTop: '40px' }}>
        <Title order={4} c="red" ta="center">
          {(error as any)?.data?.message ?? 'Ошибка загрузки изображений галереи'}
        </Title>
      </div>
    );
  }

  // Загрузка спиннера срабатывает только во время активного fetch-запроса
  if (isFetching || !data) {
    return (
      <div className={classes.loadingBox}>
        <LoadingOverlay visible />
      </div>
    )
  }

  // Если столовая выбрана, но картинок в ней нет
  if (data.data.length === 0) {
    return (
      <div className={classes.loadingBox}>
        <NoContentPage
          label="Отсутствуют изображения по заданному запросу :("
          img={searchEmpty}
          size='sm'
        />
      </div>
    )
  }

  return (
    <>
      <Flex 
        className={classes.imageListBox}
        onContextMenu={e => {e.preventDefault(); toggleOpened({opened:!opened, coordinates: {x: e.pageX, y:e.pageY}})}}
      >
        <Flex className={classes.imageList}>
          <LoadingOverlay visible={deleteImagesResult.isLoading || deleteImagesTagsResult.isLoading} />
          {isLoading && <Skeleton mih={1000} miw={1400}/>}
          {
            images && images.map((img)=>(
              <ImageCard 
                key={img.id} 
                image={img} 
                togglePicked={()=>togglePicked(img.id)} picked={picked.includes(img.id)}
                onDoubleClick={() => openEditModal(img)}
              />
            )) 
          }
        </Flex>
        { data &&
          <Flex className={classes.paginationBox}>
            <Pagination total={data?.totalPages} />
          </Flex>
        }
        <DropdownMenu 
          opened={opened} 
          onChange={(opened) => toggleOpened({opened, coordinates})} 
          offset={menuOffset} 
          width={180}
          actions={{
            selectAll: ()=> setPicked(images?.map(({id})=>id) ?? []),
            deselectAll: () => setPicked([]),
            edit: openEdit,
            deleteItems,
            deleteTags,
          }}
        />
      </Flex>
      { img &&
        <ImageEditCard
          opened={editModalOpened}
          onClose={closeEditModal}
          imageData={img}
        />
      }
    </>
  );
};

export default ImageList;
