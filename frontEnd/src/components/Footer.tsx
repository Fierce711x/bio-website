import Logo from "./Logo";
import youtube from "../assets/youtube-image.png";
import facebook from "../assets/facebook-image.png";
import whatsapp from "../assets/whatsapp-image.png";
export default function Footer() {
  return (
    <>
      <footer className="bg-primary-container p-[50px_150px] flex justify-between items-center capitalize w-full">
        <Logo />
        <section className="flex flex-col items-center justify-between gap-7">
          <h4>social media</h4>
          <section className="flex gap-9 font-cairo text-[12px] font-medium not-italic leading-4 tracking:[0.5px]">
            <a href="" className="text-[#F00] flex items-center gap-2">
              <span
                style={{ "--bg-image": `url(${youtube})` } as React.CSSProperties}
                className={`bg-lightgray bg-[image:var(--bg-image)] bg-center bg-cover bg-no-repeat aspect-10/7 w-5 h-3.5 inline-block`}></span>
              <span>youtube</span>
            </a>
            <a href="" className="text-[#1977F3] flex items-center gap-2">
              <span
                style={{ "--bg-image": `url(${facebook})` } as React.CSSProperties}
                className={`bg-lightgray bg-[image:var(--bg-image)] bg-center bg-cover bg-no-repeat aspect-square w-5 h-5 inline-block`}></span>
              <span>facebook</span>
            </a>
          </section>
        </section>
        <section className="flex flex-col items-center justify-between gap-7">
          <h4>contact us</h4>
          <a
            href=""
            className="text-tertiary-container font-cairo text-[12px] font-medium not-italic leading-4 tracking:[0.5px] flex items-center gap-2">
            <span
              style={{ "--bg-image": `url(${whatsapp})` } as React.CSSProperties}
              className={`bg-lightgray bg-[image:var(--bg-image)] bg-center bg-cover bg-no-repeat aspect-square w-5 h-5 inline-block`}></span>
            01027738433
          </a>
        </section>
        <section className="flex flex-col items-center justify-between gap-7">
          <h4>pages</h4>
          <section className="text-tertiary-container font-cairo text-[12px] font-medium not-italic leading-4 tracking:[0.5px] flex gap-9 items-center">
            <a href="">home</a>
            <a href="">sign up</a>
            <a href="">log in</a>
          </section>
        </section>
      </footer>
    </>
  );
}
