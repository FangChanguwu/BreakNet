import http from "@/utils/http";

export type SponsorUser = {
  qq: string;
  avatar: string;
};

export const sponsorApi = {
  getSponsors() {
    return http.get<{ returnCode: number; data?: { sponsors?: SponsorUser[] } }>("/sponsors", {
      timeout: 15000,
    });
  },

  addSponsor(qq: string) {
    return http.post<{ returnCode: number; data?: SponsorUser; message?: string }>("/admin/sponsors", { qq }, {
      timeout: 15000,
    });
  },
};
