import * as fs from "fs";
import {
  enhanceQuestion,
  getQuestions,
  getTitle,
  markdownToHtml,
} from "./helpers.ts";
import { JSDOM } from "jsdom";

const { DOC_PATH } = process.env;
if (!DOC_PATH) {
  throw Error("Please specify path of the doc, by sending DOC_PATH as env");
}

const file = fs.readFileSync(DOC_PATH, "utf8");

const html = await markdownToHtml(file);

const { document } = new JSDOM(html).window;

const title = getTitle(document);

const questions = getQuestions(document);

const pages = questions
  .sort(() => Math.random() - 0.5)
  .map((q) => ({ elements: enhanceQuestion(q) }));

const data = {
  title,
  pages,
  showProgressBar: "bottom",
  completedHtml:
    "<h4>You got <b>{correctAnswers}</b> out of <b>{questionCount}</b> correct answers.</h4>",
};

fs.writeFileSync("./src/quiz.generated.json", JSON.stringify(data, null, 2));
