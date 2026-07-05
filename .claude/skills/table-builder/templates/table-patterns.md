# Table Patterns

Reference patterns for building data tables with IDS components.

---

## Column Type Mapping

| User Input | Column Type | Cell Renderer | Notes |
|------------|------------|--------------|-------|
| name, user, customer, employee | text | Plain text | Sortable |
| email, email address | email | Link (`mailto:`) | Sortable |
| phone, phone number | text | Plain text | — |
| status, state | status | Badge component | Color-coded |
| date, created, updated, due date | date | Formatted date | Sortable |
| amount, price, cost, total, revenue | currency | Formatted number | Sortable, right-aligned |
| count, quantity, number | number | Plain number | Sortable, right-aligned |
| role, type, category | text | Plain text or Chip | Sortable |
| description, notes | text | Truncated text | Max width |
| actions, menu | actions | DropdownButton | Right-aligned, not sortable |
| progress, completion | progress | Progress bar | — |
| avatar, photo | avatar | Image/initials | Not sortable |

---

## Status Badge Mapping

Common status values and their Badge variants:

| Status | Badge Variant | Color Token Context |
|--------|--------------|-------------------|
| Active, Enabled, Online | success | `--color-status-success` |
| Pending, In Progress, Processing | warning | `--color-status-warning` |
| Inactive, Disabled, Offline | neutral | `--color-text-secondary` |
| Error, Failed, Rejected | error | `--color-status-error` |
| Completed, Approved, Resolved | success | `--color-status-success` |
| Draft, New | info | `--color-status-info` |

---

## Sample Data Generator

### Names
```
"Alex Johnson", "Maria Garcia", "James Chen", "Sarah Williams",
"David Kim", "Emily Brown", "Michael Davis", "Jessica Martinez",
"Robert Taylor", "Amanda Wilson"
```

### Emails (match names)
```
"alex.johnson@example.com", "maria.garcia@example.com", ...
```

### Statuses
```
"Active", "Pending", "Inactive", "Active", "Active",
"Pending", "Active", "Inactive", "Active", "Pending"
```

### Dates (recent, realistic)
```
"2024-01-15", "2024-02-03", "2024-01-28", "2024-03-10",
"2024-02-14", "2024-03-01", "2024-01-22", "2024-02-28",
"2024-03-05", "2024-01-10"
```

### Amounts
```
"$1,250.00", "$3,400.50", "$890.00", "$5,200.75", "$2,100.00"
```

---

## Table Structure

### Basic Table
```tsx
<div className={styles.tableContainer}>
  <div className={styles.tableHeader}>
    <TextField placeholder="Search..." />
    <Button variant="primary">Add new</Button>
  </div>
  <Table>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>Email</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell>Date</Table.HeaderCell>
        <Table.HeaderCell>Actions</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {data.map(row => (
        <Table.Row key={row.id}>
          <Table.Cell>{row.name}</Table.Cell>
          <Table.Cell>{row.email}</Table.Cell>
          <Table.Cell><Badge variant={row.statusVariant}>{row.status}</Badge></Table.Cell>
          <Table.Cell>{row.date}</Table.Cell>
          <Table.Cell>
            <DropdownButton label="Actions" items={actionItems} />
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
  <div className={styles.tableFooter}>
    <Pagination totalPages={5} currentPage={1} />
  </div>
</div>
```

---

## Table CSS Patterns

```css
.tableContainer {
  display: flex;
  flex-direction: column;
  gap: var(--space-400);
}

.tableHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-300);
}

.tableFooter {
  display: flex;
  justify-content: center;
  padding-top: var(--space-300);
}

/* Responsive: horizontal scroll on mobile */
@media (max-width: 767px) {
  .tableContainer {
    overflow-x: auto;
  }
}
```

---

## Row Action Patterns

### Dropdown Menu Actions
```tsx
const actionItems = [
  { label: 'View', onClick: () => handleView(row.id) },
  { label: 'Edit', onClick: () => handleEdit(row.id) },
  { label: 'Delete', onClick: () => handleDelete(row.id) },
];
```

### Inline Button Actions
For simple tables with 1-2 actions:
```tsx
<Table.Cell>
  <Button variant="secondary" size="small">Edit</Button>
</Table.Cell>
```
