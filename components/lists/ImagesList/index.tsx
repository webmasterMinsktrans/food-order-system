'use client';

import { useDeleteImagesMutation, useDeleteImagesTagsMutation, useGetImageListQuery } from "@/lib/api/moderatorApi";
import ImageCard from "../../cards/ImageCard";
import { Flex,  LoadingOverlay,  Skeleton,  } from "@mantine/core";
import classes from './styles.module.scss';
import { Pagination } from "@/UI";
import { useSearchParamValues } from "@/shared/hooks";
import { useEffect, useState, useMemo } from "react"; // 👈 Добавили useMemo
import DropdownMenu from "./DropdownMenu";
import ImageEditCard from "../../cards/ImageEditCard";
import { ImageFullInfoDto } from "@/shared/types";
import { NotificationService } from "@/shared/services";
import searchEmpty from '@/public/search_state.gif';
import NoContentPage from "../../NoContentPage/NoContentPage";

interface ImageListProps {
  
}

const ImageList = (props: ImageListProps) => {
  const [page, s, sortOrder, orderBy, office] = useSearchParamValues(['page','s','order','sort', 'office']);
  
  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем объект параметров для RTK Query.
  // Задаем дефолтные значения ('id', 'desc'), чтобы Express-сервер Минсктранса 
  // не падал в пустоту при первом заходе, когда в URL еще нет параметров сортировки.
  const queryParams = useMemo(() => ({
    page: page ? +page : 1, 
    pageSize: 20,
    s: s || undefined,
    orderBy: orderBy || 'id',
    sortOrder: sortOrder || 'desc',
    canteenId: office ? +office : undefined,
  }), [page, s, orderBy, sortOrder, office]);

  // ✅ ИСПРАВЛЕНИЕ №2: Добавляем skip на проверку window и refetchOnMountOrArgChange.
  // Запрос пропустит серверный пре-рендер Next.js 15 и автоматически улетит на бэкенд 
  // сразу после гидратации на клиенте в браузере, благодаря чему данные выведутся сами!
  const { data, isLoading, isFetching } = useGetImageListQuery(queryParams, {
    skip: typeof window === 'undefined',
    refetchOnMountOrArgChange: true,
  });

  const images = data?.data;
  const [picked, setPicked] = useState<number[]>([]);
  const togglePicked = (id: number) => {
    if(picked.includes(id)) setPicked(picked.filter((pickedId) => pickedId !== id ))
    else setPicked([...picked, id])
  }
  const [{opened, coordinates}, toggleOpened] = useState({opened: false, coordinates: {x:0, y:0}});
  useEffect(()=>setPicked([]),[s, orderBy, sortOrder, office])
  const [{editModalOpened, img}, setEditModalState] = useState({
    editModalOpened: false, 
    img: null as ImageFullInfoDto | null
  });
  const [deleteImages, deleteImagesResult]= useDeleteImagesMutation();
  const [deleteImagesTags, deleteImagesTagsResult]= useDeleteImagesTagsMutation();
  const closeEditModal = () => setEditModalState({editModalOpened: false, img: null});
  const openEditModal = (img: ImageFullInfoDto) => setEditModalState({editModalOpened: true, img });
  const openEdit = () =>{
    if(picked.length === 0) NotificationService.showForbiddenNotification({message:'Не выбрано ни одного изображения'})
    if(images)
      openEditModal(images.find((image) => image.id === picked[0])!)
  }
  const deleteItems = () =>{
    const ids = picked;
    deleteImages({body:{ids}})
    .then(res => {
      if(res.error){
        NotificationService.showErrorNotification({
          title: 'Ошибка удаление выбранных картинок',
          message:(res.error as any)?.message
        })
      }else{
         NotificationService.showSuccessNotification({
          title: `Удалено ${res.data?.count}`,
          message:''
        })
        setPicked([]);
      }
    })
  };
  const deleteTags= () =>{
    const ids = picked;
    deleteImagesTags({body:{ids}})
    .then(res => {
      if(res.error){
        NotificationService.showErrorNotification({
          title: 'Ошибка удаление выбранных тегов',
          message:(res.error as any)?.message
        })
      }else{
         NotificationService.showSuccessNotification({
          title: `Теги выбранных картинок очищены`,
          message:''
        })
        setPicked([]);
      }
    })
  };

  // ✅ ИСПРАВЛЕНИЕ №3: Безопасный расчет смещения выпадающего меню без падения на сервере Node.js
  const menuOffset = useMemo(() => {
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
    return {
      'mainAxis': coordinates.y - 35, 
      'crossAxis': coordinates.x - screenWidth / 2 + 95
    };
  }, [coordinates.x, coordinates.y]);

  // ✅ ИСПРАВЛЕНИЕ №4: Вычисляем реальное наличие картинок в оперативной памяти стора Redux.
  const hasLoadedData = data && images && images.length > 0;
  
  // КРИТИЧЕСКИЙ ПРЕДОХРАНИТЕЛЬ: Состояние отсутствия данных срабатывает строго тогда, 
  // когда загрузка завершена (isFetching === false), объект data прилетел, но массив пуст.
  const hasNoData = !isFetching && data && data.data.length === 0;

  return (
    // ✅ ИСПРАВЛЕНИЕ №5: Оборачиваем весь рендер в контейнер с относительным позиционированием.
    // Мы полностью вырезали старый блокирующий "if(isFetching || data?.data.length===0)".
    // Теперь разметка стабильна, а LoadingOverlay мягко перекрывает контейнер, не ломая Virtual DOM!
    <div style={{ position: 'relative', minHeight: '400px', width: '100%' }}>
      {/* Главный спиннер перекрывает галерею только во время выполнения сетевого запроса на клиенте */}
      <LoadingOverlay visible={isFetching && !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={classes.loadingBox}>
            <NoContentPage
              label="Отсутствуют изображения по заданному запросу :("
              img={searchEmpty}
              size='sm'
            />
          </div>
        ) : (
          <Flex 
            className={classes.imageListBox}
            onContextMenu={e => {e.preventDefault(); toggleOpened({opened:!opened, coordinates: {x: e.pageX, y:e.pageY}})}}
          >
            <Flex className={classes.imageList}>
              <LoadingOverlay visible={deleteImagesResult.isLoading || deleteImagesTagsResult.isLoading} />
              {/* Скелетон Mantine показывается только при первичной инициализации, когда данных нет вообще */}
              {isLoading && !hasLoadedData && <Skeleton mih={1000} miw={1400}/>}
              {
                // Карточки отрисуются автоматически сразу при заходе в галерею модератора!
                (!isFetching || hasLoadedData) && images && images.map((img)=>(
                  <ImageCard 
                    key={img.id} 
                    image={img} 
                    togglePicked={()=>togglePicked(img.id)} picked={picked.includes(img.id)}
                    onDoubleClick={() => openEditModal(img)}
                  />
                )) 
              }
            </Flex>
            { hasLoadedData &&
              <Flex className={classes.paginationBox}>
                <Pagination total={data?.totalPages} />
              </Flex>
            }
            <DropdownMenu 
              opened={opened} 
              onChange={(opened) => toggleOpened({opened, coordinates})} 
              offset={menuOffset} // Передаем мемоизированный menuOffset
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
        )
      }

      { img &&
        <ImageEditCard
          opened={editModalOpened}
          onClose={closeEditModal}
          imageData={img}
        />
      }
    </div>
  );
};

export default ImageList;
