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

export enum ReservationStatus {
  AGENDADO = 'AGENDADO',
  CHECKED_IN = 'CHECKED_IN',
  CANCELADO = 'CANCELADO',
  FINALIZADO = 'FINALIZADO'
}

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  customRole?: string | null;
  accessLevel?: string;
  profilePictureUrl?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  createdAt?: string;
  emailVerified?: boolean;
}

export interface User extends UserResponseDTO {}

export interface RegisterUserRequestDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  customRole?: string | null;
}

export interface UpdateUserProfileRequestDTO {
  name?: string;
  phone?: string;
  profilePictureUrl?: string | null;
  role?: Role;
  customRole?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface FirebaseAuthRequestDTO {
  idToken: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePictureUrl?: string | null;
  role?: Role;
  customRole?: string | null;
}

export interface LoginResponseDTO {
  token: string;
  type: string;
  email: string;
  name: string;
  role: string;
}

export interface NotebookResponseDTO {
  id: number;
  name: string;
  modelDescription: string;
  status: NotebookStatus;
}

export interface CreateNotebookRequestDTO {
  name: string;
  modelDescription: string;
  status: NotebookStatus;
}

export interface LocationResponseDTO {
  id: number;
  name: string;
  address: string;
  cep: string;
}

export interface CreateReservationRequestDTO {
  notebookId: number;
  startTime: string; // ISO-8601 ex: '2026-11-15T09:00:00'
  endTime: string;   // ISO-8601 ex: '2026-11-15T12:00:00'
  locationId?: number | null;
  purpose: string;
}

export interface CheckInReservationRequestDTO {
  locationType?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface FinishReservationRequestDTO {
  locationType?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
}

export interface ReservationResponseDTO {
  id: number;
  userId: number;
  userName: string;
  notebookId: number;
  notebookName: string;
  notebookModel: string;
  startTime: string;
  endTime: string;
  locationId?: number | null;
  locationName?: string | null;
  status: ReservationStatus;
  purpose: string;
  checkInLocationType?: string | null;
  checkInAddress?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAt?: string | null;
  returnLocationType?: string | null;
  returnAddress?: string | null;
  returnLatitude?: number | null;
  returnLongitude?: number | null;
  returnPhotoUrl?: string | null;
  returnedAt?: string | null;
}

export interface StandardError {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
}

export interface Notebook {
  id: number;
  name: string;
  status: NotebookStatus;
  currentUser?: User;
}
