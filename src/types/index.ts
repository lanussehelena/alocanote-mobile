export enum Role {
  ADMINISTRADOR = 'ADMINISTRADOR',
  PROJETISTA = 'PROJETISTA',
  CONFERENTE = 'CONFERENTE',
  CONSULTOR_VENDAS = 'CONSULTOR_VENDAS',
  OUTROS = 'OUTROS'
}

export enum NotebookStatus {
  DISPONIVEL = 'DISPONIVEL',
  EM_USO = 'EM_USO',
  MANUTENCAO = 'MANUTENCAO'
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  profilePictureUrl?: string;
}

export interface RegisterUserRequestDTO {
  name: string;
  email: string;
  phone: string;
  role: Role;
  customRole?: string;
}
