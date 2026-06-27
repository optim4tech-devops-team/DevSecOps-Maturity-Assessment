import { Answers, categories, Category, questions, Question } from "@/data/assessment";

export type CategoryScore = {
  category: Category;
  score: number;
  level: string;
  answered: number;
  total: number;
  risk: "Low" | "Medium" | "High" | "Critical";
};

export type AssessmentScore = {
  overallScore: number;
  maturityLevel: string;
  categoryScores: CategoryScore[];
  completion: number;
};

export function getMaturityLevel(score: number) {
  if (score <= 20) return "Level 1 - Initial";
  if (score <= 40) return "Level 2 - Developing";
  if (score <= 60) return "Level 3 - Defined";
  if (score <= 80) return "Level 4 - Managed";
  return "Level 5 - Optimized";
}

export function getQuestionScore(question: Question, value: Answers[string]) {
  if (question.type === "numeric" || question.type === "text") return 0;
  if (!question.options || value === undefined || value === "") return 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return 0;
    const selected = question.options.filter((option) => value.includes(option.value));
    return Math.min(5, selected.reduce((max, option) => Math.max(max, option.score), 0));
  }
  return question.options.find((option) => option.value === value)?.score ?? 0;
}

export function calculateAssessment(answers: Answers): AssessmentScore {
  const categoryScores = categories.map((category) => {
    const categoryQuestions = questions.filter((question) => question.categoryId === category.id && question.type !== "numeric" && question.type !== "text");
    const answered = categoryQuestions.filter((question) => {
      const value = answers[question.id];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
    }).length;
    const weighted = categoryQuestions.reduce((sum, question) => sum + getQuestionScore(question, answers[question.id]) * question.weight, 0);
    const max = categoryQuestions.reduce((sum, question) => sum + 5 * question.weight, 0);
    const score = max === 0 ? 0 : Math.round((weighted / max) * 100);

    return {
      category,
      score,
      level: getMaturityLevel(score),
      answered,
      total: categoryQuestions.length,
      risk: score < 30 ? "Critical" : score < 50 ? "High" : score < 70 ? "Medium" : "Low"
    } satisfies CategoryScore;
  });

  const weightedOverall = categoryScores.reduce((sum, item) => sum + item.score * item.category.weight, 0);
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  const totalQuestions = questions.filter((question) => question.type !== "numeric" && question.type !== "text").length;
  const answered = questions.filter((question) => {
    if (question.type === "numeric" || question.type === "text") return false;
    const value = answers[question.id];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
  }).length;

  const overallScore = Math.round(weightedOverall / totalWeight);
  return {
    overallScore,
    maturityLevel: getMaturityLevel(overallScore),
    categoryScores,
    completion: Math.round((answered / totalQuestions) * 100)
  };
}
