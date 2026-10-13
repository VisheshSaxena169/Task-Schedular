import api from "./api";

const getAuthConfig = () => {
  const token = localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Create workspace
export const createWorkspace = async (name) => {
  const response = await api.post(
    "/workspaces",
    { name },
    getAuthConfig()
  );

  return response.data;
};

// Get all workspaces
export const getWorkspaces = async () => {
  const response = await api.get(
    "/workspaces",
    getAuthConfig()
  );

  return response.data;
};

// Get single workspace
export const getWorkspace = async (id) => {
  console.log("id from workspace service",id);
  const response = await api.get(
    `/workspaces/${id}`,
    getAuthConfig()
  );

  return response.data;
};

// Update workspace
export const updateWorkspace = async (id, name) => {
  const response = await api.patch(
    `/workspaces/${id}`,
    { name },
    getAuthConfig()
  );

  return response.data;
};

// Delete workspace
export const deleteWorkspace = async (id) => {
  const response = await api.delete(
    `/workspaces/${id}`,
    getAuthConfig()
  );

  return response.data;
};

// Invite member
export const inviteMember = async (id, email, role = "member") => {
  const response = await api.post(
    `/workspaces/${id}/members`,
    { email, role },
    getAuthConfig()
  );

  return response.data;
};

// Get members
export const getMembers = async (id) => {
  const response = await api.get(
    `/workspaces/${id}/members`,
    getAuthConfig()
  );

  return response.data;
};

// Change member role
export const changeMemberRole = async (
  workspaceId,
  userId,
  role
) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/members/${userId}`,
    { role },
    getAuthConfig()
  );

  return response.data;
};

// Remove member
export const removeMember = async (
  workspaceId,
  userId
) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/members/${userId}`,
    getAuthConfig()
  );

  return response.data;
};

// Create board
export const createBoard = async (
  workspaceId,
  boardData
) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/boards`,
    boardData,
    getAuthConfig()
  );

  return response.data;
};

// Get boards
export const getBoards = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/boards`,
    getAuthConfig()
  );

  return response.data;
};