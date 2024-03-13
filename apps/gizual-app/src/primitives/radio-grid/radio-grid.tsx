import style from "./radio-grid.module.scss";

type RadioGridProps = {
  children: React.ReactNode;
};

function RadioGrid({ children }: RadioGridProps) {
  return <div className={style.RadioGrid}>{children}</div>;
}

export { RadioGrid };
