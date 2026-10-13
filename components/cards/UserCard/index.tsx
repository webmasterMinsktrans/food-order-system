import React from "react";
import { CardSection, ActionIcon, Grid, Radio, Group, Button, CheckIcon, Text, Card, Tooltip, TextInput, LoadingOverlay } from "@mantine/core";
import { IconDeviceFloppy, IconKey, IconX } from "@tabler/icons-react";
import { ErrorPage, Select } from "@/UI";
import { rolesSelectOptions } from "@/shared/settings";
import { useForm } from "@mantine/form";
import { useGetUserMainInfoQuery, useUpdateUserMutation } from "@/lib/api/adminApi";
import { formatDate, formatFullName, formatOffice } from "@/shared/helpers/formatHelper";
import { UserMainInfoDto } from "@/shared/types/user";
import { UpdateUserBody } from "@/lib/api/adminApi/types";
import { ModalService, NotificationService } from "@/shared/services";
import { useCurrentUser, useLogout } from "@/shared/hooks";
import { useDisclosure } from "@mantine/hooks";
import PasswordChangeModal from "../../PasswordChangeModal";
import classes from './styles.module.scss';

interface UserCardProps {
  userId: number
}

const UserCard = ({userId}: UserCardProps) => {
  const { isFetching, error, data, refetch } = useGetUserMainInfoQuery(userId);
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <Card className={classes.card}  withBorder >
      <LoadingOverlay visible={isFetching} />
      <CardSection className={classes.headerSection} withBorder>
          <Text className={classes.importantText}>
            {formatFullName(data?.employee)}, {data?.employee.personnelNumber}
          </Text>
          <Text className={classes.dimmedText}>
            {formatOffice(data?.office)}
          </Text>
          <Tooltip label="Изменить пароль">
            <ActionIcon
              className={classes.resetPasswordButton}
              variant='transparent'
              size={32}
              onClick={open}
            >
              <IconKey size={32}/>
            </ActionIcon>
          </Tooltip>
      </CardSection>
      {error && 
        <ErrorPage 
          message={(error as any)?.message ?? `Ошибка загрузки пользователя с id ${userId} `}
          onRetry={refetch}
        />
      }
      {data && <EditUserForm updateData={refetch} userData={data} />}
      <PasswordChangeModal 
        opened={opened} 
        onClose={close} 
        userId={userId} 
        employee ={data?.employee} 
      />
    </Card>
  );
};

const EditUserForm = ({updateData, userData}:{updateData: () => any,userData:UserMainInfoDto})=>{
  const { email, id, login, registered, changed, role, emailConfirmed, activeEmployee } = userData;
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      login,
      email,
      role,
      emailConfirmed: String(emailConfirmed),
      active: String(activeEmployee),
    },
    validate:  {
      login:(val) => val.length < 5 || val.includes('@') ?
      'Логин должен содержать не менее 5 символов и не должен содержать символ @' : null,
      email: val =>  /^\S+@\S+$/.test(val) ? null : 'Некорректный email',
      role: val => val ===''? 'Роль не установлена':  null
    },
    transformValues:(values) =>( {
      ...values,
      active: values.active === 'true',
      emailConfirmed: values.emailConfirmed === 'true',
    })
  });
  const [triggerUpdate, updateResult]= useUpdateUserMutation();
  const user = useCurrentUser();
  const { logout } = useLogout();
  const saveChanges = () => {
    function userUpdateConfirmed (afterSuccess?: ()=>void){
      const result = form.validate();
      if(result.hasErrors) return;
      const body: UpdateUserBody = {};
      const formValues = form.getTransformedValues();
      Object.keys(form.getDirty()).forEach((key) =>{
        const bodyKey = key as keyof UpdateUserBody;
        if(bodyKey)
          body[bodyKey] = formValues[key as keyof typeof formValues] as any;
      })
      triggerUpdate({id, body}).then(res =>{
        if(res.data){
          NotificationService.showSuccessNotification({title: 'Изменения сохранены', message:res.data.message})
          if(afterSuccess) afterSuccess();
          updateData().then(()=>form.resetDirty() );
        }
        if(res.error){
          NotificationService.showErrorNotification({title: 'Ошибка!', message: (res.error as any).message ?? 'Ошибка. Невозможно обновить данные пользователя'})
          form.reset();
        }
      });
    }
    if(user?.id === id){
      openConfirmModal(()=>userUpdateConfirmed(logout), ()=>NotificationService.showForbiddenNotification({'message':'Изменения отменены'}))
    }else{
      userUpdateConfirmed();
    }
  };
  return(
    <>
      <CardSection className={classes.centralSection} withBorder>
        <Grid align='center'>
          <GridRow label="id">
            {id}
          </GridRow>
          <GridRow label="Логин">
            <TextInput 
              variant="unstyled"
              classNames={{input:classes.tableTextInput}}
              placeholder="web.master3000"
              key={form.key('login')}
              {...form.getInputProps('login')}
            />
          </GridRow>
          <GridRow label="Email">
            <TextInput 
              variant="unstyled"
              classNames={{input:classes.tableTextInput}}
              placeholder="admin.admin@minstrans.by"
              type="email"
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
          </GridRow>
          <GridRow label="Роль">
            <Select 
              allowDeselect={false}
              data={rolesSelectOptions}
              key={form.key('role')}
              {...form.getInputProps('role')}
            />
          </GridRow>
          <GridRow label="Дата изменения">
            {formatDate(changed, 'with-sec')}
          </GridRow>          
          <GridRow label="Дата регистрации">
            {formatDate(registered, 'with-sec')}
          </GridRow>
          <Grid.Col fs={'italic'} span={6}>
            <Radio.Group
              label="Статус подтверждения email: "
              key={form.key('emailConfirmed')}
              {...form.getInputProps('emailConfirmed')}
            >
              <Group mt="xs">
                <Radio value={'true'} label="Подтвержден" />
                <Radio value={'false'} label="Не подтвержден" />
              </Group>
            </Radio.Group>
          </Grid.Col>
          <Grid.Col fs={'italic'} span={6}>
            <Radio.Group
              label="Статус сотрудника: "
              key={form.key('active')}
              {...form.getInputProps('active')}
            >
              <Group mt="xs">
                <Radio value={'true'} label="Работает на предприятии" />
                <Radio value={'false'} label="Уволен" />
              </Group>
            </Radio.Group>
          </Grid.Col>
        </Grid>
      </CardSection>
      <CardSection>
        <Group justify="space-between" className={classes.buttonsGroup}>
          <Tooltip label="Данные не были изменены" disabled={form.isDirty()}>
            <Button 
              className={classes.saveBtn} 
              variant={'transparent'} 
              leftSection ={<IconDeviceFloppy size={24}/>}
              disabled={!form.isDirty()}
              onClick={saveChanges}
            >
              Сохранить изменения
            </Button>
          </Tooltip>
          <Button 
            className={classes.cancelBtn} 
            variant={'transparent'} 
            leftSection ={<IconX size={24}/>}
            disabled={!form.isDirty()}
            onClick={()=>form.reset()}
          > 
            Отмена
          </Button>
        </Group>
      </CardSection>
    </>
  )
}

const GridRow = ({label, children}:React.PropsWithChildren<{label: string}>)=>{
  return(
    <>
      <Grid.Col fs={'italic'} span={3}>
        {label}
      </Grid.Col>
      <Grid.Col span={9}>
        {children}
      </Grid.Col>
    </>
  )
}
export default UserCard;

function openConfirmModal (onConfirm: () =>void, onCancel: () =>void){
   ModalService.openConfirmModal({
    title: 'Вы точно хотите изменить свои данные?',
    children: (
      <Text size="sm">
        После изменения собственных данных вы выйдете из системы
      </Text>
    ),
    labels: { cancel: 'Назад', confirm: 'Изменить данные' },
    onConfirm,
    onCancel,
  });
}