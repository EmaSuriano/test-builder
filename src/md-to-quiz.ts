import { marked } from "marked";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

type Question = {
  title: string;
  description: string;
  choices: string[];
  correctAnswer: string[] | string;
  meta?: string;
};

const { DOC_PATH } = process.env;
if (!DOC_PATH) {
  throw Error("Please specify doc for quiz");
}

const doc = fs.readFileSync(DOC_PATH, "utf8");

// Convert markdown to HTML using `marked`
const html = await marked(doc);

// Parse the HTML using JSDOM
const dom = new JSDOM(html);
const document = dom.window.document;

const title = document.querySelector("h1")?.textContent || "";

// Create an array to hold all questions
const questions: Question[] = [];

// Get all sections (each question type like Checkbox, Radio button, etc.)
document.querySelectorAll("h2").forEach((section) => {
  const question: Question = {
    title: section.textContent || "",
    description: "",
    meta: "",
    choices: [],
    correctAnswer: [],
  };

  let currElem = section.nextElementSibling!;

  while (currElem && currElem.tagName !== "H2") {
    switch (currElem.tagName) {
      case "BLOCKQUOTE":
        question.description = currElem.textContent?.trim() || "";
        break;

      case "UL": {
        const liElements = Array.from(currElem.querySelectorAll("li"));
        const options = liElements.map((li) => {
          const input = li.querySelector("input");
          const checked = input?.getAttribute("checked") !== null; // Check if the input is marked as checked
          const label = li.textContent?.trim() || ""; // Get the label text

          return { label, checked };
        });
        question.choices = options.map((opt) => opt.label);
        question.correctAnswer = options
          .filter((opt) => opt.checked)
          .map((opt) => opt.label);
        break;
      }

      // if not recognized, then it's extra attributes
      default:
        question.meta += currElem.outerHTML;
        break;
    }

    currElem = currElem.nextElementSibling!;
  }

  questions.push(question);
});

const enhanceQuestion = (q: Question) => {
  const { meta, ...rest } = q;
  const name = uuidv4();

  const extra = meta
    ? { type: "html", name: "meta" + name, html: q.meta }
    : null;

  const defaults = {
    type: "radiogroup",
    name,
    choicesOrder: "random",
    enableIf: `{${name}} empty`,
    isRequired: true,
  };

  return [extra, { ...rest, ...defaults }].filter(Boolean);
};

const data = {
  title,
  showProgressBar: "bottom",
  pages: questions
    .sort(() => Math.random() - 0.5)
    .map((q) => ({ elements: enhanceQuestion(q) })),
  completedHtml:
    "<h4>You got <b>{correctAnswers}</b> out of <b>{questionCount}</b> correct answers.</h4>",
  completedHtmlOnCondition: [
    {
      expression: "{correctAnswers} == 0",
      html: "<h4>Unfortunately, none of your answers is correct. Please try again.</h4>",
    },
    {
      expression: "{correctAnswers} == {questionCount}",
      html: "<h4>Congratulations! You answered all the questions correctly!</h4>",
    },
  ],
};

fs.writeFileSync("./src/quiz.generated.json", JSON.stringify(data, null, 2));
