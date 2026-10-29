import { api } from './api';
import { CreateNotebookRequestDTO, NotebookResponseDTO } from '../types';

export const notebookService = {
  async listNotebooks(): Promise<NotebookResponseDTO[]> {
    const response = await api.get<NotebookResponseDTO[]>('/notebooks');
    return response.data;
  },

  async getNotebookById(id: number): Promise<NotebookResponseDTO> {
    const response = await api.get<NotebookResponseDTO>(`/notebooks/${id}`);
    return response.data;
  },

  async createNotebook(data: CreateNotebookRequestDTO): Promise<NotebookResponseDTO> {
    const response = await api.post<NotebookResponseDTO>('/notebooks', data);
    return response.data;
  },

  async updateNotebook(id: number, data: CreateNotebookRequestDTO): Promise<NotebookResponseDTO> {
    const response = await api.put<NotebookResponseDTO>(`/notebooks/${id}`, data);
    return response.data;
  },

  async deleteNotebook(id: number): Promise<void> {
    await api.delete(`/notebooks/${id}`);
  },
};
