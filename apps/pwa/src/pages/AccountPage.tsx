import { PageTitle } from '../layout/PageTitle';
import { FormWrapper } from '../layout/FormWrapper';
import { AccountEditForm } from './AccountEditForm';

export function AccountPage() {
  return (
    <>
      <PageTitle label="My account" />
      <FormWrapper>
        <AccountEditForm />
      </FormWrapper>
    </>
  );
}
