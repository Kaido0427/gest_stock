import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMe, useLogout } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { data: user, isLoading } = useMe();
  const { mutate: logout } = useLogout();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} onLogout={logout} />
  ) : (
    <LoginPage />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;