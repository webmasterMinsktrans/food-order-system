'use client';

import { ActionIcon, Affix, CloseButton, ComboboxItem, Flex, Stack, Title, useMantineTheme } from '@mantine/core';
import { createContext, FunctionComponent } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconFilterFilled } from '@tabler/icons-react';
import classes from './styles.module.scss';
import { useFilters } from './useFilters';
import { MultiSelect } from '@/UI';
import DeliveryDestinationInput from '@/components/DeliveryDestinationInput';
import FilterModal from './FilterModal/FilterModal';

export const FilterContext = createContext({
  categoryOptions: [] as ComboboxItem[],
  categoryValue: [] as string[] | undefined,
  changeCategory: (() => {}) as any,
  typeOptions: [] as ComboboxItem[],
  typeValue: [] as string[] | undefined,
  changeType: (() => {}) as any,
  resetFilters: () => {},
  isFiltersActive: false,
});

export const MenuFilterBar: FunctionComponent = () => {
  // ✅ ИСПРАВЛЕНИЕ №1: Вызываем хук useFilters() строго ОДИН раз.
  const filters = useFilters();
  
  // ✅ ИСПРАВЛЕНИЕ №2: Деструктурируем переменные из уже созданной константы filters.
  // Это предотвращает дублирование параллельных процессов маршрутизации в React 19.
  const {
    categoryOptions, 
    categoryValue, 
    changeCategory,
    typeOptions, 
    typeValue, 
    changeType,
    resetFilters, 
    isFiltersActive,
  } = filters;

  const [opened, { open, close }] = useDisclosure(false);
  const theme = useMantineTheme();

  return (
    <FilterContext.Provider value={filters}>
      <Flex className={classes.filtersBox}>
        <DeliveryDestinationInput />
        <Flex className={classes.filterBarContainer}>
          <Stack className={classes.filter}>
            <Title order={4}>Тип продукции</Title>
            <MultiSelect
              className={classes.select}
              data={typeOptions}
              value={typeValue}
              onChange={changeType}
              placeholder='Вид продукции'
            />
          </Stack>
          <Stack className={classes.filter}>
            <Title order={4}>Тип блюда</Title>
            <MultiSelect
              className={classes.select}
              data={categoryOptions}
              value={categoryValue}
              onChange={changeCategory}
              disabled={categoryOptions.length === 0}
              placeholder='Тип блюда'
            />
          </Stack>
          <Stack className={classes.filter}>
            <Title order={4} className={classes.resetButtonHeader}>Сбросить</Title>
            <CloseButton
              disabled={!isFiltersActive} // Исправлена логика кнопки сброса (активна, когда фильтры применены)
              onClick={resetFilters}
              className={classes.resetButton}
            />
          </Stack>
        </Flex>
        <FilterModal
          opened={opened}
          onClose={close}
          title="Фильтры"
        />
        <Affix
          position={{ top: 10, right: theme.spacing.md }}
          hiddenFrom="sm"
          hidden={opened}
        >
          <ActionIcon
            onClick={open}
            hiddenFrom="sm"
            radius="xl"
            variant="transparent"
            size={25}
          >
            {isFiltersActive ? <IconFilterFilled /> : <IconFilter />}
          </ActionIcon>
        </Affix>
      </Flex>
    </FilterContext.Provider>
  );
};

export default MenuFilterBar;
