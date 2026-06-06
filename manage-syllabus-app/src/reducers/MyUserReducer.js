import cookies from "react-cookies";

export default (current, action) => {
  switch (action.type) {
    case "login":
      return action.payload;
    case "logout":
      cookies.remove("token");
      cookies.remove("refresh_token");
      cookies.remove("user");
      return null;
  }
  return current;
};
