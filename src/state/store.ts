import { create } from "zustand";
import { AppData, Assignee, Column, Comment, CommentImage, Priority, Project, Task, TaskImage } from "../types";
import { loadState, saveState } from "../storage/localStorage";
import { nowIso } from "../utils/dates";
import { uid } from "../utils/ids";

type NewTaskInput = {
  title: string;
  description: string;
  requesterName: string;
  tags: string[];
  assigneeId: string | null;
  priority: Priority;
  startDate: string | null;
  endDate: string | null;
  subtasks: string[];
  images: Array<{ name: string; dataUrl: string }>;
};

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "requesterName"
    | "tags"
    | "reopenedCount"
    | "assigneeId"
    | "priority"
    | "startDate"
    | "endDate"
    | "columnId"
  >
>;

interface AppStore extends AppData {
  setTheme: (theme: "light" | "dark") => void;
  setLocale: (locale: "pt-BR" | "en-US") => void;
  addProject: (name: string) => string | null;
  removeProject: (projectId: string) => string | null;
  setActiveProject: (projectId: string) => void;
  addColumn: (title: string) => string | null;
  removeColumn: (columnId: string) => string | null;
  reorderColumns: (activeId: string, overId: string) => void;
  addAssignee: (name: string) => string | null;
  removeAssignee: (assigneeId: string) => string | null;
  addTask: (input: NewTaskInput) => string | null;
  patchTask: (taskId: string, patch: TaskPatch) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, nextColumnId: string) => void;
  reorderTask: (taskId: string, overTaskId: string, columnId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  addTaskImage: (taskId: string, image: Omit<TaskImage, "id" | "createdAt">) => void;
  removeTaskImage: (taskId: string, imageId: string) => void;
  addComment: (taskId: string, text: string, images: Omit<CommentImage, "id">[]) => void;
  removeComment: (taskId: string, commentId: string) => void;
}

const persisted = loadState();
const TASK_CODE_MAX = 9_999_999;

function parseTaskCode(taskCode: string): number {
  const numeric = Number.parseInt(taskCode, 10);
  if (Number.isNaN(numeric) || numeric < 1) return 0;
  return numeric;
}

function formatTaskCode(value: number): string {
  return String(value).padStart(4, "0");
}

function persist(setter: (state: AppStore) => Partial<AppStore>) {
  return (set: (fn: (state: AppStore) => Partial<AppStore>) => void) => {
    set((state) => {
      const partial = setter(state);
      const data: AppData = {
        projects: (partial.projects ?? state.projects) as Project[],
        activeProjectId: (partial.activeProjectId ?? state.activeProjectId) as string,
        columns: (partial.columns ?? state.columns) as Column[],
        assignees: (partial.assignees ?? state.assignees) as Assignee[],
        tasks: (partial.tasks ?? state.tasks) as Task[],
        theme: (partial.theme ?? state.theme) as "light" | "dark",
        locale: (partial.locale ?? state.locale) as "pt-BR" | "en-US"
      };
      saveState(data);
      return partial;
    });
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...persisted,

  setTheme: (theme) => persist(() => ({ theme }))(set),
  setLocale: (locale) => persist(() => ({ locale }))(set),

  addProject: (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Nome do projeto deve ter no minimo 2 caracteres.";
    const state = get();
    const exists = state.projects.some((project) => project.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return "Ja existe um projeto com esse nome.";

    const projectId = uid();
    persist((current) => ({
      projects: [...current.projects, { id: projectId, name: trimmed, order: current.projects.length }],
      activeProjectId: projectId
    }))(set);
    return null;
  },

  removeProject: (projectId) => {
    const state = get();
    if (state.projects.length <= 1) return "Você precisa manter pelo menos um projeto.";
    const hasTasks = state.tasks.some((task) => task.projectId === projectId);
    if (hasTasks) return "Não é possível excluir projeto com tarefas vinculadas.";

    const nextProjects = state.projects.filter((project) => project.id !== projectId);
    const nextActiveProjectId =
      state.activeProjectId === projectId ? nextProjects[0]?.id ?? state.activeProjectId : state.activeProjectId;

    persist(() => ({
      projects: nextProjects.map((project, index) => ({ ...project, order: index })),
      activeProjectId: nextActiveProjectId
    }))(set);
    return null;
  },

  setActiveProject: (projectId) =>
    persist((state) => {
      if (!state.projects.some((project) => project.id === projectId)) return {};
      return { activeProjectId: projectId };
    })(set),

  addColumn: (title) => {
    const trimmed = title.trim();
    if (!trimmed) return "Titulo da coluna nao pode ficar vazio.";
    const exists = get().columns.some((column) => column.title.toLowerCase() === trimmed.toLowerCase());
    if (exists) return "Ja existe coluna com esse titulo.";

    persist((state) => ({
      columns: [...state.columns, { id: uid(), title: trimmed, order: state.columns.length }]
    }))(set);
    return null;
  },

  removeColumn: (columnId) => {
    const state = get();
    if (state.columns.length <= 1) return "Voce precisa manter pelo menos uma coluna.";
    const hasTasks = state.tasks.some((task) => task.columnId === columnId);
    if (hasTasks) return "Nao e possivel excluir coluna com tarefas.";

    persist((current) => ({
      columns: current.columns
        .filter((column) => column.id !== columnId)
        .sort((a, b) => a.order - b.order)
        .map((column, index) => ({ ...column, order: index }))
    }))(set);
    return null;
  },

  reorderColumns: (activeId, overId) => {
    if (activeId === overId) return;
    const columns = [...get().columns].sort((a, b) => a.order - b.order);
    const oldIndex = columns.findIndex((item) => item.id === activeId);
    const newIndex = columns.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const [moved] = columns.splice(oldIndex, 1);
    columns.splice(newIndex, 0, moved);
    persist(() => ({
      columns: columns.map((column, index) => ({ ...column, order: index }))
    }))(set);
  },

  addAssignee: (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Nome do responsavel deve ter no minimo 2 caracteres.";
    const exists = get().assignees.some((assignee) => assignee.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return "Responsavel ja existe.";

    persist((state) => ({
      assignees: [...state.assignees, { id: uid(), name: trimmed }]
    }))(set);
    return null;
  },

  removeAssignee: (assigneeId) => {
    const used = get().tasks.filter((task) => task.assigneeId === assigneeId).length;
    if (used > 0) return `Nao e possivel excluir. ${used} tarefa(s) vinculada(s).`;

    persist((state) => ({
      assignees: state.assignees.filter((assignee) => assignee.id !== assigneeId)
    }))(set);
    return null;
  },

  addTask: (input) => {
    if (input.title.trim().length < 3) return "Titulo da tarefa deve ter no minimo 3 caracteres.";
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      return "Data final nao pode ser menor que data inicial.";
    }

    const state = get();
    const activeProjectId = state.activeProjectId;
    const firstColumn = [...state.columns].sort((a, b) => a.order - b.order)[0];
    if (!firstColumn) return "Sem coluna disponivel.";

    const columnTasks = state.tasks.filter(
      (task) => task.columnId === firstColumn.id && task.projectId === activeProjectId
    );
    const nextCode = state.tasks.reduce((acc, task) => Math.max(acc, parseTaskCode(task.taskCode)), 0) + 1;
    if (nextCode > TASK_CODE_MAX) return "Limite de IDs atingido (9999999).";
    const now = nowIso();
    const task: Task = {
      id: uid(),
      taskCode: formatTaskCode(nextCode),
      projectId: activeProjectId,
      title: input.title.trim(),
      description: input.description.trim(),
      requesterName: input.requesterName.trim(),
      tags: input.tags
        .map((tag) => tag.trim())
        .filter((tag, index, arr) => tag.length > 0 && arr.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index),
      reopenedCount: 0,
      assigneeId: input.assigneeId,
      priority: input.priority,
      startDate: input.startDate,
      endDate: input.endDate,
      columnId: firstColumn.id,
      order: columnTasks.length,
      subtasks: input.subtasks
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .map((title) => ({ id: uid(), title, done: false })),
      images: input.images.map((image) => ({ ...image, id: uid(), createdAt: now })),
      comments: [],
      createdAt: now,
      updatedAt: now
    };

    persist((current) => ({ tasks: [...current.tasks, task] }))(set);
    return null;
  },

  patchTask: (taskId, patch) => {
    const now = nowIso();
    persist((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: now } : task))
    }))(set);
  },

  removeTask: (taskId) => {
    persist((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) }))(set);
  },

  moveTask: (taskId, nextColumnId) => {
    const state = get();
    const nextOrder = state.tasks.filter((task) => task.columnId === nextColumnId).length;
    const now = nowIso();
    persist((current) => ({
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              columnId: nextColumnId,
              order: nextOrder,
              updatedAt: now
            }
          : task
      )
    }))(set);
  },

  reorderTask: (taskId, overTaskId, columnId) => {
    if (taskId === overTaskId) return;
    const state = get();
    const columnTasks = state.tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.order - b.order);
    const oldIndex = columnTasks.findIndex((item) => item.id === taskId);
    const newIndex = columnTasks.findIndex((item) => item.id === overTaskId);
    if (oldIndex < 0 || newIndex < 0) return;

    const [moved] = columnTasks.splice(oldIndex, 1);
    columnTasks.splice(newIndex, 0, moved);

    persist((current) => ({
      tasks: current.tasks.map((task) => {
        if (task.columnId !== columnId) return task;
        const index = columnTasks.findIndex((item) => item.id === task.id);
        return index >= 0 ? { ...task, order: index, updatedAt: nowIso() } : task;
      })
    }))(set);
  },

  addSubtask: (taskId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...task.subtasks, { id: uid(), title: trimmed, done: false }],
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  toggleSubtask: (taskId, subtaskId) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
              ),
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  removeSubtask: (taskId, subtaskId) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  addTaskImage: (taskId, image) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              images: [...task.images, { ...image, id: uid(), createdAt: nowIso() }],
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  removeTaskImage: (taskId, imageId) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              images: task.images.filter((image) => image.id !== imageId),
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  addComment: (taskId, text, images) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [
                ...task.comments,
                {
                  id: uid(),
                  text: text.trim(),
                  images: images.map((image) => ({ ...image, id: uid() })),
                  createdAt: nowIso()
                } as Comment
              ],
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  },

  removeComment: (taskId, commentId) => {
    persist((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: task.comments.filter((comment) => comment.id !== commentId),
              updatedAt: nowIso()
            }
          : task
      )
    }))(set);
  }
}));
