import style from "../welcome.module.scss";

type DragHandlerProps = {
  onDrag: (files: DataTransferItemList) => void;
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
        onDrag(e.dataTransfer.items);
      }}
    >
      {children}
    </div>
  );
}
