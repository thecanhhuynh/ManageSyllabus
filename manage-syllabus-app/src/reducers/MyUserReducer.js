import cookies from "react-cookies";

const myUserReducer = (current, action) => {
  switch (action.type) {
    case "login":
      return action.payload;
    case "logout":
      cookies.remove("token");
      cookies.remove("refresh_token");
      cookies.remove("user");
      return null;
    default:
      return current;
  }
};

export default myUserReducer;
