import { Answers, OrganizationProfile } from "@/data/assessment";
import { AssessmentScore } from "@/features/scoring/scoring";
import { Recommendation } from "@/features/recommendations/recommendations";

export type AssessmentRecord = {
  id: string;
  token: string;
  status: "Draft" | "InProgress" | "Completed" | "Archived";
  reportStatus?: "NotStarted" | "Processing" | "Ready" | "Failed";
  organization: OrganizationProfile;
  answers: Answers;
  score?: AssessmentScore;
  recommendations?: Recommendation[];
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reportRequestedAt?: string;
  reportReadyAt?: string;
  reportGeneratedAt?: string;
};

export type PublicAssessmentPayload = Pick<AssessmentRecord, "id" | "token" | "status" | "reportStatus" | "organization" | "answers" | "score" | "recommendations" | "aiSummary" | "reportReadyAt" | "reportGeneratedAt">;
