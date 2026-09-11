import {create} from "zustand";
// Import thư viện để clone/merge object sâu (deep merge), tránh lỗi shallow merge ở các mục 34, 35
import {cloneDeep, isEqual, merge, mergeWith} from "lodash";

export const useSyllabusStore = create((set, get) => ({
  revision: 0,
  serverSnapshot: {},
  localBlocks: {},
  conflicts: [],

  initData: (serverRevision, mainSections) => {
    const snapshots = {};
    const locals = {};

    mainSections.forEach((mainSec) => {
      mainSec.sub_sections.forEach((sub) => {
        const blockData = {...sub, main_section_id: mainSec.id};

        snapshots[sub.code] = cloneDeep(blockData);
        locals[sub.code] = {
          data: cloneDeep(blockData),
          isDirty: false,
          dirtyFields: [],
        };
      });
    });

    set({
      revision: serverRevision,
      serverSnapshot: snapshots,
      localBlocks: locals,
      conflicts: [],
    });
  },

  updateLocalBlock: (code, changedFields) => {
    set((state) => {
      const existingLocal = state.localBlocks[code];
      if (!existingLocal) return state;

      const customizer = (objValue, srcValue) => {
        if (Array.isArray(srcValue)) {
          return srcValue;
        }
      };

      const newData = mergeWith(
        cloneDeep(existingLocal.data),
        changedFields,
        customizer,
      );

      const currentDirtyFields = Object.keys(changedFields).filter((key) => {
        const newValue = newData[key];
        const originalValue = state.serverSnapshot[code]?.[key];
        return !isEqual(newValue, originalValue);
      });

      const isStillDirty = currentDirtyFields.length > 0;

      return {
        localBlocks: {
          ...state.localBlocks,
          [code]: {
            ...existingLocal,
            data: newData,
            isDirty: isStillDirty,
            dirtyFields: isStillDirty
              ? Array.from(
                  new Set([
                    ...existingLocal.dirtyFields,
                    ...currentDirtyFields,
                  ]),
                )
              : [],
          },
        },
      };
    });
  },

  applyServerUpdate: (newRevision, changedServerBlocks) => {
    const state = get();
    const nextLocalBlocks = cloneDeep(state.localBlocks);
    const nextServerSnapshot = cloneDeep(state.serverSnapshot);
    const newConflicts = [...state.conflicts];

    changedServerBlocks.forEach((serverBlock) => {
      const code = serverBlock.code;
      const localBlock = state.localBlocks[code];

      nextServerSnapshot[code] = cloneDeep(serverBlock);

      if (!localBlock || !localBlock.isDirty) {
        nextLocalBlocks[code] = {
          data: cloneDeep(serverBlock),
          isDirty: false,
          dirtyFields: [],
        };
      } else {
        const serverChangedKeys = Object.keys(serverBlock).filter(
          (key) =>
            JSON.stringify(serverBlock[key]) !==
            JSON.stringify(state.serverSnapshot[code][key]),
        );

        const intersection = serverChangedKeys.filter((key) =>
          localBlock.dirtyFields.includes(key),
        );

        if (intersection.length === 0) {
          nextLocalBlocks[code].data = merge(
            cloneDeep(serverBlock),
            localBlock.data,
          );
        } else {
          if (!newConflicts.includes(code)) {
            newConflicts.push(code);
          }
        }
      }
    });

    set({
      revision: newRevision,
      serverSnapshot: nextServerSnapshot,
      localBlocks: nextLocalBlocks,
      conflicts: newConflicts,
    });
  },

  markSaved: (newRevision, savedCodes = []) => {
    set((state) => {
      const nextLocalBlocks = {...state.localBlocks};
      const nextServerSnapshot = {...state.serverSnapshot};
      let nextConflicts = [...state.conflicts];

      const codesToClean =
        savedCodes.length > 0 ? savedCodes : Object.keys(state.localBlocks);

      codesToClean.forEach((code) => {
        if (nextLocalBlocks[code]) {
          nextLocalBlocks[code].isDirty = false;
          nextLocalBlocks[code].dirtyFields = [];
          nextServerSnapshot[code] = cloneDeep(nextLocalBlocks[code].data);
        }
        nextConflicts = nextConflicts.filter((c) => c !== code);
      });

      return {
        revision: newRevision ?? state.revision,
        serverSnapshot: nextServerSnapshot,
        localBlocks: nextLocalBlocks,
        conflicts: nextConflicts,
      };
    });
  },
}));
