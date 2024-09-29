import React from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import "./index.css";
import { json } from "./json";

function SurveyComponent() {
  const survey = new Model(json);
  survey.onComplete.add((sender, options) => {
    console.log(JSON.stringify(sender.data, null, 3));
  });
  const correctStr = "Correct";
  const incorrectStr = "Incorrect";

  // Builds an HTML string to display in a question title
  function getTextHtml(text, str, isCorrect) {
    if (text.indexOf(str) < 0) return undefined;

    return (
      text.substring(0, text.indexOf(str)) +
      "<span class='" +
      (isCorrect ? "correctAnswer" : "incorrectAnswer") +
      "'>" +
      text.substring(text.indexOf(str)) +
      "</span>"
    );
  }

  // Adds "Correct" or "Incorrect" to a question title
  function changeTitle(q) {
    if (!q) return;

    const isCorrect = q.isAnswerCorrect();
    if (!q.prevTitle) {
      q.prevTitle = q.title;
    }
    if (isCorrect === undefined) {
      q.title = q.prevTitle;
    }
    q.title =
      q.prevTitle +
      " " +
      (isCorrect
        ? correctStr
        : `${incorrectStr} - Justification: ${q.jsonObj.justification}`);
  }

  survey.onValueChanged.add((_, options) => {
    // Change the quesion title when the question value is changed
    changeTitle(options.question);
  });

  survey.onTextMarkdown.add((a, options) => {
    const text = options.text;
    let html = getTextHtml(text, correctStr, true);
    if (!html) {
      html = getTextHtml(text, incorrectStr, false);
    }
    if (!!html) {
      // Set an HTML string with the "Correct" or "Incorrect" suffix for display
      options.html = html;
    }
  });
  return <Survey model={survey} />;
}

export default SurveyComponent;
