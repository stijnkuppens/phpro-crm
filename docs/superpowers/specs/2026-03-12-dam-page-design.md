# DAM (Digital Asset Management) Page Design

## Overview

Replace the current flat file list page with a full DAM featuring folder tree navigation, grid/list views with image thumbnails, file detail panel, bulk operations, and search.

## Architecture Decision

**Pure Supabase Storage** — no additional DB table. Folders are path prefixes in the existing `documents` bucket. File metadata comes from `storage.objects` (name, size, mimetype, created_at). No migration needed.

## Layout

3-panel layout:

```
┌──────────┬─────────────────────────────────┬──────────────┐
│ Folder   │ Toolbar: [Upload] [Grid|List]   │ File Detail  │
│ Tree     │ [Search] [Bulk: Delete]         │ Panel        │
│          ├─────────────────────────────────┤              │
│ documents│                                 │ preview.png  │
│ ├─ mktg  │  [thumb] [thumb] [thumb]        │ 245 KB       │
│ ├─ legal │  [thumb] [thumb]                │ image/png    │
│ └─ int.  │                                 │ 1920x1080    │
│          │                                 │ [Download]   │
│          │                                 │ [Delete]     │
└──────────┴─────────────────────────────────┴──────────────┘
```

- **Left**: Collapsible folder tree (~200px wide)
- **Center**: File grid (default) or list view with toolbar
- **Right**: Detail panel (~280px), shown only when a file is selected (Sheet or inline panel)

## Components

### FolderTree (`folder-tree.tsx`)
- Recursive tree built with shadcn Button + ChevronRight/Down icons + indentation
- Discovers folders by calling `supabase.storage.from('documents').list(prefix)` and filtering items where `id` is null (Supabase convention for folder prefixes)
- Lazy-loads children on expand — each tree node manages its own expanded/children state internally (independent of `use-file-browser` which only tracks the currently navigated path)
- "New folder" button at top opens `CreateFolderDialog`
- Active folder (matching `currentPath`) highlighted
- Empty state: when root has no subfolders, just shows the root node with "New folder" button still accessible

### CreateFolderDialog (`create-folder-dialog.tsx`)
- Dialog (not AlertDialog — this is a creation action, not a destructive confirmation) with a text input for folder name
- Creates folder by uploading a `.emptyFolderPlaceholder` file at `{currentPath}/{name}/.emptyFolderPlaceholder`
- Validates: no special chars, no duplicate names

### FileToolbar (`file-toolbar.tsx`)
- Search input (filters by name, uses Supabase `search` param)
- View toggle: Grid | List (using shadcn Toggle or two Buttons)
- Upload button (opens the existing FileUpload dropzone)
- Bulk actions bar: appears when items selected — shows count + "Delete" button with ConfirmDialog
- Breadcrumb path: `Documents / Marketing / Logos` — each segment clickable

### FileGrid (`file-grid.tsx`)
- CSS grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
- Each item is a `FileCard`

### FileCard (`file-card.tsx`)
- shadcn Card with:
  - Checkbox overlay (top-left corner) for bulk select, visible on hover or when selected
  - Thumbnail area: signed URL for images, `FileTypeIcon` for non-images
  - Filename (truncated), file size below
- Click: opens detail panel (sets selected file)
- Checkbox click: toggles selection (does not open detail)
- Folder cards: folder icon, click navigates into folder

### FileListView (`file-list-view.tsx`)
- Reuses the existing DataTable component
- Columns: checkbox, icon+name, size, type, date
- Row click opens detail panel
- Sortable columns via existing DataTable sorting

### FileDetailPanel (`file-detail-panel.tsx`)
- Right-side panel (not a Sheet — inline flex panel that appears/disappears)
- Image preview: signed URL in an `<img>` tag with `object-contain`
- Non-image: large FileTypeIcon
- Metadata: filename, size (formatted), mimetype, created_at
- Actions: Download button, Delete button (with ConfirmDialog), Rename (stretch)
- Close button (X) to dismiss

### FileTypeIcon (`file-type-icon.tsx`)
- Maps mimetype to Lucide icons:
  - `image/*` → Image icon
  - `application/pdf` → FileText icon
  - `video/*` → Video icon
  - `audio/*` → Music icon
  - `application/zip`, `application/x-tar` → Archive icon
  - `text/*` → FileCode icon
  - Default → File icon
- Accepts `size` prop for consistent sizing

### FileUpload (existing, modified)
- Now receives `currentPath` prop
- Uploads to `{currentPath}/{filename}` instead of root (preserves original filename)
- `useFileUpload` hook must also be modified: accept optional `pathPrefix` param, use `{pathPrefix}/{originalFilename}` as path instead of UUID-based naming (UUIDs make files unrecognizable in a DAM)
- After upload, triggers reload of current folder

## Hook: `use-file-browser.ts`

Central state management for the DAM:

```ts
type UseFileBrowserReturn = {
  // Navigation
  currentPath: string;
  navigateTo: (path: string) => void;
  breadcrumbs: { label: string; path: string }[];

  // File listing
  files: StorageFile[];
  folders: string[];
  loading: boolean;
  refresh: () => void;

  // Search
  search: string;
  setSearch: (q: string) => void;

  // Selection
  selectedFiles: Set<string>;
  toggleSelect: (name: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Active file (for detail panel)
  activeFile: StorageFile | null;
  setActiveFile: (file: StorageFile | null) => void;

  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Operations (deleteFiles routes through server action for permission enforcement)
  deleteFiles: (names: string[]) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
};
```

## Types

Extend `src/features/files/types.ts`:

```ts
export type StorageFile = {
  name: string;
  id: string | null;  // null for folder prefixes
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
};

export type FolderEntry = {
  name: string;
  path: string;
  children?: FolderEntry[];
  expanded?: boolean;
};
```

## File Structure

```
src/features/files/
├── types.ts                    (extend with FolderEntry)
├── actions/delete-file.ts      (existing, extend for bulk)
├── queries/get-files.ts        (existing, adapt for prefix param)
├── hooks/
│   └── use-file-browser.ts     (new — central DAM state)
└── components/
    ├── folder-tree.tsx          (new)
    ├── file-grid.tsx            (new)
    ├── file-card.tsx            (new)
    ├── file-list-view.tsx       (new)
    ├── file-toolbar.tsx         (new)
    ├── file-detail-panel.tsx    (new)
    ├── file-type-icon.tsx       (new)
    └── create-folder-dialog.tsx (new)

src/components/admin/file-upload.tsx  (modify — add currentPath prop)
src/app/admin/files/page.tsx          (rewrite — compose DAM)
```

## Supabase Storage API Usage

- **List files in folder**: `storage.from('documents').list(prefix, { search })` — note: `search` is prefix-match on names within the current folder level only, not recursive
- **Separate folders vs files**: items with `id === null` are folders, others are files
- **Thumbnails**: `storage.from('documents').createSignedUrl(path, 3600)` for image previews
- **Create folder**: upload placeholder file at `{path}/.emptyFolderPlaceholder`
- **Delete**: `storage.from('documents').remove([...paths])` for bulk
- **Download**: `storage.from('documents').createSignedUrl(path, 60)` then `window.open`

## No New Migrations

Everything uses the existing `documents` bucket and its RLS policies.

## Permissions

Follows existing RLS policies and ACL (`src/lib/acl.ts`):
- All authenticated users can browse/download
- Editors+ can upload, create folders, and delete
- `deleteFiles` in the hook calls the existing `deleteFile` server action (which uses `requirePermission` + `createServiceRoleClient`) — extended to accept multiple paths for bulk delete

Uses existing `RoleGuard` component to conditionally show upload/delete actions.

### Breadcrumbs
The page-level `PageHeader` breadcrumb shows `Admin > Files`. The folder path breadcrumb (e.g., `Documents / Marketing / Logos`) lives inside `FileToolbar` as a separate navigational breadcrumb for the storage path — this is distinct from the page-level breadcrumb.
