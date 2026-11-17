import React, { forwardRef } from "react";
import { Input } from "antd";
import {
  cleanWhitespace,
  formatTypingWhitespace,
} from "../../utils/stringUtils";

const { TextArea, Search, Password } = Input;

export const CleanInput = forwardRef(
  (
    {
      onChange,
      onBlur,
      value,
      autoTrim = true,
      multiline = false,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      if (!autoTrim || typeof e?.target?.value !== "string") {
        onChange?.(e);
        return;
      }

      const raw = e.target.value;
      const formatted = formatTypingWhitespace(raw, multiline);

      if (formatted !== raw) {
        e.target.value = formatted;
      }
      onChange?.(e);
    };

    const handleBlur = (e) => {
      if (autoTrim && typeof e?.target?.value === "string") {
        const raw = e.target.value;
        const cleaned = cleanWhitespace(raw, multiline);

        if (cleaned !== raw) {
          e.target.value = cleaned;
          onChange?.(e);
        }
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

CleanInput.displayName = "CleanInput";

CleanInput.TextArea = forwardRef(
  (
    {
      onChange,
      onBlur,
      value,
      autoTrim = true,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      if (!autoTrim || typeof e?.target?.value !== "string") {
        onChange?.(e);
        return;
      }

      const raw = e.target.value;
      const formatted = formatTypingWhitespace(raw, true);

      if (formatted !== raw) {
        e.target.value = formatted;
      }
      onChange?.(e);
    };

    const handleBlur = (e) => {
      if (autoTrim && typeof e?.target?.value === "string") {
        const raw = e.target.value;
        const cleaned = cleanWhitespace(raw, true);

        if (cleaned !== raw) {
          e.target.value = cleaned;
          onChange?.(e);
        }
      }
      onBlur?.(e);
    };

    return (
      <TextArea
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

CleanInput.TextArea.displayName = "CleanInput.TextArea";

CleanInput.Search = forwardRef(
  (
    {
      onChange,
      onBlur,
      onSearch,
      value,
      autoTrim = true,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      if (!autoTrim || typeof e?.target?.value !== "string") {
        onChange?.(e);
        return;
      }

      const raw = e.target.value;
      const formatted = formatTypingWhitespace(raw, false);

      if (formatted !== raw) {
        e.target.value = formatted;
      }
      onChange?.(e);
    };

    const handleBlur = (e) => {
      if (autoTrim && typeof e?.target?.value === "string") {
        const raw = e.target.value;
        const cleaned = cleanWhitespace(raw, false);

        if (cleaned !== raw) {
          e.target.value = cleaned;
          onChange?.(e);
        }
      }
      onBlur?.(e);
    };

    const handleSearch = (val, event, info) => {
      const cleaned = cleanWhitespace(val, false);
      onSearch?.(cleaned, event, info);
    };

    return (
      <Search
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onSearch={handleSearch}
        {...props}
      />
    );
  }
);

CleanInput.Search.displayName = "CleanInput.Search";

CleanInput.Password = forwardRef((props, ref) => {
  return <Password ref={ref} {...props} />;
});

CleanInput.Password.displayName = "CleanInput.Password";

export default CleanInput;
