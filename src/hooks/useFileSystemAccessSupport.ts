"use client";

import { useState } from "react";

export function useFileSystemAccessSupport(): boolean {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window &&
      "showOpenFilePicker" in window,
  );
  return supported;
}
