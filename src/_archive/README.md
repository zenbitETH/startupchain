// ! Archived 2025-11-20
# Archive Guidelines

This folder is a quarantine for unused components/hooks/utilities we might bring back. Use it to keep the main app lean while we decide whether to delete or revive code.

**How to use**
- Move unused pieces here with their original relative paths (e.g., `components/modals/foo.tsx` → `_archive/components/modals/foo.tsx`).
- Add a short header comment in each archived file with: reason, date moved, and owner.
- Avoid importing from `_archive` in active code; copy back to `src/` if you need to revive something.

**Retention**
- Anything untouched for 30 days should be deleted.
- If you need more time, update the header comment with a new review date and why.

