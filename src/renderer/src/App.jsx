import { ThemeProvider } from './contexts/ThemeContext';
import { DiagramProvider } from './contexts/DiagramContext';
import { LoggerProvider } from './contexts/LoggerContext';
import { ApiProvider } from './contexts/ApiContext';
import { Titlebar } from './components/Titlebar';
import Routes from './Routes';

function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <LoggerProvider>
          <DiagramProvider>
            <Titlebar />
            <Routes />
          </DiagramProvider>
        </LoggerProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;
