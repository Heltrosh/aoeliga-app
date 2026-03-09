import { createContext, useContext, useState } from "react";

type TournamentHeaderContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

const TournamentHeaderContext = createContext<TournamentHeaderContextValue | null>(null);

export function TournamentHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <TournamentHeaderContext.Provider value={{ title, setTitle }}>
      {children}
    </TournamentHeaderContext.Provider>
  );
}

export function useTournamentHeader() {
  const ctx = useContext(TournamentHeaderContext);
  if (!ctx) {
    throw new Error("TournamentHeaderProvider is missing");
  }
  return ctx;
}