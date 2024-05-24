import { IconGithub } from "@app/assets";
import { Button } from "@app/primitives/button";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import style from "./featured-repos.module.scss";

type RepoModalProps = {
  repoName: string;
  repoSource: string;
  onOpenCb?: () => void;
};

function RepoModal({ repoName, repoSource, onOpenCb }: RepoModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} title={`Open Repository - ${repoName}`} centered>
        <div className={style.RepoCard__Modal__Content}>
          <Button
            variant="gray"
            onClick={() => {
              window.open(repoSource, "_blank");
            }}
          >
            <div className={style.RepoCard__Modal__IconButton}>
              <IconGithub style={{ height: 22, width: 22 }} />
              Go to GitHub
            </div>
          </Button>
          <Button
            style={{ width: 150 }}
            onClick={() => {
              close();
              onOpenCb?.();
            }}
          >
            Open in Gizual
          </Button>
        </div>
      </Modal>

      <div
        className={style.RepoCard__Source}
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        <IconGithub />
        <a>{repoSource}</a>
      </div>
    </>
  );
}

export { RepoModal };
