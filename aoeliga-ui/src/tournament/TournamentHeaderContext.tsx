import { createContext, useState } from "react";

type TournamentHeaderContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

export const TournamentHeaderContext = createContext<TournamentHeaderContextValue | null>(null);

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
