import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserToken } from '../redux/actions';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);

  useEffect(() => {
    const tokenFromSession = sessionStorage.getItem('authToken'); 
    if (!token && tokenFromSession) {
      dispatch(setUserToken(tokenFromSession)); 
    }
  }, [token, dispatch]);

  return children; 
};

export default AuthProvider;
