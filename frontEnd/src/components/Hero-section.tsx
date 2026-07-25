import DNA from "../assets/DNA.png";
export default function Hero() {
  return (
    <>
      <section className="flex justify-between pt-9 px-20 capitalize">
        <div className="w-[30vw] flex flex-col items-start gap-7 justify-start py-20 relative">
          <p className="font-display-bold-large text-tertiary">
            explore the <br /> science of life
          </p>
          <p className="font-body-regular-large">
            master biology from cell biology to ecosystems. <br /> interactive lessons, quizzes, and bilingual content.
          </p>
          <div className="flex items-center justify-center gap-8">
            <span className="flex flex-col justify-between items-center">
              <span className="font-el-messiri font-bold text-[22px] text-secondary">12k+</span>
              <span className="font-label-large">students</span>
            </span>
            <span className="flex flex-col justify-between items-center relative px-8 after:border-r after-border-[#334155] after:h-9 after:absolute after:right-0 after:top-[calc(50%-20px)] before:border-r before-border-[#334155] before:h-9 before:absolute before:left-0 before:top-[calc(50%-20px)] ">
              <span className="font-el-messiri font-bold text-[22px] text-secondary">150+</span>
              <span className="font-label-large">lessons</span>
            </span>
            <span className="flex flex-col justify-between items-center">
              <span className="font-el-messiri font-bold text-[22px] text-secondary">4.0★</span>
              <span className="font-label-large">rating</span>
            </span>
          </div>
          <button
            onClick={e => {
              e.currentTarget.classList.remove("bg-primary", "text-white");
              e.currentTarget.classList.add("bg-secondary-container", "text-secondary");
            }}
            className="w-50 h-15 filled-button font-cairo font-semibold">
            start learning now
          </button>
          <span className="absolute top-0 right-[15%] after:absolute after:shadow-[-5px_0px_8px_0px_white] after:right-[calc(38%-5px)] after:top-[calc(90%-5px)] after:rounded-[50%] after:animate-glow-after before:absolute before:shadow-[5px_0px_8px_0px_white] before:left-[calc(34%-5px)] before:bottom-[calc(85%-5px)] before:rounded-[50%] before:animate-glow-before">
            <svg xmlns="http://www.w3.org/2000/svg" width="58" height="104" viewBox="0 0 58 104" fill="none">
              <path d="M29 0L58 52L29 104L0 52L29 0Z" fill="#A8CFEC" />
            </svg>
          </span>
        </div>
        <div className="relative w-170 h-140">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 671 557" fill="none" className="-z-100 absolute w-full h-full">
            <path
              d="M671 196.607C671 214.975 656.003 229.807 637.636 229.605L516.312 228.269C500.85 228.098 488.214 240.496 488.09 255.959L487.439 337.35C487.316 352.813 499.75 365.487 515.213 365.657L638.363 367.014C656.446 367.213 671 381.928 671 400.012V626.999C671 645.224 656.225 659.999 638 659.999H0.667192C0.298706 659.999 0 659.7 0 659.332C0 658.96 0.303216 658.661 0.674554 658.665L69.3047 659.421C84.7676 659.591 97.4026 647.193 97.5264 631.729L97.7852 599.382C97.9089 583.918 85.4746 571.245 70.0117 571.074L32.6364 570.662C14.5539 570.463 0 555.748 0 537.664V384.237C0 365.869 14.9972 351.036 33.3637 351.239L162.264 352.66C180.528 352.861 195.481 338.189 195.627 319.926L195.801 298.164C195.947 279.978 181.351 265.102 163.166 264.902L32.6363 263.463C14.5539 263.264 0 248.549 0 230.465V168.786C0 150.418 14.9972 135.585 33.3637 135.788L152.142 137.097C167.604 137.267 180.24 124.87 180.364 109.406L181.177 7.8584C181.207 4.0542 183.832 0 187.637 0H638C656.225 0 671 14.7746 671 33V196.607Z"
              fill="#A8CFEC"
            />
          </svg>
          <img src={DNA} alt="" className="aspect-22/25 h-170 w-150 absolute -top-15 rotate-6 -z-100" />
          <span className="block w-70 h-45 rounded-4xl absolute -left-[20%] top-[22%] second-glass animate-vertical-glass"></span>
          <span className="block w-65 h-32.5 rounded-4xl absolute top-[10%] -right-[10%] glass animate-horizontal-glass"></span>
          <span className="block w-25 h-31.25 bg-[#B3F9DB] absolute rounded-4xl top-[8%] left-[6%] -z-20"></span>
          <span className="block w-25 h-40 bg-[#B3F9DB] absolute rounded-4xl right-[5%] bottom-[15%] -z-20"></span>
        </div>
      </section>
    </>
  );
}
// className="block absolute w-20 h-20 z-10 bg-primary-container skew-x-20 rotate-54"
