import { Navigate, Route, Routes } from 'react-router-dom';
import { GreetingsListPage } from './pages/GreetingsListPage';
import { NewGreetingPage } from './pages/NewGreetingPage';

export function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<GreetingsListPage />} />
        <Route path="/greetings/new" element={<NewGreetingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
