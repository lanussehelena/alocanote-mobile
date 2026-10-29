import { api } from './api';
import { RegisterUserRequestDTO, UpdateUserProfileRequestDTO, UserResponseDTO } from '../types';

export const userService = {
  async listUsers(): Promise<UserResponseDTO[]> {
    const response = await api.get<UserResponseDTO[]>('/users');
    return response.data;
  },

  async getMyProfile(): Promise<UserResponseDTO> {
    const response = await api.get<UserResponseDTO>('/users/me');
    return response.data;
  },

  async updateMyProfile(data: UpdateUserProfileRequestDTO): Promise<UserResponseDTO> {
    const response = await api.put<UserResponseDTO>('/users/me', data);
    return response.data;
  },

  async createUser(data: RegisterUserRequestDTO): Promise<UserResponseDTO> {
    const response = await api.post<UserResponseDTO>('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: UpdateUserProfileRequestDTO): Promise<UserResponseDTO> {
    const response = await api.put<UserResponseDTO>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
