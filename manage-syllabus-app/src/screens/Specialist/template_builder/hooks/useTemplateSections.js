import { arrayMove } from "@dnd-kit/sortable";
import { message } from "antd";

export const useTemplateSections = (
  sections,
  setSections,
  templateMeta,
  setTemplateMeta,
  autoSaveSections,
) => {
  const handleMainDragEnd = (activeId, overId) => {
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      position: idx + 1,
    }));
    setSections(reordered);
    autoSaveSections(reordered);
  };

  const handleSubDragEnd = (activeId, overId) => {
    const section = sections.find((s) =>
      (s.sub_sections || []).some((sub) => sub.id === activeId),
    );
    if (!section) return;

    const oldIndex = section.sub_sections.findIndex((s) => s.id === activeId);
    const newIndex = section.sub_sections.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedSubs = arrayMove(section.sub_sections, oldIndex, newIndex).map(
      (sub, idx) => ({ ...sub, position: idx + 1 }),
    );
    const updatedSections = sections.map((s) =>
      s.id === section.id ? { ...s, sub_sections: reorderedSubs } : s,
    );
    setSections(updatedSections);
    autoSaveSections(updatedSections);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isMain = sections.some((s) => s.id === active.id);
    if (isMain) {
      handleMainDragEnd(active.id, over.id);
      return;
    }
    handleSubDragEnd(active.id, over.id);
  };

  const handleAddMainSection = (newSection) => {
    const nextSections = [...sections, newSection];
    setSections(nextSections);
    autoSaveSections(nextSections);
    message.success(`Đã thêm Phần lớn: ${newSection.name}`);
  };

  const handleRemoveMainSection = (sectionId) => {
    const nextSections = sections
      .filter((s) => s.id !== sectionId)
      .map((s, idx) => ({ ...s, position: idx + 1 }));
    setSections(nextSections);
    autoSaveSections(nextSections);
    message.success("Đã xóa Phần lớn.");
  };

  const handleUpdateSectionName = (sectionId, newName, shouldAutoSave = true) => {
    const nextSections = sections.map((s) =>
      s.id === sectionId ? { ...s, name: newName } : s,
    );
    setSections(nextSections);
    if (!shouldAutoSave) return;
    autoSaveSections(nextSections);
  };

  const handleAddSubSection = (sectionId, newSub) => {
    const nextSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, sub_sections: [...(sec.sub_sections || []), newSub] };
    });
    setSections(nextSections);
    autoSaveSections(nextSections);
    message.success(`Đã thêm mục con: ${newSub.name}`);
  };

  const handleRemoveSubSection = (sectionId, subId) => {
    const nextSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const filtered = (sec.sub_sections || []).filter((sub) => sub.id !== subId);
      const renumbered = filtered.map((sub, idx) => ({ ...sub, position: idx + 1 }));
      return { ...sec, sub_sections: renumbered };
    });
    setSections(nextSections);
    autoSaveSections(nextSections);
    message.success("Đã xóa mục con.");
  };

  const handleUpdateSubName = (sectionId, subId, newName, shouldAutoSave = true) => {
    const nextSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const updatedSubs = (sec.sub_sections || []).map((sub) => {
        if (sub.id !== subId) return sub;
        return { ...sub, name: newName, place_holder: newName };
      });
      return { ...sec, sub_sections: updatedSubs };
    });
    setSections(nextSections);
    if (!shouldAutoSave) return;
    autoSaveSections(nextSections);
  };

  const handleUpdateTemplateName = (newName) => {
    const updatedMeta = { ...templateMeta, name: newName };
    setTemplateMeta(updatedMeta);
    autoSaveSections(sections, updatedMeta);
    message.success("Đã cập nhật tên đề cương mẫu.");
  };

  return {
    handleDragEnd,
    handleAddMainSection,
    handleRemoveMainSection,
    handleUpdateSectionName,
    handleAddSubSection,
    handleRemoveSubSection,
    handleUpdateSubName,
    handleUpdateTemplateName,
  };
};

export default useTemplateSections;
