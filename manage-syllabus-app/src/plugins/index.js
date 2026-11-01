import TextEditor from "./Text/TextEditor";
import SelectionEditor from "./Selection/SelectionEditor";
import CreditEditor from "./Credit/CreditEditor";
import LecturerInfoEditor from "./LecturerInfo/LecturerInfoEditor";
import RequirementSubjectEditor from "./RequirementSubject/RequirementSubjectEditor";
import ObjectiveOutcomeEditor from "./ObjectiveOutcome/ObjectiveOutcomeEditor";
import CourseLearningOutcomeEditor from "./CourseLearningOutcome/CourseLearningOutcomeEditor";
import AssessmentEditor from "./Assessment/AssessmentEditor";
import LearningMaterialEditor from "./LearningMaterial/LearningMaterialEditor";
import TeachingPlanEditor from "./TeachingPlan/TeachingPlanEditor";
import TableEditor from "./Table/TableEditor";

export const TextPlugin = {
  type: "text",
  Editor: TextEditor,
};

export const SelectionPlugin = {
  type: "selection",
  Editor: SelectionEditor,
};

export const TablePlugin = {
  type: "table",
  Editor: TableEditor,
};

export const CreditPlugin = {
  code: "credit",
  Editor: CreditEditor,
};

export const LecturerInfoPlugin = {
  code: "lecturer_info",
  Editor: LecturerInfoEditor,
};

export const RequirementSubjectPlugin = {
  code: "requirement_subject",
  Editor: RequirementSubjectEditor,
};

export const ObjectiveOutcomePlugin = {
  code: "objective_outcomes",
  Editor: ObjectiveOutcomeEditor,
};

export const CourseLearningOutcomePlugin = {
  code: "course_learning_outcomes",
  Editor: CourseLearningOutcomeEditor,
};

export const AssessmentPlugin = {
  code: "assessment_method",
  Editor: AssessmentEditor,
};

export const LearningMaterialPlugin = {
  code: "learning_material",
  Editor: LearningMaterialEditor,
};

export const TeachingPlanPlugin = {
  code: "teaching_schedule",
  Editor: TeachingPlanEditor,
};
