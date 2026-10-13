// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, AuthContext } from './context/AuthContext';
// import { useContext } from 'react';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import WorkspaceView from './pages/WorkSpaceView';

// // A simple component to protect routes that require login
// const ProtectedRoute = ({ children }) => {
//     const { user, loading } = useContext(AuthContext);
//     if (loading) return <div>Loading...</div>;
//     return user ? children : <Navigate to="/login" />;
// };

// function App() {
//     return (
//         <AuthProvider>
//             <BrowserRouter>
//                 <Routes>
//                     <Route path="/login" element={<Login />} />
                    
//                     <Route path="/dashboard" element={
//                         <ProtectedRoute>
//                             <Dashboard />
//                         </ProtectedRoute>
//                     } />

//                     <Route path="/workspaces/:id" element={
//                         <ProtectedRoute>
//                             <WorkspaceView />
//                         </ProtectedRoute>
//                     } />

//                     <Route path="*" element={<Navigate to="/dashboard" replace />} />
//                 </Routes>
//             </BrowserRouter>
//         </AuthProvider>
//     );
// }

// export default App;





import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
  AuthContext,
} from "./context/AuthContext";

import { useContext } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Worksapce";
import Board from "./pages/Boards";
import { Toaster } from 'react-hot-toast'; // 1. Import Toaster

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


           <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/board/:boardId"
            element={
                <ProtectedRoute>
                    <Board />
                </ProtectedRoute>
            }
/>

        </Routes>

        
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;