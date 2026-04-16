import { useEffect } from 'react';
import AppRouter from './AppRouter';
import { useAuthStore } from './stores/authStore';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <AppRouter />;
}

export default App;
