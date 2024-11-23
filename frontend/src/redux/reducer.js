const initialState = {
  //token: null,  // Domyślnie brak tokena
  token: sessionStorage.getItem('authToken') || null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_TOKEN':
      if (action.payload) {
        sessionStorage.setItem('authToken', action.payload); // Zapisz token do sessionStorage
      } else {
        sessionStorage.removeItem('authToken'); // Usuń token z sessionStorage
      }
      return {
        ...state,
        token: action.payload,  // Ustawienie tokena
      };
    default:
      return state;
  }
};

export default reducer;
