"use client";

import { useEffect, useState } from "react";
import { usePreviewStaffEmailQuery } from "../services/usersApi";
import { userErrorMessage } from "../utils";

export function useStaffEmailPreview(fullName: string, isOpen: boolean) {
  const name = fullName.trim();
  const [debouncedName, setDebouncedName] = useState(name);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(name), 250);
    return () => clearTimeout(timer);
  }, [name]);
  const isReady =
    isOpen && !!name && name.length <= 100 && name === debouncedName;
  const { currentData, error, isFetching } = usePreviewStaffEmailQuery(
    debouncedName,
    {
      skip: !isReady,
      refetchOnMountOrArgChange: true,
    },
  );
  return {
    email: isReady ? (currentData?.email ?? "") : "",
    isLoading: !!name && (!isReady || isFetching),
    error: isReady && error ? userErrorMessage(error) : null,
  };
}
