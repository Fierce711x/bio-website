import { useNavigate } from "react-router";
import Logo from "./Logo";
export default function NavBar() {
  const navigate = useNavigate();
  return (
    <>
      <nav className="flex justify-between items-center w-screen h-18 py-2.5 px-[calc((80/1440)*100vw)] bg-background">
        <Logo />
        <div className="flex gap-[calc((32/1440)*100vw)]">
          <button
            onClick={e => {
              e.currentTarget.classList.add("bg-secondary-container");
              navigate("/login");
            }}
            className="w-[clamp(90px,calc((115/1440)*100vw),115px)] h-11.5 rounded-[100px] capitalize font-cairo font-semibold text-[14px] leading-[100%] tracking- flex justify-center items-center p-[10px_20px] border-2 border-primary text-secondary transition-colors duration-200 ease-in-out">
            log in
          </button>
          <button
            onClick={e => {
              e.currentTarget.classList.remove("bg-primary", "text-white");
              e.currentTarget.classList.add("bg-secondary-container", "text-secondary");
              navigate("/signup");
            }}
            className="w-[clamp(90px,calc((115/1440)*100vw),115px)] h-11.5 capitalize font-cairo font-semibold text-[14px] leading-[100%] tracking- filled-button">
            get started
          </button>
        </div>
      </nav>
    </>
  );
}
