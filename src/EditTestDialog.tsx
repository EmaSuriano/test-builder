import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import {
  enhanceQuestion,
  getQuestions,
  getTitle,
  markdownToHtml,
} from "./generate-quiz/helpers";

type Props = { onSubmit: (quiz: object) => void };

const generateQuiz = async (raw: string) => {
  const html = await markdownToHtml(raw);

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  const title = getTitle(document);

  const questions = getQuestions(document);

  const pages = questions
    .sort(() => Math.random() - 0.5)
    .map((q) => ({ elements: enhanceQuestion(q) }));

  return {
    title,
    pages,
    showProgressBar: "bottom",
    completedHtml:
      "<h4>You got <b>{correctAnswers}</b> out of <b>{questionCount}</b> correct answers.</h4>",
  };
};

export const EditTestDialog = ({ onSubmit }: Props) => {
  const [open, setOpen] = useState(false);
  const [rawQuiz, setRawQuiz] = useState("");

  useEffect(() => {
    import("./contents/test.md").then((res) => {
      fetch(res.default)
        .then((response) => response.text())
        .then((data) => setRawQuiz(data))
        .catch((error) =>
          console.error("Error fetching Markdown file:", error),
        );
    }); // Fetch from the public directory
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Edit Test
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
          <DialogDescription>
            Feel free to pase the markdown that you want to assert your
            knowledge
          </DialogDescription>
        </DialogHeader>

        <form
          id="FORM_ID"
          onSubmit={async (evt) => {
            evt.preventDefault();
            const quiz = await generateQuiz(rawQuiz);
            onSubmit(quiz);
            setOpen(false);
          }}
        >
          <Textarea
            rows={20}
            value={rawQuiz}
            onChange={(e) => setRawQuiz(e.target.value)}
          />
        </form>

        <DialogFooter>
          <Button type="submit" form="FORM_ID">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
