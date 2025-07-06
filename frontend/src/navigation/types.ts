export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CreateDeck: undefined;
  CreateCard: {
    deckId: string;
  };
  EditCard: {
    cardId: string;
    deckId: string;
  };
  EditDeck: {
    deck: any;
  };
  DeckDetail: {
    deckId: string;
    deckName: string;
  };
  Study: {
    deckId: string;
    deckName: string;
  };
  Premium: undefined;
  Stats: undefined;
  Register: undefined;
  EditProfile: undefined;
  About: undefined;
};

export type TabParamList = {
  Home: undefined;
  Decks: undefined;
  Study: undefined;
  Gamification: undefined;
  Profile: undefined;
}; 