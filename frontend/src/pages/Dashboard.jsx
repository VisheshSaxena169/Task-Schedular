// import { useEffect, useState, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";

// import {
//   getWorkspaces,
//   createWorkspace,
//   deleteWorkspace,
//   updateWorkspace
// } from "../services/workspaceService";

// const Dashboard = () => {
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [workspaces, setWorkspaces] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showCreate, setShowCreate] = useState(false);
//   const [workspaceName, setWorkspaceName] = useState("");

//   const [error, setError] = useState("");

//   useEffect(() => {
//     loadWorkspaces();
//   }, []);

//   const loadWorkspaces = async () => {
//     try {
//       setLoading(true);

//       const response = await getWorkspaces();

//       setWorkspaces(response.workspaces || []);
//     } catch (error) {
//       console.error(error);
//       setError("Failed to load workspaces");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateWorkspace = async (e) => {
//     e.preventDefault();

//     if (!workspaceName.trim()) return;

//     try {
//       const response = await createWorkspace(
//         workspaceName
//       );

//       setWorkspaces((prev) => [
//         ...prev,
//         response.workspace,
//       ]);

//       setWorkspaceName("");
//       setShowCreate(false);
//     } catch (error) {
//       setError(
//         error.response?.data?.message ||
//           "Failed to create workspace"
//       );
//     }
//   };

//   const handleDeleteWorkspace = async (
//     e,
//     workspaceId
//   ) => {
//     e.stopPropagation();

//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this workspace?"
//     );

//     if (!confirmDelete) return;

//     try {
//       await deleteWorkspace(workspaceId);

//       setWorkspaces((prev) =>
//         prev.filter(
//           (workspace) => workspace._id !== workspaceId
//         )
//       );
//     } catch (error) {
//       setError(
//         error.response?.data?.message ||
//           "Failed to delete workspace"
//       );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-950 text-white">

//       {/* Navbar */}
//       <header className="border-b border-slate-800 bg-slate-900">

//         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

//           <h1 className="text-2xl font-bold">
//             Task<span className="text-blue-500">Flow</span>
//           </h1>

//           <div className="flex items-center gap-5">

//             <span className="text-slate-400">
//               {user?.name}
//             </span>

//             <button
//               onClick={logout}
//               className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition"
//             >
//               Logout
//             </button>

//           </div>

//         </div>

//       </header>

//       {/* Main */}
//       <main className="max-w-7xl mx-auto px-6 py-10">

//         <div className="flex justify-between items-center mb-8">

//           <div>
//             <h2 className="text-3xl font-bold">
//               Your Workspaces
//             </h2>

//             <p className="text-slate-400 mt-2">
//               Manage your projects and teams.
//             </p>
//           </div>

//           <button
//             onClick={() => setShowCreate(true)}
//             className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg font-medium transition"
//           >
//             + New Workspace
//           </button>

//         </div>

//         {error && (
//           <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
//             {error}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-slate-400">
//             Loading workspaces...
//           </div>
//         ) : workspaces.length === 0 ? (

//           <div className="border border-dashed border-slate-700 rounded-2xl p-16 text-center">

//             <h3 className="text-xl font-semibold">
//               No workspaces yet
//             </h3>

//             <p className="text-slate-400 mt-2">
//               Create your first workspace to get started.
//             </p>

//           </div>

//         ) : (

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

//             {workspaces.map((workspace) => (

//               <div
//                 key={workspace._id}
//                 onClick={() =>
//                   navigate(`/workspace/${workspace._id}`)
//                 }
//                 className="group cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800/70 transition"
//               >

//                 <div className="flex justify-between items-start">

//                   <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
//                     {workspace.name
//                       ?.charAt(0)
//                       ?.toUpperCase()}
//                   </div>

//                   <button
//                     onClick={(e) =>
//                       handleDeleteWorkspace(
//                         e,
//                         workspace._id
//                       )
//                     }
//                     className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
//                   >
//                     Delete
//                   </button>

//                 </div>

//                 <h3 className="text-xl font-semibold mt-6">
//                   {workspace.name}
//                 </h3>

//                 <p className="text-slate-500 text-sm mt-2">
//                   Open workspace →
//                 </p>

//               </div>

//             ))}

//           </div>
//         )}

//       </main>

//       {/* Create Workspace Modal */}
//       {showCreate && (

//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4">

//           <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">

//             <h2 className="text-xl font-semibold">
//               Create Workspace
//             </h2>

//             <form
//               onSubmit={handleCreateWorkspace}
//               className="mt-6"
//             >

//               <input
//                 value={workspaceName}
//                 onChange={(e) =>
//                   setWorkspaceName(e.target.value)
//                 }
//                 placeholder="Workspace name"
//                 autoFocus
//                 className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
//               />

//               <div className="flex justify-end gap-3 mt-5">

//                 <button
//                   type="button"
//                   onClick={() => setShowCreate(false)}
//                   className="px-4 py-2 text-slate-400"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
//                 >
//                   Create
//                 </button>

//               </div>

//             </form>

//           </div>

//         </div>

//       )}

//     </div>
//   );
// };

// export default Dashboard;














import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
  updateWorkspace
} from "../services/workspaceService";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Unified modal state for Create & Update
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");

  const [error, setError] = useState("");

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await getWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (e, workspaceId) => {
    e.stopPropagation(); // Prevent navigating to workspace
    setOpenDropdownId((prev) => (prev === workspaceId ? null : workspaceId));
  };

  // Open modal for creating
  const openCreateModal = () => {
    setIsEditing(false);
    setActiveWorkspaceId(null);
    setWorkspaceName("");
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (e, workspace) => {
    e.stopPropagation();
    setOpenDropdownId(null); // Close dropdown
    setIsEditing(true);
    setActiveWorkspaceId(workspace._id);
    setWorkspaceName(workspace.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setWorkspaceName("");
    setActiveWorkspaceId(null);
    setIsEditing(false);
  };

  // Handles both Create and Update based on `isEditing` state
  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!workspaceName.trim()) return;

    try {
      if (isEditing) {
        // UPDATE WORKSPACE
        await updateWorkspace(activeWorkspaceId, workspaceName);
        
        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws._id === activeWorkspaceId ? { ...ws, name: workspaceName } : ws
          )
        );
      } else {
        // CREATE WORKSPACE
        const response = await createWorkspace(workspaceName);
        setWorkspaces((prev) => [...prev, response.workspace]);
      }

      closeModal();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} workspace`
      );
    }
  };

  const handleDeleteWorkspace = async (e, workspaceId) => {
    e.stopPropagation();
    setOpenDropdownId(null); // Close dropdown

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workspace?"
    );

    if (!confirmDelete) return;

    try {
      await deleteWorkspace(workspaceId);

      setWorkspaces((prev) =>
        prev.filter((workspace) => workspace._id !== workspaceId)
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete workspace"
      );
    }
  };

  console.log("Logged in User ID:", user?._id);
console.log("First Workspace Owner:", workspaces[0]?.owner);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Task<span className="text-blue-500">Flow</span>
          </h1>

          <div className="flex items-center gap-5">
            <span className="text-slate-400">{user?.name}</span>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Workspaces</h2>
            <p className="text-slate-400 mt-2">
              Manage your projects and teams.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg font-medium transition"
          >
            + New Workspace
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-2xl p-16 text-center">
            <h3 className="text-xl font-semibold">No workspaces yet</h3>
            <p className="text-slate-400 mt-2">
              Create your first workspace to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() => navigate(`/workspace/${workspace._id}`)}
                className="group cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800/70 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
                    {workspace.name?.charAt(0)?.toUpperCase()}
                  </div>

                  {/* 3-Dots Dropdown Menu - Visible only to Workspace Owner */}
                   {workspace.owner?._id === (user?._id || user?.id) && (                    <div className="relative">
                      <button
                        onClick={(e) => toggleDropdown(e, workspace._id)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {/* Dropdown Options */}
                      {openDropdownId === workspace._id && (
                        <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                          <button
                            onClick={(e) => openEditModal(e, workspace)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-blue-400 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteWorkspace(e, workspace._id)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mt-6">
                  {workspace.name}
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  Open workspace →
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dynamic Create/Update Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? "Update Workspace" : "Create Workspace"}
            </h2>

            <form onSubmit={handleModalSubmit} className="mt-6">
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                >
                  {isEditing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;