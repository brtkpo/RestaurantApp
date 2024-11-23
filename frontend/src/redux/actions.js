export const setUserToken = (token) => {
  return {
    type: 'SET_USER_TOKEN',
    payload: token,
  };
};

export const logoutUser = () => (dispatch) => {
  dispatch(setUserToken(null)); // Usuń token z Redux
  sessionStorage.removeItem('authToken'); // Usuń token z sessionStorage
};
  
  //export const clearUserToken = () => ({
  //  type: 'CLEAR_USER_TOKEN',
  //});