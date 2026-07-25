import { Routes, Route } from "react-router";
import LandingPage from "./pages/LandingPage";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
function App() {
  return (
    <>
      <NavBar />

      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
