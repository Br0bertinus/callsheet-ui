import { useMutation } from '@tanstack/react-query';
import { validateStep } from '../api/game';
import type { ValidateStepResponse } from '../types';

type ValidateStepArgs = {
  currentActorId: number;
  nextActorId: number;
  movieId: number;
  visitedActorIds: number[];
  visitedMovieIds: number[];
};

// Calls POST /game/validate-step to check whether the proposed chain link is valid.
// The caller decides what to do with the result via the onSuccess callback.
export function useValidateStep(onSuccess: (data: ValidateStepResponse) => void) {
  const {
    mutate: submitStep,
    isPending: isValidatingStep,
    error: validateStepError,
    reset: resetValidateStep,
  } = useMutation({
    mutationFn: (args: ValidateStepArgs) => validateStep(args),
    onSuccess,
  });

  return {
    submitStep,
    isValidatingStep,
    validateStepError,
    resetValidateStep,
  };
}
