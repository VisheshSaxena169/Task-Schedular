import api from "./api";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
});

// --- STAGE APIs ---
export const getStages = async (boardId) => {
  // Matches: router.get('/:boardId/stages', ...)
  const response = await api.get(`/boards/${boardId}/stages`, getAuthConfig());
  return response.data;
};

export const createStage = async (boardId, name) => {
  const response = await api.post(`/boards/${boardId}/stages`, { name }, getAuthConfig());
  return response.data;
};

// --- TASK APIs ---
export const getTasksByStage = async (stageId) => {
  // Matches: router.get('/:stageId/tasks', ...)
  const response = await api.get(`/stages/${stageId}/tasks`, getAuthConfig());
  return response.data;
};

export const deleteStage = async (stageId) => {
  // Matches: router.delete('/:stageId', ...) mounted at /api/stages
  const response = await api.delete(`/stages/${stageId}`, getAuthConfig());
  return response.data;
};

export const createTask = async (stageId, taskData) => {
  // Matches: router.post('/:stageId/tasks', ...)
  const response = await api.post(`/stages/${stageId}/tasks`, taskData, getAuthConfig());
  return response.data;
};

export const deleteTask = async (taskId) => {
  // Matches: router.delete('/:taskId', ...)
  const response = await api.delete(`/tasks/${taskId}`, getAuthConfig());
  return response.data;
};

export const moveTask = async (taskId, destinationStageId, newOrder) => {
  // Matches: router.patch('/:taskId/move', ...)
  const response = await api.patch(
    `/tasks/${taskId}/move`,
    { destinationStageId, newOrder },
    getAuthConfig()
  );
  return response.data;
};