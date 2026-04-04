import { Outlet } from 'react-router';
import { PageLayout } from './layout/PageLayout';

function App() {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
}

export default App;
