
import { useEffect, useState,useContext  } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AuthContext } from "../context/AuthContext"; // Make sure this path matches your folder structure!

import {
  getStages,
  getTasksByStage,
  createStage,
  createTask,
  deleteTask,
  moveTask,
  deleteStage
} from "../services/taskService";



const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState({}); // Stores tasks grouped by stageId: { stageId: [tasks] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeStageId, setActiveStageId] = useState(null); // Knows which column to add the task to
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" });
  
  const [newStageName, setNewStageName] = useState("");
  const { socket } = useContext(AuthContext);

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

useEffect(() => {
    if (!socket || !boardId) return; 

    socket.emit('join_workspace', boardId); 

    const handleTaskMoved = (data) => {
      const { taskId, destinationStageId, newOrder } = data;
      console.log("🔥 REAL-TIME UPDATE! Moving card in UI without refreshing...", data);

      setTasks((prevTasks) => {
        let foundTask = null;
        let sourceStageId = null;
        let currentIndex = -1;

        // Find the task
        for (const stageId of Object.keys(prevTasks)) {
          const index = prevTasks[stageId]?.findIndex((t) => t._id === taskId);
          if (index !== -1 && index !== undefined) {
            foundTask = prevTasks[stageId][index];
            sourceStageId = stageId;
            currentIndex = index;
            break;
          }
        }

        if (!foundTask) return prevTasks;

        // --- NEW SAFETY CHECK ---
        // If this user already moved the card (Optimistic UI), do nothing!
        if (sourceStageId === destinationStageId && currentIndex === newOrder) {
          console.log("Card is already in the correct position. Ignoring socket event.");
          return prevTasks;
        }

        const nextTasks = { ...prevTasks };
        nextTasks[sourceStageId] = [...nextTasks[sourceStageId]];
        nextTasks[sourceStageId] = nextTasks[sourceStageId].filter((t) => t._id !== taskId);

        if (!nextTasks[destinationStageId]) {
          nextTasks[destinationStageId] = [];
        } else {
          nextTasks[destinationStageId] = [...nextTasks[destinationStageId]];
        }
        
        nextTasks[destinationStageId].splice(newOrder, 0, foundTask);

        return nextTasks;
      });
    };

    socket.on('task_moved', handleTaskMoved);

    return () => {
      socket.emit('leave_workspace', boardId);
      socket.off('task_moved', handleTaskMoved);
    };
  }, [socket, boardId]);




  // --- NEW: Silent Sync Function ---
  // This updates the tasks in the background without showing a loading screen!
 

  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch Stages
      const stageRes = await getStages(boardId);
      const fetchedStages = stageRes.stages || [];
      setStages(fetchedStages);

      // 2. Fetch Tasks for each stage concurrently
      const tasksByStage = {};
      await Promise.all(
        fetchedStages.map(async (stage) => {
          try {
            const taskRes = await getTasksByStage(stage._id);
            tasksByStage[stage._id] = taskRes.tasks || [];
          } catch (err) {
            tasksByStage[stage._id] = [];
          }
        })
      );

      setTasks(tasksByStage);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  //  const syncBoardData = async () => {
  //   try {
  //     const stageRes = await getStages(boardId);
  //     const fetchedStages = stageRes.stages || [];
  //     setStages(fetchedStages);

  //     const tasksByStage = {};
  //     await Promise.all(
  //       fetchedStages.map(async (stage) => {
  //         try {
  //           const taskRes = await getTasksByStage(stage._id);
  //           tasksByStage[stage._id] = taskRes.tasks || [];
  //         } catch (err) {
  //           tasksByStage[stage._id] = [];
  //         }
  //       })
  //     );

  //     setTasks(tasksByStage);
  //   } catch (error) {
  //     console.error("Background sync failed:", error);
  //   }
  // };

  // --- Drag and Drop Logic ---
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid column
    if (!destination) return;

    // Dropped in the exact same spot
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    // Clone arrays for optimistic UI update
    const sourceTasks = Array.from(tasks[sourceStageId] || []);
    const destTasks = sourceStageId === destStageId ? sourceTasks : Array.from(tasks[destStageId] || []);

    // Remove task from source
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Insert task into destination
    if (sourceStageId === destStageId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setTasks({ ...tasks, [sourceStageId]: sourceTasks });
    } else {
      destTasks.splice(destination.index, 0, movedTask);
      setTasks({
        ...tasks,
        [sourceStageId]: sourceTasks,
        [destStageId]: destTasks,
      });
    }

    // Call Backend API
    try {
      await moveTask(draggableId, destStageId, destination.index);
    } catch (error) {
      // If this prints in your browser console, this is why the board is reloading!
      console.error("Frontend API Error during drag-and-drop:", error);
      setError("Failed to move task. Reloading board...");
      loadBoardData(); // Revert UI if API fails
    }
  };

  // --- Actions ---
  const handleCreateStage = async (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    try {
      const res = await createStage(boardId, newStageName);
      setStages([...stages, res.stage]);
      setTasks({ ...tasks, [res.stage._id]: [] });
      setNewStageName("");
    } catch (error) {
      setError("Failed to create stage");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !activeStageId) return;

    try {
      const payload = { ...taskForm, boardId };
      const response = await createTask(activeStageId, payload);
      
      setTasks({
        ...tasks,
        [activeStageId]: [...(tasks[activeStageId] || []), response.task],
      });

      setTaskForm({ title: "", description: "", priority: "medium" });
      setShowTaskModal(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId, stageId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTasks({
        ...tasks,
        [stageId]: tasks[stageId].filter((t) => t._id !== taskId),
      });
    } catch (error) {
      setError("Failed to delete task");
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm("Are you sure? This will also delete all tasks inside this stage!")) return;
    
    try {
      await deleteStage(stageId);
      
      // Update UI: Remove the stage and its tasks from local state
      setStages(stages.filter(stage => stage._id !== stageId));
      
      const newTasks = { ...tasks };
      delete newTasks[stageId];
      setTasks(newTasks);
      
    } catch (error) {
      setError("Failed to delete stage");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-xl">←</button>
            <div>
              <h1 className="text-xl font-bold">Kanban Board</h1>
              <p className="text-xs text-slate-500">Drag and drop tasks between stages</p>
            </div>
          </div>
          
          {/* Quick Stage Creator */}
          <form onSubmit={handleCreateStage} className="flex gap-2">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="New Stage Name..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg text-sm font-medium">
              Add Column
            </button>
          </form>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 overflow-x-auto p-6">
        {error && <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading board...</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full items-start">
              
              {stages.map((stage) => (
                <div key={stage._id} className="bg-slate-900 border border-slate-800 rounded-xl w-80 shrink-0 flex flex-col max-h-full">
                  
                  {/* Column Header */}
                  {/* <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200">{stage.name}</h3>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
                      {tasks[stage._id]?.length || 0}
                    </span>
                  </div> */}

                  {/* Column Header */}
<div className="p-4 border-b border-slate-800 flex justify-between items-center group">
  <h3 className="font-semibold text-slate-200">{stage.name}</h3>
  
  <div className="flex items-center gap-2">
    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
      {tasks[stage._id]?.length || 0}
    </span>
    {/* Delete Stage Button (Shows on hover) */}
    <button 
      onClick={() => handleDeleteStage(stage._id)} 
      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete Column"
    >
      ×
    </button>
  </div>
</div>

                  {/* Droppable Task Area */}
                  <Droppable droppableId={stage._id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${
                          snapshot.isDraggingOver ? "bg-slate-800/50" : ""
                        }`}
                      >
                        {tasks[stage._id]?.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-slate-800 border rounded-lg p-4 mb-3 group ${
                                  snapshot.isDragging ? "border-blue-500 shadow-xl" : "border-slate-700 hover:border-slate-600"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-sm text-slate-200 break-words">{task.title}</h4>
                                  <button onClick={() => handleDeleteTask(task._id, stage._id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ×
                                  </button>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                    {task.priority || "Medium"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Task Button */}
                  <div className="p-3 border-t border-slate-800">
                    <button
                      onClick={() => { setActiveStageId(stage._id); setShowTaskModal(true); }}
                      className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}

              {stages.length === 0 && (
                <div className="text-slate-500 border border-dashed border-slate-700 rounded-xl p-10 w-full text-center">
                  No stages found. Create a column above to get started.
                </div>
              )}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Task title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task details..."
                  rows="3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-medium">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;