import { Title } from '@mantine/core';
import { PageTitle } from '../layout/PageTitle';
import { FormWrapper } from '../layout/FormWrapper';
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
