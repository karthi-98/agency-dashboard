# Agency dashboard

A standalone sales dashboard for the "Spark Pixel Team" agency, rebuilt from the `agency dashboard.jpg` reference. It's plain HTML, CSS and vanilla JavaScript, with no dependencies, package installation or build step.

## Open

Open `index.html` directly in a modern browser, or run `python -m http.server 4173` from this directory and visit `http://localhost:4173`. At a 1440 × 1024 viewport the layout matches the reference frame.

## Files

- `index.html`: sidebar, top bar, page header, chart cards, transactions table, menus and toast.
- `styles.css`: color, type and motion tokens, component styles and responsive breakpoints.
- `app.js`: sample data, the cell-grid sales chart, revenue bars, table logic and interactions.
- `icons.js`: Hugeicons (stroke rounded, free set) path data from `@hugeicons/core-free-icons` 4.3.5, inlined so the page works offline.
- `assets/avatar.jpg`: profile photo cropped from the reference. Replace it with a higher-resolution photo of the same name for a sharper avatar.

## Interactions

- Hover the Sales Trend grid to move the crosshair and tooltip; they glide between columns (250ms, interruptible). Focus the grid and use the arrow keys (Shift for steps of 5, Home/End) to step instantly.
- Weekly / Monthly / Yearly tabs swap the chart data; the pill slides to the selected tab, and arrow keys move between tabs.
- The Daily control opens a period menu with arrow-key navigation, Enter to choose and Escape to close.
- The date button opens a calendar: pick a day, page months with the arrows (or PageUp/PageDown, Shift for a year), move by day/week with the arrow keys, Home/End for the week's start/end, or jump to Today. Future days are disabled.
- Scrollbars are a slim 6px orange pill.
- Recent Transactions: search, sort by any column, select rows or all rows, add a sample transaction, and use the row menu to view, copy the ID or mark as refunded.
- Export CSV downloads the visible transactions.
- Ctrl/⌘ + K focuses the top search, which also filters the table; `/` focuses the table search.
- Below 960px the sidebar becomes a drawer, and below 720px the layout stacks into one column.

## Design notes

Text is set in Inter, and labels and figures in Geist Mono, loaded from Google Fonts with a system fallback offline. Motion follows emil-design-eng, better-ui and transitions-polish. Hover and press feedback stays at or under 150ms, buttons scale to 0.96 on press, and the tab pill uses the 250ms tabs-sliding token. Menus open in 250ms from 0.97 and close in 150ms to 0.99, scaling from their trigger. Reduced-motion users get opacity-only transitions.

All figures are sample data. Changes reset on reload.
