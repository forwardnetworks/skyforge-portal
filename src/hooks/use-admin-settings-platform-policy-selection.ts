import { useEffect, useMemo, useState } from "react";
import { filterUsernames } from "./admin-settings-users-access-shared";

interface Props {
  userOptions: string[];
}

export function useAdminSettingsPlatformPolicyUserSelection({
  userOptions,
}: Props) {
  const [platformPolicyUserQuery, setPlatformPolicyUserQuery] = useState("");
  const [platformPolicyTargetUser, setPlatformPolicyTargetUser] = useState("");

  const filteredPlatformPolicyUsers = useMemo(
    () => filterUsernames(userOptions, platformPolicyUserQuery),
    [userOptions, platformPolicyUserQuery],
  );
  const platformPolicySearchMatches = useMemo(
    () => filteredPlatformPolicyUsers.slice(0, 8),
    [filteredPlatformPolicyUsers],
  );

  useEffect(() => {
    if (!platformPolicyTargetUser && userOptions.length > 0) {
      setPlatformPolicyTargetUser(userOptions[0]);
    }
  }, [platformPolicyTargetUser, userOptions]);

  return {
    platformPolicyUserQuery,
    setPlatformPolicyUserQuery,
    platformPolicyTargetUser,
    setPlatformPolicyTargetUser,
    filteredPlatformPolicyUsers,
    platformPolicySearchMatches,
    platformPolicySearchCount: filteredPlatformPolicyUsers.length,
  };
}
