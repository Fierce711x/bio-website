import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError } from "../lib/axios/apiError";
type inputType = "text" | "password" | "number" | "tel" | "email";
type FormField<T> = { type: inputType; autoComplete: string; key: Path<T>; placeHolder?: string };
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
              if (err instanceof ApiError) {
                console.log(err.message);
                console.log(err.status);
              }
            }
          },
          errors => console.log(errors),
        )}
        className="flex flex-col gap-10 justify-center items-center w-75 m-auto rounded-4xl shadow-[0_1px_8px_-1px_rgba(0,0,0,0.5)] aspect-square my-5 p-5">
        {formFields.map(({ key, autoComplete, type, placeHolder }) => {
          if (key === "grade")
            return (
              <div className="w-full" key={key}>
                <select
                  autoComplete={autoComplete}
                  id={key}
                  {...register(key)}
                  defaultValue={"SEC_1"}
                  className="rounded-4xl border border-black p-2.5 w-full">
                  <option value="SEC_1">1st Secondary</option>
                  <option value="SEC_2">2nd Secondary</option>
                  <option value="SEC_3">3rd Secondary</option>
                </select>
              </div>
            );
          return (
            <div className="w-full" key={key}>
              <input
                autoComplete={autoComplete}
                type={type}
                id={key}
                placeholder={placeHolder ?? key}
                {...register(key)}
                className="rounded-4xl border border-black p-2.5 w-full"
              />
            </div>
          );
        })}
        {/* {mode === "signup" && } */}
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
