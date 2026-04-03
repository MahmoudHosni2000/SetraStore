# SETRA UI Color System

A modern, premium, and futuristic SaaS brand theme featuring a mint green primary color and a sophisticated neutral palette.

## Hex Palette

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Mint Primary** | `#2ED39A` | Brand Primary, Buttons, Active Links |
| **Mint Dark** | `#22B884` | Primary Hover, Dark Accents |
| **Mint Light** | `#D9F8EE` | Succes backgrounds, Light accents |
| **Mint Muted** | `#6EE7B7` | Secondary accents, Borders |
| **Deep Black** | `#111111` | Light Theme Text Primary, Dark Mode Foreground |
| **Ebony** | `#1C1C1C` | Dark Mode Cards |
| **Onyx** | `#3A3A3A` | Light Theme Text Secondary |
| **Gray Sage** | `#7A7A7A` | Muted Text, Icons |
| **Cool Gray** | `#E5E7EB` | Light Theme Borders |
| **Ghost White** | `#F4F5F7` | Light Theme Background |
| **Absolute White** | `#FFFFFF` | Surfaces, Dark Theme Text |
| **Midnight** | `#0F1115` | Dark Theme Background |
| **Deep Space** | `#171A21` | Dark Theme Surfaces |
| **Steel** | `#2A2F38` | Dark Theme Borders |
| **Silver Lake** | `#C9CDD4` | Dark Theme Secondary Text |
| **Success** | `#16A34A` | Valid states, Success badges |
| **Warning** | `#F59E0B` | Pending, Cautions |
| **Error** | `#DC2626` | Destructive, Errors |

## CSS Variables (HSL)

### Light Theme
```css
:root {
  --background: 214 15% 96%;      /* #F4F5F7 */
  --foreground: 0 0% 7%;         /* #111111 */
  --card: 0 0% 100%;             /* #FFFFFF */
  --card-foreground: 0 0% 7%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 7%;
  --primary: 159 66% 50%;        /* #2ED39A */
  --primary-foreground: 0 0% 100%;
  --secondary: 214 32% 91%;      /* #E5E7EB */
  --secondary-foreground: 0 0% 23%; /* #3A3A3A */
  --muted: 214 15% 96%;
  --muted-foreground: 0 0% 48%;  /* #7A7A7A */
  --accent: 159 66% 92%;         /* #D9F8EE */
  --accent-foreground: 159 68% 43%; /* #22B884 */
  --destructive: 0 84% 60%;      /* #DC2626 */
  --destructive-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 159 66% 50%;
}
```

### Dark Theme
```css
.dark {
  --background: 222 17% 7%;      /* #0F1115 */
  --foreground: 0 0% 100%;       /* #FFFFFF */
  --card: 0 0% 11%;              /* #1C1C1C */
  --card-foreground: 0 0% 100%;
  --popover: 222 18% 11%;        /* #171A21 */
  --popover-foreground: 0 0% 100%;
  --primary: 159 66% 50%;        /* #2ED39A */
  --primary-foreground: 222 17% 7%;
  --secondary: 221 14% 19%;      /* #2A2F38 */
  --secondary-foreground: 0 0% 100%;
  --muted: 221 14% 19%;
  --muted-foreground: 218 10% 81%; /* #C9CDD4 */
  --accent: 159 66% 50%;
  --accent-foreground: 222 17% 7%;
  --destructive: 0 84% 60%;      /* #DC2626 */
  --destructive-foreground: 0 0% 100%;
  --border: 221 14% 19%;
  --input: 221 14% 19%;
  --ring: 159 66% 50%;
}
```
