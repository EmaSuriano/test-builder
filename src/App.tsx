import { useEffect, useState } from "react";
import { Survey } from "./Survey";
import DEFAULT_QUIZ from "./quiz.generated.json";
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { EditTestDialog } from "./EditTestDialog";

export const App = () => {
  const [darkTheme, setDarkTheme] = useState(false);
  const [quiz, setQuiz] = useState<object>(DEFAULT_QUIZ);

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(darkTheme ? "dark" : "light");
  }, [darkTheme]);

  return (
    <>
      <div className="flex space-x-2 m-2 justify-end">
        <Toggle pressed={darkTheme} onPressedChange={setDarkTheme}>
          {darkTheme ? <Sun /> : <Moon />}
        </Toggle>
        <EditTestDialog onSubmit={setQuiz} />
      </div>

      <Separator className="my-4" />

      <Survey quiz={quiz} mode="learn" theme={darkTheme ? "dark" : "light"} />
    </>
  );
};
