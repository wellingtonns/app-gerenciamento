import { useMemo, useState } from "react";
import { TaskModal } from "../../components/task/TaskModal";
import { TaskPreviewModal } from "../../components/task/TaskPreviewModal";
import { useAppStore } from "../../state/store";
import { toPtBrDate } from "../../utils/dates";
import { fileToDataUrl, validateImageFile } from "../../utils/images";
import styles from "./BoardPage.module.css";

const MAX_TASK_IMAGES = 5;

export function BoardPage() {
  const locale = useAppStore((state) => state.locale);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const columnsRaw = useAppStore((state) => state.columns);
  const tasks = useAppStore((state) => state.tasks);
  const assignees = useAppStore((state) => state.assignees);
  const addTask = useAppStore((state) => state.addTask);
  const patchTask = useAppStore((state) => state.patchTask);
  const moveTask = useAppStore((state) => state.moveTask);
  const addComment = useAppStore((state) => state.addComment);
  const removeTask = useAppStore((state) => state.removeTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [sectorTagDraft, setSectorTagDraft] = useState("");
  const [sectorTags, setSectorTags] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<"Baixa" | "Media" | "Alta" | "Critica">("Media");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [images, setImages] = useState<Array<{ id: string; name: string; dataUrl: string }>>([]);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const t =
    locale === "en-US"
      ? {
          newTask: "New Task",
          taskTitle: "Task title",
          requester: "Requester",
          sectorTag: "Department (tag)",
          noSectorTags: "No department tags",
          noAssignee: "No assignee",
          description: "Description",
          subtask: "Subtask",
          noSubtasks: "No subtasks",
          add: "Add",
          attachments: "Task attachments",
          pasteImage: "Paste image here with Ctrl+V",
          remove: "Remove",
          createTask: "Create task",
          reopenedConfirm: "Are you sure you want to reopen this task?",
          done: "Done",
          noDescription: "No description",
          requestedBy: "Requested by",
          notInformed: "Not informed",
          subtasks: "Subtasks",
          comments: "Comments",
          images: "Images",
          reopened: "Reopened",
          start: "Start",
          end: "End",
          view: "View",
          delete: "Delete",
          deleteConfirm: "Delete task?"
        }
      : {
          newTask: "Nova Tarefa",
          taskTitle: "Título da tarefa",
          requester: "Solicitante",
          sectorTag: "Setor (tag)",
          noSectorTags: "Sem tags de setor",
          noAssignee: "Sem responsável",
          description: "Descrição",
          subtask: "Subtarefa",
          noSubtasks: "Sem subtarefas",
          add: "Adicionar",
          attachments: "Anexos da tarefa",
          pasteImage: "Cole imagem aqui com Ctrl+V",
          remove: "Remover",
          createTask: "Criar tarefa",
          reopenedConfirm: "Você tem certeza que quer reabrir esta tarefa?",
          done: "Concluído",
          noDescription: "Sem descrição",
          requestedBy: "Solicitado por",
          notInformed: "Não informado",
          subtasks: "Subtarefas",
          comments: "Comentários",
          images: "Anexos",
          reopened: "Reaberta",
          start: "Início",
          end: "Fim",
          view: "Visualizar",
          delete: "Excluir",
          deleteConfirm: "Excluir tarefa?"
        };

  const columns = useMemo(() => [...columnsRaw].sort((a, b) => a.order - b.order), [columnsRaw]);
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === activeProjectId),
    [tasks, activeProjectId]
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, typeof projectTasks>();
    columns.forEach((column) => {
      map.set(
        column.id,
        projectTasks.filter((task) => task.columnId === column.id).sort((a, b) => a.order - b.order)
      );
    });
    return map;
  }, [columns, projectTasks]);

  const onCreateTask = () => {
    const message = addTask({
      title,
      description,
      requesterName,
      tags: sectorTags,
      assigneeId: assigneeId || null,
      priority,
      startDate: startDate || null,
      endDate: endDate || null,
      subtasks,
      images: images.map((image) => ({ name: image.name, dataUrl: image.dataUrl }))
    });
    if (message) {
      setError(message);
      return;
    }
    setTitle("");
    setDescription("");
    setRequesterName("");
    setSectorTagDraft("");
    setSectorTags([]);
    setAssigneeId("");
    setPriority("Media");
    setStartDate("");
    setEndDate("");
    setSubtaskDraft("");
    setSubtasks([]);
    setImages([]);
    setError("");
  };

  const appendFilesAsImages = async (files: File[]) => {
    if (!files.length) return;
    if (images.length + files.length > MAX_TASK_IMAGES) {
      setError(`Maximo de ${MAX_TASK_IMAGES} imagens por tarefa.`);
      return;
    }

    const next: Array<{ id: string; name: string; dataUrl: string }> = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation) {
        setError(validation);
        continue;
      }
      next.push({ id: crypto.randomUUID(), name: file.name, dataUrl: await fileToDataUrl(file) });
    }

    if (next.length) {
      setImages((prev) => [...prev, ...next]);
      setError("");
    }
  };

  const isDoneColumn = (columnId: string) => {
    const column = columns.find((item) => item.id === columnId);
    if (!column) return false;
    return column.id === "done" || column.title.toLowerCase().includes("concl");
  };

  const requestMoveTask = (taskId: string, nextColumnId: string) => {
    const task = projectTasks.find((item) => item.id === taskId);
    if (!task) return;
    const isReopening = isDoneColumn(task.columnId) && !isDoneColumn(nextColumnId);
    if (isReopening) {
      const confirmed = window.confirm(t.reopenedConfirm);
      if (!confirmed) return;
      patchTask(task.id, { reopenedCount: task.reopenedCount + 1 });
      addComment(task.id, "Tarefa reaberta a partir de Concluido.", []);
    }
    moveTask(taskId, nextColumnId);
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h2>{t.newTask}</h2>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            onCreateTask();
          }}
        >
          <input className={`${styles.field} ${styles.title}`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.taskTitle} />
          <input
            className={`${styles.field} ${styles.requester}`}
            value={requesterName}
            onChange={(event) => setRequesterName(event.target.value)}
            placeholder={t.requester}
          />
          <div className={`${styles.tags} ${styles.field}`}>
            <div className={styles.subtaskInputRow}>
              <input
                className={styles.subtaskInput}
                value={sectorTagDraft}
                onChange={(event) => setSectorTagDraft(event.target.value)}
                placeholder={t.sectorTag}
              />
              <button
                type="button"
                className={styles.subtaskAdd}
                onClick={() => {
                  const trimmed = sectorTagDraft.trim();
                  if (!trimmed) return;
                  if (sectorTags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) return;
                  setSectorTags((prev) => [...prev, trimmed]);
                  setSectorTagDraft("");
                }}
              >
                {t.add}
              </button>
            </div>
            <div className={styles.subtaskList}>
              {sectorTags.length ? (
                sectorTags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className={styles.subtaskChip}>
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setSectorTags((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remover tag ${tag}`}
                    >
                      x
                    </button>
                  </span>
                ))
              ) : (
                <small>{t.noSectorTags}</small>
              )}
            </div>
          </div>
          <select className={`${styles.field} ${styles.assignee}`} value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">{t.noAssignee}</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
          <select className={`${styles.field} ${styles.formPriority}`} value={priority} onChange={(event) => setPriority(event.target.value as "Baixa" | "Media" | "Alta" | "Critica")}>
            <option>Baixa</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Critica</option>
          </select>
          <input className={`${styles.field} ${styles.start}`} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className={`${styles.field} ${styles.end}`} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <textarea className={`${styles.field} ${styles.description}`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.description} />
          <div className={`${styles.subtasks} ${styles.field}`}>
            <div className={styles.subtaskInputRow}>
              <input
                className={styles.subtaskInput}
                value={subtaskDraft}
                onChange={(event) => setSubtaskDraft(event.target.value)}
                placeholder={t.subtask}
              />
              <button
                type="button"
                className={styles.subtaskAdd}
                onClick={() => {
                  const trimmed = subtaskDraft.trim();
                  if (!trimmed) return;
                  setSubtasks((prev) => [...prev, trimmed]);
                  setSubtaskDraft("");
                }}
              >
                {t.add}
              </button>
            </div>
            <div className={styles.subtaskList}>
              {subtasks.length ? (
                subtasks.map((subtask, index) => (
                  <span key={`${subtask}-${index}`} className={styles.subtaskChip}>
                    {subtask}
                    <button
                      type="button"
                      onClick={() => setSubtasks((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remover subtarefa ${subtask}`}
                    >
                      x
                    </button>
                  </span>
                ))
              ) : (
                <small>{t.noSubtasks}</small>
              )}
            </div>
          </div>
          <div className={`${styles.imagesBlock} ${styles.field}`}>
            <div className={styles.imagesHeader}>
              <strong>{t.attachments}</strong>
              <small>{images.length}/{MAX_TASK_IMAGES}</small>
            </div>
            <div
              className={styles.pasteZone}
              tabIndex={0}
              onPaste={async (event) => {
                const clipboardFiles = Array.from(event.clipboardData.items)
                  .filter((item) => item.type.startsWith("image/"))
                  .map((item) => item.getAsFile())
                  .filter((file): file is File => Boolean(file));
                if (clipboardFiles.length) {
                  event.preventDefault();
                  await appendFilesAsImages(clipboardFiles);
                }
              }}
            >
              {t.pasteImage}
            </div>
            <input
              className={styles.fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={async (event) => {
                await appendFilesAsImages(Array.from(event.target.files || []));
                event.target.value = "";
              }}
            />
            <div className={styles.imageGrid}>
              {images.map((image) => (
                <figure key={image.id} className={styles.imageCard}>
                  <button
                    type="button"
                    className={styles.imageThumbButton}
                    onClick={() => setPreviewImage({ dataUrl: image.dataUrl, name: image.name })}
                  >
                    <img src={image.dataUrl} alt={image.name} />
                  </button>
                  <figcaption>{image.name}</figcaption>
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((item) => item.id !== image.id))}
                  >
                    {t.remove}
                  </button>
                </figure>
              ))}
            </div>
          </div>
          <button className={styles.submit} type="submit">
            {t.createTask}
          </button>
        </form>
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.board}>
        {columns.map((column) => (
          <article
            key={column.id}
            className={styles.column}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragTaskId) requestMoveTask(dragTaskId, column.id);
              setDragTaskId(null);
            }}
          >
            <div className={styles.columnHeader}>
              <h3>{column.title}</h3>
              <span>{tasksByColumn.get(column.id)?.length ?? 0}</span>
            </div>
            <div className={styles.taskList}>
              {(tasksByColumn.get(column.id) || []).map((task) => (
                <div
                  key={task.id}
                  className={styles.task}
                  draggable
                  onClick={() => setPreviewTaskId(task.id)}
                  onDragStart={() => setDragTaskId(task.id)}
                  onDragEnd={() => setDragTaskId(null)}
                >
                  <div className={styles.taskTop}>
                    <strong>
                      #{task.taskCode} - {task.title}
                    </strong>
                    <small
                      className={`${styles.priorityBadge} ${
                        column.id === "done"
                          ? styles.priorityDone
                          : task.priority === "Baixa"
                            ? styles.priorityLow
                            : task.priority === "Media"
                              ? styles.priorityMedium
                              : styles.priorityHigh
                      }`}
                    >
                      {column.id === "done" ? t.done : task.priority}
                    </small>
                  </div>
                  <p>{task.description || t.noDescription}</p>
                  <p className={styles.requesterText}>{t.requestedBy}: {task.requesterName || t.notInformed}</p>
                  {task.tags.length ? (
                    <div className={styles.tagList}>
                      {task.tags.map((tag) => (
                        <span key={`${task.id}-${tag}`} className={styles.tagChip}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.meta}>
                    <span>{t.subtasks}: {task.subtasks.filter((item) => item.done).length}/{task.subtasks.length}</span>
                    <span>{t.comments}: {task.comments.length}</span>
                    <span>{t.images}: {task.images.length}</span>
                    {task.reopenedCount > 0 ? <span>{t.reopened}: {task.reopenedCount}x</span> : null}
                  </div>
                  <div className={styles.dates}>
                    <span>{t.start}: {toPtBrDate(task.startDate)}</span>
                    <span>{t.end}: {toPtBrDate(task.endDate)}</span>
                  </div>
                  <div className={styles.controls}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewTaskId(task.id);
                      }}
                    >
                      {t.view}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!window.confirm(t.deleteConfirm)) return;
                        removeTask(task.id);
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {editingTaskId ? (
        <TaskModal taskId={editingTaskId} assignees={assignees} columns={columns} onClose={() => setEditingTaskId(null)} />
      ) : null}
      {previewTaskId ? (
        <TaskPreviewModal
          taskId={previewTaskId}
          assignees={assignees}
          columns={columns}
          onClose={() => setPreviewTaskId(null)}
          onEdit={() => {
            setEditingTaskId(previewTaskId);
            setPreviewTaskId(null);
          }}
        />
      ) : null}
      {previewImage ? (
        <section className={styles.imageLightbox} onClick={() => setPreviewImage(null)}>
          <article className={styles.imageLightboxContent} onClick={(event) => event.stopPropagation()}>
            <img src={previewImage.dataUrl} alt={previewImage.name} />
            <button type="button" onClick={() => setPreviewImage(null)}>
              Fechar imagem
            </button>
          </article>
        </section>
      ) : null}
    </main>
  );
}
