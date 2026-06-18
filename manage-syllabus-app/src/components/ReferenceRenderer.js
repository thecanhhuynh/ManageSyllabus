import React from "react";
import CreditReference from "./renderers/CreditReference";
import LecturerInfoReference from "./renderers/LecturerInfoReference";
import RequirementSubjectReference from "./renderers/RequirementSubjectReference";
import ObjectiveOutcomeReference from "./renderers/ObjectiveOutcomeReference";
import CourseLearningOutcomeReference from "./renderers/CourseLearningOutcomeReference";
import LearningMaterialReference from "./renderers/LearningMaterialReference";

const REFERENCE_MAP = {
  credit: CreditReference,
  director: LecturerInfoReference,
  requirement_subject: RequirementSubjectReference,
  objectives_and_outcomes: ObjectiveOutcomeReference,
  course_learning_outcomes: CourseLearningOutcomeReference,
  learning_material: LearningMaterialReference,
};

const ReferenceRenderer = ({item, basePath}) => {
  const refPath = [...basePath, "reference_data"];
  const SpecificRefComponent = REFERENCE_MAP[item.reference_code];

  if (!SpecificRefComponent) {
    return (
      <div style={{padding: "10px", border: "1px dashed #ccc"}}>
        Đang chờ UI cho reference: <strong>{item.reference_code}</strong>
      </div>
    );
  }

  return <SpecificRefComponent item={item} refPath={refPath} />;
};

export default ReferenceRenderer;
