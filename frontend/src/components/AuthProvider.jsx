import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserToken } from '../redux/actions';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);

  useEffect(() => {
    const tokenFromSession = sessionStorage.getItem('authToken'); // Pobierz token z sessionStorage
    if (!token && tokenFromSession) {
      dispatch(setUserToken(tokenFromSession)); // Zsynchronizuj Redux
    }
  }, [token, dispatch]);

  return children; // Renderuj dzieci w drzewie komponentów
};

export default AuthProvider;
