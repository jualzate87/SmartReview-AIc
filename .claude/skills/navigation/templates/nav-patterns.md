# Navigation Patterns

Reference patterns for adding navigation to IDS prototypes.

---

## Tabs Navigation

Horizontal tab bar for switching between content sections within a page.

### Component
`@ids-ts/tabs`

### Pattern
```tsx
import { Tabs } from '@ids-ts/tabs';
import '@ids-ts/tabs/dist/main.css';

const [activeTab, setActiveTab] = useState(0);

<Tabs
  selectedIndex={activeTab}
  onSelect={(index) => setActiveTab(index)}
>
  <Tabs.Tab>Overview</Tabs.Tab>
  <Tabs.Tab>Details</Tabs.Tab>
  <Tabs.Tab>Activity</Tabs.Tab>
</Tabs>

{activeTab === 0 && <div className={styles.tabContent}>Overview content</div>}
{activeTab === 1 && <div className={styles.tabContent}>Details content</div>}
{activeTab === 2 && <div className={styles.tabContent}>Activity content</div>}
```

### CSS
```css
.tabContent {
  padding: var(--space-400);
}
```

### When to Use
- Switching between related views on the same page
- Content categories that are equally important
- 2-7 tabs (more than 7 becomes hard to scan)

---

## Sidebar Navigation (Left Navigation)

Vertical navigation for app-level page switching.

### Component
`@ids-ts/left-navigation`

### Pattern
```tsx
import { LeftNavigation } from '@ids-ts/left-navigation';
import '@ids-ts/left-navigation/dist/main.css';

const navItems = [
  { label: 'Dashboard', id: 'dashboard', icon: <Home /> },
  { label: 'Reports', id: 'reports', icon: <BarChart /> },
  { label: 'Settings', id: 'settings', icon: <Settings /> },
];

const [activePage, setActivePage] = useState('dashboard');

<nav className={styles.sidebar}>
  <LeftNavigation
    items={navItems}
    selectedId={activePage}
    onSelect={(id) => setActivePage(id)}
  />
</nav>
```

### CSS
```css
.sidebar {
  width: 250px;
  border-right: 1px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
  min-height: 100vh;
}

@media (max-width: 767px) {
  .sidebar {
    display: none; /* or convert to bottom nav */
  }
}
```

### When to Use
- App-level navigation (switching between major sections)
- 3-15 navigation items
- Items can be grouped with headers
- Usually paired with a header layout

---

## Pagination

Numbered page navigation for paginated content (lists, tables, search results).

### Component
`@ids-ts/pagination`

### Pattern
```tsx
import { Pagination } from '@ids-ts/pagination';
import '@ids-ts/pagination/dist/main.css';

const [currentPage, setCurrentPage] = useState(1);
const totalPages = 10;

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

### CSS
```css
.paginationContainer {
  display: flex;
  justify-content: center;
  padding: var(--space-400) 0;
}
```

### When to Use
- Long lists of items (> 10-20 items)
- Data tables
- Search results
- Usually placed below the content it paginates

---

## Step Flow

Sequential step indicator for multi-step processes (wizards, onboarding, checkout).

### Component
`@ids-ts/step-flow`

### Pattern
```tsx
import { StepFlow } from '@ids-ts/step-flow';
import '@ids-ts/step-flow/dist/main.css';

const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Preferences' },
  { label: 'Review' },
];

<StepFlow steps={steps} currentStep={currentStep} />

<div className={styles.stepContent}>
  {currentStep === 0 && <div>Account form</div>}
  {currentStep === 1 && <div>Profile form</div>}
  {currentStep === 2 && <div>Preferences form</div>}
  {currentStep === 3 && <div>Review and submit</div>}
</div>

<div className={styles.stepButtons}>
  {currentStep > 0 && (
    <Button variant="secondary" onClick={() => setCurrentStep(s => s - 1)}>Back</Button>
  )}
  {currentStep < steps.length - 1 ? (
    <Button variant="primary" onClick={() => setCurrentStep(s => s + 1)}>Next</Button>
  ) : (
    <Button variant="primary" onClick={handleSubmit}>Finish</Button>
  )}
</div>
```

### CSS
```css
.stepContent {
  padding: var(--space-500) 0;
  min-height: 300px;
}

.stepButtons {
  display: flex;
  justify-content: space-between;
  gap: var(--space-300);
  padding-top: var(--space-400);
  border-top: 1px solid var(--color-border-secondary);
}
```

### When to Use
- Multi-step forms or wizards
- Onboarding flows
- Checkout processes
- 2-7 steps (more than 7 is overwhelming)

---

## Accordion Navigation

Expandable/collapsible sections for dense content that doesn't need to be visible all at once.

### Component
`@ids-ts/accordion`

### Pattern
```tsx
import { Accordion } from '@ids-ts/accordion';
import '@ids-ts/accordion/dist/main.css';

<Accordion>
  <Accordion.Item>
    <Accordion.Header>General Settings</Accordion.Header>
    <Accordion.Content>
      {/* General settings content */}
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item>
    <Accordion.Header>Notifications</Accordion.Header>
    <Accordion.Content>
      {/* Notification settings content */}
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item>
    <Accordion.Header>Privacy</Accordion.Header>
    <Accordion.Content>
      {/* Privacy settings content */}
    </Accordion.Content>
  </Accordion.Item>
</Accordion>
```

### When to Use
- FAQ pages
- Settings with many sections
- Content-heavy pages where users only need 1-2 sections at a time
- Mobile views where vertical space is limited
