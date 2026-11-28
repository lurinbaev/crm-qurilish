---
name: Construction CRM
description: Uzbek construction sales and inventory workspace
colors:
  primary: "#67d8cb"
  primary-deep: "#2bc0b4"
  neutral-bg: "#071725"
  neutral-mid: "#0b2133"
  neutral-raised: "#123149"
  glass-surface: "rgba(22, 54, 76, .58)"
  glass-border: "rgba(209, 238, 241, .16)"
  text-primary: "#eef6f6"
  text-secondary: "#b7cbd2"
  status-blue: "#77b8e5"
  status-amber: "#f0bd72"
  status-red: "#ee887f"
  status-green: "#83d4a9"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(25px, 2.7vw, 33px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#062a34"
    rounded: "{rounded.sm}"
    padding: "0 15px"
    height: "40px"
  input:
    backgroundColor: "rgba(3, 18, 31, .52)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "41px"
  glass-panel:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "18px"
  status-chip:
    backgroundColor: "rgba(242, 250, 249, .055)"
    textColor: "{colors.text-secondary}"
    rounded: "999px"
    padding: "5px 9px"
  workspace-navigation:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px"
# Design System: Construction CRM

## Overview

Construction CRM is a focused Uzbek Latin workspace for sales and apartment operations. Its dark glass panes create depth around the tables and dialogs without turning inventory into a decorative dashboard.

**The Workbench Rule.** Keep lead and catalog data as the visual center; glass is a container for real work, not a reason to replace rows with cards.

## Colors

Turquoise is reserved for primary actions, focus, and selected states. Deep navy and slate ground the workspace; pale foreground text keeps controls legible. Status colors distinguish lead and apartment states and always pair color with text.

**The Text-Labeled Status Rule.** Never communicate a lead stage or inventory state with color alone.

## Typography

The installed system sans is used throughout. Page titles establish hierarchy; compact table labels support high information density. Reserve tabular numerals for amounts and counts.

**The Readable Data Rule.** Use the body scale for instructions and a compact label scale for table metadata; keep explanatory text readable on translucent surfaces.

## Layout

Desktop workspace uses a fixed navigation rail beside a flexible content area. Page headings and actions sit above the working table. At narrow widths, the rail becomes a slide-in menu and tables scroll horizontally rather than shrinking columns into unreadable labels.

## Elevation & Depth

Panels use translucent slate fills, a visible full border, background blur, and a broad offset shadow. Reserve stronger blur for raised panels and dialogs; keep ordinary rows mostly flat.

**The Surface Rule.** Glass earns its place when it separates a panel from the deep backdrop or clarifies a modal layer.

## Shapes

Small controls have gently rounded corners, work panels have a moderate radius, and dialogs use the largest curve. Status labels may be pills because they are compact state indicators; large controls and panels are not pill-shaped.

## Components

Primary buttons use turquoise with dark ink, and quiet actions remain text-forward. Inputs have a dark inset surface, clear labels, and a turquoise focus ring. Glass panels separate work areas. Status chips include a short label and colored marker.

## Do's and Don'ts

- **Do** keep controls keyboard reachable and give focus a visible turquoise outline.
- **Do** honor reduced-motion settings and show loading, error, and empty states.
- **Do** retain a readable full border wherever blur could blend into the backdrop.
- **Don't** replace operational tables with repeated icon cards.
- **Don't** use blur as decoration on every element or put body copy on a low-contrast glass tint.
- **Don't** expose a direct `won` stage action; sale confirmation is a separate operation.
