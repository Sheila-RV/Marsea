export interface GymMemberCount {
  gymId: string;
  gymName: string;
  activeMembers: number;
}

export interface SuperAdminDashboard {
  totalGyms: number;
  activeGyms: number;
  totalMembers: number;
  totalActiveMemberships: number;
  totalMonthlyMembershipRevenue: string;
  activeMembersByGym: GymMemberCount[];
}
