interface CardProps {
  img: string;
  name: string;
  level: string;
  year: string;
  discription: string;
  length: string;
  duration: string;
}

export default function Card({ img, name, level, year, discription, length, duration }: CardProps) {
  return (
    <>
      <div className="flex flex-col items-center bg-white shadow-[0px_4px_16px_0px_rgba(0,0,0,0.18)] rounded-2xl w-[clamp(220px,calc((300/1440)*100vw),300px)] h-[clamp(280px,calc((340/1284)*100dvh),340px)] justify-start overflow-clip capitalize m-auto">
        <section className="w-75 h-40 flex gap-1.5 flex-col bg-[#064E3B] items-center justify-center p-2.5">
          <p className="h-12 w-12 text-5xl font-cairo font-normal leading-[100%]">{img}</p>
          <p className="text-white font-el-messiri font- text-[15px] leading-[100%] tracking- h-6 w-20 flex justify-center items-center">
            {name}
          </p>
          <p className="p-[4px_10px] bg-[#FFFFFF33] rounded-[100px] text-[10px] font-normal leading-[100%] font-cairo text-white h-7 w-15 flex justify-center items-center">
            {level}
          </p>
        </section>
        <section className="flex flex-col gap-2.5 text-[#475569]  font-cairo font-medium p-[14px_16px] w-full">
          <h3 className="font-el-messiri font-bold text-[#0F172A]">{year}</h3>
          <p className="text-[12px]">{discription}</p>
          <span className="text-[11px] leading-4 tracking-[0.5px] flex gap-2.5 items-center">
            <span>{length}</span> <span className="bg-[#94A3B8] inline-block h-0.75 w-0.75 rounded-[50%]"></span> <span>{duration}</span>
          </span>
          <button
            onClick={e => {
              e.currentTarget.classList.remove("bg-primary", "text-white");
              e.currentTarget.classList.add("bg-secondary-container", "text-secondary");
            }}
            className="w-full h-9.5 p-[10px_20px] rounded-4xl self-center font-label-medium filled-button">
            start course →
          </button>
        </section>
      </div>
    </>
  );
}
