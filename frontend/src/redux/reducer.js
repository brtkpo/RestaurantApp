const initialState = {
  token: sessionStorage.getItem('authToken') || null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_TOKEN':
      if (action.payload) {
        sessionStorage.setItem('authToken', action.payload); 
        sessionStorage.removeItem('authToken'); 
      }
      return {
        ...state,
        token: action.payload,  
      };
    default:
      return state;
  }
};

export default reducer;
