'use client';

import { Grid, ModalProps, Title } from '@mantine/core';
import { FunctionComponent, useContext } from 'react';
import { MobilePillsInput, MobileModal } from '@/UI';
import { FilterContext } from '..';

interface FilterModalProps extends ModalProps {}

const FilterModal: FunctionComponent<FilterModalProps> = (props) => {
  // Потребляем очищенные и мемоизированные данные из стабильного FilterContext
  const {
    categoryOptions, 
    categoryValue, 
    changeCategory,
    typeOptions, 
    typeValue, 
    changeType,
    resetFilters,
  } = useContext(FilterContext);

  return (
    <MobileModal
      {...props}
      zIndex="var(--first-modal-z-index)"
      showAccept
      resetText="Сбросить"
      // ✅ ИСПРАВЛЕНИЕ: Передаем прямую стабильную ссылку на функцию вместо стрелочного замыкания () => resetFilters().
      // Это предотвращает паразитные микро-ререндеры инпутов во время анимации закрытия окна в React 19.
      resetAction={resetFilters}
    >
      <Grid gutter="lg" align="flex-start" px="sm">
        <Grid.Col span={5}>
          <Title order={3}>Тип продукции:</Title>
        </Grid.Col>
        <Grid.Col span={7}>
          <MobilePillsInput
            data={typeOptions}
            values={typeValue}
            setValues={changeType}
            w="100%"
            modalTitle="Выберите тип продукции"
            size="md"
          />
        </Grid.Col>
        <Grid.Col span={5}>
          <Title order={3}>Тип блюда:</Title>
        </Grid.Col>
        <Grid.Col span={7}>
          <MobilePillsInput
            data={categoryOptions}
            values={categoryValue}
            setValues={changeCategory}
            w="100%"
            modalTitle="Выберите тип блюда"
            size="md"
          />
        </Grid.Col>
      </Grid>
    </MobileModal>
  );
};

export default FilterModal;
