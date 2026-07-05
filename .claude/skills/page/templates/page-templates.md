# Page Templates

Reference patterns for common IDS page types. Each template lists the components needed and a structural overview.

---

## Settings Page

A page with grouped settings sections, toggle switches, and a save action.

### Components
- `@ids-ts/product-header` — page header
- `@ids-ts/typography` — section headings and descriptions
- `@ids-ts/switch` — toggle settings
- `@ids-ts/dropdown` — select options
- `@ids-ts/text-field` — editable settings
- `@ids-ts/button` — save/cancel actions
- `@ids-ts/panel` — section containers

### Structure
```
ProductHeader ("Settings")
├── Panel ("General")
│   ├── Typography (section heading)
│   ├── Switch ("Email notifications")
│   ├── Switch ("Dark mode")
│   └── Dropdown ("Language")
├── Panel ("Account")
│   ├── Typography (section heading)
│   ├── TextField ("Display name")
│   └── TextField ("Email")
└── Button row
    ├── Button ("Save", primary)
    └── Button ("Cancel", secondary)
```

---

## Form Page

A page centered around data entry with validation.

### Components
- `@ids-ts/typography` — title and field labels
- `@ids-ts/text-field` — text inputs
- `@ids-ts/textarea` — multi-line input
- `@ids-ts/dropdown` — select fields
- `@ids-ts/checkbox` — checkbox options
- `@ids-ts/radio` — radio button groups
- `@ids-ts/date-picker` — date fields
- `@ids-ts/inline-validation-message` — field errors
- `@ids-ts/button` — submit/cancel
- `@ids-ts/page-message` — form-level success/error

### Structure
```
Typography ("Form Title")
Typography ("Form description")
├── TextField ("First name") + InlineValidationMessage
├── TextField ("Last name") + InlineValidationMessage
├── TextField ("Email") + InlineValidationMessage
├── Dropdown ("Category")
├── DatePicker ("Date")
├── Textarea ("Comments")
├── Checkbox ("I agree to terms")
└── Button row
    ├── Button ("Submit", primary)
    └── Button ("Cancel", secondary)
```

---

## List Page

A scrollable list with search, filters, and item actions.

### Components
- `@ids-ts/product-header` — page header
- `@ids-ts/text-field` — search input
- `@ids-ts/chip` — filter chips
- `@ids-ts/cards` — list items
- `@ids-ts/typography` — item titles and descriptions
- `@ids-ts/badge` — status indicators
- `@ids-ts/button` — actions
- `@ids-ts/pagination` — page navigation
- `@ids-ts/skeleton` — loading state

### Structure
```
ProductHeader ("Items")
├── Search bar (TextField with search icon)
├── Filter row (Chip, Chip, Chip)
├── List
│   ├── Cards (item 1: title, description, Badge, Button)
│   ├── Cards (item 2: ...)
│   ├── Cards (item 3: ...)
│   └── ...
└── Pagination
```

---

## Table Page

A data table with sorting, pagination, and row actions.

### Components
- `@ids-ts/product-header` — page header
- `@ids-ts/text-field` — search
- `@ids-ts/button` — actions (add, export)
- `@ids-ts/table` — data table
- `@ids-ts/badge` — status columns
- `@ids-ts/dropdown-button` — row action menus
- `@ids-ts/pagination` — table pagination
- `@ids-ts/chip` — filters

### Structure
```
ProductHeader ("Data")
├── Action bar
│   ├── TextField (search)
│   ├── Button ("Add new")
│   └── Button ("Export")
├── Table
│   ├── Header row (Name, Email, Status, Date, Actions)
│   └── Data rows
│       ├── Row (text, text, Badge, date, DropdownButton)
│       └── ...
└── Pagination
```

---

## Detail Page

A single-item view showing metadata, content, and actions.

### Components
- `@ids-ts/product-header` — with back navigation
- `@ids-ts/typography` — title, metadata, content
- `@ids-ts/badge` — status
- `@ids-ts/button` — edit, delete, share actions
- `@ids-ts/tabs` — content sections
- `@ids-ts/panel` — content areas
- `@ids-ts/cards` — related items

### Structure
```
ProductHeader (with back button)
├── Title section
│   ├── Typography ("Item Title")
│   ├── Badge ("Active")
│   └── Button row (Edit, Delete, Share)
├── Tabs ("Overview", "Activity", "Related")
│   ├── Tab: Overview
│   │   ├── Panel (metadata grid)
│   │   └── Panel (description)
│   ├── Tab: Activity
│   │   └── Activity list
│   └── Tab: Related
│       └── Cards grid
```

---

## Empty State Page

A placeholder page when no data exists — encourages the user to take action.

### Components
- `@ids-ts/typography` — heading and description
- `@ids-ts/button` — call-to-action
- `@design-systems/icons` — illustrative icon

### Structure
```
Centered container
├── Icon (large, illustrative)
├── Typography ("No items yet")
├── Typography ("Create your first item to get started.")
└── Button ("Create item", primary)
```

---

## Error Page

Error states for 404, 500, or permission denied.

### Components
- `@ids-ts/typography` — error heading and message
- `@ids-ts/button` — navigation actions
- `@ids-ts/link` — help links
- `@design-systems/icons` — error icon

### Structure
```
Centered container
├── Icon (warning/error)
├── Typography ("Page not found" / "Something went wrong")
├── Typography (helpful description)
├── Button ("Go home", primary)
└── Link ("Contact support")
```

---

## Onboarding Page

A multi-step guided setup flow.

### Components
- `@ids-ts/step-flow` — step navigation
- `@ids-ts/typography` — step titles and descriptions
- `@ids-ts/text-field` — input fields
- `@ids-ts/dropdown` — select options
- `@ids-ts/checkbox` — preferences
- `@ids-ts/button` — next/back/finish
- `@ids-ts/cards` — option cards

### Structure
```
StepFlow (Step 1 of 4)
├── Step 1: "Welcome"
│   ├── Typography (welcome message)
│   └── Button ("Get started")
├── Step 2: "Profile"
│   ├── TextField ("Name")
│   ├── TextField ("Email")
│   └── Dropdown ("Role")
├── Step 3: "Preferences"
│   ├── Checkbox ("Option A")
│   ├── Checkbox ("Option B")
│   └── Cards (plan selection)
└── Step 4: "Done"
    ├── Typography ("All set!")
    └── Button ("Go to dashboard")
```
