import { Button, Dialog } from "@chakra-ui/react";
import { useRef } from "react";

interface DialogProps {
  onDelete: () => void;
  onClose: () => void;
  isOpen: boolean;
  title: string;
}

export function AlertDialog({ onDelete, onClose, isOpen, title }: DialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root
      role="Dialog"
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header fontSize="lg" fontWeight="bold">
            {title}
          </Dialog.Header>
          <Dialog.Body>
            Tem certeza que deseja excluir este item? Essa ação não pode ser
            revertida.
          </Dialog.Body>
          <Dialog.Footer>
            <Button ref={cancelRef} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" ml={3} onClick={onDelete}>
              Excluir
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
