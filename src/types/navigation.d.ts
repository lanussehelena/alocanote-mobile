export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  VerificacaoToken: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AuthStackParamList {}
  }
}