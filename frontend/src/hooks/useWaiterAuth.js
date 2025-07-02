import { useState, useEffect } from 'react';

export const useWaiterAuth = () => {
  const [isWaiterMode, setIsWaiterMode] = useState(false);
  const [waiterInfo, setWaiterInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedWaiterInfo = localStorage.getItem('waiterInfo');
    const waiterToken = localStorage.getItem('waiterToken');

    if (waiterToken && storedWaiterInfo) {
      setIsWaiterMode(true);
      setWaiterInfo(JSON.parse(storedWaiterInfo));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('waiterToken');
    localStorage.removeItem('waiterInfo');
    setIsWaiterMode(false);
    setWaiterInfo(null);
  };

  return {
    isWaiterMode,
    waiterInfo,
    loading,
    logout
  };
};
