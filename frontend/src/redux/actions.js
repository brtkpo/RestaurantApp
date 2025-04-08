export const setUserToken = (token) => {
  return {
    type: 'SET_USER_TOKEN',
    payload: token,
  };
};

export const logoutUser = () => (dispatch) => {
  dispatch(setUserToken(null)); 
  sessionStorage.removeItem('authToken'); 
};
  
  //export const clearUserToken = () => ({
  //  type: 'CLEAR_USER_TOKEN',
  //});