export function validateTaskTitle(value: string): string | null {
  if (value.trim().length < 3) return "Titulo da tarefa deve ter no minimo 3 caracteres.";
  return null;
}

export function validateAssigneeName(value: string): string | null {
  if (value.trim().length < 2) return "Nome do responsavel deve ter no minimo 2 caracteres.";
  return null;
}

export function validateColumnTitle(value: string): string | null {
  if (!value.trim()) return "Titulo da coluna nao pode ficar vazio.";
  return null;
}
