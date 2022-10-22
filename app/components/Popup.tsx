import { Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export function Popup({ onClose }: { onClose: () => void; }) {
  return (
    <Modal show size="md" popup onClose={onClose}>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Tem certeza que deseja excluir este cliente?
          </h3>
          <div className="flex justify-center gap-4">
            <Button color="failure">Sim</Button>
            <Button color="gray" onClick={onClose}>
              Não, cancelar
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
