import { Title } from '@mantine/core';
import { PageTitle } from '../components/layout/PageTitle';
import { FormWrapper } from '../components/admin/forms/FormWrapper';
import { AccountEditForm } from './AccountEditForm';
import { UserRelationships } from '../components/admin/user/UserRelationships';

export function AccountPage() {
  return (
    <>
      <PageTitle label="My account" />

      <FormWrapper>
        <Title order={3} mt="xl" mb="md">
          Account details
        </Title>
        <AccountEditForm />
      </FormWrapper>

      <FormWrapper>
        <Title order={3} mt="xl" mb="md">
          Family & members
        </Title>
        <UserRelationships useUserPointOfView={true} />
      </FormWrapper>
    </>
  );
}
