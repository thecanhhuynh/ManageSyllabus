import {BrowserRouter, Route, Routes} from "react-router-dom";
import MyHeader from "./components/MyHeader";
import MyFooter from "./components/MyFooter";
import {Container} from "react-bootstrap";
import Home from "./screens/Home/Home";
import "bootstrap/dist/css/bootstrap.min.css";
import {ConfigProvider} from "antd";
import Login from "./screens/User/Login";
import {useEffect, useReducer, useState} from "react";
import MyUserReducer from "./reducers/MyUserReducer";
import {
  MySelectionDataContext,
  MyUserContext,
} from "./config/contexts/MyContext";
import cookies from "react-cookies";
import User from "./screens/User/User";
import SyllabusEdit from "./screens/syllabus/SyllabusEdit";
import {authApis, endpoints} from "./config/Apis";

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, cookies.load("user"));
  const [selectionDictionary, setSelectionDictionary] = useState({});
  const [isDictLoading, setIsDictLoading] = useState(true);

  const fetchMasterData = async () => {
    try {
      setIsDictLoading(true);
      const res = await authApis().get(endpoints["attribute-groups"]);
      const rawApiData = res.data;
      const dictionary = rawApiData.reduce((acc, group) => {
        acc[group.name] = group.attribute_values.map((val) => ({
          label: val.name_value,
          value: val.id,
        }));
        return acc;
      }, {});
      setSelectionDictionary(dictionary);
    } catch (error) {
      console.log(error);
    } finally {
      setIsDictLoading(false);
    }
  };
  useEffect(() => {
    fetchMasterData();
  }, []);
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
        <MySelectionDataContext.Provider
          value={{selectionDictionary, isDictLoading}}
        >
          <BrowserRouter>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <MyHeader />
              <div
                style={{flex: 1, padding: "40px 0", backgroundColor: "#f9f9f9"}}
              >
                <Container>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<User />} />
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/syllabuses/:syllabusId"
                      element={<SyllabusEdit />}
                    />
                  </Routes>
                </Container>
              </div>
              <MyFooter />
            </div>
          </BrowserRouter>
        </MySelectionDataContext.Provider>
      </MyUserContext.Provider>
    </ConfigProvider>
  );
};

export default App;
