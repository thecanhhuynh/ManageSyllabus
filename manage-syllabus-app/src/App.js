import {BrowserRouter, Route, Routes} from "react-router-dom";
import MyHeader from "./components/MyHeader";
import MyFooter from "./components/MyFooter";
import {Container} from "react-bootstrap";
import Home from "./screens/Home/Home";
import "bootstrap/dist/css/bootstrap.min.css";
import {ConfigProvider} from "antd";
import Login from "./screens/User/Login";
import {useReducer} from "react";
import MyUserReducer from "./reducers/MyUserReducer";
import {MyUserContext} from "./config/contexts/MyContext";
import cookies from "react-cookies";
import User from "./screens/User/User";
const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, cookies.load("user"));
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#368bd5",
          borderRadius: 6,
        },
      }}
    >
      <MyUserContext.Provider value={[user, dispatch]}>
        <BrowserRouter>
          <MyHeader />
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<User />} />
            </Routes>
          </Container>
          <MyFooter />
        </BrowserRouter>
      </MyUserContext.Provider>
    </ConfigProvider>
  );
};

export default App;
