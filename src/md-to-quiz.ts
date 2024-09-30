import { marked } from "marked";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Union type for all question types
type Question = {
  // TODO: give support for others please
  // type: "boolean" | "radiogroup" | "checkbox" | "ranking";
  type: "radiogroup";
  title: string;
  description: string;
  choices: string[];
  correctAnswer: string[] | string;
};

const testMd = fs.readFileSync("./src/test.md", "utf8");

// Convert markdown to HTML using `marked`
const html = await marked(testMd);

// Parse the HTML using JSDOM
const dom = new JSDOM(html);
const document = dom.window.document;

type Option = { label: string; checked: boolean };

// Helper to parse options and identify which are checked based on HTML input structure
function parseOptions(optionElements: Element[]): Option[] {
  return optionElements.map((li) => {
    const input = li.querySelector("input");
    const checked = input?.getAttribute("checked") !== null; // Check if the input is marked as checked
    const label = li.textContent?.trim() || ""; // Get the label text
    return {
      label,
      checked,
    };
  });
}

// TODO: give support for other types
const getType = (
  options: Option[],
  isOrdered: boolean,
): { type: Question["type"]; answers: Option[] } => {
  const answers = options.filter((opt) => opt.checked);

  // if (isOrdered) {
  //   return { type: "ranking", answers: options.map(getText) };
  // }

  // if (options.length === 2 && answers.length === 1) {
  //   return {
  //     type: "boolean",
  //     answers: options.findIndex((x) => x.checked) === 0 ? "true" : "false",
  //   };
  // }

  if (answers.length === 1) {
    return { type: "radiogroup", answers };
  }

  // if (answers.length > 1) {
  //   return { type: "checkbox", answers: answers.map(getText) };
  // }

  throw new Error("Unknown question type");
};

const getText = (opt: Option) => opt.label;

// Function to determine the type of the question
function determineQuestionType(
  title: string,
  description: string,
  options: Option[],
  isOrdered: boolean,
): Question {
  const { type, answers } = getType(options, isOrdered);

  return {
    type,
    title,
    description,
    choices: options.map(getText),
    correctAnswer: answers.map(getText),
  };
}

// Create an array to hold all questions
const questions: Question[] = [];

// Get all sections (each question type like Checkbox, Radio button, etc.)
const sections = document.querySelectorAll("h2");

sections.forEach((section) => {
  const title = section.textContent || ""; // Extract the title (e.g., "Checkbox")

  // Get the description (the blockquote directly after the title)
  const descriptionElement = section.nextElementSibling;
  const description =
    descriptionElement && descriptionElement.tagName === "BLOCKQUOTE"
      ? descriptionElement.textContent?.trim() || ""
      : "";

  // Get the options (answers) - could be either an unordered list (ul) or ordered list (ol)
  const optionsElement = descriptionElement?.nextElementSibling;
  let options: { label: string; checked: boolean }[] = [];
  let isOrdered = false;

  if (optionsElement && optionsElement.tagName === "UL") {
    const liElements = Array.from(optionsElement.querySelectorAll("li"));
    options = parseOptions(liElements);
  } else if (optionsElement && optionsElement.tagName === "OL") {
    isOrdered = true;
    options = Array.from(optionsElement.querySelectorAll("li")).map((li) => ({
      label: li.textContent || "",
      checked: false, // Ordered lists are not checkable
    }));
  }

  // Determine the type of question and add it to the array
  const question = determineQuestionType(
    title,
    description,
    options,
    isOrdered,
  );
  questions.push(question);
});

const enhanceQuestion = (q: Question) => {
  const name = uuidv4();

  return {
    ...q,
    name,
    choicesOrder: "random",
    enableIf: `{${name}} empty`,
    isRequired: true,
  };
};

const data = {
  title: document.querySelector("h1")?.textContent || "",
  showProgressBar: "bottom",
  showPrevButton: false,
  pages: questions.map((q) => ({ elements: [enhanceQuestion(q)] })),

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

fs.writeFileSync("./src/test-generated.json", JSON.stringify(data, null, 2));
