import { CLAIMS } from "../controllers/OAuthController";
import { isStringArray } from "./TypescriptHelpers";

export const permissionsIncludesIndex = (permissions: number, index: number): boolean => {
  return (permissions & (1 << index)) !== 0;
};

export const generateFromIndexes = (indexes: number[] | string[]): number => {
  if (indexes.length === 0) {
    return 0;
  }

  if (isStringArray(indexes)) {
    return generateFromIndexes(indexes.map(num => parseInt(num, 10)));
  }

  return indexes.reduce((acc, num) => acc | (1 << num), 0);
};

export const getClaims = (permissions: number) => {
  return CLAIMS.filter((_, index) => permissionsIncludesIndex(permissions, index));
};

export const getAddedClaims = (oldPermissions: number, newPermissions: number) => {
  const newClaims = getClaims(newPermissions);
  const oldClaims = getClaims(oldPermissions);

  return newClaims.filter(claim => !oldClaims.includes(claim));
};

export const getRemovedClaims = (oldPermissions: number, newPermissions: number) => {
  const newClaims = getClaims(newPermissions);
  const oldClaims = getClaims(oldPermissions);

  return oldClaims.filter(claim => !newClaims.includes(claim));
};

export const getChangedClaims = (oldPermissions: number, newPermissions: number) => {
  return {
    added: getAddedClaims(oldPermissions, newPermissions),
    removed: getRemovedClaims(oldPermissions, newPermissions),
  };
};

export const getClaimsIndex = (claims: string[]) => {
  return CLAIMS.findIndex(claimName => claimName === claims);
};
export const getClaimIndex = (claim: string) => {
  return CLAIMS.findIndex(claims => claims.includes(claim));
};
