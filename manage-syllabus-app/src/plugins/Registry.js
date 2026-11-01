import {
  CreditPlugin,
  LecturerInfoPlugin,
  SelectionPlugin,
  TextPlugin,
  RequirementSubjectPlugin,
  ObjectiveOutcomePlugin,
  CourseLearningOutcomePlugin,
  AssessmentPlugin,
  LearningMaterialPlugin,
  TeachingPlanPlugin,
  TablePlugin,
} from ".";

const PLUGINS = [
  CreditPlugin,
  LecturerInfoPlugin,
  RequirementSubjectPlugin,
  ObjectiveOutcomePlugin,
  CourseLearningOutcomePlugin,
  AssessmentPlugin,
  LearningMaterialPlugin,
  TeachingPlanPlugin,
  TablePlugin,
  TextPlugin,
  SelectionPlugin,
];

export const getPlugin = (type, code) => {
  const matchByCode = PLUGINS.find((p) => p.code === code);
  if (matchByCode) return matchByCode;

  const matchByType = PLUGINS.find((p) => p.type === type);
  return matchByType || null;
};
