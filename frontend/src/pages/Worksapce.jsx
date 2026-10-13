import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getWorkspace,
  getMembers,
  getBoards,
  inviteMember,
  changeMemberRole,
  removeMember,
  updateWorkspace,
  createBoard,
} from "../services/workspaceService";
import ChatBox from '../components/ChatBox';

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [boards, setBoards] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [showBoard, setShowBoard] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");


  const [boardName, setBoardName] = useState("");

  const [error, setError] = useState("");
const [isChatOpen, setIsChatOpen] = useState(() => {
    return localStorage.getItem('workspaceChatOpen') === 'true';
  });
  // NEW: State to track unread messages
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const newState = !prev;
      localStorage.setItem('workspaceChatOpen', newState); // Save to browser memory
      return newState;
    });
    
    if (!isChatOpen) {
      setHasUnread(false);
    }
  };


  const loadWorkspace = async () => {
    try {
      setLoading(true);

      const [
        workspaceResponse,
        membersResponse,
        boardsResponse,
      ] = await Promise.all([
        getWorkspace(id),
        getMembers(id),
        getBoards(id),
      ]);

      setWorkspace(workspaceResponse.workspace);
      setMembers(membersResponse.members || []);
      setBoards(boardsResponse.boards || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      const response = await inviteMember(
        id,
        email,
        role
      );

      setMembers((prev) => [
        ...prev,
        response.member,
      ]);

      setEmail("");
      setRole("member");
      setShowInvite(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to invite member"
      );
    }
  };

  const handleRoleChange = async (
    userId,
    newRole
  ) => {
    try {
      const response = await changeMemberRole(
        id,
        userId,
        newRole
      );

      setMembers((prev) =>
        prev.map((member) =>
          member.user?._id === userId ||
          member.userId === userId
            ? response.member
            : member
        )
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to change role"
      );
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeMember(id, userId);

      setMembers((prev) =>
        prev.filter(
          (member) =>
            member.user?._id !== userId &&
            member.userId !== userId
        )
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to remove member"
      );
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!boardName.trim()) return;

    try {
      const response = await createBoard(id, {
        name: boardName,
      });

      setBoards((prev) => [
        ...prev,
        response.board,
      ]);

      setBoardName("");
      setShowBoard(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create board"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">

          <button
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white"
          >
            ←
          </button>

          <div>
            <h1 className="text-xl font-bold">
              {workspace?.name}
            </h1>

            <p className="text-xs text-slate-500">
              Workspace
            </p>
          </div>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Boards */}

        <section>

          <div className="flex justify-between items-center mb-5">

            <div>
              <h2 className="text-2xl font-bold">
                Boards
              </h2>

              <p className="text-slate-400">
                Organize your tasks into boards.
              </p>
            </div>

            <button
              onClick={() => setShowBoard(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
            >
              + New Board
            </button>

          </div>

          {boards.length === 0 ? (

            <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-400">
              No boards yet.
            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

             {boards.map((board) => (
  <div
    key={board._id}
    onClick={() => navigate(`/board/${board._id}`)}
    className="cursor-pointer bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition"
  >
    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
      #
    </div>

    <h3 className="font-semibold text-lg mt-4">
      {board.name}
    </h3>

    <p className="text-sm text-slate-500 mt-1">
      Open board →
    </p>
  </div>
))}

            </div>

          )}

        </section>

        {/* Members */}

        <section className="mt-12">

          <div className="flex justify-between items-center mb-5">

            <div>
              <h2 className="text-2xl font-bold">
                Members
              </h2>

              <p className="text-slate-400">
                Manage workspace members.
              </p>
            </div>

            <button
              onClick={() => setShowInvite(true)}
              className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg"
            >
              + Invite Member
            </button>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            {members.map((member, index) => {

              const memberId =
                member.user?._id ||
                member.userId;

              const memberName =
                member.user?.name ||
                member.name ||
                "User";

              const memberEmail =
                member.user?.email ||
                member.email ||
                "";

              const memberRole =
                member.role || "member";

              return (
                <div
                  key={memberId || index}
                  className="flex items-center justify-between p-5 border-b border-slate-800 last:border-0"
                >

                  <div className="flex items-center gap-4">

                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold">
                      {memberName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-medium">
                        {memberName}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {memberEmail}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <select
                      value={memberRole}
                      onChange={(e) =>
                        handleRoleChange(
                          memberId,
                          e.target.value
                        )
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="member">
                        Member
                      </option>

                      <option value="admin">
                        Admin
                      </option>

                      <option value="owner">
                        Owner
                      </option>
                    </select>

                    <button
                      onClick={() =>
                        handleRemoveMember(memberId)
                      }
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

      </main>

      {/* Invite Modal */}

      {showInvite && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-xl font-semibold">
              Invite Member
            </h2>

            <form
              onSubmit={handleInvite}
              className="mt-6 space-y-4"
            >

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="member@example.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
              />

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
              >
                <option value="member">
                  Member
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowInvite(false)
                  }
                  className="px-4 py-2 text-slate-400"
                >
                  Cancel
                </button>

                <button
                  className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg"
                >
                  Invite
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Board Modal */}

      {showBoard && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-xl font-semibold">
              Create Board
            </h2>

            <form
              onSubmit={handleCreateBoard}
              className="mt-6"
            >

              <input
                value={boardName}
                onChange={(e) =>
                  setBoardName(e.target.value)
                }
                placeholder="Board name"
                required
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
              />

              <div className="flex justify-end gap-3 mt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowBoard(false)
                  }
                  className="px-4 py-2 text-slate-400"
                >
                  Cancel
                </button>

                <button
                  className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg"
                >
                  Create
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

  {/* Floating Chat Widget */}
     {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        {/* Hidden ChatBox (keeps history and connection alive) */}
        <div 
          className={`absolute bottom-20 right-0 w-[350px] sm:w-[400px] shadow-2xl rounded-xl overflow-hidden origin-bottom-right transition-all duration-300 border border-slate-800 ${
            isChatOpen 
              ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' 
              : 'opacity-0 scale-90 pointer-events-none translate-y-8'
          }`}
        >
           {/* Pass the state updater to the ChatBox */}
           <ChatBox 
              workspaceId={id} 
              onNewMessage={() => setHasUnread(true)} 
           />
        </div>

        {/* Circular Toggle Button */}
        <button
          onClick={toggleChat}
          className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
            isChatOpen ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {/* --- NOTIFICATION DOT --- */}
          {hasUnread && !isChatOpen && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-950"></span>
            </span>
          )}

          {isChatOpen ? (
            // Close (X) Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Chat Bubble Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Workspace;