# Regras do projeto ALOCANOTE

Frontend mobile do sistema de gestão de reservas de notebooks para a equipe interna de uma loja de móveis planejados.

## Stack permitida (NÃO use NADA fora desta lista)

- React Native utilizando o ecossistema Expo.
- TypeScript obrigatório para todos os arquivos (extensões .ts e .tsx).
- Axios para TODA chamada HTTP consumindo a API própria.
- React Navigation para roteamento, combinando Stack Navigation e Tab Navigation.
- Estilização estritamente feita com a API nativa `StyleSheet.create`.
- NÃO instale bibliotecas de componentes visuais (como NativeBase, Tailwind ou similares). A construção visual deve ser feita com componentes nativos puros.

## Padrões do código

- **A arquitetura de pastas é fixa:**
    - `src/screens/`: Telas completas e isoladas do aplicativo (ex: Login, Cadastro, Home).
    - `src/components/`: Componentes visuais reutilizáveis (ex: PrimaryButton.tsx, CustomInput.tsx).
    - `src/routes/`: Configuração e arquivos de navegação (auth.routes.tsx, app.routes.tsx).
    - `src/services/api.ts`: Configuração do cliente HTTP centralizado.
    - `src/types/index.ts`: Tipagens e Enums espelhando o backend.

- **Regras estritas de Componentes Nativos:**
    - Todo e qualquer texto deve obrigatoriamente estar envolvido por uma tag `<Text>`. Textos soltos quebram a aplicação no React Native.
    - Imagens (`<Image>`) carregadas da internet (URL) DEVEM ter largura (`width`) e altura (`height`) definidas no `StyleSheet`, caso contrário não serão exibidas.
    - Interações de clique e botões devem utilizar o componente moderno `<Pressable>`, utilizando a propriedade `pressed` para alterar dinamicamente o estilo (ex: mudança de cor) durante o toque.
    - Para conteúdos com rolagem, utilizar `<ScrollView>`, garantindo que ele não seja usado para listas gigantes (renderização infinita).

- **Comunicação e Estado:**
    - Utilize Props tipadas para passar informações de telas pai para componentes filhos.
    - Mantenha o estado local (`useState`) devidamente tipado e utilize tratamento de erro e loading nas chamadas da API (não deixe o app falhar silenciosamente).

## O que NÃO fazer

- Não escreva código HTML (div, p, span, button) ou CSS tradicional, pois o React Native não os suporta.
- Não adicione regras de negócio complexas soltas dentro das telas (`screens`); isole o consumo da API na pasta `services`.
- Não use o componente `ScrollView` como substituto preguiçoso para listas longas ou feeds.
- Não crie arquivos de roteamento genéricos; siga o padrão de dividir a navegação em escopos (Stack para aprofundamento, Tab para navegação principal).