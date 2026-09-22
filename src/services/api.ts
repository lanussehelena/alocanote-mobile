import axios from 'axios';

export const api = axios.create({
  // Em ambiente local rodando Expo no celular físico, substitua 'localhost' pelo IP da máquina rodando o Spring Boot
  baseURL: 'http://192.168.x.x:8080/api',
  headers: {
    'Content-Type': 'application/json',
  }
});