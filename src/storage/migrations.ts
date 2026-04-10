import { AppData, PersistedState } from "../types";
import { nowIso } from "../utils/dates";
import { uid } from "../utils/ids";

export const STORAGE_VERSION = 4;
const TASK_CODE_MAX = 9_999_999;

export const STORAGE_KEY = "app-gerenciamento:v1";

function parseTaskCode(taskCode: unknown): number {
  const numeric = Number.parseInt(String(taskCode ?? ""), 10);
  if (Number.isNaN(numeric) || numeric < 1) return 0;
  return Math.min(numeric, TASK_CODE_MAX);
}

function formatTaskCode(value: number): string {
  return String(value).padStart(4, "0");
}

export function createSeedData(): AppData {
  const now = nowIso();
  const start = now.slice(0, 10);
  const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const assigneeA = { id: uid(), name: "Wellington" };
  const assigneeB = { id: uid(), name: "UX" };

  const columns = [
    { id: "todo", title: "A Fazer", order: 0 },
    { id: "doing", title: "Em Progresso", order: 1 },
    { id: "done", title: "Concluido", order: 2 }
  ];
  const defaultProjectId = "project-default";

  return {
    projects: [{ id: defaultProjectId, name: "Projeto Principal", order: 0 }],
    activeProjectId: defaultProjectId,
    columns,
    assignees: [assigneeA, assigneeB],
    tasks: [
      {
        id: uid(),
        taskCode: "0001",
        projectId: defaultProjectId,
        title: "Definir escopo do sprint",
        description: "Listar historias prioritarias e dependencias.",
        requesterName: "Wellington",
        tags: ["Produto"],
        reopenedCount: 0,
        assigneeId: assigneeA.id,
        priority: "Alta",
        startDate: start,
        endDate: end,
        columnId: "todo",
        order: 0,
        subtasks: [],
        images: [],
        comments: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uid(),
        taskCode: "0002",
        projectId: defaultProjectId,
        title: "Criar layout do dashboard",
        description: "Construir tela com cards e filtros principais.",
        requesterName: "Produto",
        tags: ["UX"],
        reopenedCount: 0,
        assigneeId: assigneeB.id,
        priority: "Media",
        startDate: start,
        endDate: end,
        columnId: "doing",
        order: 0,
        subtasks: [],
        images: [],
        comments: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    theme: "dark",
    locale: "pt-BR"
  };
}

export function migratePersistedState(input: PersistedState | null): PersistedState {
  if (!input) {
    return { version: STORAGE_VERSION, data: createSeedData() };
  }

  if (input.data) {
    const data = input.data;
    const safeProjectsRaw = Array.isArray((data as any).projects) ? (data as any).projects : [];
    const safeProjects = safeProjectsRaw
      .map((project: any, index: number) => ({
        id: String(project?.id ?? `project-${index + 1}`),
        name: String(project?.name ?? `Projeto ${index + 1}`),
        order: typeof project?.order === "number" ? project.order : index
      }))
      .filter((project: { id: string; name: string }) => project.id && project.name.trim());
    const projects = safeProjects.length
      ? safeProjects.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      : createSeedData().projects;
    const activeProjectId = projects.some((project: { id: string }) => project.id === (data as any).activeProjectId)
      ? String((data as any).activeProjectId)
      : projects[0].id;

    const safeColumnsRaw = Array.isArray(data.columns) ? data.columns : [];
    const safeColumns = safeColumnsRaw
      .map((column: any, index: number) => ({
        id: String(column?.id ?? column?.key ?? `col-${index}`),
        title: String(column?.title ?? column?.label ?? `Coluna ${index + 1}`),
        order: typeof column?.order === "number" ? column.order : index
      }))
      .filter((column: { id: string }) => Boolean(column.id));

    const safeAssigneesRaw = Array.isArray(data.assignees) ? data.assignees : [];
    const safeAssignees = safeAssigneesRaw
      .map((assignee: any, index: number) => {
        if (typeof assignee === "string") {
          return { id: `asg-${index}-${assignee}`, name: assignee };
        }
        return {
          id: String(assignee?.id ?? `asg-${index}`),
          name: String(assignee?.name ?? "")
        };
      })
      .filter((assignee: { name: string }) => assignee.name.trim().length >= 2);

    const assigneeByName = new Map(safeAssignees.map((a: { id: string; name: string }) => [a.name, a.id]));

    const safeTasksRaw = Array.isArray(data.tasks) ? data.tasks : [];
    let nextTaskCode = 0;
    const safeTasks = safeTasksRaw.map((task: any, index: number) => {
      const assigneeName = String(task?.assignee ?? "");
      const assigneeId = task?.assigneeId ?? assigneeByName.get(assigneeName) ?? null;
      const rawTaskCode = parseTaskCode(task?.taskCode ?? task?.codigo ?? task?.code);
      nextTaskCode = Math.min(TASK_CODE_MAX, Math.max(nextTaskCode + 1, rawTaskCode));
      const taskCode = formatTaskCode(nextTaskCode);
      const tags = Array.isArray(task?.tags)
        ? task.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0)
        : typeof task?.sector === "string"
          ? [String(task.sector).trim()].filter((tag) => tag.length > 0)
          : typeof task?.tag === "string"
            ? [String(task.tag).trim()].filter((tag) => tag.length > 0)
            : [];

      return {
        id: String(task?.id ?? uid()),
        taskCode,
        projectId: String(task?.projectId ?? activeProjectId),
        title: String(task?.title ?? "Tarefa sem titulo"),
        description: String(task?.description ?? ""),
        requesterName: String(task?.requesterName ?? task?.requester ?? ""),
        tags: tags.filter(
          (tag: string, tagIndex: number, arr: string[]) =>
            arr.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === tagIndex
        ),
        reopenedCount:
          typeof task?.reopenedCount === "number"
            ? Math.max(0, task.reopenedCount)
            : task?.wasReopened
              ? 1
              : 0,
        assigneeId,
        priority: task?.priority ?? "Media",
        startDate: task?.startDate ?? null,
        endDate: task?.endDate ?? null,
        columnId: String(task?.columnId ?? task?.column ?? safeColumns[0]?.id ?? "todo"),
        order: typeof task?.order === "number" ? task.order : index,
        subtasks: Array.isArray(task?.subtasks)
          ? task.subtasks.map((sub: any) => ({
              id: String(sub?.id ?? uid()),
              title: String(sub?.title ?? "Subtarefa"),
              done: Boolean(sub?.done)
            }))
          : [],
        images: Array.isArray(task?.images)
          ? task.images
              .map((img: any) => ({
                id: String(img?.id ?? uid()),
                name: String(img?.name ?? "imagem"),
                dataUrl: String(img?.dataUrl ?? ""),
                createdAt: String(img?.createdAt ?? nowIso())
              }))
              .filter((img: { dataUrl: string }) => img.dataUrl.startsWith("data:image/"))
          : [],
        comments: Array.isArray(task?.comments)
          ? task.comments.map((comment: any) => ({
              id: String(comment?.id ?? uid()),
              text: String(comment?.text ?? ""),
              createdAt: String(comment?.createdAt ?? nowIso()),
              images: Array.isArray(comment?.images)
                ? comment.images
                    .map((img: any) => ({
                      id: String(img?.id ?? uid()),
                      name: String(img?.name ?? "imagem"),
                      dataUrl: String(img?.dataUrl ?? "")
                    }))
                    .filter((img: { dataUrl: string }) => img.dataUrl.startsWith("data:image/"))
                : []
            }))
          : [],
        createdAt: String(task?.createdAt ?? nowIso()),
        updatedAt: String(task?.updatedAt ?? nowIso())
      };
    });

    return {
      version: STORAGE_VERSION,
      data: {
        projects,
        activeProjectId,
        columns: safeColumns.length ? safeColumns : createSeedData().columns,
        assignees: safeAssignees.length ? safeAssignees : createSeedData().assignees,
        tasks: safeTasks,
        theme: data.theme === "light" ? "light" : "dark",
        locale: data.locale === "en-US" ? "en-US" : "pt-BR"
      }
    };
  }

  return { version: STORAGE_VERSION, data: createSeedData() };
}
