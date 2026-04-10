import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppStore } from "../../state/store";
import styles from "./SettingsPage.module.css";

function SortableColumnItem({ columnId, removeLabel }: { columnId: string; removeLabel: string }) {
  const column = useAppStore((state) => state.columns.find((item) => item.id === columnId));
  const removeColumn = useAppStore((state) => state.removeColumn);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: columnId });

  const [error, setError] = useState("");
  if (!column) return null;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={styles.item}
      {...attributes}
      {...listeners}
    >
      <strong>{column.title}</strong>
      <div className={styles.itemActions}>
        <button
          type="button"
          className={styles.itemButton}
          onClick={() => {
            const message = removeColumn(column.id);
            setError(message || "");
          }}
        >
          {removeLabel}
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </article>
  );
}

export function SettingsPage() {
  const locale = useAppStore((state) => state.locale);
  const projectsRaw = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const addProject = useAppStore((state) => state.addProject);
  const removeProject = useAppStore((state) => state.removeProject);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const columnsRaw = useAppStore((state) => state.columns);
  const assignees = useAppStore((state) => state.assignees);
  const addColumn = useAppStore((state) => state.addColumn);
  const reorderColumns = useAppStore((state) => state.reorderColumns);
  const addAssignee = useAppStore((state) => state.addAssignee);
  const removeAssignee = useAppStore((state) => state.removeAssignee);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [newProject, setNewProject] = useState("");
  const [newColumn, setNewColumn] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [error, setError] = useState("");
  const t =
    locale === "en-US"
      ? {
          projects: "Projects",
          newProject: "New project",
          active: "Active",
          columns: "Columns",
          newColumn: "New column",
          add: "Add",
          assignees: "Assignees",
          newAssignee: "New assignee",
          remove: "Delete"
        }
      : {
          projects: "Projetos",
          newProject: "Novo projeto",
          active: "Ativo",
          columns: "Colunas",
          newColumn: "Nova coluna",
          add: "Adicionar",
          assignees: "Responsáveis",
          newAssignee: "Novo responsável",
          remove: "Excluir"
        };

  const projects = useMemo(() => [...projectsRaw].sort((a, b) => a.order - b.order), [projectsRaw]);
  const columns = useMemo(() => [...columnsRaw].sort((a, b) => a.order - b.order), [columnsRaw]);

  const onColumnsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderColumns(String(active.id), String(over.id));
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h2>{t.projects}</h2>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={newProject}
            onChange={(event) => setNewProject(event.target.value)}
            placeholder={t.newProject}
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              const message = addProject(newProject);
              if (message) setError(message);
              else {
                setError("");
                setNewProject("");
              }
            }}
          >
            {t.add}
          </button>
        </div>
        <div className={styles.list}>
          {projects.map((project) => (
            <article key={project.id} className={styles.item}>
              <strong>{project.name}</strong>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => setActiveProject(project.id)}
                >
                  {project.id === activeProjectId ? `${t.active} ?` : t.active}
                </button>
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => {
                    const message = removeProject(project.id);
                    setError(message || "");
                  }}
                >
                  {t.remove}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <h2>{t.columns}</h2>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={newColumn}
            onChange={(event) => setNewColumn(event.target.value)}
            placeholder={t.newColumn}
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              const message = addColumn(newColumn);
              if (message) setError(message);
              else {
                setError("");
                setNewColumn("");
              }
            }}
          >
            {t.add}
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColumnsDragEnd}>
          <SortableContext items={columns.map((column) => column.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.list}>
              {columns.map((column) => (
                <SortableColumnItem key={column.id} columnId={column.id} removeLabel={t.remove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section className={styles.panel}>
        <h2>{t.assignees}</h2>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={newAssignee}
            onChange={(event) => setNewAssignee(event.target.value)}
            placeholder={t.newAssignee}
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              const message = addAssignee(newAssignee);
              if (message) setError(message);
              else {
                setError("");
                setNewAssignee("");
              }
            }}
          >
            {t.add}
          </button>
        </div>
        <div className={styles.list}>
          {assignees.map((assignee) => (
            <article key={assignee.id} className={styles.item}>
              <strong>{assignee.name}</strong>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => {
                    const message = removeAssignee(assignee.id);
                    setError(message || "");
                  }}
                >
                  {t.remove}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
    </main>
  );
}
