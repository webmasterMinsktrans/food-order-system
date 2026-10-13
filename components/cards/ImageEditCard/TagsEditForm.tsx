'use client';

import { ActionIcon, Button, Group, LoadingOverlay, Stack, TextInput, Title } from "@mantine/core";
import { IconCancel, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { ImageTagDto } from "@/shared/types";
import OfficeSelect from "../../OfficeSelect/OfficeSelect";
import classes from './styles.module.scss';
import { useEffect } from "react";
import { useUpdateImageTagsMutation } from "@/lib/api/moderatorApi";
import { NotificationService } from "@/shared/services";
import { baseApiWithAuth } from "@/lib/api/baseApi";
import { useAppDispatch } from "@/shared/hooks";

interface TagsEditFormProps {
  tags?: ImageTagDto[],
  imageId: number,
  dirtyRef?: React.MutableRefObject<any>,
  onCloseRef?: React.MutableRefObject<any>,
}

const TagsEditForm = ({imageId, tags = [], dirtyRef, onCloseRef}: TagsEditFormProps) => {
  const form = useForm({
    mode: 'controlled', // Гарантирует корректную работу реактивности полей в React 19
    initialValues:{
      tags: tags.map((tag) => ({
        id: `${tag.id}`,
        tagName: tag.tagName,
        canteenId: `${tag.canteen?.id}`,
        action: 'none',
        type: 'old',
      }))
    },
    validate: {
      'tags':{
        canteenId: (value) => +value > 0 ? null : 'Столовая не указана',
        'tagName': value => value && value.length>=4? null :'Минимум 4 символа',
      }
    }
  });
  
  const [editTags, editResults] = useUpdateImageTagsMutation();
  const dispatch = useAppDispatch();

  // ✅ ИСПРАВЛЕНИЕ №1: Выносим булево значение isDirty в константу для корректной зависимости в React 19
  const isFormDirty = form.isDirty();

  useEffect(() => {
    if (dirtyRef) dirtyRef.current = isFormDirty;
  }, [dirtyRef, isFormDirty]);

  const insertTag = () => {
    form.insertListItem('tags', {
      id: randomId(),
      tagName: '',
      canteenId: '',
      action: 'create',
      type: 'new',
    });
  };

  const removeTag = (index: number) =>  {
    const tag = form.getValues()?.tags?.at(index);
    if(tag?.type === 'old'){
      form.replaceListItem('tags', index, {
        ...tag,
        action: 'delete'
      })
    }else{
      form.removeListItem('tags', index)
    }
  };

  const saveEditedTags = () => {
    if(form.validate().hasErrors) return;
    const touched = form.getTouched();
    const tagValues = form.getValues().tags.filter((tag, index) => {
      return tag.type === 'new' ||
        tag.action === 'delete' ||
        touched[`tags.${index}.tagName`] ||
        touched[`tags.${index}.canteenId`] 
    })
    .map(tag => tag.type === 'old' && tag.action === 'none' ? {...tag, action: 'edit'} : tag);

    editTags({id: imageId, body: {tags: tagValues}}).then(res => {
      // ✅ ИСПРАВЛЕНИЕ №2: Строгий и безопасный разбор ответа мутации по стандартам Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          title: 'Ошибка обновления',
          message: (res.error as any)?.data?.message ?? (res.error as any)?.message ?? 'Ошибка сервера'
        });
        return;
      }

      form.setInitialValues(form.getValues());
      form.resetTouched();
      form.resetDirty();
      if(onCloseRef)
        onCloseRef.current = () => dispatch(baseApiWithAuth.util.invalidateTags(['Images'])); 
    });
  }

  return (
    <Stack className={classes.tagsInput}>
      <LoadingOverlay visible={editResults.isLoading} />
      <Title order={4}>Теги:</Title> 
      {form.getValues().tags?.map((item, index) => (
        item.action !== 'delete' &&  
        <Group 
          key={item.id}
          className={classes.tagField}
        >
          <TextInput 
            placeholder='Введите тег'
            variant='filled'
            key={form.key(`tags.${index}.tagName`)}
            {...form.getInputProps(`tags.${index}.tagName`)}
          />
          <OfficeSelect
            placeholder='Выберите столовую'
            officeType='canteen'
            unselectable='on'
            key={form.key(`tags.${index}.canteenId`)}
            {...form.getInputProps(`tags.${index}.canteenId`)}
          />
          <ActionIcon 
            size={24} 
            color='primary.4' 
            variant='transparent'
            onClick={() => removeTag(index)}
          >
            <IconTrash />
          </ActionIcon>
        </Group>
      ))}
      <Button 
        size='xs' 
        variant='transparent' 
        radius={'lg'}
        fz={18}
        onClick={insertTag}
      >
        +
      </Button>
      <Group className={classes.buttonsBlock} display={isFormDirty ? undefined : 'none'}>
        <ActionIcon
          size={32}
          color='yellow.8'
          variant='outline'
          onClick={() => form.reset()}
        >
          <IconCancel />
        </ActionIcon>
        <ActionIcon 
          size={32}
          color={'green.8'} 
          onClick={saveEditedTags}
          loading={editResults.isLoading} // ✅ Предотвращает дублирующие отправки во время сетевого запроса
        >
          <IconDeviceFloppy />
        </ActionIcon>
      </Group>
    </Stack>  
  );
};

export default TagsEditForm;
