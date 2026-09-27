export interface Pais {
  id: string;
  nome: string;
  bandeira: string;
  ddi: string;
}

export const PAISES: Pais[] = [
  { id: 'BR', nome: 'Brasil', bandeira: '🇧🇷', ddi: '+55' },
  { id: 'US', nome: 'Estados Unidos', bandeira: '🇺🇸', ddi: '+1' },
  { id: 'PT', nome: 'Portugal', bandeira: '🇵🇹', ddi: '+351' },
  { id: 'ES', nome: 'Espanha', bandeira: '🇪🇸', ddi: '+34' },
  { id: 'AR', nome: 'Argentina', bandeira: '🇦🇷', ddi: '+54' },
  { id: 'UY', nome: 'Uruguai', bandeira: '🇺🇾', ddi: '+598' },
  { id: 'PY', nome: 'Paraguai', bandeira: '🇵🇾', ddi: '+595' },
];