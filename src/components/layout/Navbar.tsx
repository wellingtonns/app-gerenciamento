import { NavLink } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore } from "../../state/store";
import styles from "./Navbar.module.css";

function linkClassName({ isActive }: { isActive: boolean }) {
  return `${styles.link} ${isActive ? styles.active : ""}`.trim();
}

export function Navbar() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const projectsRaw = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const [logoSrc, setLogoSrc] = useState("/taskops-logo.png");
  const [menuOpen, setMenuOpen] = useState(false);
  const projects = useMemo(() => [...projectsRaw].sort((a, b) => a.order - b.order), [projectsRaw]);
  const t = locale === "en-US"
    ? {
        openMenu: "Open menu",
        closeMenu: "Close menu",
        menu: "Menu",
        dashboard: "Dashboard",
        reports: "Reports",
        projects: "Projects",
        settings: "Settings",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        switchLang: "Switch language"
      }
    : {
        openMenu: "Abrir menu",
        closeMenu: "Fechar menu",
        menu: "Menu",
        dashboard: "Dashboard",
        reports: "Relatórios",
        projects: "Projetos",
        settings: "Configurações",
        darkMode: "Modo Noturno",
        lightMode: "Modo Claro",
        switchLang: "Trocar idioma"
      };

  return (
    <header className={styles.shell}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={styles.brandWrap}>
          {logoSrc ? (
            <img
              className={styles.logo}
              src={logoSrc}
              alt="TaskOps"
              onError={() => {
                if (logoSrc === "/taskops-logo.png") setLogoSrc("/logo.png");
                else if (logoSrc === "/logo.png") setLogoSrc("/taskops.png");
                else setLogoSrc("");
              }}
            />
          ) : (
            <div className={styles.logoFallback}>TO</div>
          )}
          <h1 className={styles.brand}>TaskOps Kanban</h1>
        </div>

        <button
          type="button"
          className={styles.langToggle}
          onClick={() => setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")}
          aria-label={t.switchLang}
          title={t.switchLang}
        >
          {locale === "pt-BR" ? "🇧🇷" : "🇺🇸"}
        </button>
      </div>

      {menuOpen ? <button type="button" className={styles.overlay} onClick={() => setMenuOpen(false)} /> : null}

      <aside className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <strong>{t.menu}</strong>
          <button type="button" className={styles.closeButton} onClick={() => setMenuOpen(false)}>
            {t.closeMenu}
          </button>
        </div>

        <nav className={styles.links}>
          <NavLink
            to="/"
            className={linkClassName}
            onClick={() => setMenuOpen(false)}
          >
            {t.dashboard}
          </NavLink>
          <NavLink
            to="/reports"
            className={linkClassName}
            onClick={() => setMenuOpen(false)}
          >
            {t.reports}
          </NavLink>
        </nav>

        <section className={styles.projects}>
          <h3>{t.projects}</h3>
          <div className={styles.projectList}>
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={`${styles.projectItem} ${project.id === activeProjectId ? styles.projectItemActive : ""}`}
                onClick={() => setActiveProject(project.id)}
              >
                {project.name}
              </button>
            ))}
          </div>
        </section>

        <nav className={styles.links}>
          <NavLink
            to="/settings"
            className={linkClassName}
            onClick={() => setMenuOpen(false)}
          >
            {t.settings}
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? t.darkMode : t.lightMode}
          </button>
        </div>
      </aside>
    </header>
  );
}
