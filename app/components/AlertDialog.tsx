import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { useRef } from "react";

type AlertDialogProps = {
  onDelete: () => void;
  onClose: () => void;
  isOpen: boolean;
  title: string;
};

export function MyAlertDialog({
  onDelete,
  onClose,
  isOpen,
  title,
}: AlertDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>();

  return (
    <AlertDialog
      isOpen={isOpen}
      // @ts-ignore
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>
          <AlertDialogBody>
            Tem certeza que deseja excluir este item? Essa ação não pode ser
            revertida.
          </AlertDialogBody>
          <AlertDialogFooter>
           {/* // @ts-ignore */}
            <Button ref={cancelRef} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" ml={3} onClick={onDelete}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
