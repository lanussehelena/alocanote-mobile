/**
 * Utilitário para adicionar atributos data-cy semanticamente compatíveis
 * tanto com a web (React Native for Web) quanto com seletores do Cypress.
 *
 * No React Native Web, `dataSet: { cy: id }` é compilado no DOM final como `data-cy="id"`.
 * Adicionamos também `testID` para máxima compatibilidade com suítes de teste.
 */
export function dataCy(id: string) {
  return {
    dataSet: { cy: id },
    'data-cy': id,
    testID: id,
  };
}
