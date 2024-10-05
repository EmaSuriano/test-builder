import { marked } from "marked";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

async function markdownToDocument(doc: string): Promise<Document> {
  // Convert Markdown to HTML
  let html = await marked(doc);

  // Regular expression to match headers and content
  const sectionRegex = /(<h2>.*?<\/h2>)(.*?)(?=<h[1-6]>|$)/gs;

  // Wrap matched sections in <section> tags
  html = html.replace(
    sectionRegex,
    (_, header, content) => `<section>${header}${content.trim()}</section>`,
  );

  console.log(html);

  const dom = new JSDOM(html);

  return dom.window.document;
}

type NonEmptyArray<T> = [T, ...T[]]; // At least one element

type Question = {
  title: string;
  description: string;
  choices: string[];
  correctAnswer: string[] | string;
  meta?: string;
};

type CompleteQuestion = {
  title: string;
  description: string;
  choices: NonEmptyArray<string>;
  correctAnswer: string;
  meta?: string;
};

const { DOC_PATH } = process.env;
if (!DOC_PATH) {
  throw Error("Please specify path of the doc, by sending DOC_PATH as env");
}

const getNodeText = (elem): string => elem.textContent?.trim() || "";

const document = await markdownToDocument(fs.readFileSync(DOC_PATH, "utf8"));

const title = document.querySelector("h1")?.textContent || "";

// Create an array to hold all questions
const questions: CompleteQuestion[] = [];

// Get all sections (each question type like Checkbox, Radio button, etc.)
document.querySelectorAll("section").forEach((section) => {
  const question: Question = {
    title: "",
    description: "",
    meta: "",
    choices: [],
    correctAnswer: [],
  };

  section.childNodes.forEach((currElem) => {
    if (!(currElem instanceof HTMLElement)) {
      return;
    }

    console.log(currElem.tagName);
    switch (currElem.tagName) {
      case "H2":
        question.title = getNodeText(currElem);
        break;

      case "BLOCKQUOTE":
        question.description = getNodeText(currElem);
        break;

      case "UL": {
        const liElements = Array.from(currElem.querySelectorAll("li"));
        const options = liElements.map((li) => {
          const input = li.querySelector("input");
          const checked = input?.getAttribute("checked") !== null; // Check if the input is marked as checked
          const label = getNodeText(li);

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
        if (currElem.outerHTML) {
          question.meta += currElem.outerHTML;
        }
        break;
    }
  });

  questions.push(validateQuestion(question));
});

const validateQuestion = (q: Question): CompleteQuestion => {
  if (q.choices.length < 1) {
    throw Error(`The following question "${q.title}" does not have choices`);
  }

  if (!q.correctAnswer) {
    throw Error(
      `The following question "${q.title}" does not have a correct answer`,
    );
  }

  return q;
};

const enhanceQuestion = (q: CompleteQuestion) => {
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
