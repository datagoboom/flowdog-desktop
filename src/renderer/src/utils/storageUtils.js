// storageUtils.js
import { openDB } from 'idb';

const DB_NAME = 'workflow_db';
const STORE_NAME = 'workflow_store';
const DB_VERSION = 1;

export const DEFAULT_STORAGE = {
  type: 'memory',
  data: new Map()
};

export const initStorage = async () => {
  // First try IndexedDB
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    
    // Test write to verify we can actually use IndexedDB
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.put({ test: 'test' }, 'test_key');
    await tx.done;
    
    return {
      type: 'indexedDB',
      db
    };
  } catch (error) {
    console.log('IndexedDB not available, falling back to localStorage:', error);
    
    // Test localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return {
        type: 'localStorage'
      };
    } catch (error) {
      console.warn('Neither IndexedDB nor localStorage are available:', error);
      return DEFAULT_STORAGE;
    }
  }
};

export const loadState = async (storage = DEFAULT_STORAGE) => {
  try {
    let savedState = null;
    
    switch (storage.type) {
      case 'indexedDB':
        const tx = storage.db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        savedState = await store.get('workflow_data');
        break;
        
      case 'localStorage':
        const data = localStorage.getItem('workflow_data');
        savedState = data ? JSON.parse(data) : null;
        break;
      
      case 'memory':
        savedState = storage.data.get('workflow_data');
        break;
    }
    
    // If we have saved state, ensure all expected properties exist
    if (savedState) {
      savedState.nodes = savedState.nodes || [];
      savedState.edges = savedState.edges || [];
      savedState.nodeCounter = savedState.nodeCounter || {};
      savedState.nodeSequence = savedState.nodeSequence || {};
    }
    
    return savedState;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

export const saveState = async (storage = DEFAULT_STORAGE, state) => {
  if (!state) return;
  
  try {
    const cleanState = cleanStateForStorage(state);
    
    switch (storage.type) {
      case 'indexedDB':
        const tx = storage.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.put(cleanState, 'workflow_data');
        await tx.done;
        break;
        
      case 'localStorage':
        localStorage.setItem('workflow_data', JSON.stringify(cleanState));
        break;
        
      case 'memory':
        storage.data.set('workflow_data', cleanState);
        break;
    }
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const clearState = async (storage = DEFAULT_STORAGE) => {
  try {
    switch (storage.type) {
      case 'indexedDB':
        const tx = storage.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.delete('workflow_data');
        await tx.done;
        break;
        
      case 'localStorage':
        localStorage.removeItem('workflow_data');
        break;
        
      case 'memory':
        storage.data.delete('workflow_data');
        break;
    }
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};

// Helper functions for cleaning data
const cleanNodeData = (node) => {
  const cleanData = { ...node };
  if (cleanData.data) {
    Object.keys(cleanData.data).forEach(key => {
      if (typeof cleanData.data[key] === 'function') {
        delete cleanData.data[key];
      }
    });
  }
  delete cleanData.dragHandle;
  delete cleanData.dragging;
  delete cleanData.selected;
  return cleanData;
};

const cleanEdgeData = (edge) => {
  const cleanData = { ...edge };
  delete cleanData.selected;
  delete cleanData.updatable;
  return cleanData;
};

const cleanStateForStorage = (state) => {
  const cleanState = { ...state };
  if (cleanState.nodes) {
    cleanState.nodes = cleanState.nodes.map(cleanNodeData);
  }
  if (cleanState.edges) {
    cleanState.edges = cleanState.edges.map(cleanEdgeData);
  }
  Object.keys(cleanState).forEach(key => {
    if (typeof cleanState[key] === 'function') {
      delete cleanState[key];
    }
  });
  return cleanState;
};