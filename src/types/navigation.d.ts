export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  VerificacaoToken: { telefone?: string } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AuthStackParamList {}
  }
}