import { marked } from "marked";
import { JSDOM } from "jsdom";
import { Question, questionSchema } from "./schema";
import { v4 as uuidv4 } from "uuid";

export const markdownToDocument = async (
  content: string,
): Promise<Document> => {
  const html = await marked(content);

  const sectionRegex = /(<h2>.*?<\/h2>)(.*?)(?=<h[1-6]>|$)/gs;

  const wrappedHtml = html.replace(
    sectionRegex,
    (_, header, content) => `<section>${header}${content}</section>`,
  );

  const dom = new JSDOM(wrappedHtml);

  return dom.window.document;
};

const getNodeText = (elem: any): string =>
  (elem && elem.textContent?.trim()) || "";

export const getTitle = (document: Document): string =>
  getNodeText(document.querySelector("h1"));

export const getQuestions = (document: Document): Question[] => {
  return Array.from(document.querySelectorAll("section")).map((section) => {
    const question: Record<string, string | string[]> = {};

    section.childNodes.forEach((currElem) => {
      // if (!(currElem instanceof HTMLElement)) {
      //   return;
      // }

      switch (currElem.tagName) {
        case "H2":
          question.title = getNodeText(currElem);
          break;

        case "BLOCKQUOTE":
          question.description = getNodeText(currElem);
          break;

        case "UL": {
          const options = Array.from(currElem.querySelectorAll("li")).map(
            (li) => {
              const input = li.querySelector("input");
              const checked = input?.getAttribute("checked") !== null; // Check if the input is marked as checked
              const label = getNodeText(li);

              return { label, checked };
            },
          );

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

    return questionSchema.parse(question);
  });
};

export const enhanceQuestion = (q: Question) => {
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
