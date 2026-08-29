import Card from "./Card";
export default function Courses() {
  return (
    <>
      <section className="w-screen capitalize bg-background p-[40px_80px] flex justify-between flex-col gap-7">
        <h2 className="font-el-messiri font-bold text-[32px] leading-[100%] tracking- text-[#0F172A]">courses</h2>
        <section className="flex gap-5 items-center m-auto overflow-x-scroll overflow-y-hidden h-88 w-full whitespace-nowrap [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <Card
            img="🧬"
            name="cell biology"
            level="beginner"
            grade="3 secondary"
            discription="explore cells, organelles & processes"
            length="12 lessons"
            duration="3h 20m"
          />
          <Card
            img="🧬"
            name="cell biology"
            level="beginner"
            grade="3 secondary"
            discription="explore cells, organelles & processes"
            length="12 lessons"
            duration="3h 20m"
          />
          <Card
            img="🧬"
            name="cell biology"
            level="beginner"
            grade="3 secondary"
            discription="explore cells, organelles & processes"
            length="12 lessons"
            duration="3h 20m"
          />
          <Card
            img="🧬"
            name="cell biology"
            level="beginner"
            grade="3 secondary"
            discription="explore cells, organelles & processes"
            length="12 lessons"
            duration="3h 20m"
          />
        </section>
      </section>
    </>
  );
}
