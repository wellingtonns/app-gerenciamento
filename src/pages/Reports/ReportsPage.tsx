import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "../../state/store";
import { exportTasksCsv } from "../../utils/csv";
import { toPtBrDate } from "../../utils/dates";
import styles from "./ReportsPage.module.css";

export function ReportsPage() {
  const locale = useAppStore((state) => state.locale);
  const projectsRaw = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const tasks = useAppStore((state) => state.tasks);
  const columnsRaw = useAppStore((state) => state.columns);
  const assignees = useAppStore((state) => state.assignees);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState(activeProjectId);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState("all");
  const t =
    locale === "en-US"
      ? {
          title: "Reports",
          allProjects: "All projects",
          allTags: "All tags",
          export: "Export CSV",
          clearStatus: "Clear status filter",
          totalFiltered: "Filtered total",
          done: "Done",
          completion: "Completion rate",
          distribution: "Status distribution",
          filteredList: "Filtered List",
          id: "ID",
          task: "Task",
          status: "Status",
          requester: "Requester",
          tags: "Tags",
          start: "Start",
          end: "End",
          notInformed: "Not informed",
          noResults: "No tasks found with current filters."
        }
      : {
          title: "Relatórios",
          allProjects: "Todos os projetos",
          allTags: "Todas as tags",
          export: "Exportar CSV",
          clearStatus: "Limpar filtro de status",
          totalFiltered: "Total filtrado",
          done: "Concluídas",
          completion: "Taxa de conclusão",
          distribution: "Distribuição por status",
          filteredList: "Lista Filtrada",
          id: "ID",
          task: "Título",
          status: "Status",
          requester: "Solicitante",
          tags: "Tags",
          start: "Início",
          end: "Fim",
          notInformed: "Não informado",
          noResults: "Nenhuma tarefa encontrada com os filtros atuais."
        };

  const projects = useMemo(() => [...projectsRaw].sort((a, b) => a.order - b.order), [projectsRaw]);
  const columns = useMemo(() => [...columnsRaw].sort((a, b) => a.order - b.order), [columnsRaw]);

  const availableTags = useMemo(() => {
    const unique = new Set<string>();
    tasks
      .filter((task) => (projectId === "all" ? true : task.projectId === projectId))
      .forEach((task) => task.tags.forEach((tag) => unique.add(tag)));
    return [...unique].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tasks, projectId]);

  const activeColumnIds = selectedColumnIds.length ? selectedColumnIds : columns.map((column) => column.id);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (startDate && task.endDate && task.endDate < startDate) return false;
      if (endDate && task.startDate && task.startDate > endDate) return false;
      if (projectId !== "all" && task.projectId !== projectId) return false;
      if (!activeColumnIds.includes(task.columnId)) return false;
      if (selectedTag !== "all" && !task.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) return false;
      return true;
    });
  }, [tasks, startDate, endDate, projectId, activeColumnIds, selectedTag]);

  const doneColumn = columns.find((column) => column.id === "done");
  const doneCount = doneColumn ? filtered.filter((task) => task.columnId === doneColumn.id).length : 0;
  const completionRate = filtered.length ? Math.round((doneCount / filtered.length) * 100) : 0;

  const chartData = columns.map((column) => ({
    status: column.title,
    total: filtered.filter((task) => task.columnId === column.id).length
  }));

  const toggleColumnFilter = (columnId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h2>{t.title}</h2>

        <div className={styles.filters}>
          <select className={styles.filter} value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="all">{t.allProjects}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <input className={styles.filter} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className={styles.filter} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <select className={styles.filter} value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
            <option value="all">{t.allTags}</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
          <button type="button" className={styles.export} onClick={() => exportTasksCsv(filtered, columns, assignees)}>
            {t.export}
          </button>
        </div>

        <div className={styles.columnFilters}>
          {columns.map((column) => {
            const checked = activeColumnIds.includes(column.id);
            return (
              <label key={column.id} className={styles.columnFilterItem}>
                <input type="checkbox" checked={checked} onChange={() => toggleColumnFilter(column.id)} />
                <span>{column.title}</span>
              </label>
            );
          })}
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => setSelectedColumnIds([])}
            disabled={!selectedColumnIds.length}
          >
            {t.clearStatus}
          </button>
        </div>

        <div className={styles.metrics}>
          <article className={styles.metric}>
            <span>{t.totalFiltered}</span>
            <h3>{filtered.length}</h3>
          </article>
          <article className={styles.metric}>
            <span>{t.done}</span>
            <h3>{doneCount}</h3>
          </article>
          <article className={styles.metric}>
            <span>{t.completion}</span>
            <h3>{completionRate}%</h3>
          </article>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>{t.distribution}</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>{t.filteredList}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.id}</th>
                <th>{t.task}</th>
                <th>{t.status}</th>
                <th>{t.requester}</th>
                <th>{t.tags}</th>
                <th>{t.start}</th>
                <th>{t.end}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((task) => (
                  <tr key={task.id}>
                    <td>{task.taskCode}</td>
                    <td>{task.title}</td>
                    <td>{columns.find((column) => column.id === task.columnId)?.title ?? task.columnId}</td>
                    <td>{task.requesterName || t.notInformed}</td>
                    <td>{task.tags.length ? task.tags.map((tag) => `#${tag}`).join(", ") : "-"}</td>
                    <td>{toPtBrDate(task.startDate)}</td>
                    <td>{toPtBrDate(task.endDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>{t.noResults}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
