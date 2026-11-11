import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Stats } from './pages/Stats'
import { TestPage } from './pages/TestPage'

// HashRouter: GitHub Pages has no SPA fallback, so routes live after the '#'.
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test/:id" element={<TestPage />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
