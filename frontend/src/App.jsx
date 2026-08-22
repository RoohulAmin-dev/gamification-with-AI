import Auth from "./components/Auth/Auth";
import Home from "./pages/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AppContent = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Loading your learning space...</h1>
            <p>Checking your account session.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Home />

      <button
        type="button"
        onClick={signOut}
        className="btn"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        Sign Out
      </button>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;