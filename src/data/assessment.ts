import assessmentBank from "./assessment-bank.json";

export type QuestionType = "single" | "multi" | "tool" | "numeric" | "text";

export type Option = {
  label: string;
  value: string;
  score: number;
};

export type Category = {
  id: string;
  name: string;
  weight: number;
  description: string;
};

export type Question = {
  id: string;
  code: string;
  categoryId: string;
  text: string;
  type: QuestionType;
  weight: number;
  required: boolean;
  helpText?: string;
  options?: Option[];
};

export type OrganizationProfile = {
  companyName: string;
  sector: string;
  industrySubtype?: string;
  employeeCount: number;
  developerCount: number;
  devopsEngineerCount: number;
  applicationCount: number;
  productionApplicationCount: number;
  criticalApplicationCount: number;
  cloudProvider: string;
  kubernetesUsage: string;
  sourceControlTool: string;
  cicdTool: string;
  itsmTool: string;
  securityTools: string;
  monitoringTools: string;
};

export type Answers = Record<string, string | string[] | number>;

type AssessmentBank = {
  categories: Category[];
  questions: Question[];
};

const typedAssessmentBank = assessmentBank as AssessmentBank;

export const categories: Category[] = typedAssessmentBank.categories;
export const questions: Question[] = typedAssessmentBank.questions;

export const defaultProfile: OrganizationProfile = {
  companyName: "Optim4Tech Demo",
  sector: "Technology",
  industrySubtype: "",
  employeeCount: 420,
  developerCount: 85,
  devopsEngineerCount: 9,
  applicationCount: 72,
  productionApplicationCount: 38,
  criticalApplicationCount: 11,
  cloudProvider: "Hybrid / Kubernetes",
  kubernetesUsage: "Production",
  sourceControlTool: "GitHub / Azure DevOps",
  cicdTool: "GitHub Actions / Azure Pipelines",
  itsmTool: "Jira Service Management",
  securityTools: "SonarQube, Trivy",
  monitoringTools: "Prometheus, Grafana, Loki"
};

export const defaultAnswers: Answers = Object.fromEntries(
  questions.map((question) => {
    if (question.type === "numeric") return [question.id, 0];
    if (question.type === "tool" || question.type === "multi") return [question.id, []];
    return [question.id, ""];
  })
);
