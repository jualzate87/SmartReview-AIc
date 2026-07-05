# Layout Templates

Reference patterns for common IDS layouts. Each layout uses CSS Grid/Flexbox with design tokens.

---

## Sidebar Layout

Fixed sidebar on the left, scrollable content on the right.

```tsx
// Components: ProductHeader, LeftNavigation
<div className={styles.sidebarLayout}>
  <header className={styles.header}>
    <ProductHeader title="App Name" />
  </header>
  <nav className={styles.sidebar}>
    <LeftNavigation items={navItems} />
  </nav>
  <main className={styles.content}>
    {/* Content here */}
  </main>
</div>
```

```css
.sidebarLayout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header header"
    "sidebar content";
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar {
  grid-area: sidebar;
  border-right: 1px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
}
.content {
  grid-area: content;
  padding: var(--space-400);
  overflow-y: auto;
}

@media (max-width: 767px) {
  .sidebarLayout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "content";
  }
  .sidebar { display: none; }
}
```

---

## Dashboard Layout

Header + sidebar + grid of cards/widgets.

```tsx
// Components: ProductHeader, LeftNavigation, Cards, Typography
<div className={styles.dashboard}>
  <header className={styles.header}>
    <ProductHeader title="Dashboard" />
  </header>
  <nav className={styles.sidebar}>
    <LeftNavigation items={navItems} />
  </nav>
  <main className={styles.content}>
    <div className={styles.widgetGrid}>
      <Cards>{/* Widget 1 */}</Cards>
      <Cards>{/* Widget 2 */}</Cards>
      <Cards>{/* Widget 3 */}</Cards>
      <Cards>{/* Widget 4 */}</Cards>
    </div>
  </main>
</div>
```

```css
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header header"
    "sidebar content";
  min-height: 100vh;
}

.widgetGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-400);
  padding: var(--space-400);
}

@media (max-width: 767px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "content";
  }
  .sidebar { display: none; }
  .widgetGrid {
    grid-template-columns: 1fr;
    gap: var(--space-300);
    padding: var(--space-300);
  }
}
```

---

## Header + Content Layout

Sticky header with full-width scrollable content.

```tsx
// Components: ProductHeader
<div className={styles.headerContent}>
  <header className={styles.header}>
    <ProductHeader title="App Name" />
  </header>
  <main className={styles.content}>
    {/* Content here */}
  </main>
</div>
```

```css
.headerContent {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky, 100);
}

.content {
  flex: 1;
  padding: var(--space-400);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
```

---

## Split View Layout

Two panels side by side with adjustable proportions.

```tsx
// Components: Panel
<div className={styles.splitView}>
  <div className={styles.leftPanel}>
    <Panel>{/* Left content */}</Panel>
  </div>
  <div className={styles.rightPanel}>
    <Panel>{/* Right content */}</Panel>
  </div>
</div>
```

```css
.splitView {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-400);
  min-height: 100vh;
  padding: var(--space-400);
}

@media (max-width: 767px) {
  .splitView {
    grid-template-columns: 1fr;
  }
}
```

---

## Centered Layout

Centered content with max-width container — ideal for forms, settings, articles.

```tsx
<div className={styles.centered}>
  <main className={styles.content}>
    {/* Content here */}
  </main>
</div>
```

```css
.centered {
  display: flex;
  justify-content: center;
  padding: var(--space-500) var(--space-400);
  min-height: 100vh;
  background: var(--color-background-secondary);
}

.content {
  width: 100%;
  max-width: 720px;
  background: var(--color-background-primary);
  border-radius: var(--radius-200);
  padding: var(--space-500);
  box-shadow: var(--elevation-100);
}
```

---

## Holy Grail Layout

Header + left sidebar + content + right sidebar + footer.

```tsx
// Components: ProductHeader, LeftNavigation, PanelContextual
<div className={styles.holyGrail}>
  <header className={styles.header}>
    <ProductHeader title="App Name" />
  </header>
  <nav className={styles.leftSidebar}>
    <LeftNavigation items={navItems} />
  </nav>
  <main className={styles.content}>
    {/* Main content */}
  </main>
  <aside className={styles.rightSidebar}>
    <PanelContextual>{/* Context panel */}</PanelContextual>
  </aside>
  <footer className={styles.footer}>
    {/* Footer content */}
  </footer>
</div>
```

```css
.holyGrail {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "leftSidebar content rightSidebar"
    "footer footer footer";
  min-height: 100vh;
}

.header { grid-area: header; }
.leftSidebar {
  grid-area: leftSidebar;
  border-right: 1px solid var(--color-border-secondary);
}
.content {
  grid-area: content;
  padding: var(--space-400);
}
.rightSidebar {
  grid-area: rightSidebar;
  border-left: 1px solid var(--color-border-secondary);
}
.footer {
  grid-area: footer;
  padding: var(--space-300) var(--space-400);
  border-top: 1px solid var(--color-border-secondary);
}

@media (max-width: 1199px) {
  .holyGrail {
    grid-template-columns: 220px 1fr;
    grid-template-areas:
      "header header"
      "leftSidebar content"
      "footer footer";
  }
  .rightSidebar { display: none; }
}

@media (max-width: 767px) {
  .holyGrail {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "content"
      "footer";
  }
  .leftSidebar { display: none; }
}
```
