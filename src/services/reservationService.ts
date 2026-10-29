import { api } from './api';
import {
  CheckInReservationRequestDTO,
  CreateReservationRequestDTO,
  FinishReservationRequestDTO,
  ReservationResponseDTO,
} from '../types';

export const reservationService = {
  async createReservation(data: CreateReservationRequestDTO): Promise<ReservationResponseDTO> {
    const response = await api.post<ReservationResponseDTO>('/reservations', data);
    return response.data;
  },

  async listMyReservations(): Promise<ReservationResponseDTO[]> {
    const response = await api.get<ReservationResponseDTO[]>('/reservations');
    return response.data;
  },

  async listAllReservations(): Promise<ReservationResponseDTO[]> {
    const response = await api.get<ReservationResponseDTO[]>('/reservations/all');
    return response.data;
  },

  async getReservationById(id: number): Promise<ReservationResponseDTO> {
    const response = await api.get<ReservationResponseDTO>(`/reservations/${id}`);
    return response.data;
  },

  async checkInReservation(
    id: number,
    data?: CheckInReservationRequestDTO
  ): Promise<ReservationResponseDTO> {
    const response = await api.patch<ReservationResponseDTO>(`/reservations/${id}/check-in`, data);
    return response.data;
  },

  async cancelReservation(id: number): Promise<ReservationResponseDTO> {
    const response = await api.patch<ReservationResponseDTO>(`/reservations/${id}/cancel`);
    return response.data;
  },

  async finishReservation(
    id: number,
    data?: FinishReservationRequestDTO
  ): Promise<ReservationResponseDTO> {
    const response = await api.patch<ReservationResponseDTO>(`/reservations/${id}/finish`, data);
    return response.data;
  },

  async deleteReservation(id: number): Promise<void> {
    await api.delete(`/reservations/${id}`);
  },
};
