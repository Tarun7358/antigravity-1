export let localFiles = [
  { id: 'readme_md', _id: 'readme_md', name: 'README.md', content: '# Welcome to Test Workspace\n\nThis is a local, fully interactive file.', path: 'README.md', type: 'file', parentId: null }
];

export const listeners = new Set();
export const triggerListeners = () => {
  listeners.forEach(cb => cb({
    docs: localFiles.map(file => ({
      id: file._id,
      data: () => file
    }))
  }));
};

export const collection = () => 'mock_collection';
export const query = () => 'mock_query';
export const orderBy = () => 'mock_orderby';
export const where = () => 'mock_where';

export const onSnapshot = (q, successCallback, errorCallback) => {
  listeners.add(successCallback);
  setTimeout(() => {
    successCallback({
      docs: localFiles.map(file => ({
        id: file._id,
        data: () => file
      }))
    });
  }, 100);
  return () => {
    listeners.delete(successCallback);
  };
};

export const addDoc = async (col, data) => {
  const newId = 'file_' + Math.random().toString(36).substring(2, 9);
  const newFile = {
    id: newId,
    _id: newId,
    ...data,
    createdAt: new Date().toISOString()
  };
  localFiles.push(newFile);
  triggerListeners();
  return { id: newId };
};

export const updateDoc = async (docRef, data) => {
  const fileId = docRef.id;
  localFiles = localFiles.map(f => f.id === fileId ? { ...f, ...data } : f);
  triggerListeners();
};

export const doc = (db, col, ...paths) => {
  const id = paths[paths.length - 1];
  return { id };
};

export const serverTimestamp = () => new Date().toISOString();
