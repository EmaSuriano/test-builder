import { TextMarkdownEvent } from "survey-core";
import { Survey as SurveyReact, SurveyModel } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { PlainDark, PlainLight } from "survey-core/themes";
import { useEffect, useMemo } from "react";
import { notReachable } from "./helpers";

const isDone = (opt: TextMarkdownEvent) =>
  opt.text.includes("✅") || opt.text.includes("❌");

type Props = {
  mode: "learn" | "test";
  quiz: object;
  theme: "light" | "dark";
};

export const Survey = ({ quiz, mode, theme }: Props) => {
  const survey = useMemo(() => new SurveyModel(quiz), [quiz]);

  useEffect(() => {
    switch (mode) {
      case "learn":
        enableTestMode(survey);
        break;

      case "test":
        break;

      default:
        notReachable(mode);
    }
  }, [mode, survey]);

  useEffect(() => {
    switch (theme) {
      case "light":
        survey.applyTheme(PlainLight);
        break;

      case "dark":
        survey.applyTheme(PlainDark);
        break;

      default:
        notReachable(theme);
    }
  }, [theme, survey]);

  return <SurveyReact model={survey} />;
};

const enableTestMode = (survey: SurveyModel) => {
  survey.onComplete.add(console.log);

  survey.onValueChanged.add((_, options) => {
    const { question } = options;

    question.description = question.isAnswerCorrect()
      ? "✅"
      : `❌ - ${question.description}`;
  });

  survey.onTextMarkdown.add((_, opt) => {
    if (opt.name === "description" && !isDone(opt)) {
      opt.html = "❓";
    }
  });
};
