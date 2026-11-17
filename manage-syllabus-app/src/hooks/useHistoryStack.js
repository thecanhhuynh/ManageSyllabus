import {useState, useRef, useCallback} from "react";

const areSnapshotsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

export const useHistoryStack = (maxLimit = 40) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const lastPushedRef = useRef(null);

  const syncFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const pushSnapshot = useCallback(
    (snapshot) => {
      if (!snapshot) return;
      if (areSnapshotsEqual(snapshot, lastPushedRef.current)) return;
      if (lastPushedRef.current !== null) {
        undoStackRef.current.push(lastPushedRef.current);
        if (undoStackRef.current.length > maxLimit) {
          undoStackRef.current.shift();
        }
      }
      lastPushedRef.current = snapshot;
      redoStackRef.current = [];
      syncFlags();
    },
    [maxLimit, syncFlags],
  );

  const undo = useCallback(
    (currentSnapshot) => {
      if (undoStackRef.current.length === 0) return null;
      const previous = undoStackRef.current.pop();
      if (currentSnapshot) {
        redoStackRef.current.push(currentSnapshot);
      }
      lastPushedRef.current = previous;
      syncFlags();
      return previous;
    },
    [syncFlags],
  );

  const redo = useCallback(
    (currentSnapshot) => {
      if (redoStackRef.current.length === 0) return null;
      const next = redoStackRef.current.pop();
      if (currentSnapshot) {
        undoStackRef.current.push(currentSnapshot);
      }
      lastPushedRef.current = next;
      syncFlags();
      return next;
    },
    [syncFlags],
  );

  const reset = useCallback(
    (initialSnapshot = null) => {
      undoStackRef.current = [];
      redoStackRef.current = [];
      lastPushedRef.current = initialSnapshot;
      syncFlags();
    },
    [syncFlags],
  );

  return {
    pushSnapshot,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
};

export default useHistoryStack;
