import { Assignee, Column, Task } from "../types";

function esc(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportTasksCsv(tasks: Task[], columns: Column[], assignees: Assignee[]): void {
  const headers = ["ID", "Titulo", "Descricao", "Solicitante", "Tags", "Responsavel", "Prioridade", "Status", "Inicio", "Fim"];
  const lines = tasks.map((task) => {
    const status = columns.find((column) => column.id === task.columnId)?.title ?? task.columnId;
    const assignee = assignees.find((item) => item.id === task.assigneeId)?.name ?? "Sem responsavel";

    return [
      esc(task.taskCode),
      esc(task.title),
      esc(task.description || ""),
      esc(task.requesterName || ""),
      esc(task.tags.join(" | ")),
      esc(assignee),
      esc(task.priority),
      esc(status),
      esc(task.startDate || ""),
      esc(task.endDate || "")
    ].join(",");
  });

  const content = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio-kanban-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
