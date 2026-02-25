import { API_BASE_URL } from './constants';
import type { NewGameResponse, ValidateStepResponse } from '../types';

type StartGameBody = {
  startActorId: number;
  targetActorId: number;
};

type ValidateStepBody = {
  currentActorId: number;
  nextActorId: number;
  movieId: number;
  visitedActorIds: number[];
  visitedMovieIds: number[];
};

export async function startGame(body: StartGameBody): Promise<NewGameResponse> {
  const response = await fetch(`${API_BASE_URL}/game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to start game: ${response.statusText}`);
  }

  return response.json() as Promise<NewGameResponse>;
}

export async function validateStep(body: ValidateStepBody): Promise<ValidateStepResponse> {
  const response = await fetch(`${API_BASE_URL}/game/validate-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate step: ${response.statusText}`);
  }

  return response.json() as Promise<ValidateStepResponse>;
}
