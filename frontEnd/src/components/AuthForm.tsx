import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
type inputType = "text" | "password" | "number" | "tel";
type FormField<T> = { type: inputType; autoComplete: string; key: Path<T> };
type AuthFormProps<T extends FieldValues> = {
  formFields: FormField<T>[];
  form: UseFormReturn<T>;
  onSubmit: (userData: T) => Promise<void>;
  mode: "signup" | "login";
  switchMode: () => void;
};

export default function AuthForm<T extends FieldValues>({ formFields, form, onSubmit, mode, switchMode }: AuthFormProps<T>) {
  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;
  console.log(errors);
  return (
    <div className="flex justify-center items-center flex-col">
      <form
        onSubmit={handleSubmit(
          async data => {
            try {
              await onSubmit(data);
            } catch (err) {
              console.log(err);
            }
          },
          errors => console.log(errors),
        )}
        className="flex flex-col gap-10 justify-center items-center w-75 m-auto rounded-4xl shadow-[0_1px_8px_-1px_rgba(0,0,0,0.5)] aspect-square my-5 p-5">
        {formFields.map(({ key, autoComplete, type }) => {
          return (
            <div className="w-full" key={key}>
              <input
                autoComplete={autoComplete}
                type={type}
                id={key}
                placeholder={key}
                {...register(key)}
                className="rounded-4xl border border-black p-2.5 w-full"
              />
            </div>
          );
        })}
        <button type="submit" className="filled-button" disabled={isSubmitting}>
          submit
        </button>
      </form>
      {
        <button className="filled-button" onClick={switchMode}>
          switch to {mode === "signup" ? "login" : "signup"}
        </button>
      }
    </div>
  );
}
