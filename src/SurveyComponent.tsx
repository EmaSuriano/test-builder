import { Model, TextMarkdownEvent } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import quiz from "./test-generated.json";
import { PlainLight } from "survey-core/themes";

const isDone = (opt: TextMarkdownEvent) =>
  opt.text.includes("✅") || opt.text.includes("❌");

function SurveyComponent() {
  const survey = new Model(quiz);
  survey.applyTheme(PlainLight);

  survey.onComplete.add(console.log);

  // Append result after value updated
  survey.onValueChanged.add((_, options) => {
    const { question } = options;

    console.log(question.description);

    question.description = question.isAnswerCorrect()
      ? "✅"
      : `❌ - ${question.description}`;
  });

  survey.onTextMarkdown.add((_, opt) => {
    if (opt.name === "description" && !isDone(opt)) {
      opt.html = "❓";
    }
  });

  return <Survey model={survey} />;
}

export default SurveyComponent;
