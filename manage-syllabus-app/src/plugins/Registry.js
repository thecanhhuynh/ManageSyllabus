// Sau này import các Reference Plugins vào đây...

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
} from ".";

// Map các plugin lại với nhau
const plugins = [
  TextPlugin,
  SelectionPlugin,
  CreditPlugin,
  LecturerInfoPlugin,
  RequirementSubjectPlugin,
  ObjectiveOutcomePlugin,
  CourseLearningOutcomePlugin,
  AssessmentPlugin,
  LearningMaterialPlugin,
  TeachingPlanPlugin,
];

export const getPlugin = (type, code) => {
  // 1. Tìm theo CODE trước (Dành cho các Reference đặc thù như DANH_GIA, TIN_CHI)
  let found = plugins.find((p) => p.code === code);

  // 2. Nếu không có CODE, tìm theo TYPE (Dành cho text, selection chung)
  if (!found) {
    found = plugins.find((p) => p.type === type);
  }

  // 3. Fallback an toàn (tránh văng app nếu lỡ quên code)
  return found || null;
};
