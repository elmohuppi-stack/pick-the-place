export type Phase = "setup" | "proposal" | "voting" | "results" | "closed";

export interface LocationWithVotes {
  id: string;
  name: string;
  description: string | null;
  proposedById: string;
  proposedByName: string;
  isActive: boolean;
  voteCount: number;
  percentage: number;
}

export interface RoundResult {
  roundNumber: number;
  totalVotes: number;
  locations: LocationWithVotes[];
  winner: LocationWithVotes | null;
}
