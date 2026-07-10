import {useContext} from "react";
import {Navigate} from "react-router-dom";
import {MyUserContext} from "../../config/contexts/MyContext";

const SpecialistRoutes = ({children}) => {
  const [user] = useContext(MyUserContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.user_role !== "specialist") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SpecialistRoutes;
