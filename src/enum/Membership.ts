export enum MembershipType {
  Normal = "jasen",
  Supporting = "kannatusjasen",
  Associate = "ulkojasen",
  Honorary = "kunniajasen",
}

export enum MembershipStatus {
  Normal = "jasen",
  Supporting = "kannatusjasen",
  Associate = "ulkojasen",
  Honorary = "kunniajasen",
  NonMember = "ei-jasen",
  Revoked = "erotettu",
}

export const PUBLIC_MEMBERSIHP_TYPES = [MembershipType.Normal, MembershipType.Supporting, MembershipType.Associate];
