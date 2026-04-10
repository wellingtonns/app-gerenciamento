import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Assignee, Column, CommentImage, Priority, TaskImage } from "../../types";
import { useAppStore } from "../../state/store";
import { fileToDataUrl, validateImageFile } from "../../utils/images";
import { isEndDateValid } from "../../utils/dates";
import styles from "./TaskModal.module.css";

type Props = {
  taskId: string;
  assignees: Assignee[];
  columns: Column[];
  onClose: () => void;
};

type Draft = {
  title: string;
  description: string;
  requesterName: string;
  tags: string[];
  assigneeId: string | null;
  priority: Priority;
  startDate: string | null;
  endDate: string | null;
  columnId: string;
};

const MAX_TASK_IMAGES = 5;
const MAX_COMMENT_IMAGES = 3;

export function TaskModal({ taskId, assignees, columns, onClose }: Props) {
  const locale = useAppStore((state) => state.locale);
  const task = useAppStore((state) => state.tasks.find((item) => item.id === taskId));
  const patchTask = useAppStore((state) => state.patchTask);
  const addSubtask = useAppStore((state) => state.addSubtask);
  const toggleSubtask = useAppStore((state) => state.toggleSubtask);
  const removeSubtask = useAppStore((state) => state.removeSubtask);
  const addTaskImage = useAppStore((state) => state.addTaskImage);
  const removeTaskImage = useAppStore((state) => state.removeTaskImage);
  const addComment = useAppStore((state) => state.addComment);
  const removeComment = useAppStore((state) => state.removeComment);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<CommentImage[]>([]);
  const [previewImage, setPreviewImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const t =
    locale === "en-US"
      ? {
          editTask: "Edit Task",
          close: "Close",
          noAssignee: "No assignee",
          requester: "Requester",
          sectorTag: "Department tag",
          add: "Add",
          noTags: "No tags",
          subtasks: "Subtasks",
          newSubtask: "New subtask",
          delete: "Delete",
          taskImages: "Task Images",
          pasteImage: "Paste image here with Ctrl+V",
          comments: "Comments",
          newComment: "New comment",
          addComment: "Add Comment",
          remove: "Remove",
          removeCommentConfirm: "Delete comment?",
          changeNote: "Change Note",
          changeNotePlaceholder: "Optional: describe reason for changes",
          cancel: "Cancel",
          save: "Save",
          closeImage: "Close image",
          reopenedConfirm: "Are you sure you want to reopen this task?"
        }
      : {
          editTask: "Editar Tarefa",
          close: "Fechar",
          noAssignee: "Sem responsável",
          requester: "Solicitante",
          sectorTag: "Tag de setor",
          add: "Adicionar",
          noTags: "Sem tags",
          subtasks: "Subtarefas",
          newSubtask: "Nova subtarefa",
          delete: "Excluir",
          taskImages: "Imagens da Tarefa",
          pasteImage: "Cole imagem aqui com Ctrl+V",
          comments: "Comentários",
          newComment: "Novo comentário",
          addComment: "Adicionar Comentário",
          remove: "Remover",
          removeCommentConfirm: "Excluir comentário?",
          changeNote: "Comentário da Alteração",
          changeNotePlaceholder: "Opcional: descreva o motivo da alteração",
          cancel: "Cancelar",
          save: "Salvar",
          closeImage: "Fechar imagem",
          reopenedConfirm: "Você tem certeza que quer reabrir esta tarefa?"
        };

  useEffect(() => {
    if (!task) return;
    setDraft({
      title: task.title,
      description: task.description,
      requesterName: task.requesterName,
      tags: task.tags,
      assigneeId: task.assigneeId,
      priority: task.priority,
      startDate: task.startDate,
      endDate: task.endDate,
      columnId: task.columnId
    });
  }, [task]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onClose]);

  const subtaskProgress = useMemo(() => {
    if (!task) return "0/0";
    const done = task.subtasks.filter((item) => item.done).length;
    return `${done}/${task.subtasks.length}`;
  }, [task]);

  if (!task || !draft) return null;

  const isDoneColumn = (columnId: string) => {
    const column = columns.find((item) => item.id === columnId);
    if (!column) return false;
    return column.id === "done" || column.title.toLowerCase().includes("concl");
  };

  const onPickTaskImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await appendTaskImages(files);
    event.target.value = "";
  };

  const appendTaskImages = async (files: File[]) => {
    if (!files.length) return;
    if (task.images.length + files.length > MAX_TASK_IMAGES) {
      setError(`Maximo de ${MAX_TASK_IMAGES} imagens por tarefa.`);
      return;
    }

    for (const file of files) {
      const errorMessage = validateImageFile(file);
      if (errorMessage) {
        setError(errorMessage);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      addTaskImage(task.id, { name: file.name, dataUrl } as Omit<TaskImage, "id" | "createdAt">);
    }
    setError("");
  };

  const onPickCommentImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (commentImages.length + files.length > MAX_COMMENT_IMAGES) {
      setError(`Maximo de ${MAX_COMMENT_IMAGES} imagens por comentario.`);
      return;
    }

    const next: CommentImage[] = [];
    for (const file of files) {
      const errorMessage = validateImageFile(file);
      if (errorMessage) {
        setError(errorMessage);
        continue;
      }
      next.push({ id: crypto.randomUUID(), name: file.name, dataUrl: await fileToDataUrl(file) });
    }
    setCommentImages((prev) => [...prev, ...next]);
    setError("");
    event.target.value = "";
  };

  const save = () => {
    if (draft.title.trim().length < 3) {
      setError("Titulo da tarefa deve ter no minimo 3 caracteres.");
      return;
    }
    if (!isEndDateValid(draft.startDate, draft.endDate)) {
      setError("Data final nao pode ser menor que data inicial.");
      return;
    }

    const changes: string[] = [];
    if (draft.title.trim() !== task.title) changes.push("titulo");
    if (draft.description.trim() !== task.description) changes.push("descricao");
    if (draft.requesterName.trim() !== task.requesterName) changes.push("solicitante");
    if (JSON.stringify(draft.tags) !== JSON.stringify(task.tags)) changes.push("tags");
    if (draft.assigneeId !== task.assigneeId) changes.push("responsavel");
    if (draft.priority !== task.priority) changes.push("prioridade");
    if (draft.startDate !== task.startDate) changes.push("inicio");
    if (draft.endDate !== task.endDate) changes.push("fim");
    if (draft.columnId !== task.columnId) changes.push("status");
    const isReopening = isDoneColumn(task.columnId) && !isDoneColumn(draft.columnId);
    if (isReopening) {
      const confirmed = window.confirm(t.reopenedConfirm);
      if (!confirmed) return;
      changes.push("reabertura");
    }

    patchTask(task.id, {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      requesterName: draft.requesterName.trim(),
      reopenedCount: isReopening ? task.reopenedCount + 1 : task.reopenedCount,
      tags: draft.tags
        .map((tag) => tag.trim())
        .filter((tag, index, arr) => tag.length > 0 && arr.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index)
    });

    if (changes.length) {
      const base = `Alteracao realizada: ${changes.join(", ")}.`;
      const note = changeNote.trim();
      addComment(task.id, note ? `${base} Observacao: ${note}` : base, []);
      if (isReopening) {
        addComment(task.id, "Tarefa reaberta a partir de Concluido.", []);
      }
    }
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t.editTask}</h2>
          <button type="button" className={styles.inlineButton} onClick={onClose}>
            {t.close}
          </button>
        </div>

        <div className={styles.grid}>
          <input className={styles.field} value={task.taskCode} readOnly aria-label="ID da tarefa" />
          <input
            className={styles.field}
            value={draft.title}
            onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
            placeholder="Titulo"
          />
          <select
            className={styles.field}
            value={draft.assigneeId ?? ""}
            onChange={(event) =>
              setDraft((prev) => (prev ? { ...prev, assigneeId: event.target.value || null } : prev))
            }
          >
            <option value="">{t.noAssignee}</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
          <select
            className={styles.field}
            value={draft.priority}
            onChange={(event) =>
              setDraft((prev) => (prev ? { ...prev, priority: event.target.value as Priority } : prev))
            }
          >
            <option>Baixa</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Critica</option>
          </select>
          <select
            className={styles.field}
            value={draft.columnId}
            onChange={(event) => setDraft((prev) => (prev ? { ...prev, columnId: event.target.value } : prev))}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
          <input
            className={styles.field}
            type="date"
            value={draft.startDate ?? ""}
            onChange={(event) =>
              setDraft((prev) => (prev ? { ...prev, startDate: event.target.value || null } : prev))
            }
          />
          <input
            className={styles.field}
            type="date"
            value={draft.endDate ?? ""}
            onChange={(event) =>
              setDraft((prev) => (prev ? { ...prev, endDate: event.target.value || null } : prev))
            }
          />
          <textarea
            className={styles.field}
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
            placeholder="Descricao"
          />
          <input
            className={styles.field}
            value={draft.requesterName}
            onChange={(event) => setDraft((prev) => (prev ? { ...prev, requesterName: event.target.value } : prev))}
            placeholder={t.requester}
          />
          <div className={styles.field}>
            <div className={styles.row}>
              <input
                className={styles.field}
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                placeholder={t.sectorTag}
              />
              <button
                type="button"
                className={styles.inlineButton}
                onClick={() => {
                  const trimmed = tagDraft.trim();
                  if (!trimmed) return;
                  setDraft((prev) => {
                    if (!prev) return prev;
                    if (prev.tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) return prev;
                    return { ...prev, tags: [...prev.tags, trimmed] };
                  });
                  setTagDraft("");
                }}
              >
                {t.add}
              </button>
            </div>
            <div className={styles.list}>
              {draft.tags.length ? (
                draft.tags.map((tag, index) => (
                  <article key={`${tag}-${index}`} className={styles.listItem}>
                    <span>#{tag}</span>
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={() =>
                        setDraft((prev) =>
                          prev ? { ...prev, tags: prev.tags.filter((_, itemIndex) => itemIndex !== index) } : prev
                        )
                      }
                    >
                      Remover
                    </button>
                  </article>
                ))
              ) : (
                <small>{t.noTags}</small>
              )}
            </div>
          </div>
        </div>

        <section className={styles.block}>
          <h3>{t.subtasks} ({subtaskProgress})</h3>
          <div className={styles.row}>
            <input
              className={styles.field}
              value={subtaskTitle}
              onChange={(event) => setSubtaskTitle(event.target.value)}
              placeholder={t.newSubtask}
            />
            <button
              type="button"
              className={styles.inlineButton}
              onClick={() => {
                if (!subtaskTitle.trim()) return;
                addSubtask(task.id, subtaskTitle);
                setSubtaskTitle("");
              }}
            >
              {t.add}
            </button>
          </div>
          <div className={styles.list}>
            {task.subtasks.map((subtask) => (
              <article key={subtask.id} className={styles.listItem}>
                <label>
                  <input type="checkbox" checked={subtask.done} onChange={() => toggleSubtask(task.id, subtask.id)} />
                  <span>{subtask.title}</span>
                </label>
                <button type="button" className={styles.inlineButton} onClick={() => removeSubtask(task.id, subtask.id)}>
                  {t.delete}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <h3>{t.taskImages}</h3>
          <div
            className={styles.pasteZone}
            tabIndex={0}
            onPaste={async (event) => {
              const clipboardFiles = Array.from(event.clipboardData.items)
                .filter((item) => item.type.startsWith("image/"))
                .map((item) => item.getAsFile())
                .filter((file): file is File => Boolean(file));
              if (!clipboardFiles.length) return;
              event.preventDefault();
              await appendTaskImages(clipboardFiles);
            }}
          >
            {t.pasteImage}
          </div>
          <input className={styles.field} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onPickTaskImages} />
          <div className={styles.imageGrid}>
            {task.images.map((image) => (
              <figure key={image.id} className={styles.imageCard}>
                <button
                  type="button"
                  className={styles.imagePreviewButton}
                  onClick={() => setPreviewImage({ dataUrl: image.dataUrl, name: image.name })}
                >
                  <img src={image.dataUrl} alt={image.name} />
                </button>
                <button type="button" className={styles.inlineButton} onClick={() => removeTaskImage(task.id, image.id)}>
                  {t.remove}
                </button>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <h3>{t.comments}</h3>
          <textarea
            className={`${styles.field} ${styles.commentInput}`}
            rows={2}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder={t.newComment}
          />
          <div className={styles.row}>
            <input className={styles.field} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onPickCommentImages} />
            <button
              type="button"
              className={styles.inlineButton}
              onClick={() => {
                addComment(
                  task.id,
                  commentText,
                  commentImages.map((image) => ({ name: image.name, dataUrl: image.dataUrl }))
                );
                setCommentText("");
                setCommentImages([]);
              }}
            >
              {t.addComment}
            </button>
          </div>
          <div className={styles.imageGrid}>
            {commentImages.map((image) => (
              <figure key={image.id} className={styles.imageCard}>
                <button
                  type="button"
                  className={styles.imagePreviewButton}
                  onClick={() => setPreviewImage({ dataUrl: image.dataUrl, name: image.name })}
                >
                  <img src={image.dataUrl} alt={image.name} />
                </button>
                <button
                  type="button"
                  className={styles.inlineButton}
                  onClick={() => setCommentImages((prev) => prev.filter((item) => item.id !== image.id))}
                >
                  {t.remove}
                </button>
              </figure>
            ))}
          </div>
          <div className={styles.list}>
            {task.comments.map((comment) => (
              <article key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <small>{new Date(comment.createdAt).toLocaleString("pt-BR")}</small>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => {
                      if (!window.confirm(t.removeCommentConfirm)) return;
                      removeComment(task.id, comment.id);
                    }}
                  >
                    {t.delete}
                  </button>
                </div>
                <p>{comment.text}</p>
                <div className={styles.imageGrid}>
                  {comment.images.map((image) => (
                    <figure key={image.id} className={styles.imageCard}>
                      <button
                        type="button"
                        className={styles.imagePreviewButton}
                        onClick={() => setPreviewImage({ dataUrl: image.dataUrl, name: image.name })}
                      >
                        <img src={image.dataUrl} alt={image.name} />
                      </button>
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <h3>{t.changeNote}</h3>
          <textarea
            className={`${styles.field} ${styles.changeNoteInput}`}
            rows={2}
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            placeholder={t.changeNotePlaceholder}
          />
        </section>

        {error ? <p>{error}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.inlineButton} onClick={onClose}>
            {t.cancel}
          </button>
          <button type="button" className={styles.primary} onClick={save}>
            {t.save}
          </button>
        </div>
      </section>
      {previewImage ? (
        <section className={styles.imageLightbox} onClick={() => setPreviewImage(null)}>
          <article className={styles.imageLightboxContent} onClick={(event) => event.stopPropagation()}>
            <img src={previewImage.dataUrl} alt={previewImage.name} />
            <button type="button" className={styles.inlineButton} onClick={() => setPreviewImage(null)}>
              {t.closeImage}
            </button>
          </article>
        </section>
      ) : null}
    </div>
  );
}
