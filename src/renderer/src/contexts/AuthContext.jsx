import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useApi } from './ApiContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [secretKey, setSecretKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(null);

  // Check if setup is complete on mount
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const result = await api.auth.checkSetup();
        console.log('Setup check result:', result);
        setIsSetupComplete(result.isComplete);
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, [api]);

  // Generate secret key from user credentials using Web Crypto API
  const generateSecretKey = async (password, username, userId) => {
    const encoder = new TextEncoder();
    
    // Create the nested hashes
    const innerData = encoder.encode(userId);
    const innerHash = await crypto.subtle.digest('SHA-256', innerData);
    
    const middleData = encoder.encode(username + Array.from(new Uint8Array(innerHash)).map(b => b.toString(16).padStart(2, '0')).join(''));
    const middleHash = await crypto.subtle.digest('SHA-256', middleData);
    
    const finalData = encoder.encode(password + Array.from(new Uint8Array(middleHash)).map(b => b.toString(16).padStart(2, '0')).join(''));
    const finalHash = await crypto.subtle.digest('SHA-256', finalData);
    
    return Array.from(new Uint8Array(finalHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const setup = async (setupData) => {
    try {
      console.log('AuthContext: Sending setup data:', setupData);
      const result = await api.auth.setup(setupData);
      console.log('AuthContext: Setup result:', result);
  
      if (result.success) {
        setUser(result.user);
        setIsSetupComplete(true);
        const firstRunResult = await api.storage.firstRun();
        console.log('AuthContext: First run result:', firstRunResult);
        
        // Store any necessary auth tokens or session data
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
      }
  
      return result;
    } catch (error) {
      console.error('Setup error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = useCallback(async (username, password) => {
    try {
      console.log('AuthContext: Attempting login...');
      const result = await api.auth.login({ username, password });
      console.log('AuthContext: Login response:', result);
      
      if (result.success && result.user) {
        console.log('AuthContext: Setting user state:', result.user);
        
        // Generate and store secret key
        const key = await generateSecretKey(password, username, result.user.id);
        setSecretKey(key);
        
        // Set user state
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      return { success: false, error: error.message };
    }
  }, [api]);

  const logout = useCallback(() => {
    console.log('AuthContext: Logging out');
    setUser(null);
    setSecretKey(null);
  }, []);

  // Utility function to encrypt data
  const encrypt = useCallback(async (data) => {
    if (!secretKey) {
      throw new Error('No secret key available');
    }

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    // Convert secretKey to a CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive the actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encodedData
    );

    // Combine the salt, IV, and encrypted content
    const encryptedData = new Uint8Array([
      ...salt,
      ...iv,
      ...new Uint8Array(encryptedContent)
    ]);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encryptedData));
  }, [secretKey]);

  // Utility function to decrypt data
  const decrypt = useCallback(async (encryptedData) => {
    console.log('Decrypting data:', encryptedData);
    if (!secretKey) {
      throw new Error('No secret key available');
    }
  
    try {
      // First ensure we're working with a string
      if (typeof encryptedData !== 'string') {
        throw new Error('Encrypted data must be a string');
      }
  
      // Convert base64 back to Uint8Array
      const rawData = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(c => c.charCodeAt(0))
      );
  
      // Extract the pieces
      const salt = rawData.slice(0, 16);
      const iv = rawData.slice(16, 28);
      const encryptedContent = rawData.slice(28);
  
      // Import the secret key for PBKDF2
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
  
      // Derive the decryption key using the same parameters
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
  
      // Decrypt the content
      const decryptedContent = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encryptedContent
      );

      console.log('Decrypted content:', decryptedContent);
  
      // Convert back to string
      const decoder = new TextDecoder();
      const result = decoder.decode(decryptedContent);
  
      // Try parsing in case it's JSON
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
  
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }, [secretKey]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isSetupComplete,
    hasSecretKey: !!secretKey,
    login,
    logout,
    setup,
    encrypt,
    decrypt
  };

  console.log('AuthContext: Current state:', { 
    isAuthenticated: !!user, 
    isLoading, 
    isSetupComplete,
    hasSecretKey: !!secretKey,
    user 
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 