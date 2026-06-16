'use client'

import { FormEvent, useEffect, useState } from "react";
import { Stack, FileInput, Title, Fieldset, Switch, Collapse, Button, TextInput } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconFile } from "@tabler/icons-react";
import { OfficeSelect } from '@/components';
import { useUploadWordMenuMutation } from "@/lib/api/moderatorApi";
import { NotificationService } from "@/shared/services";
import { File } from "buffer";
import path from "path";
import dayjs from "dayjs";

interface MenuFromDocxFormProps {

}

const dateFormat = 'DD MMM YYYY HH.mm';

export const MenuFromDocxForm = (props: MenuFromDocxFormProps) => {
  const [createMenu, result] = useUploadWordMenuMutation();
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active)
      form.setValues({
        relevantFrom: null,
        expire: null
      })
  }, [active]);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      menuName: '',
      file: undefined as File | null | undefined,
      servedOffices: new Array<string>(),
      providingCanteenId: '',
      relevantFrom: null as dayjs.Dayjs | null,
      expire: null as dayjs.Dayjs | null,
    },
    validate: {
      file: (val) => {
        if (!val) return 'Файл не добавлен';

        const ext = path.extname(val.name).toLowerCase();
        if (ext !== '.docx' && ext !== '.xlsx' && ext !== '.xls') {
          return 'Некорректный формат файла. Выберите документ Word (.docx) или Excel (.xlsx, .xls)';
        }

        return null;
      },

      servedOffices: (val) => val.length > 0 ? null : 'Не выбрано ни одного обслуживаемого филиала',
      providingCanteenId: (val) => val.length > 0 && (+val > 0) ? null : 'Выберите столовую предоставляющую меню',
      relevantFrom: (val) => !val && active ? 'Дата не установлена' : null,
      expire: (val) => !val && active ? 'Дата не установлена' : null
    }
  });
  async function submitForm(e: FormEvent<HTMLDivElement>) {
    e.preventDefault();
    if (form.validate().hasErrors) return;
    const { menuName, file, ...valuesEtc } = form.getValues();
    if (!file) return;
    const fileBlob = file as Blob;
    createMenu({ name: menuName, file: fileBlob, ...valuesEtc })
      .then(({ data, error }) => {
        if (!data) {
          NotificationService.showErrorNotification({
            message: (error as any)?.message,
          })
          return;
        }
        const { menu } = data;
        form.reset();
        const text = menu ?
          `Срок действия меню с ${dayjs(menu?.relevantFrom).locale('ru').format(dateFormat)} до ${dayjs(menu?.expire).locale('ru').format(dateFormat)}` : '';
        NotificationService.showSuccessNotification({
          title: 'Меню успешно создано',
          message: text,
          autoClose: 10000,
        });
      })
  }

  return (
    <Stack miw={250} maw={900} component='form' onSubmit={submitForm} ml={'lg'}>
      <Title order={2}> Выгрузка меню из документа Word </Title>
      <TextInput
        label='Название меню'
        placeholder={'Меню на 25.10.2024'}
        key={form.key('menuName')}
        {...form.getInputProps('menuName')}
      />
      <FileInput
        label="Добавьте файл меню"
        placeholder={`Меню на ${dayjs().format('DD.MM.YYYY')}.docx`}
        withAsterisk
        leftSection={<IconFile />}
        accept=".docx,.xlsx,.xls"
        key={form.key('file')}
        {...form.getInputProps('file')}
      />
      <OfficeSelect
        label='Выберите обслуживаемые филиалы'
        withAsterisk
        placeholder="Выберите филиалы"
        inputProps={form.getInputProps('servedOffices')}
        inputKey={form.key('servedOffices')}
      />
      <OfficeSelect
        label='Столовая предоставляющая меню'
        withAsterisk
        placeholder="Выберите столовую"
        inputProps={form.getInputProps('providingCanteenId')}
        inputKey={form.key('providingCanteenId')}
        officeType='canteen'
      />
      <Switch
        checked={active}
        onChange={(e) => setActive(e.currentTarget.checked)}
        label="Установить срок действия меню вручную"
      />
      <Collapse in={active}>
        <Fieldset legend="Срок действия">
          <DateTimePicker
            valueFormat="DD MMMM YYYY HH:mm"
            label="Доступно с"
            placeholder="выберите дату"
            w={"100%"}
            key={form.key('relevantFrom')}
            {...form.getInputProps('relevantFrom')}
          />
          <DateTimePicker
            valueFormat="DD MMMM YYYY HH:mm"
            label="Доступно по"
            placeholder="выберите дату"
            w={"100%"}
            key={form.key('expire')}
            {...form.getInputProps('expire')}
          />
        </Fieldset>
      </Collapse>
      <Button
        type="submit"
      >
        Загрузить
      </Button>
    </Stack>
  );
};
