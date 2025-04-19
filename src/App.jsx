// import { useState } from 'react'
import './App.css'
import AdminDashboard  from './AdminDashboard.jsx'
function App() {
//  const [user, setUser] = useState('admin')
// // setUser('admin')

  return (
    <>
    {/* {user==='admin'?<AdminDashboard></AdminDashboard>:<StudentDashboard></StudentDashboard>} */}
    <AdminDashboard></AdminDashboard>
      {/* <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  )
}

export default App
