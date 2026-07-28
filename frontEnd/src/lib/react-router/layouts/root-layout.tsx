import { Outlet } from "react-router-dom";
import NavBar from "../../../components/NavBar";
import Footer from "../../../components/Footer";
export default function RootLayout() {
  return (
    <>
      <div className="grid grid-rows-[72px_1fr_172px] min-h-dvh">
        <NavBar />
        <div className="flex items-center justify-center flex-col">
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
}
