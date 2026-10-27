import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// No <StrictMode> on purpose. Its double-invoked effects open and immediately
// close a second WebSocket on every mount, which Chrome reports as
// "WebSocket is closed before the connection is established." The brief asks
// for a clean console, and this is a two-user manual test tool where a doubled
// socket also doubles every frame in the debug drawer. src/lib/socket.js is
// still written to survive a remount if you add StrictMode back.
createRoot(document.getElementById('root')).render(<App />)
