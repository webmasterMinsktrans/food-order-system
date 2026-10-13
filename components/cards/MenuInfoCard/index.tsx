'use client';

import {  Button, Flex, Grid, GridCol, LoadingOverlay, Modal, ModalProps } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react'; // 👈 Добавили useMemo
import { ErrorPage } from '@/UI';
import { useGetMenuByIdQuery } from '@/lib/api/moderatorApi';
import MenuPositionsTable from './MenuPositionsTable';
import { formatDate } from '@/shared/helpers/formatHelper';
import classes from './styles.module.scss';

interface MenuInfoModalProps extends ModalProps {
  menuId?: number,
}

const MenuInfoModal: FunctionComponent<MenuInfoModalProps> = ({
  menuId,
  ...modalProps
}) => {
  // ✅ ИСПРАВЛЕНИЕ: Мемоизируем объект параметров. 
  // Теперь ссылка в памяти изменится ТОЛЬКО если изменится сам menuId.
  const queryArgs = useMemo(() => ({ 
    id: menuId ?? 0 
  }), [menuId]);

  // Передаем стабильную ссылку queryArgs вместо создания объекта "на лету"
  const { data, isLoading, error, refetch } = useGetMenuByIdQuery(queryArgs, {
    skip: !modalProps.opened
  });

  if(!menuId) return (<></>);
  
  return (
    <Modal.Root {...modalProps} size="auto" centered>
      <Modal.Overlay />
      <Modal.Content miw={500}>
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'pink', type: 'bars' }}
        />
        {
          error &&
          <ErrorPage
            message={(error as any).message}
            onRetry={()=>refetch()}
          />
        }
        {
          (isLoading || data) &&
        <>
        <Modal.Header bg="var(--mantine-color-background)">
          <Modal.Title fz="h3" fw={500}>
            {data?.name}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body className={classes.modalBody}>
          <Grid gutter="xl">
              <GridCol span={2} className={classes.gridCaption}>
                Доступно с 
              </GridCol>
              <GridCol span={4} className={classes.importantInfo}>
                {formatDate(data?.relevantFrom ?? new Date())}
              </GridCol>
              <GridCol span={2} className={classes.gridCaption}>
                по
              </GridCol>
              <GridCol span={4} className={classes.importantInfo}>
                {formatDate(data?.expire ?? new Date())}
              </GridCol>
              <GridCol span={4} className={classes.gridCaption}>
                Столовая
              </GridCol>
              <GridCol span={8} className={classes.importantInfo}>
                {data?.providingCanteen_office?.name}
              </GridCol>
              <GridCol span={4} className={classes.gridCaption}>
                Автор
              </GridCol>
              <GridCol span={8} className={classes.statusContainer}>
                {data?.user?.employee ? `${data.user.employee.surname} ${data.user.employee.name} ${data.user.employee.patronymic} (${data.user.employee.personnelNumber})` : ''}
              </GridCol>
              <GridCol span={4} className={classes.gridCaption}>
                Изменен
              </GridCol>
              <GridCol span={8}>
                {formatDate(data?.changed ?? new Date())}
              </GridCol>
              <GridCol span={4} className={classes.gridCaption}>
                Создан
              </GridCol>
              <GridCol span={8}>
                {formatDate(data?.created ?? new Date())}
              </GridCol>
              <GridCol
                span={12}
                className={classes.gridSubheading}>
                Состав меню:
              </GridCol>
              <MenuPositionsTable positions={data?.menu_positions} />
          </Grid>
          <Flex justify="center" mt="lg">
          <Button 
            className={classes.cancelButton}
            variant="outline" 
            onClick={()=>modalProps.onClose()}
          >
            Закрыть
          </Button>
          </Flex>
        </Modal.Body>
        </>
        }
      </Modal.Content>
    </Modal.Root>
  );
};

export default MenuInfoModal;
