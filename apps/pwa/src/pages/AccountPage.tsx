import { Title } from '@mantine/core';
import { PageTitle } from '../components/layout/PageTitle';
import { FormWrapper } from '../components/admin/forms/FormWrapper';
import { AccountEditForm } from './AccountEditForm';
import { UserRelationships } from './UserRelationships';

export function AccountPage() {
  return (
    <>
      <PageTitle label="My account" />

      <Title order={3} mt="xl" mb="md">
        Account details
      </Title>
      <FormWrapper>
        <AccountEditForm />
      </FormWrapper>

      <Title order={3} mt="xl" mb="md">
        Family & members
      </Title>
      <FormWrapper>
        <UserRelationships />
      </FormWrapper>
    </>
  );
}
