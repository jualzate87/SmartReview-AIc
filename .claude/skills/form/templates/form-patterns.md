# Form Patterns

Reference patterns for building forms with IDS components.

---

## Field Type Mapping

| User Input | Field Type | IDS Component | Package |
|------------|-----------|---------------|---------|
| name, first name, last name, username | text | TextField | `@ids-ts/text-field` |
| email, email address | email | TextField (type="email") | `@ids-ts/text-field` |
| password, confirm password | password | TextField (type="password") | `@ids-ts/text-field` |
| phone, phone number | tel | TextField (type="tel") | `@ids-ts/text-field` |
| number, amount, quantity, age | number | TextField (type="number") | `@ids-ts/text-field` |
| url, website, link | url | TextField (type="url") | `@ids-ts/text-field` |
| message, description, bio, notes, comments | textarea | Textarea | `@ids-ts/textarea` |
| category, type, role, country, state | select | Dropdown | `@ids-ts/dropdown` |
| search, search with suggestions | typeahead | DropdownTypeahead | `@ids-ts/dropdown-typeahead` |
| date, birthday, start date, end date | date | DatePicker | `@ids-ts/date-picker` |
| date range | daterange | DateRangePicker | `@ids-ts/date-range-picker` |
| agree, terms, opt-in, remember me | checkbox | Checkbox | `@ids-ts/checkbox` |
| gender, preference, plan (single choice) | radio | Radio | `@ids-ts/radio` |
| enabled, active, notifications (on/off) | toggle | Switch | `@ids-ts/switch` |
| status | status | StatusDropdown | `@ids-ts/status-dropdown` |

---

## Validation Patterns

### Required Fields
```tsx
<TextField
  label="Email"
  required
  errorMessage={errors.email}
/>
{errors.email && (
  <InlineValidationMessage type="error">
    {errors.email}
  </InlineValidationMessage>
)}
```

### Common Validation Rules
| Field Type | Rule | Message |
|-----------|------|---------|
| text (name) | required, minLength: 2 | "Name is required" |
| email | required, email pattern | "Enter a valid email address" |
| password | required, minLength: 8 | "Password must be at least 8 characters" |
| phone | pattern: phone regex | "Enter a valid phone number" |
| number | min, max | "Must be between X and Y" |
| url | pattern: url regex | "Enter a valid URL" |
| textarea | required, maxLength | "Message is required" / "Maximum X characters" |
| select | required | "Please select an option" |
| checkbox (terms) | must be checked | "You must agree to the terms" |
| date | required, min/max date | "Please select a date" |

---

## Form Layout Patterns

### Single Column (Default)
Best for simple forms. Stack fields vertically with consistent spacing.

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-400);
  max-width: 500px;
}
```

### Two Column (Desktop)
For longer forms. Two columns on desktop, single column on mobile.

```css
.formGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-400);
}

.formGrid .fullWidth {
  grid-column: 1 / -1;
}

@media (max-width: 767px) {
  .formGrid {
    grid-template-columns: 1fr;
  }
}
```

### Grouped Sections
For complex forms with logical sections.

```css
.formSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding-bottom: var(--space-400);
  border-bottom: 1px solid var(--color-border-secondary);
  margin-bottom: var(--space-400);
}
```

---

## Button Patterns

### Standard Form Buttons
```tsx
<div className={styles.buttonRow}>
  <Button variant="primary" type="submit">Submit</Button>
  <Button variant="secondary" type="button" onClick={handleCancel}>Cancel</Button>
</div>
```

```css
.buttonRow {
  display: flex;
  gap: var(--space-300);
  justify-content: flex-end;
  padding-top: var(--space-400);
}
```

---

## State Management Pattern

Basic React state for form prototypes:

```tsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
  // ... other fields
});

const [errors, setErrors] = useState<Record<string, string>>({});

const handleChange = (field: string) => (value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error on change
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const newErrors = validate(formData);
  if (Object.keys(newErrors).length === 0) {
    // Success
  } else {
    setErrors(newErrors);
  }
};
```
