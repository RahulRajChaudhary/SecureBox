import { create } from 'zustand';

// UI state for the upload queue. UploadManager instances live outside the
// store (in a plain Map) since they're not serializable/reactive state,
// just handles the components use to call pause/resume/abort.
export const managers = new Map();

export const useUploadStore = create((set) => ({
  uploads: [],

  addUpload: (file) => {
    const id = crypto.randomUUID();
    set((s) => ({
      uploads: [
        ...s.uploads,
        { id, name: file.name, size: file.size, status: 'queued', uploadedBytes: 0, error: null },
      ],
    }));
    return id;
  },

  updateUpload: (id, patch) =>
    set((s) => ({
      uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),

  removeUpload: (id) => {
    managers.delete(id);
    set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) }));
  },
}));
