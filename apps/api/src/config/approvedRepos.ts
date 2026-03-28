export type ApprovedRepoConfig = {
  owner: string;
  repo: string;
  isActive?: boolean;
};

// System config (Sprint 5 testing repos)
export const APPROVED_REPOS: ApprovedRepoConfig[] = [
  {
    owner: "IAmTomShaw",
    repo: "f1-race-replay",
    isActive: true
  },
  {
    owner: "slowlydev",
    repo: "f1-dash",
    isActive: true
  }
//   ,
//   {
//     owner: "lobehub",
//     repo: "lobe-chat",
//     isActive: true
//   }
];

export const toFullName = (owner: string, repo: string) => `${owner}/${repo}`;




// https://github.com/lobehub/lobe-chat.git