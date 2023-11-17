import style from "../welcome.module.scss";

type DragHandlerProps = {
  onDrag: (file: FileSystemDirectoryEntry) => void;
  children: React.ReactNode;
};
export function DragHandler({ onDrag, children }: DragHandlerProps) {
  return (
    <div
      className={style.DropZone}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.currentTarget.classList.add(style.DropZoneActive);
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove(style.DropZoneActive);
      }}
      onDrop={(e) => {
        e.preventDefault();

        const items = e.dataTransfer.items;
        if (items.length > 0) {
          const item = items[0].webkitGetAsEntry();
          if (item && item.isDirectory) {
            onDrag(item as FileSystemDirectoryEntry);
          }
          // TODO: Error states
        }
      }}
    >
      {children}
    </div>
  );
}
