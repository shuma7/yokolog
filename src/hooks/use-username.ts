"use client";

import useLocalStorage from './use-local-storage';

const USERNAME_KEY = 'yokolog_current_user'; // Changed key to reflect current user

export function useUsername() {
  const [username, setUsername] = useLocalStorage<string | null>(USERNAME_KEY, null);
  return { username, setUsername };
}
