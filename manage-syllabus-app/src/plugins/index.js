import TextEditor from "./Text/TextEditor";
import TextPreview from "./Text/TextPreview";
import SelectionEditor from "./Selection/SelectionEditor";
import SelectionPreview from "./Selection/SelectionReview";
import CreditEditor from "./Credit/CreditEditor";
import CreditPreview from "./Credit/CreditPreview";
import LecturerInfoEditor from "./LecturerInfo/LecturerInfoEditor";
import LecturerInfoPreview from "./LecturerInfo/LecturerInfoReview";
import RequirementSubjectEditor from "./RequirementSubject/RequirementSubjectEditor";
import RequirementSubjectPreview from "./RequirementSubject/RequirementSubjectPreview";
import ObjectiveOutcomeEditor from "./ObjectiveOutcome/ObjectiveOutcomeEditor";
import ObjectiveOutcomePreview from "./ObjectiveOutcome/ObjectiveOutcomePreview";
import CourseLearningOutcomeEditor from "./CourseLearningOutcome/CourseLearningOutcomeEditor";
import CourseLearningOutcomePreview from "./CourseLearningOutcome/CourseLearningOutcomePreview";
import AssessmentEditor from "./Assessment/AssessmentEditor";
import AssessmentPreview from "./Assessment/AssessmentPreview";
import LearningMaterialEditor from "./LearningMaterial/LearningMaterialEditor";
import LearningMaterialPreview from "./LearningMaterial/LearningMaterialPreview";
import TeachingPlanEditor from "./TeachingPlan/TeachingPlanEditor";
import TeachingPlanPreview from "./TeachingPlan/TeachingPlanPreview";
import TablePreview from "./Table/TablePreview";
export const TextPlugin = {
  type: "text",
  Editor: TextEditor,
  Preview: TextPreview,
};

export const SelectionPlugin = {
  type: "selection",
  Editor: SelectionEditor,
  Preview: SelectionPreview,
};

export const TablePlugin = {
  type: "table",
  Editor: null,
  Preview: TablePreview,
};

export const CreditPlugin = {
  code: "credit",
  Editor: CreditEditor,
  Preview: CreditPreview,
};

export const LecturerInfoPlugin = {
  code: "lecturer_info",
  Editor: LecturerInfoEditor,
  Preview: LecturerInfoPreview,
};

export const RequirementSubjectPlugin = {
  code: "requirement_subject",
  Editor: RequirementSubjectEditor,
  Preview: RequirementSubjectPreview,
};

export const ObjectiveOutcomePlugin = {
  code: "objective_outcomes",
  Editor: ObjectiveOutcomeEditor,
  Preview: ObjectiveOutcomePreview,
};

export const CourseLearningOutcomePlugin = {
  code: "course_learning_outcomes",
  Editor: CourseLearningOutcomeEditor,
  Preview: CourseLearningOutcomePreview,
};
export const AssessmentPlugin = {
  code: "assessment_method",
  Editor: AssessmentEditor,
  Preview: AssessmentPreview,
};

export const LearningMaterialPlugin = {
  code: "learning_material",
  Editor: LearningMaterialEditor,
  Preview: LearningMaterialPreview,
};

export const TeachingPlanPlugin = {
  code: "teaching_schedule",
  Editor: TeachingPlanEditor,
  Preview: TeachingPlanPreview,
};
