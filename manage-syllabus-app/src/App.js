import {BrowserRouter, Outlet, Route, Routes} from "react-router-dom";
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
import FacultyManagement from "./screens/Admin/FacultyManagement";
import AdminRoutes from "./screens/Admin/AdminRoutes";
import SubjectManagement from "./screens/Admin/SubjectManagement";
import MySpinner from "./components/MySpinner";
import AdminManagement from "./screens/Admin/AdminManagement";
import MajorManagement from "./screens/Admin/MajorManagement";
import TrainingProgramManagement from "./screens/Admin/TrainingProgramManagement";
import SyllabusesProgram from "./screens/Admin/SyllabusesProgram";
import ProgrammeLearningOutcomeManagement from "./screens/Admin/ProgrammeLearningOutcomeManagement";
import SpecialistRoutes from "./screens/Specialist/SpecialistRoutes";
import TemplateManagement from "./screens/Specialist/TemplateManagement";
import SpecialistManagement from "./screens/Specialist/SpecialistManagement";
import TemplateBuilder from "./screens/Specialist/TemplateBuilder";
const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [selectionDictionary, setSelectionDictionary] = useState({});
  const [isDictLoading, setIsDictLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const autoLogin = async () => {
    const token = cookies.load("token");
    if (token) {
      try {
        let res = await authApis(token).get(endpoints["profile"]);
        dispatch({
          type: "login",
          payload: res.data,
        });
      } catch (error) {
        console.error("Tự động đăng nhập thất bại:", error);
      }
    }
    setAuthLoading(false);
  };

  const fetchMasterData = async () => {
    try {
      setIsDictLoading(true);
      const token = cookies.load("token");
      if (!token) return;
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
    autoLogin();
  }, []);

  if (authLoading) {
    return <MySpinner />;
  }
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
                    <Route
                      path="/admin"
                      element={
                        <AdminRoutes>
                          <Outlet />
                        </AdminRoutes>
                      }
                    >
                      <Route index element={<AdminManagement />} />

                      <Route path="faculties" element={<FacultyManagement />} />
                      <Route path="subjects" element={<SubjectManagement />} />
                      <Route path="majors" element={<MajorManagement />} />

                      <Route path="training-programs">
                        <Route index element={<TrainingProgramManagement />} />
                        <Route
                          path=":programId/syllabuses"
                          element={<SyllabusesProgram />}
                        />
                      </Route>
                      <Route
                        path="programs-learning-outcomes"
                        element={<ProgrammeLearningOutcomeManagement />}
                      />
                    </Route>
                    <Route
                      path="/specialist"
                      element={
                        <SpecialistRoutes>
                          <Outlet />
                        </SpecialistRoutes>
                      }
                    >
                      <Route index element={<SpecialistManagement />} />
                      <Route
                        path="templates"
                        element={<TemplateManagement />}
                      />
                      <Route
                        path="templates/:id/builder"
                        element={<TemplateBuilder />}
                      />
                    </Route>
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
