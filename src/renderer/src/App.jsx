import { ThemeProvider } from './contexts/ThemeContext';
import { DiagramProvider } from './contexts/DiagramContext';
import { LoggerProvider } from './contexts/LoggerContext';
import { ApiProvider } from './contexts/ApiContext';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { Titlebar } from './components/Titlebar';
import Routes from './Routes';

function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <AuthProvider>
          <LoggerProvider>
            <DiagramProvider>
              <DashboardProvider>
                <Titlebar />
                <Routes />
              </DashboardProvider>
            </DiagramProvider>
          </LoggerProvider>
        </AuthProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;
