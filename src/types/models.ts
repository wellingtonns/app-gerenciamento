export type Priority = "Baixa" | "Media" | "Alta" | "Critica";

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface Assignee {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  order: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskImage {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export interface CommentImage {
  id: string;
  name: string;
  dataUrl: string;
}

export interface Comment {
  id: string;
  text: string;
  images: CommentImage[];
  createdAt: string;
}

export interface Task {
  id: string;
  taskCode: string;
  projectId: string;
  title: string;
  description: string;
  requesterName: string;
  tags: string[];
  reopenedCount: number;
  assigneeId: string | null;
  priority: Priority;
  startDate: string | null;
  endDate: string | null;
  columnId: string;
  order: number;
  subtasks: Subtask[];
  images: TaskImage[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  projects: Project[];
  activeProjectId: string;
  columns: Column[];
  assignees: Assignee[];
  tasks: Task[];
  theme: "light" | "dark";
  locale: "pt-BR" | "en-US";
}

export interface PersistedState {
  version: number;
  data: AppData;
}
