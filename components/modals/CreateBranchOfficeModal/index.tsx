import { Button, Checkbox, Group, LoadingOverlay, Modal, ModalProps, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import officeTypes, { officeTypeOptions} from "@/shared/types/branch-office/office-types";
import { Select } from "@/UI";
import commonClasses from '../styles.module.scss';
import { useCreateBranchOfficeMutation } from "../../../lib/api/adminApi";
import { NotificationService } from "../../../shared/services";
import OfficeSelect from "../../OfficeSelect/OfficeSelect";
import { useEffect, useState } from "react";

interface CreateBranchOfficeModalProps extends ModalProps {
  
}

const CreateBranchOfficeModal = ({...modalProps}: CreateBranchOfficeModalProps) => {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      address: '',
      officeType: 'branch' as officeTypes,
      isAvailable: true,
      servingCanteenId: undefined,
    },
    validate:{
      name: (val) => val.length >=5 ? null : 'Минимальная длина 5 символов',
      address: (val) => val.length >=5 ? null : 'Минимальная длина 5 символов',
    }
  });
  const [canteenEnabled, setCanteenEnabled] = useState(true);
  form.watch('officeType',({value})=>{
    setCanteenEnabled(value === 'branch')
    if(value !== 'branch') {
      form.setFieldValue('servingCanteenId', undefined);
    }
  })
  const [triggerCreate, createResult] = useCreateBranchOfficeMutation();
  const onClose = () => {form.reset(); modalProps.onClose()};
  const onCancel = () =>{
    onClose();
  }
  const onSubmit = () =>{
   if(form.validate().hasErrors) return;
   const values = form.getValues();
   triggerCreate({
    ...values
   }).then(({data, error}) =>{
    if(data){
      NotificationService.showSuccessNotification({message: `Филиал с id ${data} создан`})
      onClose();
    }else{
      NotificationService.showErrorNotification({message: 'При создании филиала произошла непредвиденная ошибка ' + (error as any)?.message })
    }
   })
  }
  return (
    <Modal.Root 
      {...modalProps} 
      size="auto" 
      centered
      onClose={onClose}
    >
      <Modal.Overlay />
      <Modal.Content miw={500}>
      <Modal.Header className={commonClasses.modalHeader}>
          <Modal.Title className={commonClasses.modalTitle}>
            Добавление нового филиала
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <LoadingOverlay visible={createResult.isLoading} />
          <Stack>
            <TextInput
              label={'Название'}
              placeholder="Администрация"
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <TextInput
              label={'Адрес'}
              placeholder="ул. Уличная, 22"
              key={form.key('address')}
              {...form.getInputProps('address')}
            />
            <Select
              label={'Тип филиала'}
              data={officeTypeOptions}
              key={form.key('officeType')}
              {...form.getInputProps('officeType')}
            />
            <OfficeSelect
              label={'Обслуживающая столовая'}
              key={form.key('servingCanteenId')}
              {...form.getInputProps('servingCanteenId')}
              officeType='canteen'
              disabled={!canteenEnabled}
            />
            <Checkbox
              label={'Филиал доступен'}
              key={form.key('isAvailable')}
              {...form.getInputProps('isAvailable')}
              defaultChecked={true}
            />
            <Group justify="space-between">
              <Button variant="outline" onClick={onCancel}>
                Отмена
              </Button>
              <Button onClick={onSubmit}>Создать</Button>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default CreateBranchOfficeModal;