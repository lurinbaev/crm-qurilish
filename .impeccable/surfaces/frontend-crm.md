# Staff CRM web app

## Product reference

`PRODUCT.md`

## Surface

Authenticated Next.js workspace for administrators and sales staff, with equal priority. Public clients can browse available apartments and submit a consent-backed lead. Admins manage complexes, apartments, pricing, employees, and audit records through role-protected APIs.

## Direction contract

**THESIS:** A calm, dark glass workbench keeps sales, apartment inventory, and audit activity in one operational workspace. Glass is the surface material for layered panes and focus; tables remain dense and readable.

**OWN-WORLD:** Deep navy and slate provide a quiet field; turquoise marks actions and selected states; pale text stays high contrast. Use translucent panels with a visible full edge and restrained blur. Lucide icons carry meaning. The glassmorphic material is intentional; geometry, shadows, and motion stay subordinate to CRM tasks.

**STORY:** After sign-in, an employee sees current applications and can search, filter, and progress them with version-checked API calls. A seller can confirm a viewing as a sale. That operation atomically marks the lead won and apartment sold, and writes audit events. Admins additionally edit/delete catalog records, change available apartment prices, manage staff, and inspect audit history. Visitors see available apartments and can send a consent-backed inquiry.

**FIRST VIEWPORT:** At desktop width, a persistent navigation rail anchors the application; page title and account context precede loaded work metrics and the main lead table. On mobile, navigation collapses to a menu, tables remain horizontally scrollable, and actions remain reachable. The public catalog uses a simple filter row and apartment list.

**SIGNATURE INTERACTION:** A confirmation dialog explains that sale completion updates both records and audit history. The request includes the lead's expected version; conflicts are shown without silently changing the selected row.

**MOTION GRAMMAR:** Small, short transitions mark hover and user-triggered state change. Loading is explicit and reduced-motion preferences suppress authored animation.

## API boundaries

Use the contracts in `backend/app/modules/` and `backend/app/schemas.py`. UI visibility helps navigation; backend permissions remain authoritative. Admin catalog routes are not available to sales staff or viewers. Direct stage updates cannot mark a sale `won`; use the explicit sale-confirm endpoint.
