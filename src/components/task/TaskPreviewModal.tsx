import { useMemo, useState } from "react";
import { Assignee, Column } from "../../types";
import { useAppStore } from "../../state/store";
import { toPtBrDate } from "../../utils/dates";
import styles from "./TaskPreviewModal.module.css";

type Props = {
  taskId: string;
  assignees: Assignee[];
  columns: Column[];
  onClose: () => void;
  onEdit: () => void;
};

export function TaskPreviewModal({ taskId, assignees, columns, onClose, onEdit }: Props) {
  const locale = useAppStore((state) => state.locale);
  const task = useAppStore((state) => state.tasks.find((item) => item.id === taskId));
  const [previewImage, setPreviewImage] = useState<{ dataUrl: string; name: string } | null>(null);

  const assigneeName = useMemo(() => {
    if (!task?.assigneeId) return "Sem responsavel";
    return assignees.find((item) => item.id === task.assigneeId)?.name ?? "Sem responsavel";
  }, [assignees, task?.assigneeId]);

  const status = useMemo(() => {
    if (!task) return "";
    return columns.find((column) => column.id === task.columnId)?.title ?? task.columnId;
  }, [columns, task]);

  if (!task) return null;
  const t =
    locale === "en-US"
      ? {
          noDescription: "No description",
          requester: "Requester",
          tags: "Tags",
          noTags: "No tags",
          assignee: "Assignee",
          noAssignee: "No assignee",
          priority: "Priority",
          start: "Start",
          end: "End",
          reopened: "Reopened",
          subtasks: "Subtasks",
          noSubtasks: "No subtasks",
          images: "Images",
          noAttachments: "No attachments",
          comments: "Comments",
          noComments: "No comments",
          close: "Close",
          edit: "Edit",
          closeImage: "Close image"
        }
      : {
          noDescription: "Sem descrição",
          requester: "Solicitante",
          tags: "Tags",
          noTags: "Sem tags",
          assignee: "Responsável",
          noAssignee: "Sem responsável",
          priority: "Prioridade",
          start: "Início",
          end: "Fim",
          reopened: "Reaberta",
          subtasks: "Subtarefas",
          noSubtasks: "Sem subtarefas",
          images: "Imagens",
          noAttachments: "Sem anexos",
          comments: "Comentários",
          noComments: "Sem comentários",
          close: "Fechar",
          edit: "Editar",
          closeImage: "Fechar imagem"
        };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h2>
            #{task.taskCode} - {task.title}
          </h2>
          <small>{status}</small>
        </header>

        <section className={styles.block}>
          <p>{task.description || t.noDescription}</p>
          <div className={styles.meta}>
            <span>{t.requester}: {task.requesterName || t.noAssignee}</span>
            <span>{t.tags}: {task.tags.length ? task.tags.map((tag) => `#${tag}`).join(", ") : t.noTags}</span>
            <span>{t.assignee}: {assigneeName}</span>
            <span>{t.priority}: {task.priority}</span>
            <span>{t.start}: {toPtBrDate(task.startDate)}</span>
            <span>{t.end}: {toPtBrDate(task.endDate)}</span>
            <span>{t.reopened}: {task.reopenedCount}x</span>
          </div>
        </section>

        <section className={styles.block}>
          <h3>{t.subtasks}</h3>
          <ul className={styles.list}>
            {task.subtasks.length ? (
              task.subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <input type="checkbox" checked={subtask.done} readOnly />
                  <span>{subtask.title}</span>
                </li>
              ))
            ) : (
              <li>{t.noSubtasks}</li>
            )}
          </ul>
        </section>

        <section className={styles.block}>
          <h3>{t.images}</h3>
          <div className={styles.imageGrid}>
            {task.images.length ? (
              task.images.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  className={styles.imageButton}
                  onClick={() => setPreviewImage({ dataUrl: image.dataUrl, name: image.name })}
                >
                  <img src={image.dataUrl} alt={image.name} />
                </button>
              ))
            ) : (
              <p>{t.noAttachments}</p>
            )}
          </div>
        </section>

        <section className={styles.block}>
          <h3>{t.comments}</h3>
          <div className={styles.comments}>
            {task.comments.length ? (
              task.comments.map((comment) => (
                <article key={comment.id} className={styles.comment}>
                  <small>{new Date(comment.createdAt).toLocaleString("pt-BR")}</small>
                  <p>{comment.text}</p>
                </article>
              ))
            ) : (
              <p>{t.noComments}</p>
            )}
          </div>
        </section>

        <footer className={styles.actions}>
          <button type="button" className={styles.button} onClick={onClose}>
            {t.close}
          </button>
          <button type="button" className={styles.primary} onClick={onEdit}>
            {t.edit}
          </button>
        </footer>
      </section>

      {previewImage ? (
        <section className={styles.lightbox} onClick={() => setPreviewImage(null)}>
          <article className={styles.lightboxContent} onClick={(event) => event.stopPropagation()}>
            <img src={previewImage.dataUrl} alt={previewImage.name} />
            <button type="button" className={styles.button} onClick={() => setPreviewImage(null)}>
              {t.closeImage}
            </button>
          </article>
        </section>
      ) : null}
    </div>
  );
}
